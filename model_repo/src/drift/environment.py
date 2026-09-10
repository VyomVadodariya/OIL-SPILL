from abc import ABC, abstractmethod
from typing import Tuple, Optional
from datetime import datetime

class BaseEnvironmentalAdapter(ABC):
    """
    Abstract interface for Environmental Forcing Data (Current and Wind).
    """
    
    @abstractmethod
    def get_current(self, lon: float, lat: float, time: datetime) -> Optional[Tuple[float, float]]:
        """Returns current velocity (u, v) in m/s. Returns None if out of bounds or missing data."""
        pass
        
    @abstractmethod
    def get_wind(self, lon: float, lat: float, time: datetime) -> Optional[Tuple[float, float]]:
        """Returns wind velocity (u, v) in m/s. Returns None if out of bounds or missing data."""
        pass

    @abstractmethod
    def is_land(self, lon: float, lat: float) -> bool:
        """Returns True if the coordinate is on land/invalid boundary."""
        pass

# SYNTHETIC TEST FIXTURE — NOT REAL ENVIRONMENTAL DATA
class SyntheticConstantEnv(BaseEnvironmentalAdapter):
    def __init__(self, current_u: float = 0.0, current_v: float = 0.0, wind_u: float = 0.0, wind_v: float = 0.0, bounds: tuple = None):
        self.u_c = current_u
        self.v_c = current_v
        self.u_w = wind_u
        self.v_w = wind_v
        self.bounds = bounds # (min_lon, min_lat, max_lon, max_lat)
        
    def get_current(self, lon: float, lat: float, time: datetime) -> Optional[Tuple[float, float]]:
        if self._out_of_bounds(lon, lat): return None
        return (self.u_c, self.v_c)
        
    def get_wind(self, lon: float, lat: float, time: datetime) -> Optional[Tuple[float, float]]:
        if self._out_of_bounds(lon, lat): return None
        return (self.u_w, self.v_w)
        
    def is_land(self, lon: float, lat: float) -> bool:
        return False
        
    def _out_of_bounds(self, lon: float, lat: float) -> bool:
        if not self.bounds: return False
        min_lon, min_lat, max_lon, max_lat = self.bounds
        return not (min_lon <= lon <= max_lon and min_lat <= lat <= max_lat)

# SYNTHETIC TEST FIXTURE — NOT REAL ENVIRONMENTAL DATA
class SyntheticVariableEnv(BaseEnvironmentalAdapter):
    """
    A time-varying synthetic environment to test historical back-trajectory queries.
    Current shifts eastward over time.
    """
    def __init__(self, base_time: datetime):
        self.base_time = base_time
        
    def get_current(self, lon: float, lat: float, time: datetime) -> Optional[Tuple[float, float]]:
        # Current U increases by 0.1 m/s every hour past base_time
        hours_diff = (time - self.base_time).total_seconds() / 3600.0
        u_c = 0.5 + (0.1 * hours_diff)
        return (u_c, 0.0)
        
    def get_wind(self, lon: float, lat: float, time: datetime) -> Optional[Tuple[float, float]]:
        return (0.0, 0.0)
        
    def is_land(self, lon: float, lat: float) -> bool:
        # Synthetic land mass at lon > 10.0
        return lon > 10.0
