from typing import Dict, List
import uuid
import datetime

from src.characterization.schema import SpillDetection
from src.drift.schema import DriftResult
from src.ais.schema import AISResult, VesselCandidate
from src.evidence.schema import (
    Stage6Result, CandidateAssessment, EvidenceItem, EvidenceDirection, 
    EvidenceType, SourceType, Provenance
)
from src.evidence.fusion import fuse_evidence
from src.evidence.classification import classify_candidate
from src.evidence.uncertainty import calculate_uncertainty_profile
from src.evidence.explanations import generate_explanation
from src.evidence.errors import MissingUpstreamDataError

def _create_provenance(stage: str, component: str, data_ts: datetime.datetime = None) -> Provenance:
    return Provenance(
        source_stage=stage,
        source_component=component,
        data_timestamp=data_ts,
        configuration_version="1.0"
    )

def _generate_evidence_id(candidate_id: uuid.UUID, evidence_type: EvidenceType, source_stage: str, source_component: str) -> uuid.UUID:
    name = f"{candidate_id}:{evidence_type.value}:{source_stage}:{source_component}"
    return uuid.uuid5(uuid.NAMESPACE_OID, name)

def extract_evidence(candidate: VesselCandidate, cfg: Dict) -> List[EvidenceItem]:
    """
    Extracts evidence from Stage 5 candidate ranking without double-counting.
    Enriches with direction, reliability, and exact source provenance.
    """
    weights = cfg.get("weights", {})
    reliability_priors = cfg.get("reliability_priors", {})
    evidence = []
    
    # 1. Spatial Evidence
    s_score = candidate.ranking.spatial_score
    rel_spatial = reliability_priors.get("spatial", 0.90)
    if s_score.is_missing:
        direction = EvidenceDirection.MISSING
        rel_spatial = 0.0
    elif s_score.score > 0.5:
        direction = EvidenceDirection.SUPPORTING
    elif s_score.score == 0.0:
        direction = EvidenceDirection.CONTRADICTING
    else:
        direction = EvidenceDirection.NEUTRAL
        
    evidence.append(EvidenceItem(
        evidence_id=_generate_evidence_id(candidate.candidate_id, EvidenceType.SPATIAL, "STAGE_5", "spatial_compatibility"),
        candidate_id=candidate.candidate_id,
        evidence_type=EvidenceType.SPATIAL,
        source_stage="STAGE_5",
        source_component="spatial_compatibility",
        observation=candidate.spatial,
        score=s_score.score,
        direction=direction,
        weight=weights.get("spatial", 0.20),
        reliability=rel_spatial,
        uncertainty=1.0 - rel_spatial,
        availability=not s_score.is_missing,
        description=f"Spatial compatibility ({direction.value}): {s_score.description}",
        provenance=_create_provenance("STAGE_5", "spatial_compatibility")
    ))

    # 2. Temporal Evidence
    t_score = candidate.ranking.temporal_score
    rel_temporal = reliability_priors.get("temporal", 0.90)
    if t_score.is_missing:
        direction = EvidenceDirection.MISSING
        rel_temporal = 0.0
    elif t_score.score > 0.0:
        direction = EvidenceDirection.SUPPORTING
    else:
        direction = EvidenceDirection.CONTRADICTING
        
    evidence.append(EvidenceItem(
        evidence_id=_generate_evidence_id(candidate.candidate_id, EvidenceType.TEMPORAL, "STAGE_5", "temporal_compatibility"),
        candidate_id=candidate.candidate_id,
        evidence_type=EvidenceType.TEMPORAL,
        source_stage="STAGE_5",
        source_component="temporal_compatibility",
        observation=candidate.temporal,
        score=t_score.score,
        direction=direction,
        weight=weights.get("temporal", 0.25),
        reliability=rel_temporal,
        uncertainty=1.0 - rel_temporal,
        availability=not t_score.is_missing,
        description=f"Temporal compatibility ({direction.value}): {t_score.description}",
        provenance=_create_provenance("STAGE_5", "temporal_compatibility")
    ))
    
    # 3. Behavior Evidence
    b_score = candidate.ranking.behavior_score
    rel_behavior = reliability_priors.get("behavior", 0.70)
    if b_score.is_missing:
        direction = EvidenceDirection.MISSING
        rel_behavior = 0.0
    else:
        direction = EvidenceDirection.SUPPORTING if b_score.score >= 0.5 else EvidenceDirection.NEUTRAL
        
    evidence.append(EvidenceItem(
        evidence_id=_generate_evidence_id(candidate.candidate_id, EvidenceType.BEHAVIOR, "STAGE_5", "behavior_features"),
        candidate_id=candidate.candidate_id,
        evidence_type=EvidenceType.BEHAVIOR,
        source_stage="STAGE_5",
        source_component="behavior_features",
        observation=candidate.behavior,
        score=b_score.score,
        direction=direction,
        weight=weights.get("behavior", 0.10),
        reliability=rel_behavior,
        uncertainty=1.0 - rel_behavior,
        availability=not b_score.is_missing,
        description=f"Trajectory behavior ({direction.value}): {b_score.description}",
        provenance=_create_provenance("STAGE_5", "behavior_features")
    ))
    
    # 4. Drift Evidence
    # Drift receives highest weight. Stage 4 does not currently provide an independent 
    # candidate-level overlap metric (only environment modeling). To prevent double-counting
    # Stage 5 spatial/temporal features, we explicitly mark Drift evidence as INSUFFICIENT
    # rather than fabricating a score.
    rel_drift = reliability_priors.get("drift", 0.80)
    evidence.append(EvidenceItem(
        evidence_id=_generate_evidence_id(candidate.candidate_id, EvidenceType.DRIFT, "STAGE_4", "drift_corridor"),
        candidate_id=candidate.candidate_id,
        evidence_type=EvidenceType.DRIFT,
        source_stage="STAGE_4",
        source_component="drift_corridor",
        observation=None,
        score=0.0,
        direction=EvidenceDirection.MISSING,
        weight=weights.get("drift", 0.35),
        reliability=0.0, # 0.0 because it's missing
        uncertainty=1.0,
        availability=False,
        description="Drift model physics compatibility (MISSING): No independent candidate-level Stage 4 metric available.",
        provenance=_create_provenance("STAGE_4", "drift_corridor")
    ))
    
    # 5. Track Quality
    q_score = candidate.ranking.track_quality_score
    rel_track = reliability_priors.get("track_quality", 1.0)
    if q_score.is_missing:
        rel_track = 0.0
    evidence.append(EvidenceItem(
        evidence_id=_generate_evidence_id(candidate.candidate_id, EvidenceType.AIS_TRACK, "STAGE_5", "track_quality"),
        candidate_id=candidate.candidate_id,
        evidence_type=EvidenceType.AIS_TRACK,
        source_stage="STAGE_5",
        source_component="track_quality",
        observation=f"Observations: {candidate.track.total_observations}",
        score=q_score.score,
        direction=EvidenceDirection.SUPPORTING if q_score.score > 0.5 else EvidenceDirection.NEUTRAL,
        weight=weights.get("track_quality", 0.10),
        reliability=rel_track,
        uncertainty=1.0 - rel_track,
        availability=not q_score.is_missing,
        description=f"Track quality ({q_score.score}): {q_score.description}",
        provenance=_create_provenance("STAGE_5", "track_quality")
    ))

    # 6. Vessel Identity (Completeness only, 0 weight for priority score)
    id_score = candidate.ranking.data_quality_score
    evidence.append(EvidenceItem(
        evidence_id=_generate_evidence_id(candidate.candidate_id, EvidenceType.VESSEL_IDENTITY, "STAGE_5", "vessel_identity"),
        candidate_id=candidate.candidate_id,
        evidence_type=EvidenceType.VESSEL_IDENTITY,
        source_stage="STAGE_5",
        source_component="vessel_identity",
        observation=candidate.track.identity,
        score=id_score.score,
        direction=EvidenceDirection.SUPPORTING,
        weight=0.0, # CRITICAL: NO CAUSAL WEIGHT
        reliability=1.0,
        uncertainty=0.0,
        availability=not id_score.is_missing,
        description=f"Identity completeness ({id_score.score}): {id_score.description}",
        provenance=_create_provenance("STAGE_5", "vessel_identity")
    ))

    return evidence

