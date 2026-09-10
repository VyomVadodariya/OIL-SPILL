# Stage 3 Validation

## Methodology
The Stage 3 system relies entirely on synthetic test fixtures (`tests/fixtures/synthetic_masks.py`) to validate characterization logic. Real dataset masks were strictly forbidden at this stage.

## Test Fixtures
- **Compact Spill**: A solid 20x20 square. Predictable area (400) and centroid.
- **Elongated Spill**: A 10x40 rectangle. Used to test elongation and axis derivation.
- **Fragmented Spill**: Two 10x10 squares spaced apart. Ensures the engine isolates them into separate components.
- **Noisy Spill**: A 20x20 square with isolated 1x1 noise pixels. Validates morphological opening and size thresholding.
- **Empty Mask**: A mask with no detections. Validates pipeline robustness.

## Metrics
- 13 total unit tests run.
- Tests assert area equivalence, centroid location tolerance (`< 1e-5`), correct physical conversion algorithms, missing metadata handling, and end-to-end JSON serialization in `test_stage3_pipeline.py`.
- No real datasets were downloaded or fabricated to pass the validation stage.
