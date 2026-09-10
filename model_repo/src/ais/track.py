from typing import List, Dict, Optional
import uuid
from itertools import groupby
from src.ais.schema import AISPosition, TrackSegment, VesselTrack, AISGap, AISGapType, VesselIdentity

def reconstruct_tracks(
    positions: List[AISPosition], 
    vessel_identities: Dict[str, VesselIdentity], 
    max_gap_seconds: float,
    min_observations: int
) -> List[VesselTrack]:
    """
    Groups observations by MMSI, sorts them chronologically, removes exact duplicates,
    and splits tracks into TrackSegment objects based on maximum gap thresholds.
    """
    tracks = []
    
    # Pre-sorted in normalization, but group by MMSI
    # groupby expects contiguous keys, so we must sort by mmsi first
    sorted_pos = sorted(positions, key=lambda x: (x.mmsi, x.timestamp_utc))
    
    for mmsi, group in groupby(sorted_pos, key=lambda x: x.mmsi):
        obs_list = list(group)
        
        # Remove exact duplicates (same timestamp) deterministically by keeping the first one
        unique_obs = []
        seen_ts = set()
        for obs in obs_list:
            if obs.timestamp_utc not in seen_ts:
                unique_obs.append(obs)
                seen_ts.add(obs.timestamp_utc)
                
        if len(unique_obs) < min_observations:
            continue
            
        segments = []
        gaps = []
        current_segment_obs = [unique_obs[0]]
        largest_gap = 0.0
        
        for i in range(1, len(unique_obs)):
            prev_obs = unique_obs[i-1]
            curr_obs = unique_obs[i]
            
            gap_seconds = (curr_obs.timestamp_utc - prev_obs.timestamp_utc).total_seconds()
            
            if gap_seconds > max_gap_seconds:
                # Close current segment
                if len(current_segment_obs) >= min_observations:
                    segments.append(_build_segment(mmsi, current_segment_obs))
                
                # Record gap
                gaps.append(AISGap(
                    gap_type=AISGapType.AIS_OBSERVATION_GAP,
                    start_time=prev_obs.timestamp_utc,
                    end_time=curr_obs.timestamp_utc,
                    duration_seconds=gap_seconds
                ))
                if gap_seconds > largest_gap:
                    largest_gap = gap_seconds
                    
                # Start new segment
                current_segment_obs = [curr_obs]
            else:
                current_segment_obs.append(curr_obs)
                
        # Handle last segment
        if len(current_segment_obs) >= min_observations:
            segments.append(_build_segment(mmsi, current_segment_obs))
            
        if not segments:
            continue
            
        identity = vessel_identities.get(mmsi, VesselIdentity(mmsi=mmsi))
        
        tracks.append(VesselTrack(
            identity=identity,
            segments=segments,
            gaps=gaps,
            total_observations=len(unique_obs),
            largest_gap_seconds=largest_gap
        ))
        
    return tracks

def _build_segment(mmsi: str, obs: List[AISPosition]) -> TrackSegment:
    start_time = obs[0].timestamp_utc
    end_time = obs[-1].timestamp_utc
    duration = (end_time - start_time).total_seconds()
    
    # Calculate simple distance (we will use pyproj for real distance if needed, 
    # but for TrackSegment metrics a basic approximation is fine, or we can leave it None
    # and compute in behavior.py. We'll leave it None here to keep track.py clean)
    
    sogs = [o.sog for o in obs if o.sog is not None]
    mean_sog = sum(sogs) / len(sogs) if sogs else None
    max_sog = max(sogs) if sogs else None
    
    import statistics
    speed_var = statistics.variance(sogs) if len(sogs) > 1 else 0.0
    
    return TrackSegment(
        segment_id=str(uuid.uuid4()),
        mmsi=mmsi,
        positions=obs,
        start_time=start_time,
        end_time=end_time,
        duration_seconds=duration,
        distance_meters=None, 
        mean_sog=mean_sog,
        max_sog=max_sog,
        speed_variance=speed_var
    )
