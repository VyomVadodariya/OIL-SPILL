# Stage 6 Data Contract

## Inputs
Stage 6 consumes:
1. `SpillDetection` (Stage 3)
2. `DriftResult` (Stage 4)
3. `AISResult` (Stage 5)
4. `Dict` Configuration (weights, thresholds)

## Outputs
Returns `Stage6Result`.

### `Stage6Result`
```python
@dataclass
class Stage6Result:
    detection_id: uuid.UUID
    source_type: SourceType # e.g. VESSEL or UNKNOWN
    candidates: List[CandidateAssessment]
    spill_uncertainty: UncertaintyProfile
    provenance: Dict[str, str]
```

### `CandidateAssessment`
A structured summary of a candidate vessel's compatibility.
```python
@dataclass
class CandidateAssessment:
    candidate_id: uuid.UUID
    vessel_identity: VesselIdentity
    investigation_priority_score: float
    evidence_completeness_score: float
    supporting_evidence: List[EvidenceItem]
    contradicting_evidence: List[EvidenceItem]
    missing_evidence: List[EvidenceItem]
    all_evidence: List[EvidenceItem]
    uncertainty: UncertaintyProfile
    classification: CandidateClassification
    explanation: CandidateExplanation
    provenance: Dict[str, Any]
```

### `EvidenceItem`
Maintains transparency regarding the direction, weight, reliability, and provenance of each evidence block.
```python
@dataclass
class EvidenceItem:
    evidence_type: EvidenceType
    source_stage: str
    source_component: str
    observation: Any
    score: float
    direction: EvidenceDirection
    weight: float
    reliability: float
    uncertainty: float
    availability: bool
    description: str
    provenance: Provenance
```
