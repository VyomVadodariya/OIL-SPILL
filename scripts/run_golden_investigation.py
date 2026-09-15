import os
import sys
import json
import datetime
from pathlib import Path
from pyproj import Transformer

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
    # 1. Load Detection (Mocking Stage 3 for the Golden Scene)
    poly_geom = {"type": "Polygon", "coordinates": [[[-87.16, 28.87], [-87.15, 28.87], [-87.15, 28.88], [-87.16, 28.88], [-87.16, 28.87]]]}
    import uuid
    from src.characterization.schema import GeoCentroid
    detection = SpillDetection(
        detection_id=uuid.uuid4(),
        source_scene_id="GOLDEN_20191015",
        acquisition_timestamp=datetime.datetime(2019, 10, 15, tzinfo=datetime.timezone.utc),
        geo_centroid=GeoCentroid(longitude=-87.16, latitude=28.87),
        area_km2=5.0,
        geometry=poly_geom
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
    
    particles = drift_sim.initialize_particles(100, geometry=poly_geom)
    drift_sim.run_simulation(particles, start_time=detection.acquisition_timestamp, duration_hours=24, is_backward=True)
    
    corridor = generate_corridor_geometry(particles)
    drift_result = DriftResult(
        detection_id=detection.detection_id,
        status=DriftStatus.SUCCESS,
        source_corridor=CorridorGeometry(
            density_polygon=GeoPolygon(coordinates=[]),
            hull_polygon=GeoPolygon(coordinates=[])
        ),
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
        
    # Save output for frontend
    out_dir = Path("data/demo_case/investigation")
    out_dir.mkdir(parents=True, exist_ok=True)
    import dataclasses
    with open(out_dir / "result.json", "w") as f:
        json.dump(dataclasses.asdict(final_result), f, default=str, indent=4)
        
    print("\nInvestigation complete. Ready for UI.")

if __name__ == "__main__":
    run_investigation()
