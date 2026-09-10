import numpy as np
from typing import Optional, Tuple, Dict, Any, List

def pixel_to_geo(
    row: float, 
    col: float, 
    transform: Optional[Tuple[float, float, float, float, float, float]]
) -> Optional[Tuple[float, float]]:
    """
    Convert a pixel (row, col) to geographical (longitude, latitude).
    Requires an affine transform tuple: (c, a, b, f, d, e) where:
    lon = c + a*col + b*row
    lat = f + d*col + e*row
    (rasterio standard order)
    """
    if not transform:
        return None
        
    c, a, b, f, d, e = transform
    lon = c + a * col + b * row
    lat = f + d * col + e * row
    
    return lon, lat

def calculate_physical_area(
    area_pixels: int, 
    geospatial_resolution: Optional[Tuple[float, float]],
    crs_units: str = "degrees"
) -> Optional[float]:
    """
    Convert area in pixels to area in square kilometers.
    Assumes resolution is in meters if crs_units == "meters".
    If resolution is in degrees, this is an approximation and might require reprojection for accurate km2.
    For simplicity, if units are meters, we divide by 1_000_000.
    """
    if not geospatial_resolution:
        return None
        
    x_res, y_res = geospatial_resolution
    
    if crs_units.lower() == "meters" or crs_units.lower() == "m":
        area_m2 = area_pixels * abs(x_res) * abs(y_res)
        return area_m2 / 1_000_000.0
        
    return None

def calculate_physical_length(
    length_pixels: float,
    geospatial_resolution: Optional[Tuple[float, float]],
    crs_units: str = "degrees"
) -> Optional[float]:
    """
    Convert length (perimeter, major/minor axis) from pixels to kilometers.
    Uses an average of x/y resolution.
    """
    if not geospatial_resolution:
        return None
        
    x_res, y_res = geospatial_resolution
    avg_res = (abs(x_res) + abs(y_res)) / 2.0
    
    if crs_units.lower() == "meters" or crs_units.lower() == "m":
        length_m = length_pixels * avg_res
        return length_m / 1000.0
        
    return None

def create_geojson_polygon(
    exterior_coords: List[Tuple[float, float]]
) -> Dict[str, Any]:
    """
    Generate a GeoJSON Polygon representation.
    """
    return {
        "type": "Polygon",
        "coordinates": [exterior_coords]
    }
