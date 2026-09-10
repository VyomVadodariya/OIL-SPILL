# Stage 5 Architecture — AIS & Maritime Intelligence Engine

## Overview
Stage 5 consumes the `DriftResult` (source corridor and historical time window) from Stage 4 and performs deterministic reconstruction and comparison of historical AIS data to rank candidate vessels based on spatial and temporal compatibility.

## Core Components
1. **Provider Abstraction (`src/ais/provider.py`)**: Defines `AISProvider` and explicit `ProviderCapabilities`. Adapters for Offline CSV, Global Fishing Watch (GFW), and AISStream are provided.
2. **Normalization (`src/ais/normalization.py`)**: Standardizes raw provider data into strongly-typed `AISPosition` objects. It explicitly handles missing optional fields (IMO, ship name) without fabricating data, converts timestamps to UTC, and rejects fundamentally impossible geographic coordinates.
3. **Track Reconstruction (`src/ais/track.py`)**: Sorts positions chronologically by MMSI, removes duplicates, and splits tracks into `TrackSegment` objects. Missing data beyond a configured threshold (e.g. 4 hours) is recorded as an `AISGap` (`AISGapType.AIS_OBSERVATION_GAP`). **The engine explicitly refuses to interpolate across these large observation gaps.**
4. **Spatial Compatibility (`src/ais/spatial.py`)**: Uses a configuration-driven CRS strategy (`metric_crs_strategy=auto_local`) to dynamically calculate an AOI-appropriate projected CRS (e.g., local UTM zone based on corridor centroid) for accurate metric distance calculations, resolving distortions caused by generic Web Mercator (EPSG:3857). Coordinates in the public schema remain strictly WGS84.
5. **Temporal Compatibility (`src/ais/temporal.py`)**: Calculates deterministic overlap between the vessel's track timeline and the Stage 4 Drift backward time window. The temporal score is interval-derived, strictly proportional to the actual source window duration, ensuring that full overlap produces maximum compatibility and no overlap produces zero. Temporal tolerance is used as an eligibility gate before ranking.
6. **Behavioral Features (`src/ais/behavior.py`)**: Extracts purely observable data features (Option B: Trajectory Compatibility). It focuses on `track_continuity`, `corridor_interaction_duration` (normalized proportionally against source duration without arbitrary hour constants), and descriptive speed. It explicitly **refuses** to label features like low speed or course changes as "suspicious," "evasive," or indicative of guilt.
7. **Candidate Ranking (`src/ais/candidate.py`)**: Calculates an `overall_compatibility_score`. Missing feature components are tracked (`is_missing=True`) and do not default to zero; weights are normalized around available evidence.

## Constraints & Limitations
- **No Guilt Attribution**: This engine determines physical *compatibility*. It does not generate legal conclusions or determine guilt.
- **Provider Limitations**: Not all providers support historical track retrieval. The system relies on capability flags (e.g., GFW is treated as an identity/event enrichment provider, not a raw historical track provider).
- **No Fabrication**: Missing AIS fields remain missing.
