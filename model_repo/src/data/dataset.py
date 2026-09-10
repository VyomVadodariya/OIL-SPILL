import os
import rasterio
from rasterio.windows import Window
import numpy as np
import pandas as pd
import torch
from torch.utils.data import Dataset
import albumentations as A
from albumentations.pytorch import ToTensorV2
from pathlib import Path
from typing import List, Tuple, Optional, Callable
import logging

class GulfOfMexicoPatchDataset(Dataset):
    """
    Dataset for Gulf of Mexico SAR patches based on provided CSVs.
    Reads exactly 256x256 patches dynamically using rasterio Windows.
    """
    def __init__(self, 
                 csv_path: str, 
                 local_images_dir: str, 
                 local_masks_dir: str,
                 transform: Optional[Callable] = None,
                 patch_size: int = 256,
                 db_min: float = -45.0,
                 db_max: float = 20.0):
        
        super().__init__()
        self.csv_path = Path(csv_path)
        self.local_images_dir = Path(local_images_dir)
        self.local_masks_dir = Path(local_masks_dir)
        self.transform = transform
        self.patch_size = patch_size
        self.db_min = db_min
        self.db_max = db_max
        
        # Load CSV
        if not self.csv_path.exists():
            raise FileNotFoundError(f"CSV not found: {self.csv_path}")
            
        self.df = pd.read_csv(self.csv_path)
        
        # Resolve paths to local
        self.samples = []
        for _, row in self.df.iterrows():
            # Extract original basename
            # e.g., C:/Users/william/Desktop/data_/train\images\20200307.tif
            orig_path = row['paths']
            basename = Path(orig_path.replace('\\', '/')).name
            
            img_path = self.local_images_dir / basename
            mask_path = self.local_masks_dir / basename
            
            # Extract coordinates (assuming format "row,col")
            coord_str = row['coordinates']
            r_str, c_str = coord_str.split(',')
            r, c = int(r_str), int(c_str)
            
            if img_path.exists() and mask_path.exists():
                self.samples.append({
                    'image': img_path,
                    'mask': mask_path,
                    'row': r,
                    'col': c,
                    'class': row.get('class', 0.0)
                })
        
        logging.info(f"Initialized dataset from {self.csv_path.name} with {len(self.samples)} valid patches.")

    def __len__(self) -> int:
        return len(self.samples)

    def normalize_sar(self, x: np.ndarray) -> np.ndarray:
        """
        Safely normalize SAR dB data to [0, 1] using min-max scaling.
        Handles NaNs deterministically.
        """
        # Replace NaN/Inf with db_min
        x = np.nan_to_num(x, nan=self.db_min, posinf=self.db_max, neginf=self.db_min)
        # Clip
        x = np.clip(x, self.db_min, self.db_max)
        # Scale to 0-1
        x = (x - self.db_min) / (self.db_max - self.db_min)
        return x

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        sample = self.samples[idx]
        img_path = sample['image']
        mask_path = sample['mask']
        row = sample['row']
        col = sample['col']
        
        window = Window(col_off=col, row_off=row, width=self.patch_size, height=self.patch_size)
        
        # Read image
        with rasterio.open(img_path) as src:
            image = src.read(1, window=window, boundless=True, fill_value=self.db_min)
            
        # Read mask
        with rasterio.open(mask_path) as src:
            mask = src.read(1, window=window, boundless=True, fill_value=0)
            
        # Validate dimensions
        if image.shape != (self.patch_size, self.patch_size) or mask.shape != (self.patch_size, self.patch_size):
            raise ValueError(f"Patch shape mismatch at index {idx}, row {row}, col {col}. Got {image.shape}.")
            
        # Normalize image
        image = self.normalize_sar(image)
        
        # Binarize mask
        mask = (mask > 0).astype(np.float32)
        
        # Albumentations expects (H, W, C) or (H, W)
        # We provide (H, W) and it will return (H, W) due to ToTensorV2 which adds the channel dim later if configured
        if self.transform:
            augmented = self.transform(image=image, mask=mask)
            image = augmented['image']
            mask = augmented['mask']
        else:
            image = torch.from_numpy(image).float().unsqueeze(0) # (1, H, W)
            mask = torch.from_numpy(mask).float().unsqueeze(0)   # (1, H, W)
            
        # Ensure mask is (1, H, W)
        if len(mask.shape) == 2:
            mask = mask.unsqueeze(0)
            
        return image, mask

class TestSceneDataset(Dataset):
    """
    Dataset to extract non-overlapping 256x256 grid patches from a single full test scene.
    Used for evaluation on completely held-out scenes.
    """
    def __init__(self, 
                 img_path: str, 
                 mask_path: str, 
                 patch_size: int = 256,
                 db_min: float = -45.0,
                 db_max: float = 20.0):
                 
        super().__init__()
        self.img_path = Path(img_path)
        self.mask_path = Path(mask_path)
        self.patch_size = patch_size
        self.db_min = db_min
        self.db_max = db_max
        
        with rasterio.open(self.img_path) as src:
            self.width = src.width
            self.height = src.height
            
        # Generate grid
        self.patches = []
        for r in range(0, self.height - patch_size + 1, patch_size):
            for c in range(0, self.width - patch_size + 1, patch_size):
                self.patches.append((r, c))
                
    def __len__(self) -> int:
        return len(self.patches)
        
    def normalize_sar(self, x: np.ndarray) -> np.ndarray:
        x = np.nan_to_num(x, nan=self.db_min, posinf=self.db_max, neginf=self.db_min)
        x = np.clip(x, self.db_min, self.db_max)
        x = (x - self.db_min) / (self.db_max - self.db_min)
        return x

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        row, col = self.patches[idx]
        window = Window(col_off=col, row_off=row, width=self.patch_size, height=self.patch_size)
        
        with rasterio.open(self.img_path) as src:
            image = src.read(1, window=window, boundless=True, fill_value=self.db_min)
            
        with rasterio.open(self.mask_path) as src:
            mask = src.read(1, window=window, boundless=True, fill_value=0)
            
        image = self.normalize_sar(image)
        mask = (mask > 0).astype(np.float32)
        
        image_t = torch.from_numpy(image).float().unsqueeze(0)
        mask_t = torch.from_numpy(mask).float().unsqueeze(0)
        
        return image_t, mask_t


def get_training_transforms() -> A.Compose:
    """Returns SCIENTIFICALLY DEFENSIBLE albumentations transforms for SAR training."""
    return A.Compose([
        A.HorizontalFlip(p=0.5),
        A.VerticalFlip(p=0.5),
        A.RandomRotate90(p=0.5),
        # Removed ElasticTransform as it introduces non-physical distortion to SAR physics
        ToTensorV2()
    ])

def get_validation_transforms() -> A.Compose:
    """Returns transforms for validation/testing (no augmentation)."""
    return A.Compose([
        ToTensorV2()
    ])
