import math
from typing import Tuple

# WGS84 Earth radius in meters
R_EARTH = 6378137.0

def step_geographic(lon: float, lat: float, u_m_s: float, v_m_s: float, dt_seconds: float) -> Tuple[float, float]:
    """
    Geographic integration using a simple locally flat approximation (Euler step).
    Converts velocity in m/s to delta longitude/latitude over dt_seconds.
    
    u_m_s: Eastward velocity (m/s)
    v_m_s: Northward velocity (m/s)
    """
    dx = u_m_s * dt_seconds
    dy = v_m_s * dt_seconds
    
    # Latitude change
    dlat = dy / R_EARTH
    new_lat = lat + math.degrees(dlat)
    
    # Longitude change (depends on latitude)
    # Clamp latitude to prevent division by zero at poles
    lat_rad = math.radians(lat)
    dlon = dx / (R_EARTH * math.cos(lat_rad))
    new_lon = lon + math.degrees(dlon)
    
    return new_lon, new_lat

def calculate_kinematic_transport(
    u_c: float, v_c: float, 
    u_w: float, v_w: float, 
    windage: float,
    u_diff: float = 0.0, v_diff: float = 0.0
) -> Tuple[float, float]:
    """
    Calculate the combined velocity vector.
    v_total = v_current + (windage * v_wind) + v_diffusion
    """
    u_total = u_c + (windage * u_w) + u_diff
    v_total = v_c + (windage * v_w) + v_diff
    return u_total, v_total
