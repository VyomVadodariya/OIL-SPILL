from typing import List, Dict, Optional
from src.ais.provider import AISProvider, ProviderCapabilities
from src.ais.errors import UnsupportedCapabilityError

class AISStreamProvider(AISProvider):
    """
    AISStream Provider adapter skeleton.
    Primarily a live/streaming provider.
    """
    @property
    def capabilities(self) -> ProviderCapabilities:
        return ProviderCapabilities(
            historical_positions=False, # Unsupported for generic historical queries
            vessel_identity=True,
            vessel_presence=False,
            events=False,
            live_stream=True,
            bulk_download=False
        )

    @property
    def provider_name(self) -> str:
        return "AISSTREAM"

    def get_historical_positions(self, min_lon, min_lat, max_lon, max_lat, start_time, end_time) -> List[Dict]:
        raise UnsupportedCapabilityError("AISStreamProvider is a live stream and does not support historical queries.")
        
    def get_vessel_identity(self, mmsi: str) -> Optional[Dict]:
        # Skeleton
        return None
