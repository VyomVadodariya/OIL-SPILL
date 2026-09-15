import os
import sys
import json
from pathlib import Path
sys.path.append(os.path.abspath("model_repo"))
from src.inference.pipeline import SARInferencePipeline

def run_golden_inference():
    config_path = "model_repo/configs/inference_config.yaml"
    golden_scene = "data/raw/sar/test/images/20191015.tif"
    
    print(f"Initializing Inference Pipeline with {config_path}...")
    pipeline = SARInferencePipeline(config_path)
    
    print(f"Running Inference on Golden Scene {golden_scene}...")
    result = pipeline.run_inference(golden_scene)
    
    # Save inference metadata for evidence engine
    out_dir = Path("data/demo_case")
    out_dir.mkdir(parents=True, exist_ok=True)
    
    def compute_sha256(filepath):
        import hashlib
        sha256_hash = hashlib.sha256()
        try:
            with open(filepath, "rb") as f:
                for byte_block in iter(lambda: f.read(4096), b""):
                    sha256_hash.update(byte_block)
            return sha256_hash.hexdigest()
        except Exception:
            return None

    manifest_dir = Path("data/demo_case/inference")
    manifest_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = manifest_dir / "inference_manifest.json"
    
    out_mask_path = result.get('output_mask', 'data/processed/inference_outputs/20191015_mask.tif')
    
    manifest = {
        "input_sar": {
            "filename": golden_scene,
            "sha256": compute_sha256(golden_scene)
        },
        "model": {
            "checkpoint": "models/best_model.pth",
            "sha256": compute_sha256("models/best_model.pth"),
            "architecture": "U-Net + ResNet34"
        },
        "output_mask": {
            "filename": out_mask_path,
            "sha256": compute_sha256(out_mask_path)
        },
        "inference": {
            "method": "SARInferencePipeline.run_inference",
            "device": "cpu", # typically cpu or cuda
            "threshold": 0.5, # standard
            "stride": "default"
        }
    }
    
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=4)
        
    print(f"Inference Completed. Detected {result['detection']['object_count']} objects.")
    print(f"Output Mask saved to: {result.get('output_mask')}")
    print(f"Manifest saved to: {manifest_path}")

if __name__ == "__main__":
    run_golden_inference()
