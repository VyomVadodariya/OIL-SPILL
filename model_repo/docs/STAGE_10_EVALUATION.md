# Stage 10 — Scientific Validation

This report details the real-data scientific validation for the Gulf of Mexico Sentinel-1 SAR Oil Spill segmentation model.

## Validation Metrics (Stage 2)
The model was trained on the real Sentinel-1 GoM dataset and achieved the following metrics on the best validation checkpoint (Epoch 4):
- **Validation Dice:** 0.6963
- **Validation IoU:** 0.5417
- **Held-out Test Dice:** 0.3980
- **Held-out Test IoU:** 0.3128
- **Precision / Recall / False Positives:** Not historically persisted for this specific checkpoint, but inherently bounded by the Dice/IoU thresholds.

> [!WARNING]
> These metrics represent spatial overlap (Dice/IoU), **not** accuracy. "Accuracy" is misleading for highly imbalanced geospatial datasets where 99% of pixels are background ocean. The validation-to-test gap (IoU dropping from 0.54 to 0.31) strongly indicates that model generalization remains a core scientific challenge for unseen oceanographic conditions.

## Real-Data Inference (Stage 7/8 E2E)
Executing the pipeline against the full historical scene (`data/processed/gulf_of_mexico/test/images/2018_09_26.tif`):
- **Inference Runtime:** ~15 seconds on a desktop RTX 4060 GPU.
- **Regions Detected:** 42 distinct candidate objects.
- **Largest Object Area:** 39.9359 km²

## Discrepancy Resolution: 3.18 km² vs 39.93 km²
During the integration audit, a discrepancy was investigated where Stage 7 previously yielded ~3.18 km² for the largest candidate, while Stage 8 yielded ~39.93 km² on the same file.

**Findings:**
1. **CRS Handling is Correct:** The `2018_09_26.tif` scene is natively projected in EPSG:32616 (UTM Zone 16N), with an internal affine transform (`10.0, 0.0, 263759.28, 0.0, -10.0, 3210617.52`).
2. **Resolution:** Both X and Y resolutions are exactly 10 meters (100 m² per pixel).
3. **Calculation:** The primary object spans exactly 399,359 pixels. Thus, `399,359 pixels * 100 m² / 1,000,000 = 39.9359 km²`.
4. **Resolution of Discrepancy:** Both the Inference Pipeline (Stage 7) and the Characterization Engine (Stage 3) mathematically agree on 39.9359 km². The previous 3.18 km² report was traced to a partial inference run prior to applying the final `clean_binary_mask()` morphological closing/opening, which correctly merges disjoint but contiguous regions of the slick into one massive 39.93 km² entity.

## Limitations
- **Generalization:** Generalization remains a challenge for SAR data with radically different wind patterns or look-angles.
- **Historical Backtesting:** Retrospective validation of Stage 4 (Drift) and Stage 5 (AIS) is severely blocked by the absence of historical offline NetCDF ocean currents and offline historical AIS CSV dumps for the 2018-09-26 timeframe. The model rightfully classifies these historical incidents as `UNKNOWN` attribution.
