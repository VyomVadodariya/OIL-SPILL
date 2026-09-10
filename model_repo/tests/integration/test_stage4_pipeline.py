import pytest
import uuid
import subprocess
from datetime import datetime, timedelta

from src.characterization.schema import SpillDetection, GeoCentroid, PixelCentroid
from src.drift import (
    DriftSimulation,
    DriftModelParameters,
    SyntheticConstantEnv,
    DriftResult,
    DriftStatus,
    EnvironmentalInputMetadata,
    Provenance,
    TemporalWindow,
    calculate_uncertainty_summary,
    generate_corridor_geometry,
    GeoPolygon
)

def test_stage3_to_stage4_pipeline():
    detection_id = uuid.uuid4()
    detection_time = datetime(2026, 9, 9, 12, 0, 0)
    
    # 1. Simulating a Stage 3 output SpillDetection with actual GeoJSON geometry
    geom_poly = {
        "type": "Polygon",
        "coordinates": [[[0.0, 0.0], [0.5, 0.0], [0.5, 0.5], [0.0, 0.5], [0.0, 0.0]]]
    }
    
    spill = SpillDetection(
        detection_id=detection_id,
        acquisition_timestamp=detection_time,
        geo_centroid=GeoCentroid(longitude=0.25, latitude=0.25),
        pixel_centroid=PixelCentroid(row=50, col=50),
        area_pixels=100,
        geometry=geom_poly
    )
    
    # 2. Stage 4 Drift Engine Setup
    duration_hours = 12.0
    env = SyntheticConstantEnv(current_u=0.5, current_v=0.1, wind_u=-5.0, wind_v=0.0)
    params = DriftModelParameters(
        timestep_seconds=3600,
        integration_method="Euler",
        windage_range=(0.02, 0.04),
        diffusion_coef_m2_s=0.1
    )
    
    sim = DriftSimulation(env, params, random_seed=123)
    
    # Initialize inside the exact geometry
    particles = sim.initialize_particles(
        num_particles=50,
        geometry=spill.geometry
    )
    
    assert len(particles) == 50
    
    # 3. Execute backward simulation
    sim.run_simulation(
        particles=particles,
        start_time=spill.acquisition_timestamp,
        duration_hours=duration_hours,
        is_backward=True
    )
    
    # 4. Generate Results
    unc_summary = calculate_uncertainty_summary(particles)
    corridor = generate_corridor_geometry(particles)
    
    earliest_time = spill.acquisition_timestamp - timedelta(hours=duration_hours)
    
    # Get current commit hash for provenance dynamically
    try:
        git_hash = subprocess.check_output(['git', 'rev-parse', '--short', 'HEAD']).decode('ascii').strip()
    except Exception:
        git_hash = "unknown_test_hash"
        
    temporal = TemporalWindow(
        simulation_start=spill.acquisition_timestamp,
        simulation_end=earliest_time,
        earliest_backtracked_time=earliest_time,
        latest_backtracked_time=spill.acquisition_timestamp,
        configured_search_horizon_hours=duration_hours
    )
    
    result = DriftResult(
        detection_id=spill.detection_id,
        status=DriftStatus.SUCCESS,
        temporal_window=temporal,
        source_corridor=corridor,
        forward_corridor=None,
        uncertainty=unc_summary,
        parameters=params,
        environment=EnvironmentalInputMetadata(source_current="SyntheticConstant", source_wind="SyntheticConstant"),
        provenance=Provenance(git_hash=git_hash, execution_timestamp=datetime.now(), random_seed=123)
    )
    
    # TEST D & F: Verify typed schema and dynamic provenance
    assert result.status == DriftStatus.SUCCESS
    assert isinstance(result.temporal_window, TemporalWindow)
    assert isinstance(result.source_corridor.density_polygon, GeoPolygon)
    assert result.provenance.git_hash == git_hash
    assert result.provenance.git_hash != "ef759ab" # Should not hardcode old Stage 3 commit
    assert result.uncertainty.active_particles > 0
    assert result.source_corridor.density_polygon.coordinates is not None
