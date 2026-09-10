from dataclasses import dataclass
from typing import List, Tuple
from src.drift.schema import ParticleState

@dataclass
class Particle:
    id: int
    lon: float
    lat: float
    state: ParticleState = ParticleState.ACTIVE
    windage: float = 0.03
    
    # History for trajectories
    lon_history: List[float] = None
    lat_history: List[float] = None
    
    def __post_init__(self):
        self.lon_history = [self.lon]
        self.lat_history = [self.lat]

    def update_position(self, new_lon: float, new_lat: float):
        if self.state == ParticleState.ACTIVE:
            self.lon = new_lon
            self.lat = new_lat
            self.lon_history.append(new_lon)
            self.lat_history.append(new_lat)
            
    def beach(self):
        self.state = ParticleState.BEACHED
        # Repeat the last position to keep history length consistent
        self.lon_history.append(self.lon)
        self.lat_history.append(self.lat)
        
    def reject(self):
        self.state = ParticleState.REJECTED
        self.lon_history.append(self.lon)
        self.lat_history.append(self.lat)
