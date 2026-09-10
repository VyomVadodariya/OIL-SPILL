# Stage 7 — Real SAR Inference Pipeline

## Architecture
The inference pipeline applies the Stage 2 trained `U-Net` (ResNet34 encoder) to real-world SAR GeoTIFFs.
Since full Sentinel-1 scenes are too large to fit entirely into GPU memory, the architecture uses a robust tiling, batch inference, and spatial stitching engine.

## Preprocessing
Inference preprocessing strictly mirrors Stage 2 training:
- **Missing Data (NaNs):** Replaced with `-45.0`
- **Clip Range:** `[-45.0, 20.0]` dB
- **Normalization:** Min-max scaled to `[0, 1]` using the clip bounds
- **Input Channel:** VV SAR (Band 1)

## Tiling and Overlap
To avoid edge artifacts during convolution, the pipeline utilizes a sliding window approach:
- **Tile Size:** 256×256 pixels
- **Stride:** 128 pixels (yielding 50% overlap)
- **Padding:** Edge tiles that exceed raster bounds are safely padded using `boundless=True` with `fill_value=-45.0`.

## Batch Inference & Stitching
Normalized tiles are grouped into batches (default 16) and processed via `torch.no_grad()` on CUDA. 
The raw logits output by the U-Net are passed through a `sigmoid` activation to yield probabilities. 
These probabilities are spatially accumulated into a full-scene float32 accumulator array. Because 50% overlap is used, pixels are visited multiple times; the final probability at each pixel is the sum of probabilities divided by the overlap count. 

## Post-Processing
The stitched probability map is binarized using an operational threshold of `0.5`. 
To clean up noise, morphological filters are applied:
- **Opening Kernel (3x3):** Removes isolated salt-and-pepper false positives
- **Closing Kernel (3x3):** Fills in tiny gaps within coherent oil spill structures
- **Size Filtering:** Connected components smaller than `min_component_pixels` (default 5) are rejected.

## Geospatial Handling
Using `skimage.measure.regionprops` and `rasterio.transform`, the pipeline extracts physical attributes for every candidate spill object. The original `crs` and `transform` matrix from the input GeoTIFF are preserved to ensure output alignment. The final generated `_mask.tif` is geographically identical in footprint to the source.

## Area Calculation
Area is computed individually for every connected component.
The physical area of a single pixel is derived from the input's affine transform.
If the CRS is geographic (degrees), the area is roughly approximated (for now) using an equatorial assumption (1 degree ≈ 111.32 km). If the CRS is projected (metres), it strictly uses `abs(width * height)`.

## Confidence Definition
Detection confidence is defined directly by the neural network's sigmoid probability:
- **Mean Confidence:** The average probability of all pixels belonging to the connected component.
- **Max Confidence:** The peak probability observed within the connected component.

*Note: Confidence indicates the model's certainty that a pixel resembles an oil spill. It DOES NOT equate to scientific attribution.*

## API Integration
The inference engine is exposed via a FastAPI endpoint (`POST /api/v1/inference`) defined in `src/api/main.py`. The model is loaded once upon application startup, allowing subsequent uploads to be processed efficiently. The response is a structured JSON payload containing component IDs, area, confidence, bounding boxes, and centroids.

## Limitations & Scientific Honesty
1. **Generalization:** The model was exclusively trained on a verified Gulf of Mexico dataset. Its performance on Indian waters (e.g., Indian Ocean) has **not** been established. Distributional shifts in radar backscatter may occur.
2. **Detection != Attribution:** This pipeline performs SAR-based oil-spill detection. It does **not** attribute spills to specific vessels. Outputs must be referred to as "candidate spills" or "detected oil-like regions."
3. **AIS Correlation:** Identifying the causative vessel requires downstream integration with AIS drift logic (Stages 3-6).

## Test Results
**Unit Tests (9/9 Passed):**
- Exact output shape preservation
- Boundary padding on small rasters
- Handling of non-divisible spatial dimensions
- Coordinate transformation mapping (Pixel -> EPSG:4326)
- Noise filtering and area calculation logic
- Safe handling of zero-detection cases

**Real-Data Smoke Test:**
Successfully executed on `2018_09_26.tif` (Gulf of Mexico test dataset). 
- **Inference Runtime:** ~14.2s (using RTX 4060)
- **Detected Objects:** 42 candidate regions
- **Confidence Range:** Mean ~0.50 - 0.82, Max ~0.51 - 0.99
- **Areas:** Ranging from 0.0015 km² to 3.18 km²
- **Output Artifacts:** Generated a perfectly aligned GeoTIFF mask (`2018_09_26_mask.tif`) and corresponding JSON result structure.
