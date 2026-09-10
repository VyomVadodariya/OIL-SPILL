import pytest
import uuid
import yaml
from datetime import datetime, timezone, timedelta
from src.drift.schema import GeoPolygon, TemporalWindow, DriftResult, DriftStatus, CorridorGeometry
from src.ais import (
    OfflineAISProvider, normalize_ais_positions, reconstruct_tracks,
    calculate_spatial_compatibility, calculate_temporal_compatibility,
    calculate_behavior_features, rank_candidate, VesselCandidate, AISResultStatus
)

def _load_config():
    with open("configs/stage5_config.yaml", "r") as f:
        return yaml.safe_load(f)["stage5"]

def test_stage4_to_stage5_pipeline():
    cfg = _load_config()
    
    # Mock Stage 4 DriftResult
    corridor = GeoPolygon(coordinates=[[[0.0, 0.0], [0.1, 0.0], [0.1, 0.1], [0.0, 0.1], [0.0, 0.0]]])
    window = TemporalWindow(
        simulation_start=datetime(2026, 1, 1, 12, 0, tzinfo=timezone.utc),
        simulation_end=datetime(2026, 1, 1, 8, 0, tzinfo=timezone.utc),
        earliest_backtracked_time=datetime(2026, 1, 1, 8, 0, tzinfo=timezone.utc),
        latest_backtracked_time=datetime(2026, 1, 1, 12, 0, tzinfo=timezone.utc)
    )
    drift = DriftResult(
        detection_id=uuid.uuid4(),
        status=DriftStatus.SUCCESS,
        temporal_window=window,
        source_corridor=CorridorGeometry(density_polygon=corridor)
    )
    
    raw_data = [
        # Vessel A
        {"mmsi": "A", "timestamp": "2026-01-01T09:00:00Z", "longitude": 0.05, "latitude": 0.05, "sog": 5.0},
        {"mmsi": "A", "timestamp": "2026-01-01T09:10:00Z", "longitude": 0.06, "latitude": 0.06, "sog": 5.0},
        {"mmsi": "A", "timestamp": "2026-01-01T09:20:00Z", "longitude": 0.07, "latitude": 0.07, "sog": 5.0},
        # Vessel B (Far away)
        {"mmsi": "B", "timestamp": "2026-01-01T09:00:00Z", "longitude": 10.0, "latitude": 10.0, "sog": 10.0},
        {"mmsi": "B", "timestamp": "2026-01-01T09:10:00Z", "longitude": 10.0, "latitude": 10.1, "sog": 10.0},
        {"mmsi": "B", "timestamp": "2026-01-01T09:20:00Z", "longitude": 10.0, "latitude": 10.2, "sog": 10.0},
        # Vessel C (Wrong time - 2 days later)
        {"mmsi": "C", "timestamp": "2026-01-03T09:00:00Z", "longitude": 0.05, "latitude": 0.05, "sog": 5.0},
        {"mmsi": "C", "timestamp": "2026-01-03T09:10:00Z", "longitude": 0.06, "latitude": 0.06, "sog": 5.0},
        {"mmsi": "C", "timestamp": "2026-01-03T09:20:00Z", "longitude": 0.07, "latitude": 0.07, "sog": 5.0},
    ]
    
    provider = OfflineAISProvider(raw_data)
    
    raw_query = provider.get_historical_positions(-180, -90, 180, 90, 
        drift.temporal_window.earliest_backtracked_time - timedelta(days=1), 
        drift.temporal_window.latest_backtracked_time + timedelta(days=1)
    )
    
    normalized = normalize_ais_positions(raw_query, provider.provider_name)
    tracks = reconstruct_tracks(normalized, {}, cfg["maximum_interpolation_gap_seconds"], cfg["minimum_track_observations"])
    
    candidates = []
    
    for t in tracks:
        temporal = calculate_temporal_compatibility(t, drift.temporal_window)
        if temporal.time_difference_from_window_seconds > cfg["temporal_tolerance_seconds"]:
            continue 
            
        spatial = calculate_spatial_compatibility(t, drift.source_corridor.density_polygon, cfg.get("metric_crs_strategy", "auto_local"))
        if spatial.min_distance_meters > cfg["spatial_search_radius_meters"]:
            continue 
            
        behavior = calculate_behavior_features(t, spatial, cfg)
        ranking = rank_candidate(t, spatial, temporal, behavior, cfg)
        
        cand = VesselCandidate(
            candidate_id=uuid.uuid4(),
            track=t,
            spatial=spatial,
            temporal=temporal,
            behavior=behavior,
            ranking=ranking
        )
        candidates.append(cand)
        
    assert len(candidates) == 1 # Only A should pass gating
    winner = candidates[0]
    assert winner.track.identity.mmsi == "A"
    assert winner.ranking.overall_compatibility_score > 0.60
    assert not winner.ranking.spatial_score.is_missing
    assert winner.ranking.spatial_score.score > 0.0
    assert winner.ranking.temporal_score.score > 0.0

def test_no_candidate_case():
    cfg = _load_config()
    provider = OfflineAISProvider([]) 
    
    corridor = GeoPolygon(coordinates=[[[0.0, 0.0], [0.1, 0.0], [0.1, 0.1], [0.0, 0.1], [0.0, 0.0]]])
    window = TemporalWindow(
        simulation_start=datetime(2026, 1, 1, 12, 0, tzinfo=timezone.utc),
        simulation_end=datetime(2026, 1, 1, 8, 0, tzinfo=timezone.utc),
        earliest_backtracked_time=datetime(2026, 1, 1, 8, 0, tzinfo=timezone.utc),
        latest_backtracked_time=datetime(2026, 1, 1, 12, 0, tzinfo=timezone.utc)
    )
    
    raw = provider.get_historical_positions(-180, -90, 180, 90, window.earliest_backtracked_time, window.latest_backtracked_time)
    normalized = normalize_ais_positions(raw, provider.provider_name)
    tracks = reconstruct_tracks(normalized, {}, cfg["maximum_interpolation_gap_seconds"], cfg["minimum_track_observations"])
    
    assert len(tracks) == 0
