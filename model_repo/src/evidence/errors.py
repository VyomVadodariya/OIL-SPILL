class Stage6Error(Exception):
    """Base exception for Stage 6"""
    pass

class EvidenceFusionError(Stage6Error):
    """Raised when evidence fusion fails mathematically."""
    pass

class MissingUpstreamDataError(Stage6Error):
    """Raised when required upstream data from Stages 3-5 is critically malformed or missing."""
    pass
