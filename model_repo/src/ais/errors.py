class AISError(Exception):
    """Base exception for AIS Engine."""
    pass

class ProviderUnavailableError(AISError):
    """Raised when a provider is unreachable or down."""
    pass

class UnsupportedCapabilityError(AISError):
    """Raised when a provider is asked for a capability it does not support."""
    pass

class InvalidAISDataError(AISError):
    """Raised when normalized AIS data is fundamentally invalid (e.g., bad coords)."""
    pass

class InvalidStage4InputError(AISError):
    """Raised when Stage 4 DriftResult input is invalid or missing required bounds."""
    pass
