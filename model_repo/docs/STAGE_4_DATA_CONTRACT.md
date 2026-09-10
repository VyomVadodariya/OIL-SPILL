# Stage 4 Data Contract

The Stage 4 Engine eliminates arbitrary Python dictionaries by utilizing strongly-typed schema structures (`src/drift/schema.py`). 

## Contract: `DriftResult`

- **`detection_id`**: Links directly back to the original Stage 3 `SpillDetection.detection_id`.
- **`status`**: Enumerable (`SUCCESS`, `INSUFFICIENT_DATA`, `OUT_OF_BOUNDS`, `INVALID_INPUT`, `NUMERICAL_FAILURE`).
- **`temporal_window`**: Structured `TemporalWindow` explicitly defining `simulation_start`, `simulation_end`, and the `earliest/latest_backtracked_time` boundaries required for Stage 5 AIS querying.
- **`source_corridor` / `forward_corridor`**: Uses the `GeoPolygon` class for strongly-typed coordinate arrays.
- **`uncertainty`**: Includes explicitly tracked `total_particles`, `active_particles`, `beached_particles`, and `rejected_particles`. The `spatial_dispersion_matrix_m2` tracks spatial covariance strictly in metric units (meters squared).
- **`parameters`**: Captures integration parameters (timestep, windage bounds).
- **`environment`**: Captures adapter lineage (e.g., SyntheticConstant).
- **`provenance`**: Captures dynamic git hash, random seeds, and execution timestamps for absolute deterministic reproducibility.
