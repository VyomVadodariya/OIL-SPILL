from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
from src.ais.schema import VesselIdentity

class EvidenceDirection(str, Enum):
    SUPPORTING = "SUPPORTING"
    CONTRADICTING = "CONTRADICTING"
    NEUTRAL = "NEUTRAL"
    MISSING = "MISSING"

class EvidenceType(str, Enum):
    SPATIAL = "SPATIAL"
    TEMPORAL = "TEMPORAL"
    DRIFT = "DRIFT"
    AIS_TRACK = "AIS_TRACK"
    VESSEL_IDENTITY = "VESSEL_IDENTITY"
    BEHAVIOR = "BEHAVIOR"
    DATA_QUALITY = "DATA_QUALITY"
    UNCERTAINTY = "UNCERTAINTY"

class CandidateClassification(str, Enum):
    NO_EVIDENCE = "NO_EVIDENCE"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"
    WEAKLY_COMPATIBLE = "WEAKLY_COMPATIBLE"
    MODERATELY_COMPATIBLE = "MODERATELY_COMPATIBLE"
    STRONGLY_COMPATIBLE = "STRONGLY_COMPATIBLE"
    HIGH_PRIORITY_INVESTIGATION_CANDIDATE = "HIGH_PRIORITY_INVESTIGATION_CANDIDATE"

class SourceType(str, Enum):
    VESSEL = "VESSEL"
    FIXED_SOURCE = "FIXED_SOURCE"
    PIPELINE = "PIPELINE"
    NATURAL_SEEP = "NATURAL_SEEP"
    UNKNOWN = "UNKNOWN"

@dataclass
class Provenance:
    source_stage: str
    source_component: str
    provider: Optional[str] = None
    data_timestamp: Optional[datetime] = None
    configuration_version: Optional[str] = None
    git_commit: Optional[str] = None

@dataclass
class EvidenceItem:
    evidence_id: uuid.UUID
    candidate_id: uuid.UUID
    evidence_type: EvidenceType
    source_stage: str
    source_component: str
    observation: Any
    score: float # 0.0 to 1.0 (normalized representation of this specific evidence)
    direction: EvidenceDirection
    weight: float
    reliability: float # 0.0 to 1.0
    uncertainty: float # 0.0 to 1.0
    availability: bool # True if present, False if MISSING
    description: str
    provenance: Provenance

@dataclass
class UncertaintyProfile:
    overall_uncertainty: float
    spatial_uncertainty: float
    temporal_uncertainty: float
    drift_uncertainty: float
    ais_uncertainty: float
    identity_uncertainty: float
    data_completeness: float

@dataclass
class CandidateExplanation:
    supporting_evidence: List[str]
    contradicting_evidence: List[str]
    missing_evidence: List[str]
    uncertainty: List[str]
    interpretation: str

@dataclass
class CandidateAssessment:
    candidate_id: uuid.UUID
    vessel_identity: VesselIdentity
    investigation_priority_score: float # deterministic scalar
    evidence_completeness_score: float # independent completeness metric
    supporting_evidence: List[EvidenceItem]
    contradicting_evidence: List[EvidenceItem]
    missing_evidence: List[EvidenceItem]
    all_evidence: List[EvidenceItem]
    uncertainty: UncertaintyProfile
    classification: CandidateClassification
    explanation: CandidateExplanation
    provenance: Dict[str, Any]

@dataclass
class Stage6Result:
    detection_id: uuid.UUID
    source_type: SourceType
    candidates: List[CandidateAssessment]
    spill_uncertainty: UncertaintyProfile
    provenance: Dict[str, str]
