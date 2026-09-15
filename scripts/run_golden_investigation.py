import os
import sys
import json
import datetime
from pathlib import Path
import hashlib
from pyproj import Transformer
import rasterio
import rasterio.features
from shapely.geometry import shape, Polygon, mapping
import numpy as np

sys.path.append(os.path.abspath("model_repo"))

from src.characterization.schema import SpillDetection
from src.drift.environment import SyntheticConstantEnv
from src.drift.simulation import DriftSimulation
from src.drift.schema import DriftModelParameters, DriftResult, DriftStatus, CorridorGeometry, GeoPolygon, TemporalWindow
from src.drift.corridor import generate_corridor_geometry
from src.ais.offline import OfflineAISProvider
from src.evidence.engine import evaluate_candidates
from src.ais.normalization import normalize_ais_positions
from src.ais.track import reconstruct_tracks
from src.ais.spatial import calculate_spatial_compatibility
from src.ais.temporal import calculate_temporal_compatibility
from src.ais.behavior import calculate_behavior_features
from src.ais.candidate import rank_candidate
from src.ais.schema import VesselCandidate, AISResult, AISResultStatus

def run_investigation():
    # 1. Load Detection (Mocking Stage 3 for the Golden Scene) -> REPLACED WITH TRUE CHARACTERIZATION
    mask_path = "data/processed/inference_outputs/20191015_mask.tif"
    sar_path = "data/raw/sar/test/images/20191015.tif"
    
    assert os.path.exists(mask_path), "Golden Demo mask does not exist. Run inference first."
    assert os.path.exists(sar_path), "Golden Demo SAR scene does not exist."
    
    with rasterio.open(sar_path) as src_sar:
        sar_crs = src_sar.crs
        sar_width = src_sar.width
        sar_height = src_sar.height
        sar_transform = src_sar.transform

    with rasterio.open(mask_path) as src_mask:
        assert src_mask.width == sar_width, "Mask width does not match SAR width"
        assert src_mask.height == sar_height, "Mask height does not match SAR height"
        assert src_mask.crs == sar_crs, "Mask CRS does not match SAR CRS"
        
        mask_data = src_mask.read(1)
        shapes_gen = rasterio.features.shapes(mask_data, mask=mask_data > 0, transform=src_mask.transform)
        
        largest_geom = None
        max_area = -1.0
        
        for geom_dict, val in shapes_gen:
            geom = shape(geom_dict)
            if geom.area > max_area:
                max_area = geom.area
                largest_geom = geom
                
    assert largest_geom is not None, "Extracted polygon is empty!"
    assert largest_geom.is_valid, "Extracted polygon is invalid!"
    
    # Calculate area in km2. (Assuming UTM so coordinates are in meters)
    area_km2 = max_area / 1_000_000.0
    
    centroid = largest_geom.centroid
    
    # Coordinates in geometry are currently in UTM, need to convert to Lat/Lon for GeoCentroid/Polygon output?
    # Wait, if we use GeoCentroid we might want lat/lon. Let's see what the drift simulation expects.
    # Drift is usually configured for lat/lon, but let's just convert the centroid for GeoCentroid.
    from rasterio.warp import transform_geom
    geom_wgs84 = transform_geom(sar_crs, 'EPSG:4326', mapping(largest_geom))
    centroid_wgs84 = shape(geom_wgs84).centroid
    
    assert -90 <= centroid_wgs84.y <= 90, "Centroid latitude is geographically invalid"
    assert -180 <= centroid_wgs84.x <= 180, "Centroid longitude is geographically invalid"
    
    import uuid
    from src.characterization.schema import GeoCentroid
    detection = SpillDetection(
        detection_id=uuid.uuid4(),
        source_scene_id="GOLDEN_20191015",
        acquisition_timestamp=datetime.datetime(2019, 10, 15, tzinfo=datetime.timezone.utc),
        geo_centroid=GeoCentroid(longitude=centroid_wgs84.x, latitude=centroid_wgs84.y),
        area_km2=area_km2,
        geometry=geom_wgs84
    )
    
    # 2. Environmental Forcing (from fixture)
    with open("data/demo_case/environmental/forcing.json") as f:
        env_data = json.load(f)
        
    env = SyntheticConstantEnv(
        current_u=env_data["current"]["u_comp"],
        current_v=env_data["current"]["v_comp"],
        wind_u=env_data["wind"]["u_comp"],
        wind_v=env_data["wind"]["v_comp"],
        bounds=(-180, -90, 180, 90)
    )
    
    # 3. Drift Engine (Stage 4)
    params = DriftModelParameters(timestep_seconds=3600, integration_method="EULER", windage_range=(0.02, 0.04), diffusion_coef_m2_s=10.0)
    drift_sim = DriftSimulation(env, params, random_seed=42)
    
    particles = drift_sim.initialize_particles(100, geometry=geom_wgs84)
    drift_sim.run_simulation(particles, start_time=detection.acquisition_timestamp, duration_hours=24, is_backward=True)
    
    corridor = generate_corridor_geometry(particles)
    
    # Fail-fast check for Golden Demo
    assert corridor is not None, "Drift corridor generation failed!"
    assert len(corridor.hull_polygon.coordinates) > 0, "Drift corridor hull polygon is empty!"
    
    drift_result = DriftResult(
        detection_id=detection.detection_id,
        status=DriftStatus.SUCCESS,
        source_corridor=corridor,
        temporal_window=TemporalWindow(
            simulation_start=detection.acquisition_timestamp - datetime.timedelta(hours=24),
            simulation_end=detection.acquisition_timestamp,
            earliest_backtracked_time=detection.acquisition_timestamp - datetime.timedelta(hours=24),
            latest_backtracked_time=detection.acquisition_timestamp
        )
    )
    print(f"Drift Corridor Calculated. Status: {drift_result.status}")
    
    # 4. AIS Provider & Engine (Stage 5)
    ais_provider = OfflineAISProvider()
    ais_provider.load_from_csv("data/demo_case/ais/fixture.csv")
    
    # Simulate API orchestration
    min_lon, min_lat, max_lon, max_lat = -180, -90, 180, 90
    raw_positions = ais_provider.get_historical_positions(min_lon, min_lat, max_lon, max_lat, drift_result.temporal_window.simulation_start, drift_result.temporal_window.simulation_end)
    positions = normalize_ais_positions(raw_positions, ais_provider.provider_name)
    from src.ais.schema import VesselIdentity
    vessel_identities = {}
    for pos in positions:
        if pos.mmsi not in vessel_identities:
            ident_dict = ais_provider.get_vessel_identity(pos.mmsi)
            if ident_dict:
                vessel_identities[pos.mmsi] = VesselIdentity(**ident_dict)
    
    tracks = reconstruct_tracks(positions, vessel_identities, max_gap_seconds=3600, min_observations=3)
    
    import uuid
    cfg_ais = {"spatial_search_radius_meters": 50000.0, "corridor_interaction_threshold_meters": 500.0, "low_speed_threshold_knots": 1.0}
    candidates = []
    for track in tracks:
        spatial = calculate_spatial_compatibility(track, drift_result.source_corridor.hull_polygon)
        temporal = calculate_temporal_compatibility(track, drift_result.temporal_window)
        behavior = calculate_behavior_features(track, drift_result.source_corridor.hull_polygon, cfg_ais)
        ranking = rank_candidate(track, spatial, temporal, behavior, cfg_ais)
        candidates.append(VesselCandidate(candidate_id=uuid.uuid4(), track=track, spatial=spatial, temporal=temporal, behavior=behavior, ranking=ranking))
        
    ais_result = AISResult(
        drift_detection_id=detection.detection_id,
        status=AISResultStatus.SUCCESS,
        candidates=candidates,
        providers_used=["OfflineAISProvider"],
        provenance={"execution_time": datetime.datetime.now(datetime.timezone.utc).isoformat()}
    )
    print(f"AIS Candidates Processed: {len(ais_result.candidates)}")
    
    # 5. Evidence Engine (Stage 6)
    with open("model_repo/configs/stage6_config.yaml") as f:
        import yaml
        cfg = yaml.safe_load(f)
        
    final_result = evaluate_candidates(detection, drift_result, ais_result, cfg)
    
    print("\n--- GOLDEN DEMO INVESTIGATION RANKING ---")
    for i, candidate in enumerate(final_result.candidates):
        print(f"Rank {i+1}: {candidate.vessel_identity.ship_name} (MMSI: {candidate.vessel_identity.mmsi})")
        print(f"  Priority Score: {candidate.investigation_priority_score:.2f}")
        print(f"  Classification: {candidate.classification.value}")
        
    # Hash inputs for provenance
    def compute_sha256(filepath):
        sha256_hash = hashlib.sha256()
        try:
            with open(filepath, "rb") as f:
                for byte_block in iter(lambda: f.read(4096), b""):
                    sha256_hash.update(byte_block)
            return sha256_hash.hexdigest()
        except:
            return None

    # Embed hashes in final_result provenance
    final_result.provenance["input_hashes"] = {
        "sar_image": compute_sha256("data/raw/sar/test/images/20191015.tif"),
        "model_checkpoint": compute_sha256("models/best_model.pth"),
        "prediction_mask": compute_sha256("data/processed/inference_outputs/20191015_mask.tif"),
        "ais_fixture": compute_sha256("data/demo_case/ais/fixture.csv"),
        "environmental_forcing": compute_sha256("data/demo_case/environmental/forcing.json")
    }
    
    # Embed spill info in final_result provenance for frontend
    final_result.provenance["spill_info"] = {
        "area_km2": detection.area_km2,
        "centroid_lat": detection.geo_centroid.latitude,
        "centroid_lon": detection.geo_centroid.longitude,
        "geometry_wkt": detection.geometry.wkt if hasattr(detection.geometry, 'wkt') else str(detection.geometry)
    }
    
    # Save output for frontend
    out_dir = Path("data/demo_case/investigation")
    out_dir.mkdir(parents=True, exist_ok=True)
    import dataclasses
    
    result_dict = dataclasses.asdict(final_result)
    with open(out_dir / "result.json", "w") as f:
        json.dump(result_dict, f, default=str, indent=4)
        
    # Copy to public folder for React dev server
    public_dir = Path("public")
    public_dir.mkdir(parents=True, exist_ok=True)
    with open(public_dir / "result.json", "w") as f:
        json.dump(result_dict, f, default=str, indent=4)
        
    print("\nInvestigation complete. Ready for UI. (Output saved to data/demo_case/investigation/result.json and public/result.json)")

if __name__ == "__main__":
    run_investigation()
