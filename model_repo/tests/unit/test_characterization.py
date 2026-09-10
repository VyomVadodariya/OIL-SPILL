import pytest
import numpy as np

from tests.fixtures.synthetic_masks import (
    get_single_compact_spill,
    get_elongated_spill,
    get_fragmented_spills,
    get_noisy_spill,
    get_empty_mask
)

from src.characterization.mask_processing import process_mask, label_connected_components
from src.characterization.object_extraction import extract_spill_objects
from src.characterization.geospatial import pixel_to_geo, calculate_physical_area, calculate_physical_length

def test_mask_processing_noise_removal():
    mask = get_noisy_spill()
    
    # Process with min area 10, should remove the 1x1 noise pixels
    processed = process_mask(mask, min_area_pixels=10, morph_closing_size=0, morph_opening_size=0)
    
    labeled, num_features = label_connected_components(processed)
    
    assert num_features == 1, "Noise should be removed, leaving 1 object."
    assert np.sum(processed) == 400, "Main object area should be 400."

def test_mask_processing_empty():
    mask = get_empty_mask()
    processed = process_mask(mask, min_area_pixels=10)
    labeled, num_features = label_connected_components(processed)
    assert num_features == 0
    assert np.sum(processed) == 0

def test_extract_spill_objects_compact():
    mask = get_single_compact_spill()
    labeled, num = label_connected_components(mask)
    detections = extract_spill_objects(labeled)
    
    assert len(detections) == 1
    det = detections[0]
    
    assert det.area_pixels == 400
    assert det.bounding_box_pixels == (40, 40, 60, 60)
    assert abs(det.pixel_centroid.row - 49.5) < 1e-5
    assert abs(det.pixel_centroid.col - 49.5) < 1e-5
    
    # Square, so major/minor axis should be similar
    assert abs(det.major_axis_pixels - det.minor_axis_pixels) < 5.0
    
def test_extract_spill_objects_elongated():
    mask = get_elongated_spill()
    labeled, num = label_connected_components(mask)
    detections = extract_spill_objects(labeled)
    
    assert len(detections) == 1
    det = detections[0]
    
    assert det.area_pixels == 400
    assert det.elongation > 3.0, "Elongation should be high for 10x40 rectangle"

def test_extract_spill_objects_fragmented():
    mask = get_fragmented_spills()
    labeled, num = label_connected_components(mask)
    detections = extract_spill_objects(labeled)
    
    assert len(detections) == 2
    areas = [d.area_pixels for d in detections]
    assert sorted(areas) == [100, 100]

def test_geospatial_conversions():
    # Simple affine: lon = 10 + 0.1*col, lat = 20 - 0.1*row
    transform = (10.0, 0.1, 0.0, 20.0, 0.0, -0.1)
    
    lon, lat = pixel_to_geo(50, 50, transform)
    assert abs(lon - 15.0) < 1e-5
    assert abs(lat - 15.0) < 1e-5

def test_physical_measurements():
    # Resolution 10m x 10m
    geospatial_resolution = (10.0, 10.0)
    
    # 100 pixels * 100m^2 = 10,000 m^2 = 0.01 km^2
    area_km2 = calculate_physical_area(100, geospatial_resolution, crs_units="meters")
    assert abs(area_km2 - 0.01) < 1e-6
    
    # 50 pixels length * 10m = 500m = 0.5 km
    length_km = calculate_physical_length(50.0, geospatial_resolution, crs_units="meters")
    assert abs(length_km - 0.5) < 1e-6

def test_missing_geospatial_metadata():
    mask = get_single_compact_spill()
    labeled, _ = label_connected_components(mask)
    
    # Extract without geo metadata
    detections = extract_spill_objects(labeled, transform=None, geospatial_resolution=None)
    det = detections[0]
    
    assert det.area_km2 is None
    assert det.geo_centroid is None
    assert det.area_pixels == 400
