import pytest
import json
from dataclasses import asdict

from tests.fixtures.synthetic_masks import get_noisy_spill
from src.characterization import (
    process_mask,
    label_connected_components,
    extract_spill_objects
)

def test_stage3_end_to_end_pipeline():
    """
    Integration test for Stage 3:
    Synthetic segmentation mask -> Mask processing -> Object extraction -> Geospatial conversion -> JSON serialization
    """
    # 1. Input: Raw semantic mask (with noise)
    raw_mask = get_noisy_spill()
    
    # 2. Mask processing (remove noise, min area 10)
    processed_mask = process_mask(raw_mask, min_area_pixels=10)
    
    # 3. Label connected components
    labeled_mask, num_features = label_connected_components(processed_mask)
    assert num_features == 1, "Should isolate one valid spill object"
    
    # 4. Object extraction & geospatial conversion
    # Mock geospatial metadata
    transform = (10.0, 0.1, 0.0, 20.0, 0.0, -0.1)
    resolution = (10.0, 10.0)
    
    source_metadata = {
        "scene_id": "S1A_IW_GRDH_1SDV_20260909",
        "sensor": "Sentinel-1A",
        "polarization": "VV"
    }
    
    detections = extract_spill_objects(
        labeled_mask,
        source_metadata=source_metadata,
        transform=transform,
        geospatial_resolution=resolution,
        crs="EPSG:4326",
        crs_units="meters"
    )
    
    assert len(detections) == 1
    det = detections[0]
    
    # Assign some manual fields required by schema
    det.source_scene_id = source_metadata["scene_id"]
    det.sensor = source_metadata["sensor"]
    det.polarization = source_metadata["polarization"]
    
    # Verify core schema elements
    assert det.area_pixels == 400
    assert det.geo_centroid is not None
    assert det.area_km2 == 0.04 # 400 pixels * 100m2 = 40,000m2 = 0.04km2
    assert det.uncertainty.segmentation_uncertainty == "UNAVAILABLE — MODEL NOT VALIDATED"
    
    # 5. JSON serialization
    import uuid
    from datetime import datetime
    
    # Helper to serialize uuid and datetime
    class JSONEncoder(json.JSONEncoder):
        def default(self, obj):
            if isinstance(obj, uuid.UUID):
                return str(obj)
            if isinstance(obj, datetime):
                return obj.isoformat()
            return super().default(obj)
            
    # Convert dataclass to dict and then JSON string
    det_dict = asdict(det)
    json_str = json.dumps(det_dict, cls=JSONEncoder)
    
    # Verify we can deserialize
    reconstructed = json.loads(json_str)
    
    assert reconstructed["source_scene_id"] == "S1A_IW_GRDH_1SDV_20260909"
    assert reconstructed["area_pixels"] == 400
    assert reconstructed["area_km2"] == 0.04
    assert reconstructed["pixel_centroid"]["row"] == 49.5
