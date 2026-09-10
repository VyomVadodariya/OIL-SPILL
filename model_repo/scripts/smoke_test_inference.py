import sys
import json
from src.inference.pipeline import SARInferencePipeline

def main():
    config_path = "configs/inference_config.yaml"
    test_image = "data/processed/gulf_of_mexico/test/images/2018_09_26.tif"
    
    print(f"Loading pipeline from {config_path}...")
    pipeline = SARInferencePipeline(config_path)
    
    print(f"Running inference on {test_image}...")
    result = pipeline.run_inference(test_image)
    
    print("\n--- INFERENCE RESULT ---")
    print(json.dumps(result, indent=2))
    print("------------------------")

if __name__ == "__main__":
    main()