def evaluate_candidates(
    detection: SpillDetection, 
    drift: DriftResult, 
    ais_result: AISResult, 
    cfg: Dict
) -> Stage6Result:
    """
    Main orchestration engine for Stage 6.
    Transforms candidates into fully structured CandidateAssessments.
    """
    if not detection or not drift or not ais_result:
        raise MissingUpstreamDataError("Missing required Stage 3, 4, or 5 input data.")
        
    assessments = []
    
    for candidate in ais_result.candidates:
        evidence = extract_evidence(candidate, cfg)
        
        # Evidence Fusion
        priority_score, completeness = fuse_evidence(evidence)
        
        # Uncertainty
        uncertainty = calculate_uncertainty_profile(detection, drift, candidate, completeness)
        
        # Classification
        classification = classify_candidate(priority_score, cfg)
        
        # Explanation
        explanation = generate_explanation(evidence, classification)
        
        # Sort evidence
        supp = [e for e in evidence if e.direction == EvidenceDirection.SUPPORTING]
        contra = [e for e in evidence if e.direction == EvidenceDirection.CONTRADICTING]
        miss = [e for e in evidence if not e.availability]
        
        assessment = CandidateAssessment(
            candidate_id=candidate.candidate_id,
            vessel_identity=candidate.track.identity,
            investigation_priority_score=priority_score,
            evidence_completeness_score=completeness,
            supporting_evidence=supp,
            contradicting_evidence=contra,
            missing_evidence=miss,
            all_evidence=evidence,
            uncertainty=uncertainty,
            classification=classification,
            explanation=explanation,
            provenance={
                "stage6_version": "1.0",
                "runtime_metadata": {
                    "execution_timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
                }
            }
        )
        assessments.append(assessment)
        
    # Deterministic Tie-Breaker Sort
    assessments.sort(key=lambda x: (
        -x.investigation_priority_score,
        -x.evidence_completeness_score,
        x.uncertainty.overall_uncertainty,
        x.vessel_identity.mmsi if x.vessel_identity.mmsi else str(x.candidate_id)
    ))
    
    # Check for Unknown Source
    source_type = SourceType.UNKNOWN
    if assessments:
        top_cand = assessments[0]
        mod_threshold = cfg.get("classification_thresholds", {}).get("moderately_compatible", 0.45)
        min_completeness = cfg.get("source_type_criteria", {}).get("min_completeness_for_vessel", 0.50)
        
        if top_cand.investigation_priority_score >= mod_threshold and top_cand.evidence_completeness_score >= min_completeness:
            source_type = SourceType.VESSEL

    return Stage6Result(
        detection_id=detection.detection_id,
        source_type=source_type,
        candidates=assessments,
        spill_uncertainty=assessments[0].uncertainty if assessments else calculate_uncertainty_profile(detection, drift, None, 0.0),
        provenance={"stage6": "Engine Execution Complete", "version": "1.0"}
    )
