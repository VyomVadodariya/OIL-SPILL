import pytest
import os
import torch
import torch.nn as nn
import numpy as np
import pandas as pd
import rasterio
from pathlib import Path

from src.data.dataset import GulfOfMexicoPatchDataset, TestSceneDataset
from src.models.unet import create_unet_model
from src.evaluation.metrics import calculate_metrics

@pytest.fixture
def mock_sar_data(tmp_path):
    img_dir = tmp_path / "images"
    mask_dir = tmp_path / "masks"
    img_dir.mkdir()
    mask_dir.mkdir()
    
    # Create mock 500x500 image with NaNs
    img_path = img_dir / "20200307.tif"
    mask_path = mask_dir / "20200307.tif"
    
    img_data = np.random.randn(500, 500).astype(np.float32)
    img_data[0, 0] = np.nan
    img_data[0, 1] = np.inf
    
    mask_data = np.zeros((500, 500), dtype=np.uint8)
    mask_data[100:150, 100:150] = 1 # some oil
    
    with rasterio.open(
        img_path, 'w', driver='GTiff', 
        height=500, width=500, count=1, dtype='float32'
    ) as dst:
        dst.write(img_data, 1)
        
    with rasterio.open(
        mask_path, 'w', driver='GTiff', 
        height=500, width=500, count=1, dtype='uint8'
    ) as dst:
        dst.write(mask_data, 1)
        
    csv_path = tmp_path / "train.csv"
    pd.DataFrame({
        'paths': [r"C:\Users\william\Desktop\data_\train\images\20200307.tif"],
        'coordinates': ["10,20"],
        'class': [1.0]
    }).to_csv(csv_path, index=False)
    
    return csv_path, img_dir, mask_dir

def test_dataset_discovers_pairs(mock_sar_data):
    csv, img, mask = mock_sar_data
    ds = GulfOfMexicoPatchDataset(str(csv), str(img), str(mask), patch_size=256)
    assert len(ds) == 1
    assert ds.samples[0]['image'].name == "20200307.tif"

def test_csv_remapping(mock_sar_data):
    csv, img, mask = mock_sar_data
    ds = GulfOfMexicoPatchDataset(str(csv), str(img), str(mask), patch_size=256)
    sample = ds.samples[0]
    # Path must be local, not the windows one
    assert str(img) in str(sample['image'])
    assert "william" not in str(sample['image'])
    assert sample['row'] == 10
    assert sample['col'] == 20

def test_crop_dimensions_and_binary(mock_sar_data):
    csv, img, mask = mock_sar_data
    ds = GulfOfMexicoPatchDataset(str(csv), str(img), str(mask), patch_size=256)
    image, m = ds[0]
    
    assert image.shape == (1, 256, 256)
    assert m.shape == (1, 256, 256)
    
    # Check binary mask
    unique_vals = torch.unique(m)
    assert len(unique_vals) <= 2
    for val in unique_vals:
        assert val.item() in [0.0, 1.0]

def test_invalid_coordinates(mock_sar_data):
    csv, img, mask = mock_sar_data
    # Modify CSV to be out of bounds
    pd.DataFrame({
        'paths': ["20200307.tif"],
        'coordinates': ["400,400"] # 400 + 256 > 500
    }).to_csv(csv, index=False)
    
    ds = GulfOfMexicoPatchDataset(str(csv), str(img), str(mask), patch_size=256)
    with pytest.raises(ValueError, match="Patch shape mismatch"):
        _ = ds[0]

def test_nan_handling(mock_sar_data):
    csv, img, mask = mock_sar_data
    # coordinates 0,0 includes the NaN and Inf
    pd.DataFrame({
        'paths': ["20200307.tif"],
        'coordinates': ["0,0"]
    }).to_csv(csv, index=False)
    
    ds = GulfOfMexicoPatchDataset(str(csv), str(img), str(mask), patch_size=256)
    image, _ = ds[0]
    
    assert not torch.isnan(image).any()
    assert not torch.isinf(image).any()
    
def test_test_scene_isolated(mock_sar_data):
    _, img, mask = mock_sar_data
    img_path = list(Path(img).glob("*.tif"))[0]
    mask_path = list(Path(mask).glob("*.tif"))[0]
    
    ds = TestSceneDataset(str(img_path), str(mask_path), patch_size=256)
    # 500x500 image with 256 patches -> 1 patch (0,0) fits completely. 
    # The grid extraction implemented does `range(0, height - patch_size + 1, patch_size)`
    # So 500 - 256 + 1 = 245 -> only 0 fits. 
    # Total patches = 1 x 1 = 1
    assert len(ds) == 1
    i, m = ds[0]
    assert i.shape == (1, 256, 256)
    
def test_model_shapes():
    model = create_unet_model()
    x = torch.randn(2, 1, 256, 256)
    out = model(x)
    assert out.shape == (2, 1, 256, 256)
    
def test_cpu_smoke_test():
    model = create_unet_model()
    criterion = nn.BCEWithLogitsLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
    
    x = torch.randn(2, 1, 256, 256)
    y = torch.randint(0, 2, (2, 1, 256, 256)).float()
    
    # Step 1
    optimizer.zero_grad()
    out = model(x)
    loss = criterion(out, y)
    loss.backward()
    optimizer.step()
    
    assert loss.item() > 0
    
def test_metrics_math():
    preds = torch.tensor([[[[0.9, 0.1], [0.8, 0.2]]]])
    targets = torch.tensor([[[[1.0, 0.0], [1.0, 0.0]]]])
    
    metrics = calculate_metrics(preds, targets, threshold=0.5)
    
    assert metrics['precision'] == 1.0  # tp=2, fp=0
    assert metrics['recall'] == 1.0     # tp=2, fn=0
    assert metrics['dice'] > 0.99
    assert metrics['iou'] > 0.99
