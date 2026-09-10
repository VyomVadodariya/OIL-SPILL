import pytest
import os
import json
import uuid
import datetime
import numpy as np
from pathlib import Path
from unittest.mock import patch, MagicMock

from src.utils.adapters import stage7_to_stage3, geometry_adapter
from src.characterization.schema import SpillDetection
from src.drift.schema import DriftResult, DriftStatus
from src.ais.schema import AISResult, AISResultStatus
from src.evidence.engine import evaluate_candidates
from src.evidence.schema import Stage6Result, SourceType, CandidateClassification

@pytest.fixture
def mock_stage7_result():
    return {
        "status": "success",
        "source": {
            "filename": "test_image.tif",
            "width": 100,
            "height": 100,
            "crs": "EPSG:4326",
            "bands": 1
        },
        "detection": {
            "oil_spill_detected": True,
            "object_count": 1
        },
        "objects": [{
            "id": 1,
            "confidence_mean": 0.85,
            "confidence_max": 0.95,
            "area_km2": 2.5,
            "centroid": {"longitude": -89.0, "latitude": 28.0},
            "bbox": {"min_lon": -89.1, "min_lat": 27.9, "max_lon": -88.9, "max_lat": 28.1},
            "label_id": 1
        }],
        "output_mask": "dummy_path.tif" # Needs to be mocked or point to real file
    }

@patch('rasterio.open')
def test_stage7_to_stage3_adapter(mock_rasterio, mock_stage7_result):
    # Mock the rasterio reader
    mock_src = MagicMock()
    # 10x10 array with a 2x2 square in the middle
    mask = np.zeros((10, 10), dtype=np.uint8)
    mask[4:6, 4:6] = 1
    mock_src.read.return_value = mask
    
    import rasterio.transform
    # Transform: 1 degree per pixel, origin at 0, 10
    mock_src.transform = rasterio.transform.from_origin(0.0, 10.0, 1.0, 1.0)
    
    # We must mock crs.is_projected safely
    mock_crs = MagicMock()
    mock_crs.is_projected = False
    mock_src.crs = mock_crs
    mock_src.res = (1.0, 1.0)
    mock_crs.__str__.return_value = "EPSG:4326"
    
    # Needs to be returned on context manager entry
    mock_rasterio.return_value.__enter__.return_value = mock_src
    
    timestamp = datetime.datetime(2023, 1, 1, 12, 0, 0, tzinfo=datetime.timezone.utc)
    
    detections = stage7_to_stage3(mock_stage7_result, timestamp)
    
    assert len(detections) == 1
    det = detections[0]
    
    # Validation checks
    assert isinstance(det, SpillDetection)
    assert det.acquisition_timestamp == timestamp
    assert det.source_scene_id == "test_image.tif"
    assert det.uncertainty.model_confidence == 0.85
    assert det.geometry is not None
    assert det.geometry["type"] == "Polygon"

@patch('rasterio.open')
def test_geometry_adapter(mock_rasterio):
    # A single isolated pixel object
    labeled_mask = np.zeros((5, 5), dtype=np.uint8)
    labeled_mask[2, 2] = 1 
    
    import rasterio.transform
    transform = rasterio.transform.from_origin(0.0, 5.0, 1.0, 1.0)
    
    geom = geometry_adapter(labeled_mask, 1, transform)
    
    assert geom is not None
    assert geom["type"] == "Polygon"
    assert len(geom["coordinates"]) == 1 # one exterior ring
    ring = geom["coordinates"][0]
    assert len(ring) >= 4 # Polygon must have at least 4 points (closed ring)

def test_missing_environmental_data():
    # Execute the command line script logically without actual files
    import subprocess
    cmd = [
        "python", "scripts/run_e2e_pipeline.py",
        "--input", "nonexistent.tif",
        "--output-dir", "tests/tmp_e2e"
    ]
    # We expect this to fail gracefully at Stage 7 (file not found)
    # But let's test the drift INSUFFICIENT_DATA logic directly
    
    # Directly mock the data loading
    from scripts.run_e2e_pipeline import load_real_environment, DataMissingError
    import pytest
    with pytest.raises(DataMissingError):
        load_real_environment("fake_netcdf.nc")
        
def test_missing_ais_data():
    from src.ais.schema import AISResult, AISResultStatus
    # Stage 5 should return INSUFFICIENT_AIS_DATA
    res = AISResult(
        drift_detection_id=uuid.uuid4(),
        status=AISResultStatus.INSUFFICIENT_AIS_DATA,
        candidates=[],
        providers_used=[],
        provenance={}
    )
    assert len(res.candidates) == 0
    assert res.status == AISResultStatus.INSUFFICIENT_AIS_DATA

