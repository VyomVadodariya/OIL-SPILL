from typing import Dict
from src.evidence.schema import CandidateClassification

def classify_candidate(investigation_priority_score: float, cfg: Dict) -> CandidateClassification:
    """
    Classifies a candidate based on its investigation priority score.
    Protects against nearest-vessel traps and false attribution by applying
    strict configuration-driven boundaries.
    """
    thresholds = cfg.get("classification_thresholds", {})
    
    high = thresholds.get("high_priority", 0.80)
    strong = thresholds.get("strongly_compatible", 0.65)
    moderate = thresholds.get("moderately_compatible", 0.45)
    weak = thresholds.get("weakly_compatible", 0.25)
    insufficient = thresholds.get("insufficient_evidence", 0.10)
    
    if investigation_priority_score >= high:
        return CandidateClassification.HIGH_PRIORITY_INVESTIGATION_CANDIDATE
    elif investigation_priority_score >= strong:
        return CandidateClassification.STRONGLY_COMPATIBLE
    elif investigation_priority_score >= moderate:
        return CandidateClassification.MODERATELY_COMPATIBLE
    elif investigation_priority_score >= weak:
        return CandidateClassification.WEAKLY_COMPATIBLE
    elif investigation_priority_score >= insufficient:
        return CandidateClassification.INSUFFICIENT_EVIDENCE
    else:
        return CandidateClassification.NO_EVIDENCE
