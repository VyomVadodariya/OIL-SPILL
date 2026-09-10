from abc import ABC, abstractmethod
from typing import List, Optional, Dict
from dataclasses import dataclass
from src.ais.schema import AISPosition, VesselIdentity

@dataclass
class ProviderCapabilities:
    historical_positions: bool
    vessel_identity: bool
    vessel_presence: bool
    events: bool
    live_stream: bool
    bulk_download: bool

class AISProvider(ABC):
    @property
    @abstractmethod
    def capabilities(self) -> ProviderCapabilities:
        pass

    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @abstractmethod
    def get_historical_positions(self, min_lon: float, min_lat: float, max_lon: float, max_lat: float, start_time, end_time) -> List[Dict]:
        """Returns raw historical positions if supported."""
        pass
        
    @abstractmethod
    def get_vessel_identity(self, mmsi: str) -> Optional[Dict]:
        """Returns raw vessel identity if supported."""
        pass
