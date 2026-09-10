from typing import List
from src.evidence.schema import EvidenceItem, EvidenceDirection, CandidateExplanation

def generate_explanation(evidence_items: List[EvidenceItem], classification: str) -> CandidateExplanation:
    """
    Generates a deterministic human-readable explanation from the structured evidence.
    Does NOT hard-code text. Extracts directly from the evidence descriptions.
    """
    supporting = []
    contradicting = []
    missing = []
    
    for item in evidence_items:
        if not item.availability:
            missing.append(item.description)
            continue
            
        if item.direction == EvidenceDirection.SUPPORTING:
            supporting.append(item.description)
        elif item.direction == EvidenceDirection.CONTRADICTING:
            contradicting.append(item.description)
            
    if not contradicting:
        contradicting.append("No strong contradiction identified.")
        
    if not missing:
        missing.append("No critical evidence components missing.")
        
    interpretation = f"{classification.replace('_', ' ').title()}."
    # Strict boundary requirement
    if "UNKNOWN" not in classification:
        interpretation += " Vessel responsibility is not established."
        
    # Uncertainty is handled externally and passed in, but we can summarize it if needed.
    # The schema separates uncertainty into its own profile.
        
    return CandidateExplanation(
        supporting_evidence=supporting,
        contradicting_evidence=contradicting,
        missing_evidence=missing,
        uncertainty=[], # To be filled by the engine
        interpretation=interpretation
    )
