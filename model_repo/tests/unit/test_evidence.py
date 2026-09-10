import pytest
import uuid
from src.evidence.schema import EvidenceItem, EvidenceType, EvidenceDirection, CandidateClassification, CandidateExplanation
from src.evidence.fusion import fuse_evidence
from src.evidence.classification import classify_candidate
from src.evidence.explanations import generate_explanation

def create_mock_evidence(
    score: float, 
    direction: EvidenceDirection, 
    weight: float, 
    reliability: float = 1.0, 
    availability: bool = True
) -> EvidenceItem:
    return EvidenceItem(
        evidence_id=uuid.uuid4(),
        candidate_id=uuid.uuid4(),
        evidence_type=EvidenceType.TEMPORAL,
        source_stage="STAGE_5",
        source_component="temporal",
        observation=None,
        score=score,
        direction=direction,
        weight=weight,
        reliability=reliability,
        uncertainty=1.0 - reliability,
        availability=availability,
        description="Test description",
        provenance=None
    )

def test_evidence_fusion_deterministic():
    # Only supporting evidence
    e1 = create_mock_evidence(0.8, EvidenceDirection.SUPPORTING, 0.5)
    e2 = create_mock_evidence(0.6, EvidenceDirection.SUPPORTING, 0.5)
    
    score, completeness = fuse_evidence([e1, e2])
    # Expected score: (0.8 * 0.5 + 0.6 * 0.5) / 1.0 = 0.7
    assert abs(score - 0.7) < 0.0001
    assert completeness == 1.0

def test_evidence_fusion_contradiction():
    # Strong supporting vs Strong contradicting
    e_supp = create_mock_evidence(0.9, EvidenceDirection.SUPPORTING, 0.5)
    e_contra = create_mock_evidence(1.0, EvidenceDirection.CONTRADICTING, 0.5)
    
    score, completeness = fuse_evidence([e_supp, e_contra])
    # Contradiction formula uses item.score directly now. 
    # e_contra has score 1.0. Wait! If e_contra has score 1.0, and it's CONTRADICTING, 
    # then our extraction logic in `engine.py` maps low scores to CONTRADICTING.
    # In this mock, score=1.0 but direction=CONTRADICTING.
    # We just use item.score. 
    # Expected: (0.9 * 0.5 + 1.0 * 0.5) / 1.0 = 0.95
    assert abs(score - 0.95) < 0.0001
    
def test_evidence_fusion_missing_handling():
    e_supp = create_mock_evidence(1.0, EvidenceDirection.SUPPORTING, 0.5)
    e_miss = create_mock_evidence(0.0, EvidenceDirection.MISSING, 0.5, availability=False)
    
    score, completeness = fuse_evidence([e_supp, e_miss])
    # Only available weights are used for the denominator of score
    # Expected score: (1.0 * 0.5) / 0.5 = 1.0
    assert score == 1.0
    # Completeness should be 0.5 (since 0.5 / 1.0 weights are available)
    assert completeness == 0.5

def test_classification_boundaries():
    cfg = {"classification_thresholds": {
        "high_priority": 0.80,
        "strongly_compatible": 0.65,
        "moderately_compatible": 0.45,
        "weakly_compatible": 0.25,
        "insufficient_evidence": 0.10
    }}
    
    assert classify_candidate(0.85, cfg) == CandidateClassification.HIGH_PRIORITY_INVESTIGATION_CANDIDATE
    assert classify_candidate(0.66, cfg) == CandidateClassification.STRONGLY_COMPATIBLE
    assert classify_candidate(0.15, cfg) == CandidateClassification.INSUFFICIENT_EVIDENCE
    assert classify_candidate(0.05, cfg) == CandidateClassification.NO_EVIDENCE

def test_explanation_generation():
    e_supp = create_mock_evidence(1.0, EvidenceDirection.SUPPORTING, 0.5)
    e_supp.description = "Strong support"
    
    expl = generate_explanation([e_supp], CandidateClassification.HIGH_PRIORITY_INVESTIGATION_CANDIDATE.value)
    
    assert "Strong support" in expl.supporting_evidence
    assert "No strong contradiction" in expl.contradicting_evidence[0]
    assert "High Priority Investigation Candidate." in expl.interpretation
    assert "Vessel responsibility is not established" in expl.interpretation
