import pytest
import torch
import numpy as np
from src.evaluation.metrics import calculate_metrics
from src.preprocessing.sar_prep import convert_linear_to_db, preprocess_sentinel1_grd
from src.models.unet import create_unet_model
from src.data.splitter import create_leakage_safe_splits, default_scene_extractor

def test_metrics_calculation():
    """Test precision, recall, dice, iou on dummy tensors."""
    preds = torch.tensor([[[[0.9, 0.1], [0.8, 0.2]]]])
    targets = torch.tensor([[[[1.0, 0.0], [1.0, 0.0]]]])
    
    metrics = calculate_metrics(preds, targets, threshold=0.5)
    
    assert metrics['precision'] == 1.0  # tp=2, fp=0
    assert metrics['recall'] == 1.0     # tp=2, fn=0
    assert metrics['dice'] > 0.99
    assert metrics['iou'] > 0.99
    assert metrics['fpr'] == 0.0

def test_preprocessing():
    """Test SAR normalization."""
    # Dummy linear power array
    linear_img = np.array([[0.001, 0.01], [0.1, 1.0]])
    db_img = convert_linear_to_db(linear_img, min_db=-30.0, max_db=0.0)
    
    # Check shape
    assert db_img.shape == (2, 2)
    # 1.0 -> 0 dB -> 1.0 normalized
    assert np.isclose(db_img[1, 1], 1.0)
    # 0.001 -> -30 dB -> 0.0 normalized
    assert np.isclose(db_img[0, 0], 0.0)

def test_unet_output_shape():
    """Test that the U-Net produces output of the same spatial dimensions."""
    model = create_unet_model(in_channels=1, classes=1)
    # Batch=2, Channels=1, H=256, W=256
    dummy_input = torch.randn(2, 1, 256, 256)
    output = model(dummy_input)
    
    assert output.shape == (2, 1, 256, 256)

def test_leakage_safe_splitter(tmp_path):
    """Test that scenes are never split across train and test."""
    # Create dummy files
    files = [
        "S1A_IW_GRDH_1SDV_20220101_patch_01.tif",
        "S1A_IW_GRDH_1SDV_20220101_patch_02.tif",
        "S1A_IW_GRDH_1SDV_20220202_patch_01.tif",
        "S1A_IW_GRDH_1SDV_20220303_patch_01.tif",
        "S1A_IW_GRDH_1SDV_20220404_patch_01.tif"
    ]
    for f in files:
        (tmp_path / f).touch()
        
    train, val, test = create_leakage_safe_splits(str(tmp_path), val_ratio=0.25, test_ratio=0.25, seed=42)
    
    # 20220101 scene has two patches. They MUST be in the same split.
    locs = []
    for split, name in [(train, "train"), (val, "val"), (test, "test")]:
        if "S1A_IW_GRDH_1SDV_20220101_patch_01.tif" in split:
            locs.append(name)
        if "S1A_IW_GRDH_1SDV_20220101_patch_02.tif" in split:
            locs.append(name)
            
    # Both patches must be found, and they must be in the exactly same split
    assert len(locs) == 2
    assert locs[0] == locs[1]
