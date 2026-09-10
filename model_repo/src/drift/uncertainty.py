import numpy as np
import math
from typing import List
from src.drift.schema import UncertaintySummary, ParticleState
from src.drift.particle import Particle
from src.drift.physics import R_EARTH

def _deg_to_meters_from_centroid(lon: float, lat: float, centroid_lon: float, centroid_lat: float) -> tuple[float, float]:
    """Convert degrees offset to local metric offset (meters)."""
    dlat = math.radians(lat - centroid_lat)
    dlon = math.radians(lon - centroid_lon)
    lat_rad = math.radians(centroid_lat)
    
    dy = dlat * R_EARTH
    dx = dlon * R_EARTH * math.cos(lat_rad)
    return dx, dy

def calculate_uncertainty_summary(particles: List[Particle]) -> UncertaintySummary:
    """
    Computes ensemble statistics for the final timestep in metric coordinate space.
    """
    total = len(particles)
    active = sum(1 for p in particles if p.state == ParticleState.ACTIVE)
    beached = sum(1 for p in particles if p.state == ParticleState.BEACHED)
    rejected = sum(1 for p in particles if p.state == ParticleState.REJECTED)
    
    # Calculate centroid and covariance for active + beached particles
    valid_particles = [p for p in particles if p.state != ParticleState.REJECTED]
    
    if not valid_particles:
        return UncertaintySummary(
            total_particles=total, active_particles=active, beached_particles=beached, rejected_particles=rejected,
            spatial_dispersion_matrix_m2=[[0.0, 0.0], [0.0, 0.0]],
            centroid_lon=0.0, centroid_lat=0.0
        )
        
    lons = np.array([p.lon for p in valid_particles])
    lats = np.array([p.lat for p in valid_particles])
    
    centroid_lon = float(np.mean(lons))
    centroid_lat = float(np.mean(lats))
    
    if len(valid_particles) > 1:
        # Convert to local metric coords (meters) relative to centroid
        local_x = []
        local_y = []
        for p in valid_particles:
            dx, dy = _deg_to_meters_from_centroid(p.lon, p.lat, centroid_lon, centroid_lat)
            local_x.append(dx)
            local_y.append(dy)
            
        cov_m2 = np.cov(local_x, local_y).tolist()
    else:
        cov_m2 = [[0.0, 0.0], [0.0, 0.0]]
        
    return UncertaintySummary(
        total_particles=total,
        active_particles=active,
        beached_particles=beached,
        rejected_particles=rejected,
        spatial_dispersion_matrix_m2=cov_m2,
        centroid_lon=centroid_lon,
        centroid_lat=centroid_lat
    )
