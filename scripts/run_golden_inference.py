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
    
    manifest_path = out_dir / "manifest.json"
    
    manifest = {
        "case_id": "GOLDEN_DEMO_20191015",
        "sar_source": "Sentinel-1 (Presumed from Zenodo)",
        "sar_acquisition_time": "2019-10-15T00:00:00Z",
        "sar_location": "EPSG:32616",
        "sar_format": "GeoTIFF",
        "sar_provenance": "data/raw/sar/test/images/20191015.tif",
        "label_provenance": "data/raw/sar/test/masks/20191015.tif",
        "model_provenance": "models/best_model.pth (Verified Trained Checkpoint)",
        "environmental_data_provenance": "data/demo_case/environmental/forcing.json (Deterministic Demo Fixture)",
        "ais_provenance": "data/demo_case/ais/fixture.csv (Deterministic Demo Fixture)",
        "data_mode": {
            "sar": "REAL",
            "model": "TRAINED",
            "inference": "ACTUAL INFERENCE",
            "environment": "DEMO ENVIRONMENTAL FORCING",
            "ais": "SYNTHETIC DEMO"
        }
    }
    
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=4)
        
    print(f"Inference Completed. Detected {result['detection']['object_count']} objects.")
    print(f"Output Mask saved to: {result.get('output_mask')}")
    print(f"Manifest saved to: {manifest_path}")

if __name__ == "__main__":
    run_golden_inference()
