import pytest
from datetime import datetime, timezone, timedelta
from src.ais import (
    normalize_ais_positions, reconstruct_tracks, calculate_spatial_compatibility,
    calculate_temporal_compatibility, calculate_behavior_features, rank_candidate,
    OfflineAISProvider, GFWProvider, AISStreamProvider, 
    UnsupportedCapabilityError, InvalidAISDataError, AISPosition, VesselIdentity,
    SpatialCompatibility, BehaviorFeatures, TemporalCompatibility, VesselTrack
)
from src.drift.schema import GeoPolygon, TemporalWindow
from src.ais.spatial import _get_auto_local_epsg

def test_a_b_c_d_normalization_and_rejection():
    raw_data = [
        {"mmsi": "123", "timestamp": "2026-09-09T10:05:00Z", "longitude": 10.0, "latitude": 20.0},
        {"mmsi": "123", "timestamp": "2026-09-09T10:00:00Z", "longitude": 10.1, "latitude": 20.1},
        {"mmsi": "123", "timestamp": "2026-09-09T10:00:00Z", "longitude": 10.1, "latitude": 20.1},
        {"mmsi": "123", "timestamp": "2026-09-09T10:10:00Z", "longitude": 200.0, "latitude": 20.0}, 
        {"mmsi": "", "timestamp": "2026-09-09T10:15:00Z", "longitude": 10.0, "latitude": 20.0}, 
    ]
    with pytest.raises(InvalidAISDataError):
        normalize_ais_positions(raw_data, "TEST")
    raw_data.pop(3)
    norm = normalize_ais_positions(raw_data, "TEST")
    assert len(norm) == 3
    tracks = reconstruct_tracks(norm, {}, 14400, 1)
    assert len(tracks) == 1
    assert len(tracks[0].segments[0].positions) == 2

def test_e_f_track_segmentation():
    pos = [
        AISPosition("123", datetime(2026, 1, 1, 10, 0, tzinfo=timezone.utc), 0.0, 0.0),
        AISPosition("123", datetime(2026, 1, 1, 10, 5, tzinfo=timezone.utc), 0.1, 0.0),
        AISPosition("123", datetime(2026, 1, 1, 10, 10, tzinfo=timezone.utc), 0.2, 0.0),
        AISPosition("123", datetime(2026, 1, 1, 15, 0, tzinfo=timezone.utc), 1.0, 1.0),
        AISPosition("123", datetime(2026, 1, 1, 15, 5, tzinfo=timezone.utc), 1.1, 1.0),
        AISPosition("123", datetime(2026, 1, 1, 15, 10, tzinfo=timezone.utc), 1.2, 1.0),
    ]
    tracks = reconstruct_tracks(pos, {}, max_gap_seconds=14400, min_observations=3)
    assert len(tracks) == 1
    assert len(tracks[0].segments) == 2

def test_spatial_crs_selection():
    # Indian-water geometry (e.g. Mumbai ~72E, 19N)
    epsg_india = _get_auto_local_epsg(72.0, 19.0)
    # UTM Zone 43N is 32643
    assert epsg_india == 32643
    
    # Different zone (e.g. New York ~ -74W, 40N)
    epsg_ny = _get_auto_local_epsg(-74.0, 40.0)
    # UTM Zone 18N is 32618
    assert epsg_ny == 32618
    assert epsg_india != epsg_ny

def test_spatial_compatibility_metric():
    # Public output coordinates remain WGS84
    poly = GeoPolygon(coordinates=[[[72.0, 19.0], [72.1, 19.0], [72.1, 19.1], [72.0, 19.1], [72.0, 19.0]]])
    pos1 = [
        AISPosition("1", datetime(2026, 1, 1, 10, 0, tzinfo=timezone.utc), 72.05, 19.05),
        AISPosition("1", datetime(2026, 1, 1, 10, 5, tzinfo=timezone.utc), 72.05, 19.05)
    ]
    track1 = reconstruct_tracks(pos1, {}, 14400, 2)[0]
    sp1 = calculate_spatial_compatibility(track1, poly, "auto_local")
    assert sp1.min_distance_meters == 0.0
    # Original coordinates must be intact (WGS84)
    assert track1.segments[0].positions[0].longitude == 72.05

