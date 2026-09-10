import pytest
import uuid
from datetime import datetime, timezone

from src.evidence.engine import evaluate_candidates
from src.evidence.schema import CandidateClassification, SourceType
from src.characterization.schema import SpillDetection, UncertaintyStatus
from src.drift.schema import DriftResult, DriftStatus, TemporalWindow
from src.ais.schema import (
    AISResult, AISResultStatus, VesselCandidate, VesselTrack, VesselIdentity,
    SpatialCompatibility, TemporalCompatibility, BehaviorFeatures, CandidateRanking, ScoreComponent
)

def _mock_score_comp(score, weight, is_missing=False, desc=""):
    return ScoreComponent(score=score, weight=weight, is_missing=is_missing, description=desc)

def create_mock_candidate(
    candidate_id, mmsi, 
    spatial_score, temporal_score, drift_score, behavior_score, track_score, 
    imo="IMO123", time_spent=3600
):
    # We map the mock scores to the inputs that Stage 6 expects.
    # Stage 6 calculates drift score as (spatial.score + temporal.score) / 2
    
    spatial = SpatialCompatibility(min_distance_meters=0.0, corridor_intersections=1, time_spent_in_corridor_seconds=time_spent)
    temporal = TemporalCompatibility(temporal_overlap_seconds=time_spent, source_window_duration_seconds=3600)
    behavior = BehaviorFeatures()
    track = VesselTrack(VesselIdentity(mmsi=mmsi, imo=imo), segments=[], gaps=[], total_observations=100, largest_gap_seconds=0)
    
    ranking = CandidateRanking(
        spatial_score=_mock_score_comp(spatial_score, 0.4),
        temporal_score=_mock_score_comp(temporal_score, 0.3),
        track_quality_score=_mock_score_comp(track_score, 0.15),
        behavior_score=_mock_score_comp(behavior_score, 0.1),
        data_quality_score=_mock_score_comp(1.0 if imo else 0.5, 0.05),
        overall_compatibility_score=0.9
    )
    
    return VesselCandidate(
        candidate_id=candidate_id, track=track, spatial=spatial,
        temporal=temporal, behavior=behavior, ranking=ranking
    )

@pytest.fixture
def base_inputs():
    detection = SpillDetection(uncertainty=UncertaintyStatus(model_confidence=0.9))
    window = TemporalWindow(simulation_start=datetime.now(timezone.utc), simulation_end=datetime.now(timezone.utc))
    drift = DriftResult(detection_id=detection.detection_id, status=DriftStatus.SUCCESS, temporal_window=window)
    cfg = {
        "weights": {"drift": 0.35, "temporal": 0.25, "spatial": 0.20, "behavior": 0.10, "track_quality": 0.10},
        "classification_thresholds": {
            "high_priority": 0.80, "strongly_compatible": 0.65, "moderately_compatible": 0.45,
            "weakly_compatible": 0.25, "insufficient_evidence": 0.10
        }
    }
    return detection, drift, cfg

def test_scenario_a_strong_candidate(base_inputs):
    detection, drift, cfg = base_inputs
    cand_a = create_mock_candidate(uuid.uuid4(), "MMSI_A", 1.0, 1.0, 1.0, 1.0, 1.0)
    
    ais_res = AISResult(drift.detection_id, AISResultStatus.SUCCESS, [cand_a], [], {})
    res = evaluate_candidates(detection, drift, ais_res, cfg)
    
    assert res.source_type == SourceType.VESSEL
    assert res.candidates[0].classification == CandidateClassification.HIGH_PRIORITY_INVESTIGATION_CANDIDATE
    # Completeness is < 1.0 because Drift is MISSING by design
    assert res.candidates[0].evidence_completeness_score < 1.0
    assert res.candidates[0].evidence_completeness_score > 0.6
    # No responsibility claimed
    assert "responsibility is not established" in res.candidates[0].explanation.interpretation

