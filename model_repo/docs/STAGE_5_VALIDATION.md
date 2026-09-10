# Stage 5 Validation Strategy

## Methodology
Validation is performed using fully deterministic, offline data loaded via the `OfflineAISProvider`. 
All test fixtures are strictly labeled: **`SYNTHETIC TEST FIXTURE — NOT REAL AIS DATA`**. No real API queries are executed during unit and pipeline testing, guaranteeing isolation.

## Test Suites (A–R Coverage)
1. **Normalization & Rejection (A-D)**: Validates UTC casting, impossible coordinate rejection (e.g., Longitude 200), MMSI filtering, and chronologically deterministic sorting.
2. **Segmentation & Track Metrics (E-F)**: Verifies that tracks split correctly into distinct segments when the temporal gap exceeds `maximum_interpolation_gap_seconds` (e.g., 4 hours).
3. **Spatial & Temporal Gating (G-J)**: Tests the dynamic `auto_local` local projected CRS (e.g., UTM Zone calculation). It verifies spatial score configuration (no hardcoded 50km threshold) and tests the interval-derived proportional temporal overlap functionality (no arbitrary 12-hour references or arbitrary score floors).
4. **Behavior & Missing Field Policies (K-M)**: Implements Option B testing to confirm that normal maritime behavior (course changes) is not falsely flagged as suspicious, trajectory continuity is rewarded, corridor interaction is normalized against actual source intervals, and missing optional fields trigger `is_missing=True` without zeroing out the entire candidate score. Validates deterministic bounding `[0,1]`.
5. **Provider Capabilities & Integration (N-R)**: Confirms that `GFWProvider` and `AISStreamProvider` throw `UnsupportedCapabilityError` if historical positions are requested. Tests the full end-to-end integration mapping Stage 4 `DriftResult` outputs directly into the Stage 5 engine.

## Regression Guarantee
The test suite ensures zero regressions. Stage 1 (Data), Stage 2 (ML), Stage 3 (Spill Intelligence), and Stage 4 (Drift) tests execute alongside Stage 5. All 30 combined tests currently pass successfully.
