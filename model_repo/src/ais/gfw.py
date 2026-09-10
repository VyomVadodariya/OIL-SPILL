from typing import List, Dict, Optional
from src.ais.provider import AISProvider, ProviderCapabilities
from src.ais.errors import UnsupportedCapabilityError

class GFWProvider(AISProvider):
    """
    Global Fishing Watch Provider adapter skeleton.
    Treats GFW as an enrichment ecosystem.
    It provides identity, presence, events, but NOT full raw historical tracks.
    """
    @property
    def capabilities(self) -> ProviderCapabilities:
        return ProviderCapabilities(
            historical_positions=False, # Explicitly false as per requirement
            vessel_identity=True,
            vessel_presence=True,
            events=True,
            live_stream=False,
            bulk_download=True
        )

    @property
    def provider_name(self) -> str:
        return "GLOBAL_FISHING_WATCH"

    def get_historical_positions(self, min_lon, min_lat, max_lon, max_lat, start_time, end_time) -> List[Dict]:
        raise UnsupportedCapabilityError("GFWProvider does not support full raw historical position queries.")
        
    def get_vessel_identity(self, mmsi: str) -> Optional[Dict]:
        # Skeleton
        return None
