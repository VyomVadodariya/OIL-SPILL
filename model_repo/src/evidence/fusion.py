from typing import List, Tuple
from src.evidence.schema import EvidenceItem, EvidenceDirection, EvidenceType

def fuse_evidence(evidence_items: List[EvidenceItem]) -> Tuple[float, float]:
    """
    Fuses available evidence into a deterministic scalar investigation priority score
    and a distinct evidence completeness score.
    
    Formula:
    weighted_evidence = sum(weight_i * normalized_score_i * reliability_i) / sum(weight_i * reliability_i)
    
    Completeness:
    completeness = sum(weight_i * availability_i) / sum(weight_i)
    """
    total_effective_weight = 0.0
    weighted_sum = 0.0
    
    total_possible_weight = 0.0
    available_weight = 0.0
    
    for item in evidence_items:
        # Identity is NOT a causal weight. It does not contribute to priority score directly.
        # But it contributes to evidence completeness.
        comp_weight = item.weight if item.evidence_type != EvidenceType.VESSEL_IDENTITY else 0.1
        total_possible_weight += comp_weight
        
        if item.evidence_type == EvidenceType.VESSEL_IDENTITY:
            # Identity completeness is proportional to the data quality score (MMSI=0.5, IMO=1.0)
            available_weight += comp_weight * item.score
        elif item.availability:
            available_weight += comp_weight
            
        if item.weight > 0.0 and item.availability:
            # Causal evidence fusion
            # Reliability diminishes the effective weight of the evidence
            eff_weight = item.weight * item.reliability
            total_effective_weight += eff_weight
            
            if item.direction in (EvidenceDirection.SUPPORTING, EvidenceDirection.CONTRADICTING):
                weighted_sum += item.score * eff_weight
            elif item.direction == EvidenceDirection.NEUTRAL:
                weighted_sum += item.score * eff_weight
                
    if total_effective_weight > 0.0:
        priority_score = weighted_sum / total_effective_weight
    else:
        priority_score = 0.0
        
    if total_possible_weight > 0.0:
        completeness = available_weight / total_possible_weight
    else:
        completeness = 0.0
        
    return priority_score, completeness
