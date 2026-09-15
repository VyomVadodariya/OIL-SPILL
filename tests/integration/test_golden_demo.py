import os
import json
import pytest
import datetime
import rasterio
import pandas as pd
from pathlib import Path
import subprocess
import shutil

def test_golden_demo_foundation_and_characterization():
    """
    TEST 1: SAR exists, model exists, mask exists, dimensions match, polygon valid, area > 0, drift/corridor.
    """
    sar_path = "data/raw/sar/test/images/20191015.tif"
    checkpoint_path = "models/best_model.pth"
    mask_path = "data/processed/inference_outputs/20191015_mask.tif"
    result_path = "data/demo_case/investigation/result.json"

    assert os.path.exists(sar_path), "SAR exists"
    assert os.path.exists(checkpoint_path), "model exists"
    assert os.path.exists(mask_path), "prediction mask exists"

    with rasterio.open(sar_path) as src_sar:
        sar_width, sar_height, sar_crs = src_sar.width, src_sar.height, src_sar.crs
        
    with rasterio.open(mask_path) as src_mask:
        assert src_mask.width == sar_width, "mask dimensions align with SAR"
        assert src_mask.height == sar_height, "mask dimensions align with SAR"
        assert src_mask.crs == sar_crs, "CRS valid"
        mask_data = src_mask.read(1)
        assert mask_data.sum() > 0, "area > 0"
        
    assert os.path.exists(result_path)
    with open(result_path) as f:
        result = json.load(f)
        
    assert "provenance" in result
    assert "input_hashes" in result["provenance"]
    assert result["provenance"]["input_hashes"].get("sar_image"), "SAR hash exists"
    assert result["provenance"]["input_hashes"].get("model_checkpoint"), "model hash exists"
    assert result["provenance"]["input_hashes"].get("prediction_mask"), "prediction mask hash exists"
    
    assert "spill_info" in result["provenance"]
    assert result["provenance"]["spill_info"].get("area_km2", 0) > 0, "area > 0"
    assert result["provenance"]["spill_info"].get("centroid_lat") is not None, "centroid exists"
    assert result["provenance"]["spill_info"].get("geometry_wkt") is not None, "polygon valid"
    
    assert result["detection_id"] is not None
    assert "drift_info" in result["provenance"], "drift result exists"
    assert result["provenance"]["drift_info"]["particle_count"] == 500, "corridor exists"

def test_golden_demo_ais_and_ranking():
    """
    TEST 2: AIS fixture exists, hash exists, 3 vessels, >0 obs, valid coords, tracks reconstructed, candidates ranked.
    """
    fixture_path = "data/demo_case/ais/fixture.csv"
    result_path = "data/demo_case/investigation/result.json"
    
    assert os.path.exists(fixture_path), "AIS fixture exists"
    
    df_ais = pd.read_csv(fixture_path)
    assert len(df_ais) > 0, "observations > 0"
    assert len(df_ais["mmsi"].unique()) == 3, "3 vessels"
    assert df_ais["latitude"].min() >= -90 and df_ais["latitude"].max() <= 90, "coordinates valid"
    assert df_ais["longitude"].min() >= -180 and df_ais["longitude"].max() <= 180, "coordinates valid"
    
    with open(result_path) as f:
        result = json.load(f)
        
    assert result["provenance"]["input_hashes"].get("ais_fixture"), "AIS hash exists"
    
    candidates = result["candidates"]
    assert len(candidates) > 0, "candidates ranked"
    
    # rank ordering exists
    scores = [c["investigation_priority_score"] for c in candidates]
    assert scores == sorted(scores, reverse=True), "rank ordering exists"
    
    for c in candidates:
        ev_types = [e["evidence_type"] for e in c["all_evidence"]]
        assert "SPATIAL" in ev_types, "component scores exist"
        assert "TEMPORAL" in ev_types, "component scores exist"
        assert "BEHAVIOR" in ev_types, "component scores exist"
        
        # no guilt/responsibility language
        assert "guilt" not in c["classification"].lower(), "no guilt/responsibility language"
        assert "responsible" not in c["classification"].lower(), "no guilt/responsibility language"

def test_golden_demo_provenance_and_frontend_integrity():
    """
    TEST 3: Provenance hashes, result.json loads, no legacy frontend mocks.
    """
    result_path = "data/demo_case/investigation/result.json"
    assert os.path.exists(result_path), "result.json exists"
    
    with open(result_path) as f:
        result = json.load(f) # valid JSON
        
    hashes = result["provenance"]["input_hashes"]
    assert all(hashes.values()), "all required hashes exist"
    
    frontend_dir = "src"
    
    # Check frontend loads result.json (rough heuristic or grep)
    # Just statically check no legacy mocks
    forbidden_strings = [
        "HARBOR PIONEER",
        "INC-2026-047",
        "87/100",
        "42.7 km²",
        "Persian Gulf",
        "26°09′N",
        "051°48′E",
        "DEMO_CANDIDATES"
    ]
    
    # We will search the src directory for forbidden strings
    found_forbidden = []
    for root, _, files in os.walk(frontend_dir):
        for file in files:
            if file.endswith(('.ts', '.tsx', '.json', '.html')):
                with open(os.path.join(root, file), 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    for fs in forbidden_strings:
                        if fs in content:
                            found_forbidden.append(f"{fs} in {file}")
                            
    assert len(found_forbidden) == 0, f"Found legacy mock values: {found_forbidden}"

def test_ranking_sensitivity_and_reproducibility():
    """
    TEST 4: run baseline -> record score -> modify AIS -> rerun -> prove score changes -> restore -> prove baseline returns
    """
    fixture_path = "data/demo_case/ais/fixture.csv"
    backup_path = "data/demo_case/ais/fixture_backup.csv"
    result_path = "data/demo_case/investigation/result.json"
    
    def run_pipeline():
        subprocess.run(["venv/Scripts/python.exe", "scripts/run_golden_investigation.py"], check=True, capture_output=True)
        with open(result_path) as f:
            return json.load(f)
            
    # 1, 2. run baseline, record Rank 1 score
    res_baseline = run_pipeline()
    baseline_score = res_baseline["candidates"][0]["investigation_priority_score"]
    
    # 3. modify AIS fixture
    shutil.copy(fixture_path, backup_path)
    df = pd.read_csv(fixture_path)
    # artificially move vessels far away
    df["latitude"] = df["latitude"] + 10.0
    df.to_csv(fixture_path, index=False)
    
    try:
        # 4, 5. rerun, prove candidate score/ranking changes
        res_modified = run_pipeline()
        modified_score = res_modified["candidates"][0]["investigation_priority_score"]
        assert modified_score != baseline_score, "Candidate score did not change after modifying AIS data."
    finally:
        # 6. restore AIS fixture
        shutil.move(backup_path, fixture_path)
        
    # 7, 8. rerun, prove baseline state returns
    res_restored = run_pipeline()
    restored_score = res_restored["candidates"][0]["investigation_priority_score"]
    assert restored_score == baseline_score, "Baseline state did not return after restoring AIS data."
