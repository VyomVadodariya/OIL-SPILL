# Stage 8 — End-to-End Integration

## Architecture
Stage 8 successfully unifies the disjoint operational modules (Stages 3, 4, 5, 6, and 7) into a continuous execution pipeline. It provides a real-world demonstration of end-to-end evidence accumulation starting purely from a raw Sentinel-1 SAR image.

### Pipeline Flow
1. **Stage 7 (Real SAR Inference)**: Processes the raw GeoTIFF, yields a probability mask and bounding boxes.
2. **Stage 7 → Stage 3 Adapter**: Connects the raw binarized output from Stage 7 into the typed `SpillDetection` domain models expected by Stage 3.
3. **Stage 3 (Characterization)**: Extracts physical shape descriptors, area, centroid, and metadata.
4. **Geometry Adapter**: Extracts valid `GeoJSON Polygon/MultiPolygon` geometry from the inference mask (using `rasterio.features.shapes`) as Stage 4 strictly rejects candidate regions without precise geometric boundaries.
5. **Stage 4 (Drift/Backtracking)**: Attempts to generate physics-based backward and forward corridors.
6. **Stage 5 (AIS Correlation)**: Queries historical vessel activity intersecting the drift corridors.
7. **Stage 6 (Evidence Fusion)**: Computes a final deterministic candidate evaluation.

## Adapters
To strictly adhere to the "prefer adapters over modifying components" rule, the integration utilizes:
1. `stage7_to_stage3()`: Translates the dictionary-based JSON inference results and raw output mask into the formal Python dataclass `SpillDetection`.
2. `geometry_adapter()`: Computes missing vector geometries from the rasterized mask without fundamentally altering the Stage 3 core extraction function. It safely manages CRS coordinate transformations using the GDAL affine tuple convention `(c, a, b, f, d, e)`.

## Data Contracts & Handling
- **Geometry Handling**: Handled consistently in EPSG:4326 for UI/JSON interchange, while internal area/kinematic physics continue using the source CRS (or meter-equivalent conversions).
- **Timestamp Handling**: Explicitly passed from input metadata. If no timestamp is provided, the pipeline gracefully reports `timestamp: UNKNOWN` and curtails chronologically-dependent stages (Drift and AIS).

## Graceful Degradation (NO-DATA Mode)
The system is explicitly designed to avoid fabricating or hallucinating data to force a "successful" attribution.
- **Environmental Data Requirements**: Real Stage 4 execution strictly requires NetCDF wind and current data covering the incident. If absent, it yields `INSUFFICIENT_DATA`.
- **AIS Data Requirements**: Real Stage 5 execution strictly requires historical AIS tracks covering the geographic domain and timestamp. If absent, it yields `INSUFFICIENT_DATA`.

When both fail, Stage 6 processes the `SpillDetection` alongside the missing records, yielding:
- `classification = UNKNOWN`
- High reported uncertainty profiles.
This constitutes a successful, scientifically honest pipeline execution.

## Attribution Terminology
To preserve operational integrity and avoid unverified assertions:
- **Detection ≠ Attribution**: Identifying an oil-like anomaly is not proof of its source.
- **Candidate vessel ≠ Responsible vessel**: A vessel near a slick is a statistical candidate, not a proven polluter.
- **AIS observation gap ≠ AIS disabled**: A loss of AIS transmission implies a signal absence, not inherently malicious intent.

## Real-Data Execution Results
Executed against `data/processed/gulf_of_mexico/test/images/2018_09_26.tif`:
- **Inference Runtime**: ~14s
- **Detections**: 42 objects
- **Largest Object Area**: ~39.93 km²
- **Pipeline Result**: `SUCCESS_DEGRADED` (Correctly halted drift and AIS modeling due to missing historical NetCDF/AIS databases for 2018, logging attribution as UNKNOWN).

## Limitations
The primary limitation of this end-to-end integration is the requirement for offline historical datasets to execute a retrospective incident analysis. Live providers (like AISStream) cannot serve backward-looking 2018 queries.
