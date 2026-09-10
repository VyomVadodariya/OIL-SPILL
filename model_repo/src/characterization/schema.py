from dataclasses import dataclass, field
from typing import Optional, Dict, Any, List
from datetime import datetime
import uuid

@dataclass
class PixelCentroid:
    row: float
    col: float

@dataclass
class GeoCentroid:
    longitude: float
    latitude: float

@dataclass
class UncertaintyStatus:
    model_confidence: Optional[float] = None
    segmentation_uncertainty: Optional[str] = "UNAVAILABLE — MODEL NOT VALIDATED"
    geolocation_certainty: Optional[str] = "UNAVAILABLE — METADATA MISSING"
    attribution_confidence: Optional[str] = "UNAVAILABLE — NO AIS YET"

@dataclass
class SpillDetection:
    """
    Stage 3 — Spill Intelligence & Characterization Engine
    Domain Model for an oil spill detection instance.
    """
    detection_id: uuid.UUID = field(default_factory=uuid.uuid4)
    source_scene_id: str = "UNKNOWN"
    acquisition_timestamp: Optional[datetime] = None
    sensor: str = "UNKNOWN"
    polarization: str = "UNKNOWN"
    
    classification: str = "OIL_SPILL"
    
    uncertainty: UncertaintyStatus = field(default_factory=UncertaintyStatus)
    
    # Geometry in GeoJSON format (dict)
    geometry: Optional[Dict[str, Any]] = None
    
    # Centroids
    pixel_centroid: Optional[PixelCentroid] = None
    geo_centroid: Optional[GeoCentroid] = None
    
    # Bounding Box (min_row, min_col, max_row, max_col)
    bounding_box_pixels: Optional[tuple[int, int, int, int]] = None
    
    # Pixel measurements
    area_pixels: Optional[int] = None
    perimeter_pixels: Optional[float] = None
    major_axis_pixels: Optional[float] = None
    minor_axis_pixels: Optional[float] = None
    pixel_count: Optional[int] = None
    
    # Physical measurements (must be null if unavailable)
    area_km2: Optional[float] = None
    perimeter_km: Optional[float] = None
    major_axis_km: Optional[float] = None
    minor_axis_km: Optional[float] = None
    
    # Shape descriptors
    orientation_degrees: Optional[float] = None
    compactness: Optional[float] = None
    elongation: Optional[float] = None
    
    # Geospatial details
    geospatial_resolution: Optional[tuple[float, float]] = None # (x_res, y_res) in meters/degrees
    crs: Optional[str] = None
    
    # Source & Provenance
    source_metadata: Dict[str, Any] = field(default_factory=dict)
    provenance: Dict[str, Any] = field(default_factory=dict)
