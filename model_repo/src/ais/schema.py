from dataclasses import dataclass, field
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum
import uuid

class AISResultStatus(str, Enum):
    SUCCESS = "SUCCESS"
    NO_CANDIDATES_FOUND = "NO_CANDIDATES_FOUND"
    INSUFFICIENT_AIS_DATA = "INSUFFICIENT_AIS_DATA"
    PROVIDER_UNAVAILABLE = "PROVIDER_UNAVAILABLE"
    INVALID_INPUT = "INVALID_INPUT"
    INVALID_CORRIDOR = "INVALID_CORRIDOR"
    INVALID_TIME_WINDOW = "INVALID_TIME_WINDOW"
    PROCESSING_ERROR = "PROCESSING_ERROR"

class AISGapType(str, Enum):
    AIS_OBSERVATION_GAP = "AIS_OBSERVATION_GAP"
    PROVIDER_REPORTED_OFF = "PROVIDER_REPORTED_OFF" # Explicitly known off event

@dataclass
class VesselIdentity:
    mmsi: str
    imo: Optional[str] = None
    ship_name: Optional[str] = None
    callsign: Optional[str] = None
    ship_type: Optional[str] = None
    draught: Optional[float] = None
    length: Optional[float] = None
    width: Optional[float] = None

@dataclass
class AISPosition:
    mmsi: str
    timestamp_utc: datetime
    longitude: float
    latitude: float
    sog: Optional[float] = None
    cog: Optional[float] = None
    heading: Optional[float] = None
    navigation_status: Optional[str] = None
    provider_source: str = "UNKNOWN"

@dataclass
class AISGap:
    gap_type: AISGapType
    start_time: datetime
    end_time: datetime
    duration_seconds: float

@dataclass
class TrackSegment:
    segment_id: str
    mmsi: str
    positions: List[AISPosition]
    start_time: datetime
    end_time: datetime
    duration_seconds: float
    distance_meters: Optional[float] = None
    mean_sog: Optional[float] = None
    max_sog: Optional[float] = None
    speed_variance: Optional[float] = None

@dataclass
class VesselTrack:
    identity: VesselIdentity
    segments: List[TrackSegment]
    gaps: List[AISGap]
    total_observations: int
    largest_gap_seconds: float

@dataclass
class ScoreComponent:
    score: float
    weight: float
    is_missing: bool
    description: str

@dataclass
class CandidateRanking:
    spatial_score: ScoreComponent
    temporal_score: ScoreComponent
    track_quality_score: ScoreComponent
    behavior_score: ScoreComponent
    data_quality_score: ScoreComponent
    overall_compatibility_score: float

@dataclass
class SpatialCompatibility:
    min_distance_meters: float
    corridor_intersections: int
    time_of_closest_approach: Optional[datetime] = None
    time_spent_in_corridor_seconds: float = 0.0

@dataclass
class TemporalCompatibility:
    earliest_compatible_observation: Optional[datetime] = None
    latest_compatible_observation: Optional[datetime] = None
    temporal_overlap_seconds: float = 0.0
    time_difference_from_window_seconds: float = 0.0
    source_window_duration_seconds: float = 0.0

@dataclass
class BehaviorFeatures:
    mean_speed_knots: Optional[float] = None
    max_speed_knots: Optional[float] = None
    speed_variance: Optional[float] = None
    course_change_count: Optional[int] = None
    low_speed_duration_seconds: Optional[float] = None
    track_continuity_ratio: Optional[float] = None # obs / expected obs
    observation_density: Optional[float] = None

@dataclass
class VesselCandidate:
    candidate_id: uuid.UUID
    track: VesselTrack
    spatial: SpatialCompatibility
    temporal: TemporalCompatibility
    behavior: BehaviorFeatures
    ranking: CandidateRanking

@dataclass
class AISResult:
    drift_detection_id: uuid.UUID
    status: AISResultStatus
    candidates: List[VesselCandidate]
    # Keep provider and provenance details
    providers_used: List[str]
    provenance: Dict[str, str] # e.g. git hash, execution time
