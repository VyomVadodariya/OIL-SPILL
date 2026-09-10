import statistics
from typing import List, Dict
from src.ais.schema import VesselTrack, BehaviorFeatures, SpatialCompatibility

def calculate_behavior_features(
    track: VesselTrack,
    spatial: SpatialCompatibility,
    cfg: Dict
) -> BehaviorFeatures:
    """
    Computes observable features strictly derived from AIS data.
    Does not infer intent.
    Option B: Trajectory Compatibility.
    """
    all_sogs = []
    course_changes = 0
    low_speed_duration = 0.0
    
    low_speed_threshold_knots = cfg.get("low_speed_threshold_knots", 1.0)
    expected_observation_interval_seconds = cfg.get("expected_observation_interval_seconds", 300.0)
    
    for segment in track.segments:
        segment_sogs = [p.sog for p in segment.positions if p.sog is not None]
        all_sogs.extend(segment_sogs)
        
        # Calculate low speed duration
        for i in range(1, len(segment.positions)):
            p1 = segment.positions[i-1]
            p2 = segment.positions[i]
            if p1.sog is not None and p1.sog < low_speed_threshold_knots:
                dt = (p2.timestamp_utc - p1.timestamp_utc).total_seconds()
                low_speed_duration += dt
                
            # Course changes (> 30 degrees)
            if p1.cog is not None and p2.cog is not None:
                diff = abs(p1.cog - p2.cog)
                if diff > 180:
                    diff = 360 - diff
                if diff > 30.0:
                    course_changes += 1

    mean_sog = statistics.mean(all_sogs) if all_sogs else None
    max_sog = max(all_sogs) if all_sogs else None
    speed_var = statistics.variance(all_sogs) if len(all_sogs) > 1 else None
    
    # Track continuity (ratio of actual obs to expected obs based on duration)
    total_duration = sum(s.duration_seconds for s in track.segments)
    expected_obs = total_duration / expected_observation_interval_seconds if expected_observation_interval_seconds > 0 else 0
    
    # +1 because 1 observation takes 0 seconds but is 1 observation
    expected_obs = max(1.0, expected_obs) 
    continuity = min(1.0, track.total_observations / expected_obs) if expected_obs > 0 else None
    
    return BehaviorFeatures(
        mean_speed_knots=mean_sog,
        max_speed_knots=max_sog,
        speed_variance=speed_var,
        course_change_count=course_changes,
        low_speed_duration_seconds=low_speed_duration,
        track_continuity_ratio=continuity,
        observation_density=None # Optional extension point
    )