def test_spatial_scoring_config():
    # Test configuring spatial score radius
    track = VesselTrack(VesselIdentity("1"), [], [], 0, 0)
    sp_far = SpatialCompatibility(min_distance_meters=100000.0, corridor_intersections=0)
    sp_zero = SpatialCompatibility(min_distance_meters=0.0, corridor_intersections=1)
    
    temporal = TemporalCompatibility()
    behavior = BehaviorFeatures()
    
    # Candidate at zero distance = max spatial score
    rank_zero = rank_candidate(track, sp_zero, temporal, behavior, {"spatial_search_radius_meters": 50000.0})
    assert rank_zero.spatial_score.score == 1.0 # Due to intersection boost and zero distance
    
    # Candidate beyond configured radius = zero score
    rank_far = rank_candidate(track, sp_far, temporal, behavior, {"spatial_search_radius_meters": 50000.0})
    assert rank_far.spatial_score.score == 0.0
    
    # Changing configured radius changes behavior
    rank_far_with_large_radius = rank_candidate(track, sp_far, temporal, behavior, {"spatial_search_radius_meters": 200000.0})
    assert rank_far_with_large_radius.spatial_score.score > 0.0

def test_temporal_scoring_proportional():
    track = VesselTrack(VesselIdentity("1"), [], [], 0, 0)
    spatial = SpatialCompatibility(min_distance_meters=0.0, corridor_intersections=0)
    behavior = BehaviorFeatures()
    cfg = {"temporal_tolerance_seconds": 3600.0}
    
    # No overlap -> 0
    t_no = TemporalCompatibility(
        temporal_overlap_seconds=0, 
        time_difference_from_window_seconds=10000,
        source_window_duration_seconds=43200
    )
    rank_no = rank_candidate(track, spatial, t_no, behavior, cfg)
    assert rank_no.temporal_score.score == 0.0
    
    # Small overlap
    t_small = TemporalCompatibility(
        temporal_overlap_seconds=1000, 
        time_difference_from_window_seconds=0,
        source_window_duration_seconds=43200
    )
    rank_small = rank_candidate(track, spatial, t_small, behavior, cfg)
    
    # Large overlap
    t_large = TemporalCompatibility(
        temporal_overlap_seconds=43200, 
        time_difference_from_window_seconds=0,
        source_window_duration_seconds=43200
    )
    rank_large = rank_candidate(track, spatial, t_large, behavior, cfg)
    
    assert rank_small.temporal_score.score < rank_large.temporal_score.score
    assert rank_large.temporal_score.score == 1.0

def test_behavior_option_b():
    # Deterministic behavior, bounded [0,1], no suspicious intent
    track = VesselTrack(VesselIdentity("1"), [], [], 0, 0)
    spatial = SpatialCompatibility(min_distance_meters=0.0, corridor_intersections=0, time_spent_in_corridor_seconds=3600)
    temporal = TemporalCompatibility(source_window_duration_seconds=3600)
    cfg = {}
    
    # Behavior with normal speed, track continuity
    beh_good = BehaviorFeatures(mean_speed_knots=10.0, course_change_count=5, track_continuity_ratio=1.0)
    rank_good = rank_candidate(track, spatial, temporal, beh_good, cfg)
    assert not rank_good.behavior_score.is_missing
    assert 0.0 <= rank_good.behavior_score.score <= 1.0
    
    # Missing behavior
    beh_missing = BehaviorFeatures()
    rank_missing = rank_candidate(track, spatial, temporal, beh_missing, cfg)
    assert rank_missing.behavior_score.is_missing
    
    # Test weight renormalization
    # If behavior is missing, the other components should effectively weigh more 
    # to maintain the overall score relative to available evidence.
    total_weights_good = sum(c.weight for c in [rank_good.spatial_score, rank_good.temporal_score, rank_good.track_quality_score, rank_good.behavior_score, rank_good.data_quality_score] if not c.is_missing)
    total_weights_missing = sum(c.weight for c in [rank_missing.spatial_score, rank_missing.temporal_score, rank_missing.track_quality_score, rank_missing.behavior_score, rank_missing.data_quality_score] if not c.is_missing)
    
    assert total_weights_missing < total_weights_good
    assert rank_missing.overall_compatibility_score >= 0.0 # Bounded

def test_p_provider_capabilities():
    gfw = GFWProvider()
    assert not gfw.capabilities.historical_positions
    with pytest.raises(UnsupportedCapabilityError):
        gfw.get_historical_positions(0,0,0,0,None,None)
        
    stream = AISStreamProvider()
    assert stream.capabilities.live_stream
    with pytest.raises(UnsupportedCapabilityError):
        stream.get_historical_positions(0,0,0,0,None,None)

