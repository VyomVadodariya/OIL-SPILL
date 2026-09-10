import os
import shutil
import glob
import rasterio
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path
from pyunpack import Archive

def create_preview(img_path, mask_path, out_dir):
    out_dir.mkdir(parents=True, exist_ok=True)
    
    with rasterio.open(img_path) as src:
        img = src.read()
        channels = src.count
        
    with rasterio.open(mask_path) as src:
        mask = src.read(1)
        
    scene_id = Path(img_path).stem
    out_path = out_dir / f"{scene_id}_preview.png"
    
    plt.figure(figsize=(15, 5))
    
    # Display Band 1 (VV)
    plt.subplot(1, 3, 1)
    if channels >= 1:
        vv = img[0]
        # simple normalization for viewing
        vv = np.nan_to_num(vv)
        if vv.max() > 0:
            vv = vv / vv.max()
        plt.imshow(vv, cmap='gray')
        plt.title('Band 1 (VV)')
    
    # Mask
    plt.subplot(1, 3, 2)
    plt.imshow(mask, cmap='jet')
    plt.title('Ground Truth Mask')
    
    # Overlay
    plt.subplot(1, 3, 3)
    if channels >= 1:
        plt.imshow(vv, cmap='gray')
        # Overlay mask with alpha
        mask_overlay = np.ma.masked_where(mask == 0, mask)
        plt.imshow(mask_overlay, cmap='jet', alpha=0.5)
        plt.title('Overlay')
        
    plt.tight_layout()
    plt.savefig(out_path, dpi=150)
    plt.close()

def main():
    rar_path = Path("data/raw/sar/Radar_data.rar")
    extract_dir = Path("data/extracted/gom")
    extract_dir.mkdir(parents=True, exist_ok=True)
    
    if not rar_path.exists():
        print(f"File {rar_path} not found!")
        return
        
    # Extract
    print(f"Extracting {rar_path} to {extract_dir}...")
    try:
        Archive(str(rar_path)).extractall(str(extract_dir))
    except Exception as e:
        print(f"Extraction failed: {e}")
        # Try checking if files are already extracted
        pass
        
    # Find all images and masks
    # The GOM dataset typically has 'images' and 'labels' folders
    all_tiffs = list(extract_dir.rglob('*.tif'))
    
    # Heuristic: masks might contain 'mask' or 'label' in path/name
    images = []
    masks = []
    for f in all_tiffs:
        name_lower = f.name.lower()
        path_lower = str(f).lower()
        if 'mask' in name_lower or 'label' in path_lower or 'label' in name_lower:
            masks.append(f)
        else:
            images.append(f)
            
    print(f"Found {len(images)} images and {len(masks)} masks.")
    
    manifest_data = []
    reports_dir = Path("reports/data_validation_preview")
    
    # Try pairing by exact stem or similar names
    for img_path in images:
        stem = img_path.stem
        # GOM dataset masks might have exact same name in a 'labels' folder or suffixed with _label
        matched_mask = None
        for m in masks:
            if stem in m.name or m.stem in stem:
                matched_mask = m
                break
                
        if not matched_mask:
            print(f"WARNING: No mask found for {img_path}")
            continue
            
        # Verify rasters
        try:
            with rasterio.open(img_path) as src_img, rasterio.open(matched_mask) as src_mask:
                img_shape = (src_img.height, src_img.width)
                mask_shape = (src_mask.height, src_mask.width)
                channels = src_img.count
                
                if img_shape != mask_shape:
                    print(f"Shape mismatch: {img_path.name} {img_shape} vs {matched_mask.name} {mask_shape}")
                    status = "SHAPE_MISMATCH"
                else:
                    status = "VALID"
                    
                manifest_data.append({
                    "dataset": "gulf_of_mexico",
                    "source": "zenodo_4672426",
                    "scene_id": stem,
                    "image_path": str(img_path.relative_to(Path.cwd())),
                    "mask_path": str(matched_mask.relative_to(Path.cwd())),
                    "class": "oil_spill",
                    "height": img_shape[0],
                    "width": img_shape[1],
                    "channels": channels,
                    "status": status
                })
        except Exception as e:
            print(f"Error reading {img_path.name}: {e}")
            
    # Save manifest
    manifest_df = pd.DataFrame(manifest_data)
    manifest_dir = Path("data/manifests")
    manifest_dir.mkdir(parents=True, exist_ok=True)
    manifest_csv = manifest_dir / "dataset_manifest.csv"
    manifest_df.to_csv(manifest_csv, index=False)
    print(f"\nManifest saved to {manifest_csv}")
    print(f"Total valid pairs: {len(manifest_df[manifest_df['status'] == 'VALID'])}")
    
    # Generate Previews
    print("Generating visual previews...")
    for idx, row in manifest_df.head(5).iterrows():
        if row['status'] == 'VALID':
            create_preview(row['image_path'], row['mask_path'], reports_dir)
            print(f"Generated preview for {row['scene_id']}")
            
    print("\nPhase-1 Validation dataset verification complete.")
    
if __name__ == "__main__":
    main()
