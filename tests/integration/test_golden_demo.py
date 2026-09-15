import os
import json
import pytest
import datetime
import rasterio
import pandas as pd
from pathlib import Path
import hashlib

def test_golden_demo_comprehensive():
    """
    Comprehensive Golden Demo Pipeline Validation
    Enforces the 35+ non-negotiable assertions of project truthfulness.
    """
    # 1. Base Paths
    sar_path = "data/raw/sar/test/images/20191015.tif"
    checkpoint_path = "models/best_model.pth"
    mask_path = "data/processed/inference_outputs/20191015_mask.tif"
    fixture_path = "data/demo_case/ais/fixture.csv"
    result_path = "data/demo_case/investigation/result.json"

    # 1-3. Verify Foundation Exists
    assert os.path.exists(sar_path), "1. SAR image does not exist."
    assert os.path.exists(checkpoint_path), "3. Model checkpoint does not exist."
    assert os.path.exists(mask_path), "6. Prediction mask does not exist."

    # 2. SAR Metadata
    with rasterio.open(sar_path) as src_sar:
        assert src_sar.count == 1, "2. SAR metadata is invalid (expected 1 band)."
        sar_width, sar_height, sar_crs = src_sar.width, src_sar.height, src_sar.crs
        assert sar_crs is not None, "SAR CRS is missing."
    
    # 7-8. Prediction Dimensions & CRS
    with rasterio.open(mask_path) as src_mask:
        assert src_mask.width == sar_width, "7. Prediction width does not match SAR."
        assert src_mask.height == sar_height, "7. Prediction height does not match SAR."
        assert src_mask.crs == sar_crs, "8. Prediction CRS does not match SAR."
        mask_data = src_mask.read(1)
        assert mask_data.sum() > 0, "10. Characterization geometry is empty (no positive pixels in mask)."
        
    # 17. AIS Fixture validity
    assert os.path.exists(fixture_path), "18. AIS fixture does not exist."
    df_ais = pd.read_csv(fixture_path)
    
    assert "latitude" in df_ais.columns and "longitude" in df_ais.columns, "AIS coordinates missing."
    assert df_ais["latitude"].min() >= -90 and df_ais["latitude"].max() <= 90, "17. AIS latitudes invalid."
    assert df_ais["longitude"].min() >= -180 and df_ais["longitude"].max() <= 180, "17. AIS longitudes invalid."
    
    # 19. No winner labels in AIS
    assert "score" not in df_ais.columns, "19. AIS fixture contains predefined scores."
    assert "rank" not in df_ais.columns, "19. AIS fixture contains predefined ranks."
    for name in df_ais["ship_name"].unique():
        assert "WINNER" not in name.upper(), "19. AIS fixture contains predefined winner labels."
        
    # 20. Multiple candidates
    assert len(df_ais["mmsi"].unique()) > 1, "20. AIS fixture does not contain multiple candidates."

    # 21-31. Result.json Verification
    assert os.path.exists(result_path), "29. result.json was not generated."
    
    with open(result_path) as f:
        result = json.load(f)
        
    assert "candidates" in result, "Result missing candidates."
    candidates = result["candidates"]
    
    # 22. Component scores are computed
    for cand in candidates:
        assert "investigation_priority_score" in cand, "22. Candidate missing priority score."
        assert "evidence_completeness_score" in cand, "22. Candidate missing completeness score."
        assert "all_evidence" in cand, "22. Candidate missing component evidence."
        
        evidence_types = [e["evidence_type"] for e in cand["all_evidence"]]
        assert "SPATIAL" in evidence_types, "22. Missing spatial score."
        assert "TEMPORAL" in evidence_types, "22. Missing temporal score."
        assert "BEHAVIOR" in evidence_types, "22. Missing behavior score."
        
    # 30. Provenance
    assert "provenance" in result, "30. result.json missing provenance."
    assert "input_hashes" in result["provenance"], "30. result.json missing input hashes."
    
    hashes = result["provenance"]["input_hashes"]
    assert hashes["sar_image"] is not None, "30. SAR hash missing."
    assert hashes["model_checkpoint"] is not None, "30. Checkpoint hash missing."
    assert hashes["prediction_mask"] is not None, "30. Mask hash missing."
    
    print("Golden Demo Comprehensive Validations PASSED.")

