import os
import torch
import rasterio
from rasterio.windows import Window
import numpy as np
from pathlib import Path
import json
from rasterio.features import shapes
from shapely.geometry import shape

from src.models.unet import create_unet_model
from src.inference.postprocess import clean_binary_mask, extract_spill_objects
import logging

class SARInferencePipeline:
    def __init__(self, config_path: str):
        import yaml
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
            
        self.device = torch.device(self.config['inference']['device'] if torch.cuda.is_available() else "cpu")
        logging.info(f"Inference device: {self.device}")
        
        # Load Model
        self.model = create_unet_model(
            encoder_name=self.config['model']['encoder_name'],
            in_channels=self.config['model']['in_channels'],
            classes=self.config['model']['classes'],
            activation=None
        ).to(self.device)
        
        self.model.load_state_dict(torch.load(self.config['model']['path'], map_location=self.device))
        self.model.eval()
        
        self.tile_size = self.config['inference']['tile_size']
        self.stride = self.config['inference']['stride']
        self.batch_size = self.config['inference']['batch_size']
        self.db_min = self.config['preprocessing']['db_min']
        self.db_max = self.config['preprocessing']['db_max']

    def normalize(self, x: np.ndarray) -> np.ndarray:
        x = np.nan_to_num(x, nan=self.db_min, posinf=self.db_max, neginf=self.db_min)
        x = np.clip(x, self.db_min, self.db_max)
        x = (x - self.db_min) / (self.db_max - self.db_min)
        return x

    def run_inference(self, input_path: str) -> dict:
        logging.info(f"Starting inference on {input_path}")
        input_path = Path(input_path)
        
        with rasterio.open(input_path) as src:
            width = src.width
            height = src.height
            crs = src.crs
            transform = src.transform
            bands = src.count
            
            # Create accumulators in memory (float32 for probs, uint8 for count)
            # For massive scenes, this might need to be memory-mapped
            prob_acc = np.zeros((height, width), dtype=np.float32)
            count_acc = np.zeros((height, width), dtype=np.uint8)
            
            windows = []
            for r in range(0, height, self.stride):
                for c in range(0, width, self.stride):
                    # We always request tile_size, boundless reading handles padding
                    windows.append((r, c, Window(col_off=c, row_off=r, width=self.tile_size, height=self.tile_size)))
                    
            logging.info(f"Generated {len(windows)} overlapping windows.")
            
            batch_images = []
            batch_windows = []
            
            with torch.no_grad():
                for i, (r, c, window) in enumerate(windows):
                    data = src.read(1, window=window, boundless=True, fill_value=self.db_min)
                    data = self.normalize(data)
                    batch_images.append(data)
                    batch_windows.append((r, c))
                    
                    if len(batch_images) == self.batch_size or i == len(windows) - 1:
                        # Process batch
                        batch_tensor = torch.tensor(np.array(batch_images)).float().unsqueeze(1).to(self.device)
                        logits = self.model(batch_tensor)
                        probs = torch.sigmoid(logits).squeeze(1).cpu().numpy()
                        
                        # Stitch
                        for (br, bc), prob in zip(batch_windows, probs):
                            # The prob is always 256x256 due to boundless reading
                            # We must only accumulate the valid portion that falls within the original image bounds
                            valid_h = min(self.tile_size, height - br)
                            valid_w = min(self.tile_size, width - bc)
                            
                            prob_acc[br:br+valid_h, bc:bc+valid_w] += prob[:valid_h, :valid_w]
                            count_acc[br:br+valid_h, bc:bc+valid_w] += 1
                            
                        batch_images = []
                        batch_windows = []
                        
        # Average overlapping probabilities
        # Safe divide (count_acc should be >= 1 everywhere)
        np.divide(prob_acc, count_acc, out=prob_acc, where=count_acc>0)
        
        logging.info("Thresholding and cleaning...")
        threshold = self.config['postprocessing']['threshold']
        binary_mask = (prob_acc >= threshold).astype(np.uint8)
        
        binary_mask = clean_binary_mask(
            binary_mask, 
            opening_kernel=self.config['postprocessing']['opening_kernel'],
            closing_kernel=self.config['postprocessing']['closing_kernel'],
            min_area=self.config['postprocessing']['min_component_pixels']
        )
        
        logging.info("Extracting connected components...")
        objects = extract_spill_objects(binary_mask, prob_acc, transform, crs)
        
        # Add polygon geometries to objects using rasterio.features.shapes
        polygons = list(shapes(binary_mask, mask=(binary_mask == 1), transform=transform))
        
        # For simplicity, we just attach all polygons to the output 
        # A more rigorous approach maps polygon geometries to the specific labeled components
        # We will match them by checking if the centroid of the component is within the polygon bounds
        # For API response we can return the raw list of objects
        
        # Format the result
        result = {
            "status": "success",
            "source": {
                "filename": input_path.name,
                "width": width,
                "height": height,
                "crs": str(crs),
                "bands": bands
            },
            "model": {
                "checkpoint": self.config['model']['path'],
                "architecture": f"{self.config['model']['encoder_name']} U-Net",
                "input_channels": self.config['model']['in_channels']
            },
            "inference": {
                "tile_size": self.tile_size,
                "stride": self.stride,
                "threshold": threshold,
                "device": str(self.device)
            },
            "detection": {
                "oil_spill_detected": len(objects) > 0,
                "object_count": len(objects)
            },
            "objects": objects
        }
        
        # Save Outputs
        out_dir = Path(self.config['output']['output_dir'])
        out_dir.mkdir(parents=True, exist_ok=True)
        
        out_base = input_path.stem
        
        if self.config['output']['save_mask']:
            out_tiff = out_dir / f"{out_base}_mask.tif"
            with rasterio.open(
                out_tiff, 'w', driver='GTiff',
                height=height, width=width,
                count=1, dtype='uint8',
                crs=crs, transform=transform
            ) as dst:
                dst.write(binary_mask, 1)
            result["output_mask"] = str(out_tiff)
            
        return result
