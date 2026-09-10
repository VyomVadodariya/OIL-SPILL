import math
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from skimage.measure import regionprops

from src.characterization.schema import SpillDetection, PixelCentroid, GeoCentroid
from src.characterization.geospatial import pixel_to_geo, calculate_physical_area, calculate_physical_length

def extract_spill_objects(
    labeled_mask: np.ndarray,
    source_metadata: Dict[str, Any] = None,
    transform: Optional[Tuple[float, float, float, float, float, float]] = None,
    geospatial_resolution: Optional[Tuple[float, float]] = None,
    crs: Optional[str] = None,
    crs_units: str = "degrees"
) -> List[SpillDetection]:
    """
    Extract SpillDetection objects from a labeled mask.
    """
    if source_metadata is None:
        source_metadata = {}
        
    detections = []
    
    # regionprops ignores the 0 label (background)
    props = regionprops(labeled_mask)
    
    for prop in props:
        # Basic pixel properties
        area_pixels = prop.area
        bbox = prop.bbox # (min_row, min_col, max_row, max_col)
        row_cent, col_cent = prop.centroid
        perimeter_pixels = prop.perimeter
        major_axis_pixels = prop.axis_major_length
        minor_axis_pixels = prop.axis_minor_length
        orientation = math.degrees(prop.orientation) # radians to degrees
        
        # Derived shape properties
        compactness = (4 * math.pi * area_pixels) / (perimeter_pixels ** 2) if perimeter_pixels > 0 else 0
        elongation = major_axis_pixels / minor_axis_pixels if minor_axis_pixels > 0 else 1.0
        
        # Geospatial conversions
        geo_cent = None
        if transform:
            lon, lat = pixel_to_geo(row_cent, col_cent, transform)
            geo_cent = GeoCentroid(longitude=lon, latitude=lat)
            
        area_km2 = calculate_physical_area(area_pixels, geospatial_resolution, crs_units)
        perimeter_km = calculate_physical_length(perimeter_pixels, geospatial_resolution, crs_units)
        major_axis_km = calculate_physical_length(major_axis_pixels, geospatial_resolution, crs_units)
        minor_axis_km = calculate_physical_length(minor_axis_pixels, geospatial_resolution, crs_units)
        
        # We don't generate the exterior coordinates here for geometry to save time,
        # but could use skimage.measure.find_contours in the future.
        
        detection = SpillDetection(
            pixel_centroid=PixelCentroid(row=row_cent, col=col_cent),
            geo_centroid=geo_cent,
            bounding_box_pixels=bbox,
            area_pixels=area_pixels,
            perimeter_pixels=perimeter_pixels,
            major_axis_pixels=major_axis_pixels,
            minor_axis_pixels=minor_axis_pixels,
            pixel_count=area_pixels,
            area_km2=area_km2,
            perimeter_km=perimeter_km,
            major_axis_km=major_axis_km,
            minor_axis_km=minor_axis_km,
            orientation_degrees=orientation,
            compactness=compactness,
            elongation=elongation,
            geospatial_resolution=geospatial_resolution,
            crs=crs,
            source_metadata=source_metadata
        )
        detections.append(detection)
        
    return detections