def test_scenario_b_nearest_vessel_trap(base_inputs):
    # Candidate A: nearest spatially (1.0), but bad temporal (0.0)
    # Candidate B: farther spatially (0.5), but great temporal (1.0)
    detection, drift, cfg = base_inputs
    
    cand_a = create_mock_candidate(uuid.uuid4(), "MMSI_A", 1.0, 0.0, 0.5, 0.5, 1.0)
    cand_b = create_mock_candidate(uuid.uuid4(), "MMSI_B", 0.5, 1.0, 0.75, 0.8, 1.0)
    
    ais_res = AISResult(drift.detection_id, AISResultStatus.SUCCESS, [cand_a, cand_b], [], {})
    res = evaluate_candidates(detection, drift, ais_res, cfg)
    
    # B should be ranked higher due to evidence weighting (temporal + drift interaction)
    assert res.candidates[0].vessel_identity.mmsi == "MMSI_B"

def test_scenario_e_unknown_source(base_inputs):
    # No candidates at all
    detection, drift, cfg = base_inputs
    ais_res = AISResult(drift.detection_id, AISResultStatus.SUCCESS, [], [], {})
    
    res = evaluate_candidates(detection, drift, ais_res, cfg)
    assert res.source_type == SourceType.UNKNOWN
    assert len(res.candidates) == 0

def test_scenario_d_strong_contradiction(base_inputs):
    # Spatial matches, but temporal explicitly contradicts (score=0.0)
    detection, drift, cfg = base_inputs
    cand = create_mock_candidate(uuid.uuid4(), "MMSI_A", 1.0, 0.0, 0.5, 0.5, 1.0)
    
    ais_res = AISResult(drift.detection_id, AISResultStatus.SUCCESS, [cand], [], {})
    res = evaluate_candidates(detection, drift, ais_res, cfg)
    
    c = res.candidates[0]
    has_contradiction = any(e.direction.value == "CONTRADICTING" for e in c.all_evidence)
    assert has_contradiction
    assert c.classification != CandidateClassification.HIGH_PRIORITY_INVESTIGATION_CANDIDATE

def test_identity_does_not_inflate_priority(base_inputs):
    # Two identical candidates except one has IMO, other doesn't.
    detection, drift, cfg = base_inputs
    cand_full = create_mock_candidate(uuid.uuid4(), "MMSI_1", 0.8, 0.8, 0.8, 0.8, 0.8, imo="IMO123")
    cand_miss = create_mock_candidate(uuid.uuid4(), "MMSI_2", 0.8, 0.8, 0.8, 0.8, 0.8, imo=None)
    
    ais_res = AISResult(drift.detection_id, AISResultStatus.SUCCESS, [cand_full, cand_miss], [], {})
    res = evaluate_candidates(detection, drift, ais_res, cfg)
    
    c_full = next(c for c in res.candidates if c.vessel_identity.mmsi == "MMSI_1")
    c_miss = next(c for c in res.candidates if c.vessel_identity.mmsi == "MMSI_2")
    
    # Priority score must be exactly the same (identity doesn't affect priority)
    assert c_full.investigation_priority_score == c_miss.investigation_priority_score
    
    # But completeness should be different
    assert c_full.evidence_completeness_score > c_miss.evidence_completeness_score

def test_drift_independence(base_inputs):
    # Changing Stage 5 spatial/temporal should NOT change the Drift evidence score.
    # Drift is independently derived from Stage 4 (or marked MISSING if insufficient).
    detection, drift, cfg = base_inputs
    
    cand_1 = create_mock_candidate(uuid.uuid4(), "MMSI_1", 1.0, 1.0, 1.0, 1.0, 1.0)
    cand_2 = create_mock_candidate(uuid.uuid4(), "MMSI_1", 0.1, 0.1, 1.0, 1.0, 1.0)
    
    res1 = evaluate_candidates(detection, drift, AISResult(drift.detection_id, AISResultStatus.SUCCESS, [cand_1], [], {}), cfg)
    res2 = evaluate_candidates(detection, drift, AISResult(drift.detection_id, AISResultStatus.SUCCESS, [cand_2], [], {}), cfg)
    
    drift_ev1 = next(e for e in res1.candidates[0].all_evidence if e.evidence_type.value == "DRIFT")
    drift_ev2 = next(e for e in res2.candidates[0].all_evidence if e.evidence_type.value == "DRIFT")
    
    # Drift score should be identical (and in our case, MISSING/0.0) regardless of spatial/temporal changes
    assert drift_ev1.score == drift_ev2.score
    assert drift_ev1.direction == drift_ev2.direction