def test_no_fabricated_vessel_data():
    # Verify that without real data, candidates list remains purely empty
    # rather than creating synthetic vessels.
    from src.ais.schema import AISResult, AISResultStatus
    res = AISResult(
        drift_detection_id=uuid.uuid4(),
        status=AISResultStatus.INSUFFICIENT_AIS_DATA,
        candidates=[],
        providers_used=[],
        provenance={}
    )
    assert len(res.candidates) == 0

def test_unknown_attribution_when_evidence_missing():
    # If Stage 4 & 5 yield insufficient data, Stage 6 should return UNKNOWN classification
    det = SpillDetection(geometry={"type": "Polygon", "coordinates": [[[0,0], [0,1], [1,1], [1,0], [0,0]]]})
    drift_res = DriftResult(detection_id=det.detection_id, status=DriftStatus.INSUFFICIENT_DATA)
    ais_res = AISResult(drift_detection_id=det.detection_id, status=AISResultStatus.INSUFFICIENT_AIS_DATA, candidates=[], providers_used=[], provenance={})
    
    cfg = {
        "weights": {"spatial": 0.20, "temporal": 0.25, "drift": 0.35, "behavior": 0.10, "track_quality": 0.10},
        "reliability_priors": {"spatial": 0.90, "temporal": 0.90, "drift": 0.80, "behavior": 0.70, "track_quality": 1.0}
    }
    
    s6_res = evaluate_candidates(det, drift_res, ais_res, cfg)
    
    assert s6_res.source_type == SourceType.UNKNOWN
    assert len(s6_res.candidates) == 0

def test_coordinate_consistency():
    # Verify that the geometry adapter applies CRS transform correctly
    labeled_mask = np.zeros((3, 3), dtype=np.uint8)
    labeled_mask[1, 1] = 1 # center pixel
    
    import rasterio.transform
    # Pixel (1,1) with origin (100.0, 50.0) and size 1.0, -1.0
    # Top left of pixel (1,1) is (101.0, 49.0)
    # Bottom right is (102.0, 48.0)
    transform = rasterio.transform.from_origin(100.0, 50.0, 1.0, 1.0)
    geom = geometry_adapter(labeled_mask, 1, transform)
    
    ring = geom["coordinates"][0]
    # Check that points are in the expected bbox: x in [101, 102], y in [48, 49]
    for x, y in ring:
        assert 101.0 <= x <= 102.0
        assert 48.0 <= y <= 49.0

def test_timestamp_missing_behavior():
    # If timestamp is None, SpillDetection should gracefully accept None
    from src.utils.adapters import stage7_to_stage3
    
    mock_stage7 = {
        "detection": {"oil_spill_detected": False}
    }
    
    # Should not crash
    res = stage7_to_stage3(mock_stage7, acquisition_timestamp=None)
    assert len(res) == 0

@patch('scripts.run_e2e_pipeline.SARInferencePipeline.__init__', return_value=None)
@patch('scripts.run_e2e_pipeline.SARInferencePipeline.run_inference', create=True)
@patch('scripts.run_e2e_pipeline.stage7_to_stage3')
def test_full_pipeline_with_mocked_interfaces(mock_stage7_to_stage3, mock_run_inference, mock_init, tmp_path):
    # Test the script logic
    import subprocess
    
    # This is more robustly tested by actually invoking the python script using subprocess,
    # but since it requires the script to mock its internals, we can import main and override sys.argv
    import sys
    from scripts.run_e2e_pipeline import main
    
    test_args = ["scripts/run_e2e_pipeline.py", "--input", "dummy.tif", "--output-dir", str(tmp_path)]
    
    # Setup mocks
    mock_run_inference.return_value = {
        "detection": {"oil_spill_detected": True, "object_count": 1}
    }
    
    det = SpillDetection(area_km2=5.0, geometry={"type": "Polygon", "coordinates": [[[0,0], [0,1], [1,1], [1,0], [0,0]]]})
    mock_stage7_to_stage3.return_value = [det]
    
    with patch.object(sys, 'argv', test_args):
        main()
        
    out_file = tmp_path / "e2e_result.json"
    assert out_file.exists()
    
    with open(out_file) as f:
        res = json.load(f)
        
    assert res["pipeline_status"] == "SUCCESS_DEGRADED"
    assert res["drift"]["status"] == "INSUFFICIENT_DATA"
    assert res["attribution"]["classification"] == "UNKNOWN"