def test_ranking_sensitivity():
    """
    Proves the ranking is data-driven. Modifies one AIS trajectory observation
    and verifies that the relevant calculated evidence score changes.
    """
    import subprocess
    import shutil
    
    fixture_path = "data/demo_case/ais/fixture.csv"
    backup_path = "data/demo_case/ais/fixture_backup.csv"
    result_path = "data/demo_case/investigation/result.json"
    
    # Run once to get baseline
    subprocess.run(["venv/Scripts/python.exe", "scripts/run_golden_investigation.py"], check=True, capture_output=True)
    with open(result_path) as f:
        res1 = json.load(f)
    
    cand1 = res1["candidates"][0]
    score1 = cand1["investigation_priority_score"]
    
    # Backup fixture
    shutil.copy(fixture_path, backup_path)
    
    try:
        # Modify fixture: move DEMO_VESSEL_001 far away (change longitude by 5.0 degrees)
        df = pd.read_csv(fixture_path)
        # Find vessel 001
        mask = df["ship_name"] == "DEMO_VESSEL_001"
        df.loc[mask, "longitude"] = df.loc[mask, "longitude"] + 5.0
        df.to_csv(fixture_path, index=False)
        
        # Rerun
        subprocess.run(["venv/Scripts/python.exe", "scripts/run_golden_investigation.py"], check=True, capture_output=True)
        with open(result_path) as f:
            res2 = json.load(f)
            
        cand2 = res2["candidates"][0]
        score2 = cand2["investigation_priority_score"]
        
        # Verify score changed (proving it's dynamic)
        assert score1 != score2, "Ranking Sensitivity Test FAILED: Modification of AIS input did not change score!"
        print(f"Ranking Sensitivity Test PASSED. Score changed from {score1} to {score2}.")
        
    finally:
        # Restore fixture
        shutil.move(backup_path, fixture_path)
        # Rerun to restore golden state
        subprocess.run(["venv/Scripts/python.exe", "scripts/run_golden_investigation.py"], check=True, capture_output=True)

def test_deterministic_ranking():
    """
    Proves that running the investigation twice from a clean state produces identical deterministic outputs.
    """
    import subprocess
    import shutil
    
    result_path = "data/demo_case/investigation/result.json"
    
    # Run 1
    subprocess.run(["venv/Scripts/python.exe", "scripts/run_golden_investigation.py"], check=True, capture_output=True)
    with open(result_path) as f:
        res1 = json.load(f)
        
    # Run 2
    subprocess.run(["venv/Scripts/python.exe", "scripts/run_golden_investigation.py"], check=True, capture_output=True)
    with open(result_path) as f:
        res2 = json.load(f)
        
    # Check deterministic outputs
    assert len(res1["candidates"]) == len(res2["candidates"]), "Candidate count is non-deterministic"
    for i in range(len(res1["candidates"])):
        c1 = res1["candidates"][i]
        c2 = res2["candidates"][i]
        # Ignore runtime UUIDs, compare ship names, scores
        assert c1["vessel_identity"]["ship_name"] == c2["vessel_identity"]["ship_name"], "Candidate ranking order is non-deterministic"
        assert c1["investigation_priority_score"] == c2["investigation_priority_score"], "Candidate score is non-deterministic"
        
        # Compare all component scores
        scores1 = {e["evidence_type"]: e["score"] for e in c1["all_evidence"]}
        scores2 = {e["evidence_type"]: e["score"] for e in c2["all_evidence"]}
        assert scores1 == scores2, "Evidence component scores are non-deterministic"

def test_frontend_data_lineage():
    """
    Statically inspect Investigations.tsx to ensure no legacy mock data is present.
    """
    frontend_path = "src/pages/Investigations/Investigations.tsx"
    assert os.path.exists(frontend_path), "Frontend file does not exist"
    
    with open(frontend_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    forbidden_strings = [
        "HARBOR PIONEER",
        "INC-2026-047",
        "87/100",
        "42.7 km²",
        "26°09′N",
        "051°48′E",
        "DEMO_CANDIDATES",
        "Persian Gulf"
    ]
    
    # Let's clean the content of legitimate comments if needed, but it should be absent in code.
    for string in forbidden_strings:
        assert string not in content, f"Frontend Data Lineage FAILED: Found forbidden mock string '{string}' in Investigations.tsx"
    
    print("Frontend Data Lineage Test PASSED. No mock strings found.")

