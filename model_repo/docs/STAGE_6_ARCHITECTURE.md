# Stage 6 — Evidence & Attribution Engine Architecture

Stage 6 transforms inputs from Stages 3, 4, and 5 into a structured, deterministic, transparent evidence package. It calculates investigation priority without making subjective responsibility claims.

## Core Modules

### 1. `schema.py`
Strongly-typed schemas. Defines `EvidenceType`, `EvidenceDirection` (Supporting, Contradicting, Missing, Neutral), `EvidenceItem`, `UncertaintyProfile`, and `CandidateAssessment`. 

### 2. `engine.py`
The orchestration engine. Merges Stage 3 `SpillDetection`, Stage 4 `DriftResult`, and Stage 5 `AISResult`. It extracts evidence, delegates to the fusion logic, calculates uncertainty, and classifies candidates.

### 3. `fusion.py`
Fuses available evidence deterministically. Protects against double counting by enriching derived Stage 5 compatibility scores rather than summing them blindly. Evaluates `investigation_priority_score` and an independent `evidence_completeness_score`.

### 4. `uncertainty.py`
Explicitly propagates uncertainty upstream from detection (Stage 3), physics modeling (Stage 4), and AIS tracking (Stage 5) into a comprehensive `UncertaintyProfile`.

### 5. `classification.py`
Enforces strict boundary configurations. The highest tier is `HIGH_PRIORITY_INVESTIGATION_CANDIDATE`. It is strictly forbidden to output terms like "Guilty" or "Responsible".

### 6. `explanations.py`
Produces deterministic, human-readable explanations directly derived from the structured evidence, separating supporting, contradicting, missing elements, and explicitly declaring that vessel responsibility is not established.

### 7. `errors.py`
Contains domain-specific exception types.

## Critical Boundaries

- **Missing != Negative**: Missing evidence lowers completeness but does not invent contradicting evidence.
- **Identity != Causal Weight**: Knowing a vessel's identity increases completeness but does not increase its likelihood of having caused a spill.
- **Distinct Evidence Dimensions**: Spatial and Temporal metrics are derived from Stage 5 track intersections. Drift evidence represents independent physics-based interactions derived from Stage 4. Double-counting is strictly prevented; if Stage 4 lacks candidate-level metrics, drift is marked `MISSING` rather than fabricating a score from Stage 5 data.
- **Configurable Reliability**: Reliability values (e.g. 0.9 for spatial) are explicit configuration-driven engineering priors, NOT calibrated probabilities.
- **Deterministic Evaluation**: Execution guarantees deterministic reproducibility by decoupling execution timestamps into `runtime_metadata` and using stable UUIDv5 generation based on candidate and evidence provenance identifiers.
- **Unknown Source**: If no vessel crosses the moderate threshold, or if evidence completeness is too low despite a high score, the system defaults to `UNKNOWN` source type. High candidate scores do not guarantee the physical source was a vessel without sufficient data completeness.
