from fastapi import FastAPI, UploadFile, File, HTTPException
import shutil
import tempfile
from pathlib import Path
from src.inference.pipeline import SARInferencePipeline

app = FastAPI(title="OIL SPILL - SAR Inference API")

# Initialize pipeline once on startup
pipeline = None

@app.on_event("startup")
def startup_event():
    global pipeline
    # For a real deployment, the config path should be an env variable
    config_path = "configs/inference_config.yaml"
    if Path(config_path).exists():
        pipeline = SARInferencePipeline(config_path)
    else:
        print(f"Warning: Config file {config_path} not found. Inference disabled.")

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/v1/inference")
async def inference(file: UploadFile = File(...)):
    if not pipeline:
        raise HTTPException(status_code=500, detail="Inference pipeline not initialized")
        
    if not file.filename.endswith(('.tif', '.tiff')):
        raise HTTPException(status_code=400, detail="Only GeoTIFF files (.tif, .tiff) are supported")
        
    try:
        # Save upload to a temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".tif") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
            
        # Run inference
        result = pipeline.run_inference(tmp_path)
        
        # Clean up temp file
        Path(tmp_path).unlink()
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

