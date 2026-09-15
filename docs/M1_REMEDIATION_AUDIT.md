# M1 REMEDIATION AUDIT

## A. Current Input
- SAR image: `data/raw/sar/test/images/20191015.tif`
- Validated inference mask: `data/processed/inference_outputs/20191015_mask.tif`

## B. Current Transformation
- Inference produces valid object polygons via `src.inference.pipeline`
- `scripts/run_golden_investigation.py` ignores the inference output and hardcodes a dummy `SpillDetection` polygon at `[-87.16, 28.87]`.
- Drift simulation receives this dummy geometry, but `generate_corridor_geometry` produces empty polygons (`coordinates=[]`).
- AIS fixture generation `scripts/create_fixtures.py` swaps coordinates using `always_xy=True`, placing ships in Antarctica (Lat: -89.2, Lon: 28.8).
- Evidence engine attempts to rank vessels against an empty drift corridor and Antarctic coordinates.

## C. Current Output
- `data/demo_case/investigation/result.json` contains a single candidate `VESSEL_A_COMPATIBLE` with score `0.2698` (`WEAKLY_COMPATIBLE`), missing evidence component scores.
- Frontend React application ignores the backend JSON and renders hardcoded mock data for `INC-2026-047` in the Persian Gulf featuring `HARBOR PIONEER` with a static score of 87.

## D. Broken Links
1. **Inference -> Characterization**: The detected objects from inference are not fed into the `SpillDetection` schema.
2. **Drift -> Correlation**: The backward drift particle simulation fails to construct a valid hull/density polygon, passing empty geometries downstream.
3. **AIS Correlation -> Evidence Engine**: Geographically disjoint due to inverted AIS coordinates.
4. **Backend -> Frontend**: UI is completely disconnected from the actual `data/demo_case/investigation/result.json` output, rendering a static demo state instead.

## E. Hardcoded Values
- `scripts/run_golden_investigation.py`: `poly_geom = {"coordinates": [[[-87.16, 28.87], ...]]}`, `area_km2=5.0`.
- `scripts/run_golden_investigation.py`: Empty corridor polygons `density_polygon=GeoPolygon(coordinates=[])`.

## F. Mock Frontend Values
- Incident ID: `INC-2026-047`
- Candidate Name: `HARBOR PIONEER`
- MMSI: `538009842`
- Location: `26.1520°N, 51.8150°E` (Persian Gulf)
- Static Score: `87/100`

## G. Coordinate-system Assumptions
- SAR is `EPSG:32616` (UTM 16N).
- Drift engine supports raw geometries or handles CRS correctly.
- AIS requires `EPSG:4326` (WGS84 Lat/Lon).

## H. CRS Transformations
- `scripts/create_fixtures.py` uses `Transformer.from_crs("EPSG:32616", "EPSG:4326", always_xy=True)` which returns `(lon, lat)` but assigns it to `lat_center, lon_center`.

## I. Required Fixes
1. `create_fixtures.py`: Fix AIS coordinate inversion (Lon/Lat) and rename vessels neutrally (e.g., `DEMO_VESSEL_001`).
2. `run_golden_investigation.py`: Read actual inference mask, extract largest valid object, create `SpillDetection` correctly.
3. `drift`: Ensure `generate_corridor_geometry` produces valid ConvexHull polygons from particles.
4. `run_golden_investigation.py`: Write full enriched result to `result.json` with all sub-scores.
5. `Investigations.tsx` & `incident.ts`: Refactor to dynamically load and display `data/demo_case/investigation/result.json` instead of `HARBOR PIONEER`.
6. Add asserts in the pipeline to fail loudly on empty polygons or invalid coordinates.

## J. Tests Required
- `tests/integration/test_golden_demo.py` to assert E2E pipeline continuity, data integrity, geographical validity, and neutral evidence ranking.
