import uuid
import datetime
from typing import Dict, Any, List, Optional
import rasterio
from rasterio.features import shapes
import numpy as np
import skimage.measure

from src.characterization.schema import SpillDetection, GeoCentroid, UncertaintyStatus
from src.characterization.object_extraction import extract_spill_objects as s3_extract

def geometry_adapter(labeled_mask: np.ndarray, label_id: int, transform: rasterio.Affine) -> Optional[Dict[str, Any]]:
    """
    Extract valid GeoJSON polygon geometry for a specific labeled object.
    Uses rasterio.features.shapes.
    """
    # Create a mask just for this object
    obj_mask = (labeled_mask == label_id).astype(np.uint8)
    
    # Extract shapes
    # shapes() returns a generator of (polygon, value) pairs
    polygons = list(shapes(obj_mask, mask=(obj_mask == 1), transform=transform))
    
    if not polygons:
        return None
        
    # If a single object has multiple disjoint parts (rare given connected components, 
    # but possible with diagonals), we return a MultiPolygon or just the largest Polygon.
    # To be perfectly safe, we'll wrap it in a GeometryCollection or MultiPolygon if > 1.
    if len(polygons) == 1:
        return polygons[0][0] # Returns the GeoJSON dict
    else:
        # Construct a MultiPolygon
        multi = {
            "type": "MultiPolygon",
            "coordinates": []
        }
        for poly, val in polygons:
            if poly["type"] == "Polygon":
                multi["coordinates"].append(poly["coordinates"])
        return multi

def stage7_to_stage3(stage7_result: Dict[str, Any], acquisition_timestamp: Optional[datetime.datetime] = None) -> List[SpillDetection]:
    """
    Adapts Stage 7 Inference JSON result and mask into Stage 3 SpillDetection objects.
    Enriches them with valid GeoJSON geometry for Stage 4 compatibility.
    """
    if not stage7_result.get("detection", {}).get("oil_spill_detected", False):
        return []
        
    mask_path = stage7_result.get("output_mask")
    if not mask_path:
        return []
        
    s7_objects = {obj["label_id"]: obj for obj in stage7_result.get("objects", [])}
    
    with rasterio.open(mask_path) as src:
        binary_mask = src.read(1)
        transform = src.transform
        crs = src.crs
        
    labeled_mask = skimage.measure.label(binary_mask)
    
    # Run Stage 3 object extraction to get all the shape descriptors
    # (compactness, elongation, perimeter, etc.)
    res = src.res if hasattr(src, 'res') else (None, None)
    crs_units = "degrees" if crs and not crs.is_projected else "meters"
    
    metadata = {
        "source_scene_id": stage7_result.get("source", {}).get("filename", "UNKNOWN"),
        "sensor": "Sentinel-1",
        "polarization": "VV"
    }
    
    # Convert rasterio Affine to GDAL GeoTransform 6-tuple expected by Stage 3
    # Affine has (a,b,c,d,e,f) where c,f are translations. GDAL expects (c, a, b, f, d, e)
    gdal_transform = (transform.c, transform.a, transform.b, transform.f, transform.d, transform.e) if transform else None
    
    s3_detections = s3_extract(
        labeled_mask=labeled_mask,
        source_metadata=metadata,
        transform=gdal_transform,
        geospatial_resolution=res,
        crs=str(crs),
        crs_units=crs_units
    )
    
    # Enrich Stage 3 detections with Stage 7 confidence and Geometry Adapter
    for i, det in enumerate(s3_detections):
        label_id = i + 1 # skimage.measure.label creates 1-indexed sequential labels
        
        # 1. Uncertainty from Stage 7
        s7_obj = s7_objects.get(label_id)
        if s7_obj:
            det.uncertainty = UncertaintyStatus(
                model_confidence=s7_obj.get("confidence_mean"),
                segmentation_uncertainty="COMPUTED",
                geolocation_certainty="NOMINAL",
                attribution_confidence="UNAVAILABLE — NO AIS YET"
            )
            # Stage 7 area calculation is robust to CRS; optionally we could override S3 area
            # but S3 is fine.
            
        # 2. Add Geometry via Geometry Adapter
        geom = geometry_adapter(labeled_mask, label_id, transform)
        det.geometry = geom
        
        # Set timestamps
        det.acquisition_timestamp = acquisition_timestamp
        det.source_scene_id = metadata["source_scene_id"]
        
    return s3_detections
