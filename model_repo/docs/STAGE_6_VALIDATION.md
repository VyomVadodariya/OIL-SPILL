# Stage 6 Validation and Testing

Stage 6 includes comprehensive unit and integration testing.

## Unit Tests (`test_evidence.py`)
- **Deterministic Fusion**: Validates that weighted scores accurately fuse based on configuration and formula: `sum(score * eff_weight) / sum(eff_weight)`.
- **Contradiction Handling**: Contradicting evidence behaves as a penalty `(1.0 - score)` pulling priority towards zero.
- **Missing Evidence**: Ensures `MISSING` direction omits the item from the denominator of priority but affects the `completeness` score negatively.
- **Classification Boundaries**: Strict bounds enforcing `HIGH_PRIORITY_INVESTIGATION_CANDIDATE` down to `NO_EVIDENCE`.
- **Explanations**: Verifies deterministic, non-hallucinated explanations.

## Integration Tests (`test_stage6_pipeline.py`)
- **Scenario A (Strong multi-source)**: Tests standard integration with supporting evidence leading to high priority.
- **Scenario B (Nearest Vessel Trap)**: Explicitly validates that a closer vessel with poor temporal evidence will be outranked by a slightly further vessel with strong temporal + drift evidence.
- **Scenario D (Strong Contradiction)**: Checks explicit penalization of contradicting data.
- **Scenario E (Unknown Source)**: Empty candidate sets default to `UNKNOWN`.
- **Identity Not Causal**: Ensures that two completely identical tracks with missing identity vs complete identity yield the exact same `investigation_priority_score` while differing only in `evidence_completeness_score`.
- **Drift Independence**: Verifies that drift evidence remains independent from Stage 5 spatial/temporal features.
- **Deterministic Execution**: Asserts that identical inputs produce identically hashed UUIDv5 evidence objects and identical scores.
- **Reliability Configuration**: Proves that modifying the `reliability_priors` configuration effectively alters candidate ranking and weighting limits.
- **Source-Type Protection**: Ensures a high priority candidate is still classified as `UNKNOWN` source type if the overall evidence completeness is below configured thresholds.
