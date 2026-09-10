# Stage 5 Data Contract

The Stage 5 Engine strictly relies on the typed schemas defined in `src/ais/schema.py`. It eliminates `Dict[str, Any]` to ensure absolute predictability.

## Core Schemas

### `ProviderCapabilities`
Explicitly advertises whether an adapter supports `historical_positions`, `vessel_identity`, `vessel_presence`, `events`, `live_stream`, or `bulk_download`.

### `AISPosition`
Normalized single observation. Requires `mmsi`, `timestamp_utc`, `longitude`, `latitude`, and `provider_source`. Optional fields like `sog`, `cog`, and `heading` are typed as `Optional[float]`.

### `VesselTrack` & `TrackSegment`
A `VesselTrack` consists of one or more `TrackSegment` objects separated by `AISGap` objects.

### `AISGap`
Records data gaps explicitly using `AISGapType` (e.g., `AIS_OBSERVATION_GAP` or `PROVIDER_REPORTED_OFF`). The engine does not assume intentional disablement from a basic observation gap.

### `CandidateRanking`
A transparent scoring model containing:
- `spatial_score`: Proximity and interaction with the source corridor.
- `temporal_score`: Proportional overlap derived strictly from the actual historical source window interval duration.
- `track_quality_score`: Penalties for large gaps relative to total duration.
- `behavior_score`: Option B trajectory compatibility. Uses observable track continuity, corridor interaction duration, and speed consistency. Missing features are safely normalized out. It expressly does not measure "suspiciousness" or "guilt".
- `data_quality_score`: Identity completeness (e.g., presence of IMO).

Each is a `ScoreComponent` that records `score`, `weight`, and `is_missing`. Missing features (e.g., lack of speed data) set `is_missing=True` rather than dropping the candidate's score to zero.

### `AISResult`
The final output containing the `drift_detection_id`, the `status` (`SUCCESS`, `NO_CANDIDATES_FOUND`, `PROVIDER_UNAVAILABLE`), and a list of `VesselCandidate` objects. It explicitly does not contain fields related to "responsibility" or "guilt".
