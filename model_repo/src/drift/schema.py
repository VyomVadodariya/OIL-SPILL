from dataclasses import dataclass, field
from typing import Optional, List, Tuple
from datetime import datetime
import uuid
from enum import Enum

class DriftStatus(str, Enum):
    SUCCESS = "SUCCESS"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"
    OUT_OF_BOUNDS = "OUT_OF_BOUNDS"
    INVALID_INPUT = "INVALID_INPUT"
    NUMERICAL_FAILURE = "NUMERICAL_FAILURE"

class ParticleState(str, Enum):
    ACTIVE = "ACTIVE"
    BEACHED = "BEACHED"
    REJECTED = "REJECTED"

@dataclass
class EnvironmentalInputMetadata:
    source_current: str
    source_wind: str

@dataclass
class DriftModelParameters:
    timestep_seconds: int
    integration_method: str
    windage_range: Tuple[float, float]
    diffusion_coef_m2_s: float

@dataclass
class GeoPolygon:
    """Strongly typed Polygon representation."""
    type: str = "Polygon"
    coordinates: List[List[Tuple[float, float]]] = field(default_factory=list)

@dataclass
class CorridorGeometry:
    density_polygon: GeoPolygon
    hull_polygon: Optional[GeoPolygon] = None

@dataclass
class TemporalWindow:
    simulation_start: datetime
    simulation_end: datetime
    earliest_backtracked_time: Optional[datetime] = None
    latest_backtracked_time: Optional[datetime] = None
    configured_search_horizon_hours: Optional[float] = None

@dataclass
class UncertaintySummary:
    total_particles: int
    active_particles: int
    beached_particles: int
    rejected_particles: int
    # Covariance in local metric space (meters squared)
    spatial_dispersion_matrix_m2: List[List[float]] 
    centroid_lon: float
    centroid_lat: float

@dataclass
class Provenance:
    git_hash: str
    execution_timestamp: datetime
    random_seed: int

@dataclass
class DriftResult:
    """
    Stage 4 — Drift / Source-Corridor Engine Data Contract
    """
    detection_id: uuid.UUID
    status: DriftStatus
    
    temporal_window: Optional[TemporalWindow] = None
    
    source_corridor: Optional[CorridorGeometry] = None
    forward_corridor: Optional[CorridorGeometry] = None
    
    uncertainty: Optional[UncertaintySummary] = None
    parameters: Optional[DriftModelParameters] = None
    environment: Optional[EnvironmentalInputMetadata] = None
    provenance: Optional[Provenance] = None
