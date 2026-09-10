import numpy as np
import rasterio
from rasterio.features import shapes
from rasterio.warp import transform_bounds
import skimage.measure
import scipy.ndimage
import logging

def clean_binary_mask(mask: np.ndarray, opening_kernel: int = 3, closing_kernel: int = 3, min_area: int = 10) -> np.ndarray:
    """Apply morphological operations to clean up salt-and-pepper noise."""
    if opening_kernel > 0:
        struct_open = np.ones((opening_kernel, opening_kernel), dtype=bool)
        mask = scipy.ndimage.binary_opening(mask, structure=struct_open)
        
    if closing_kernel > 0:
        struct_close = np.ones((closing_kernel, closing_kernel), dtype=bool)
        mask = scipy.ndimage.binary_closing(mask, structure=struct_close)
        
    # Remove small components
    if min_area > 0:
        labeled = skimage.measure.label(mask)
        for region in skimage.measure.regionprops(labeled):
            if region.area < min_area:
                mask[labeled == region.label] = 0
                
    return mask.astype(np.uint8)

def calculate_pixel_area_m2(transform, crs) -> float:
    """Calculate area of a single pixel in square meters. Supports projected and geographic CRS."""
    if crs.is_projected:
        # Simple abs(w * h)
        pixel_width = abs(transform[0])
        pixel_height = abs(transform[4])
        return pixel_width * pixel_height
    else:
        # If geographic, we do a rough estimation at the center of the transform, or just assume it's WGS84
        # A more robust method is to use geodesic calculations, but for simplicity here we approximate
        # 1 degree approx 111,320 meters at equator
        # Note: True geodesic area of polygons is preferred, but per-pixel is requested as an option
        pixel_width_deg = abs(transform[0])
        pixel_height_deg = abs(transform[4])
        return (pixel_width_deg * 111320) * (pixel_height_deg * 111320)

def extract_spill_objects(binary_mask: np.ndarray, prob_map: np.ndarray, transform, crs) -> list:
    """
    Extracts individual candidate spill objects, their geometries, confidence, and area.
    """
    labeled = skimage.measure.label(binary_mask)
    regions = skimage.measure.regionprops(labeled, intensity_image=prob_map)
    
    objects = []
    pixel_area = calculate_pixel_area_m2(transform, crs)
    
    for i, region in enumerate(regions, 1):
        # Confidence
        conf_mean = float(region.intensity_mean)
        conf_max = float(region.intensity_max)
        
        # Area
        area_km2 = (region.area * pixel_area) / 1_000_000.0
        
        # Bounding box (min_row, min_col, max_row, max_col)
        minr, minc, maxr, maxc = region.bbox
        
        # Transform pixel bounds to source CRS coords
        # rasterio transform.xy expects (row, col)
        # Bounding box in source CRS
        left, bottom, right, top = rasterio.transform.array_bounds(maxr - minr, maxc - minc, transform * rasterio.Affine.translation(minc, minr))
        
        # Transform to EPSG:4326 for UI
        min_lon, min_lat, max_lon, max_lat = transform_bounds(crs, 'EPSG:4326', left, bottom, right, top)
        
        centroid_lon, centroid_lat, _, _ = transform_bounds(crs, 'EPSG:4326', 
                                                           left + (right-left)/2, bottom + (top-bottom)/2, 
                                                           left + (right-left)/2, bottom + (top-bottom)/2)
        
        objects.append({
            "id": i,
            "confidence_mean": conf_mean,
            "confidence_max": conf_max,
            "area_km2": area_km2,
            "centroid": {
                "longitude": centroid_lon,
                "latitude": centroid_lat
            },
            "bbox": {
                "min_lon": min_lon,
                "min_lat": min_lat,
                "max_lon": max_lon,
                "max_lat": max_lat
            },
            # Note: A full polygon geometry extraction will be done on the full mask using rasterio.features.shapes
            # We'll merge them in the main pipeline
            "label_id": region.label
        })
        
    return objects
