import pytest
import numpy as np
from datetime import datetime, timedelta
from shapely.geometry import Polygon

from src.drift import (
    SyntheticConstantEnv,
    SyntheticVariableEnv,
    DriftModelParameters,
    DriftSimulation,
    ParticleState,
    calculate_kinematic_transport,
    step_geographic,
    calculate_uncertainty_summary,
    generate_corridor_geometry,
    DriftStatus
)

def test_kinematic_transport():
    u, v = calculate_kinematic_transport(1.0, 0.0, 0.0, 10.0, 0.03, 0.0, 0.0)
    assert u == 1.0
    assert abs(v - 0.3) < 1e-5

def test_step_geographic():
    new_lon, new_lat = step_geographic(0.0, 0.0, 1.0, 0.0, 3600)
    assert new_lon > 0.03
    assert new_lat == 0.0

def test_particle_beaching():
    env = SyntheticVariableEnv(datetime(2026, 1, 1))
    params = DriftModelParameters(3600, "Euler", (0.03, 0.03), 0.0)
    sim = DriftSimulation(env, params, random_seed=42)
    # Using centroid box as point initialization
    particles = sim.initialize_particles(1, {"type": "Polygon", "coordinates": [[[9.9, -0.1], [9.95, -0.1], [9.95, 0.1], [9.9, 0.1], [9.9, -0.1]]]})
    sim.run_simulation(particles, datetime(2026, 1, 1), 10.0)
    assert particles[0].state == ParticleState.BEACHED
    assert particles[0].lon < 10.0 

def test_missing_data_failure():
    env = SyntheticConstantEnv(1.0, 0, 0, 0, bounds=(-1.0, -1.0, 1.0, 1.0))
    params = DriftModelParameters(3600, "Euler", (0.03, 0.03), 0.0)
    sim = DriftSimulation(env, params)
    particles = sim.initialize_particles(1, {"type": "Polygon", "coordinates": [[[2.0, 2.0], [2.1, 2.0], [2.1, 2.1], [2.0, 2.1], [2.0, 2.0]]]})
    sim.run_simulation(particles, datetime(2026, 1, 1), 1.0)
    assert particles[0].state == ParticleState.REJECTED

# TEST A: Geometry-constrained initialization
def test_geometry_constrained_initialization():
    env = SyntheticConstantEnv(0, 0, 0, 0)
    params = DriftModelParameters(3600, "Euler", (0.03, 0.03), 0.0)
    sim = DriftSimulation(env, params, random_seed=42)
    
    poly_coords = [[0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0], [0.0, 0.0]]
    geom = {"type": "Polygon", "coordinates": [poly_coords]}
    shapely_poly = Polygon(poly_coords)
    
    particles = sim.initialize_particles(100, geometry=geom)
    assert len(particles) == 100
    for p in particles:
        from shapely.geometry import Point
        assert shapely_poly.contains(Point(p.lon, p.lat)), "Particle initialized outside geometry!"

# TEST B: Density Corridor (2D Histogram)
def test_density_corridor():
    env = SyntheticConstantEnv(0, 0, 0, 0)
    params = DriftModelParameters(3600, "Euler", (0.03, 0.03), 0.0)
    sim = DriftSimulation(env, params, random_seed=42)
    # create particles artificially
    particles = []
    # Cluster 1
    for i in range(50): particles.append(sim.initialize_particles(1, {"type": "Polygon", "coordinates": [[[0,0], [0.1,0], [0.1,0.1], [0,0.1], [0,0]]]})[0])
    # Cluster 2
    for i in range(50): particles.append(sim.initialize_particles(1, {"type": "Polygon", "coordinates": [[[10,10], [10.1,10], [10.1,10.1], [10,10.1], [10,10]]]})[0])
    
    corridor = generate_corridor_geometry(particles, density_quantile=0.0)
    # The density geometry should contain multiple disjoint coordinates (MultiPolygon output)
    # since we have two distant clusters with nothing in between.
    assert len(corridor.density_polygon.coordinates) >= 2

# TEST C: Metric Covariance
def test_metric_covariance():
    env = SyntheticConstantEnv(0, 0, 0, 0)
    params = DriftModelParameters(3600, "Euler", (0.03, 0.03), 0.0)
    sim = DriftSimulation(env, params, random_seed=42)
    
    # Square geometry length ~ 1 degree (~111km)
    geom = {"type": "Polygon", "coordinates": [[[0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0], [0.0, 0.0]]]}
    particles = sim.initialize_particles(500, geom)
    
    unc = calculate_uncertainty_summary(particles)
    # Dispersion matrix should be large (approx variance of uniform dist over 111km = (111000^2)/12 = ~1e9)
    assert unc.spatial_dispersion_matrix_m2[0][0] > 1e8
    assert unc.spatial_dispersion_matrix_m2[1][1] > 1e8

# TEST E: Historical Forcing Backward Drift
def test_historical_backward_forcing():
    base = datetime(2026, 1, 1)
    env = SyntheticVariableEnv(base) 
    # Current U = 0.5 + 0.1 * hours. 
    # T=0 -> U=0.5. T=10 -> U=1.5
    params = DriftModelParameters(3600, "Euler", (0.0, 0.0), 0.0)
    sim = DriftSimulation(env, params, random_seed=42)
    
    # We run backward from T=10
    geom = {"type": "Polygon", "coordinates": [[[0.0, 0.0], [0.1, 0.0], [0.1, 0.1], [0.0, 0.1], [0.0, 0.0]]]}
    particles = sim.initialize_particles(1, geom)
    
    # Start at base+10, run backwards for 2 hours
    sim.run_simulation(particles, base + timedelta(hours=10), duration_hours=2.0, is_backward=True)
    
    # Backward dx should be approx:
    # dt 1: u = -(0.5 + 0.1*10) = -1.5
    # dt 2: u = -(0.5 + 0.1*9) = -1.4
    # Expected dx = (-1.5 * 3600) + (-1.4 * 3600) = -10440 meters
    
    from src.drift.physics import R_EARTH
    import math
    dx_deg = (-10440) / (R_EARTH * math.cos(0))
    expected_lon = particles[0].lon_history[0] + math.degrees(dx_deg)
    
    assert abs(particles[0].lon - expected_lon) < 1e-4
