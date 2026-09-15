import os
import torch
import rasterio
import numpy as np
from pathlib import Path
import sys

# Ensure model_repo is in path
sys.path.append(os.path.abspath("model_repo"))
from src.models.unet import create_unet_model

def verify_sar_and_mask(img_name="20191015.tif"):
    img_path = Path(f"data/raw/sar/test/images/{img_name}")
    mask_path = Path(f"data/raw/sar/test/masks/{img_name}")
    
    if not img_path.exists() or not mask_path.exists():
        print(f"Error: Could not find {img_name} in both images and masks.")
        return False
        
    with rasterio.open(img_path) as src_img, rasterio.open(mask_path) as src_mask:
        img_meta = src_img.meta
        mask_meta = src_mask.meta
        
        print(f"--- SAR ALIGNMENT REPORT for {img_name} ---")
        print(f"Image Dimensions: {img_meta['width']} x {img_meta['height']}")
        print(f"Mask Dimensions: {mask_meta['width']} x {mask_meta['height']}")
        print(f"Image CRS: {img_meta['crs']}")
        print(f"Image Transform: {img_meta['transform']}")
        
        if img_meta['width'] == mask_meta['width'] and img_meta['height'] == mask_meta['height']:
            print("Verdict: Dimensions match.")
        else:
            print("Verdict: Dimension MISMATCH.")
            return False
            
    return True

def verify_model():
    model_path = "models/best_model.pth"
    if not os.path.exists(model_path):
        print(f"Error: Model not found at {model_path}")
        return False
        
    state_dict = torch.load(model_path, map_location="cpu")
    print(f"--- MODEL VERIFICATION REPORT ---")
    print(f"State dict size: {len(state_dict)}")
    
    # Create a fresh dummy model to compare weights
    dummy_model = create_unet_model(encoder_name="resnet34", in_channels=1, classes=1)
    dummy_state = dummy_model.state_dict()
    
    # Compare conv1 weights
    real_conv1 = state_dict.get('encoder.conv1.weight')
    dummy_conv1 = dummy_state.get('encoder.conv1.weight')
    
    if real_conv1 is not None and dummy_conv1 is not None:
        diff = torch.abs(real_conv1 - dummy_conv1).mean().item()
        print(f"Mean absolute difference from fresh initialization (conv1): {diff:.6f}")
        
        if diff > 1e-4:
            print("Verdict: Checkpoint is TRAINED (weights diverge from fresh init).")
        else:
            print("Verdict: Checkpoint is DUMMY/INITIALIZED.")
    else:
        print("Verdict: UNKNOWN ARCHITECTURE (could not find encoder.conv1.weight).")

if __name__ == "__main__":
    sar_ok = verify_sar_and_mask()
    verify_model()
