from typing import List, Dict, Optional
from src.ais.schema import (
    CandidateRanking, ScoreComponent, SpatialCompatibility, 
    TemporalCompatibility, BehaviorFeatures, VesselTrack
)

def rank_candidate(
    track: VesselTrack,
    spatial: SpatialCompatibility,
    temporal: TemporalCompatibility,
    behavior: BehaviorFeatures,
    cfg: Dict
) -> CandidateRanking:
    """
    Computes a deterministic, transparent compatibility score.
    Missing features do not penalize the overall score to 0; they are tracked as missing
    and the weights are normalized among available components.
    """
    weights = cfg.get("weights", {})
    
    # -------------------------------------------------------------------------
    # 1. Spatial Score (Issue #3 fix: No hardcoded 50km)
    # -------------------------------------------------------------------------
    search_radius = cfg.get("spatial_search_radius_meters", 50000.0)
    interaction_thresh = cfg.get("corridor_interaction_threshold_meters", 500.0)
    
    if spatial.min_distance_meters <= interaction_thresh:
        s_score = 1.0
    elif spatial.min_distance_meters >= search_radius:
        s_score = 0.0
    else:
        # Linear decay based on configured search radius
        s_score = 1.0 - (spatial.min_distance_meters / search_radius)
        
    if spatial.corridor_intersections > 0:
        s_score = min(1.0, s_score + 0.2)
        
    spatial_comp = ScoreComponent(
        score=s_score, 
        weight=weights.get("spatial", 0.4), 
        is_missing=False, 
        description=f"Distance decay (radius={search_radius}m) & intersection boost"
    )

    # -------------------------------------------------------------------------
    # 2. Temporal Score (Issue #4 fix: Interval-derived Proportional Overlap)
    # -------------------------------------------------------------------------
    if temporal.temporal_overlap_seconds > 0:
        ref_duration = temporal.source_window_duration_seconds
        if ref_duration > 0:
            t_score = min(1.0, temporal.temporal_overlap_seconds / ref_duration)
        else:
            t_score = 1.0
    else:
        # No overlap produces 0 compatibility. 
        # (Temporal eligibility/tolerance is handled as a gate before ranking)
        t_score = 0.0
            
    temporal_comp = ScoreComponent(
        score=t_score, 
        weight=weights.get("temporal", 0.3), 
        is_missing=False, 
        description="Proportional overlap with source window duration"
    )

    # -------------------------------------------------------------------------
    # 3. Track Quality Score
    # -------------------------------------------------------------------------
    track_missing = False
    if track.total_observations < cfg.get("minimum_track_observations", 3):
        q_score = 0.0
    else:
        # Penalty for very large gaps relative to duration
        total_duration = sum(s.duration_seconds for s in track.segments)
        if total_duration > 0:
            gap_penalty = min(1.0, track.largest_gap_seconds / total_duration)
            q_score = max(0.0, 1.0 - gap_penalty)
        else:
            q_score = 1.0
            
    quality_comp = ScoreComponent(
        score=q_score, 
        weight=weights.get("track_quality", 0.15), 
        is_missing=track_missing, 
        description="Observation count & gap penalty"
    )

    # -------------------------------------------------------------------------
    # 4. Behavior Score (Issue #2 fix: Option B - Trajectory Compatibility)
    # -------------------------------------------------------------------------
    b_missing = (behavior.track_continuity_ratio is None and behavior.mean_speed_knots is None)
    b_score = 0.0
    b_desc = "Behavior compatibility is missing"
    
    if not b_missing:
        # Implement a transparent weighted mean of available behavior components
        b_components = []
        
        # 1. Track continuity
        if behavior.track_continuity_ratio is not None:
            # High continuity = high compatibility
            b_components.append(min(1.0, behavior.track_continuity_ratio))
            
        # 2. Corridor interaction
        if spatial.time_spent_in_corridor_seconds > 0:
            ref_duration = temporal.source_window_duration_seconds
            if ref_duration > 0:
                dwell_score = min(1.0, spatial.time_spent_in_corridor_seconds / ref_duration)
            else:
                dwell_score = 1.0
            b_components.append(dwell_score)
            
        # 3. Speed compatibility (descriptive)
        if behavior.mean_speed_knots is not None:
            # Normal maritime speeds (e.g. > 1 knot) are standard compatibility
            # We don't penalize low speed as suspicious, we just use it as a neutral/weak feature
            if behavior.mean_speed_knots >= cfg.get("low_speed_threshold_knots", 1.0):
                b_components.append(0.5) # Neutral compatibility for normal speed
            else:
                b_components.append(0.5) # Neutral compatibility for low speed
                
        if b_components:
            b_score = sum(b_components) / len(b_components)
            b_desc = "Behavior compatibility based on observable trajectory (continuity, speed, interaction)"
        else:
            b_missing = True
            
    behavior_comp = ScoreComponent(
        score=b_score, 
        weight=weights.get("behavior", 0.10), 
        is_missing=b_missing, 
        description=b_desc
    )
    
    # -------------------------------------------------------------------------
    # 5. Data Quality Score
    # -------------------------------------------------------------------------
    d_score = 1.0 if track.identity.imo else 0.5
    data_quality_comp = ScoreComponent(
        score=d_score, 
        weight=weights.get("data_quality", 0.05), 
        is_missing=False, 
        description="Identity completeness"
    )

    # -------------------------------------------------------------------------
    # Combine available components via weight normalization
    # -------------------------------------------------------------------------
    components = [spatial_comp, temporal_comp, quality_comp, behavior_comp, data_quality_comp]
    
    total_effective_weight = sum(c.weight for c in components if not c.is_missing)
    if total_effective_weight > 0:
        overall = sum(c.score * c.weight for c in components if not c.is_missing) / total_effective_weight
    else:
        overall = 0.0

    return CandidateRanking(
        spatial_score=spatial_comp,
        temporal_score=temporal_comp,
        track_quality_score=quality_comp,
        behavior_score=behavior_comp,
        data_quality_score=data_quality_comp,
        overall_compatibility_score=overall
    )
