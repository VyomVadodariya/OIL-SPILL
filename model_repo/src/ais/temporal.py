from datetime import datetime, timedelta
from src.ais.schema import VesselTrack, TemporalCompatibility
from src.drift.schema import TemporalWindow

def calculate_temporal_compatibility(
    track: VesselTrack,
    window: TemporalWindow
) -> TemporalCompatibility:
    """
    Evaluates how closely the vessel's track aligns with the historical source time window.
    """
    earliest_track = None
    latest_track = None
    
    for segment in track.segments:
        if earliest_track is None or segment.start_time < earliest_track:
            earliest_track = segment.start_time
        if latest_track is None or segment.end_time > latest_track:
            latest_track = segment.end_time
            
    if earliest_track is None or latest_track is None:
        return TemporalCompatibility()
        
    overlap_start = max(earliest_track, window.earliest_backtracked_time)
    overlap_end = min(latest_track, window.latest_backtracked_time)
    
    overlap_seconds = max(0.0, (overlap_end - overlap_start).total_seconds())
    
    # Calculate difference from window if it doesn't overlap
    time_diff = 0.0
    if overlap_seconds == 0.0:
        if latest_track < window.earliest_backtracked_time:
            time_diff = (window.earliest_backtracked_time - latest_track).total_seconds()
        elif earliest_track > window.latest_backtracked_time:
            time_diff = (earliest_track - window.latest_backtracked_time).total_seconds()
            
    source_dur = max(0.0, (window.latest_backtracked_time - window.earliest_backtracked_time).total_seconds())
    
    return TemporalCompatibility(
        earliest_compatible_observation=earliest_track if overlap_seconds > 0 else None,
        latest_compatible_observation=latest_track if overlap_seconds > 0 else None,
        temporal_overlap_seconds=overlap_seconds,
        time_difference_from_window_seconds=time_diff,
        source_window_duration_seconds=source_dur
    )