def test_deterministic_result(base_inputs):
    # Two identical executions produce identical output (excluding execution_timestamp)
    detection, drift, cfg = base_inputs
    cand = create_mock_candidate(uuid.uuid4(), "MMSI_1", 0.8, 0.8, 0.8, 0.8, 0.8)
    ais_res = AISResult(drift.detection_id, AISResultStatus.SUCCESS, [cand], [], {})
    
    res1 = evaluate_candidates(detection, drift, ais_res, cfg)
    res2 = evaluate_candidates(detection, drift, ais_res, cfg)
    
    c1 = res1.candidates[0]
    c2 = res2.candidates[0]
    
    assert c1.investigation_priority_score == c2.investigation_priority_score
    assert c1.evidence_completeness_score == c2.evidence_completeness_score
    assert c1.classification == c2.classification
    
    # Evidence IDs must be identical
    ids1 = [e.evidence_id for e in c1.all_evidence]
    ids2 = [e.evidence_id for e in c2.all_evidence]
    assert ids1 == ids2

def test_reliability_configuration(base_inputs):
    # Changing configured reliability changes effective weighting
    detection, drift, cfg = base_inputs
    cand = create_mock_candidate(uuid.uuid4(), "MMSI_1", 0.8, 0.8, 0.8, 0.8, 0.8)
    ais_res = AISResult(drift.detection_id, AISResultStatus.SUCCESS, [cand], [], {})
    
    cfg_high = cfg.copy()
    cfg_high["reliability_priors"] = {"spatial": 1.0, "temporal": 1.0, "drift": 1.0, "behavior": 1.0, "track_quality": 1.0}
    
    cfg_low = cfg.copy()
    cfg_low["reliability_priors"] = {"spatial": 0.1, "temporal": 0.1, "drift": 0.1, "behavior": 0.1, "track_quality": 0.1}
    
    res_high = evaluate_candidates(detection, drift, ais_res, cfg_high)
    res_low = evaluate_candidates(detection, drift, ais_res, cfg_low)
    
    # With missing Drift, lowering the reliability of available metrics will change the relative impact
    # or the raw denominator. The scores should differ if the components differ in score values.
    # We just need to assert that the components' reliabilities actually changed in the objects
    s_ev_high = next(e for e in res_high.candidates[0].all_evidence if e.evidence_type.value == "SPATIAL")
    s_ev_low = next(e for e in res_low.candidates[0].all_evidence if e.evidence_type.value == "SPATIAL")
    
    assert s_ev_high.reliability == 1.0
    assert s_ev_low.reliability == 0.1

def test_source_type_protection(base_inputs):
    # A moderate candidate score must not automatically produce VESSEL if evidence completeness is insufficient.
    detection, drift, cfg = base_inputs
    
    # Force high priority but poor completeness (e.g. no IMO, no Track, missing Temporal, etc)
    cand = create_mock_candidate(uuid.uuid4(), "MMSI_1", 0.8, 0.0, 0.8, 0.8, 0.8, imo=None)
    # Simulate low completeness by forcing missing temporal
    cand.ranking.temporal_score = _mock_score_comp(0.0, 0.25, is_missing=True)
    
    ais_res = AISResult(drift.detection_id, AISResultStatus.SUCCESS, [cand], [], {})
    
    res = evaluate_candidates(detection, drift, ais_res, cfg)
    
    # Priority might be >= 0.45, but completeness < 0.50 should result in UNKNOWN
    assert res.candidates[0].investigation_priority_score >= 0.45
    assert res.candidates[0].evidence_completeness_score < 0.50
    assert res.source_type == SourceType.UNKNOWN
