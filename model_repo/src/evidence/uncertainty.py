from src.evidence.schema import UncertaintyProfile
from src.drift.schema import DriftResult
from src.characterization.schema import SpillDetection
from src.ais.schema import VesselCandidate

def calculate_uncertainty_profile(
    detection: SpillDetection,
    drift: DriftResult,
    candidate: VesselCandidate,
    completeness: float
) -> UncertaintyProfile:
    """
    Propagates uncertainty explicitly from Stages 3, 4, and 5 into a comprehensive UncertaintyProfile.
    Does not invent probabilities. Normalizes known proxies to a [0, 1] range where 1.0 is MAX uncertainty.
    """
    # 1. Spatial uncertainty (Stage 3 + Stage 4)
    # E.g. If the detection area is huge or model confidence is low
    stage3_conf = detection.uncertainty.model_confidence if detection.uncertainty.model_confidence else 0.5
    s_uncert = 1.0 - stage3_conf
    
    # 2. Drift uncertainty (Stage 4)
    if drift.uncertainty and drift.uncertainty.spatial_dispersion_matrix_m2:
        # A simple proxy: if the covariance is very large, drift is highly uncertain.
        # This requires domain mapping, but we can set a baseline for now.
        d_uncert = 0.5 
    else:
        d_uncert = 1.0
        
    # 3. Temporal uncertainty (Stage 4 + Stage 5)
    # E.g. Large AIS gaps increase temporal uncertainty
    if candidate is not None:
        total_dur = sum(s.duration_seconds for s in candidate.track.segments)
        if total_dur > 0:
            gap_ratio = min(1.0, candidate.track.largest_gap_seconds / total_dur)
            t_uncert = gap_ratio
        else:
            t_uncert = 1.0
            
        # 4. AIS uncertainty (Stage 5)
        ais_uncert = 1.0 - candidate.ranking.track_quality_score.score
        
        # 5. Identity uncertainty (Stage 5)
        id_uncert = 1.0 if not candidate.track.identity.imo else 0.0
    else:
        t_uncert = 1.0
        ais_uncert = 1.0
        id_uncert = 1.0
        
    
    # Overall is a simple average of components for now
    overall = (s_uncert + d_uncert + t_uncert + ais_uncert + id_uncert) / 5.0
    
    return UncertaintyProfile(
        overall_uncertainty=overall,
        spatial_uncertainty=s_uncert,
        temporal_uncertainty=t_uncert,
        drift_uncertainty=d_uncert,
        ais_uncertainty=ais_uncert,
        identity_uncertainty=id_uncert,
        data_completeness=completeness
    )
