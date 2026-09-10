import numpy as np
from datetime import datetime, timedelta
from typing import List, Tuple, Optional, Dict, Any
from shapely.geometry import shape, Point
import random

from src.drift.schema import DriftModelParameters, ParticleState
from src.drift.environment import BaseEnvironmentalAdapter
from src.drift.particle import Particle
from src.drift.physics import step_geographic, calculate_kinematic_transport

class DriftSimulation:
    def __init__(
        self,
        environment: BaseEnvironmentalAdapter,
        parameters: DriftModelParameters,
        random_seed: Optional[int] = None
    ):
        self.env = environment
        self.params = parameters
        if random_seed is not None:
            np.random.seed(random_seed)
            random.seed(random_seed)
            
    def _sample_windage(self) -> float:
        min_w, max_w = self.params.windage_range
        return np.random.uniform(min_w, max_w)
        
    def _sample_diffusion(self) -> Tuple[float, float]:
        # Random walk scaled by diffusion coefficient
        diff_scale = self.params.diffusion_coef_m2_s
        # VERY simplified approximation for diffusion velocity perturbation
        # Real models use stochastic random walk scaled by sqrt(2*D/dt)
        # Here we just inject random velocity perturbations directly for MVP
        u_diff = np.random.normal(0, diff_scale)
        v_diff = np.random.normal(0, diff_scale)
        return u_diff, v_diff
        
    def initialize_particles(self, num_particles: int, geometry: Optional[Dict[str, Any]] = None, fallback_lon: float = 0.0, fallback_lat: float = 0.0) -> List[Particle]:
        """
        Initialize particles strictly inside the provided GeoJSON geometry.
        If geometry is invalid or missing, it returns an empty list (which triggers INVALID_INPUT upstream).
        """
        particles = []
        
        if not geometry or "type" not in geometry or "coordinates" not in geometry:
            return particles # Return empty to signal INVALID_INPUT
            
        try:
            geom_shape = shape(geometry)
            if not geom_shape.is_valid or geom_shape.area == 0:
                return particles
                
            min_lon, min_lat, max_lon, max_lat = geom_shape.bounds
            
            # Rejection sampling: randomly sample in bbox until inside polygon
            attempts = 0
            max_attempts = num_particles * 100
            
            while len(particles) < num_particles and attempts < max_attempts:
                lon = np.random.uniform(min_lon, max_lon)
                lat = np.random.uniform(min_lat, max_lat)
                pt = Point(lon, lat)
                if geom_shape.contains(pt):
                    windage = self._sample_windage()
                    particles.append(Particle(id=len(particles), lon=lon, lat=lat, windage=windage))
                attempts += 1
                
        except Exception:
            return []
            
        return particles

    def run_simulation(
        self, 
        particles: List[Particle], 
        start_time: datetime, 
        duration_hours: float, 
        is_backward: bool = False
    ) -> bool:
        """
        Runs the simulation loop. 
        If is_backward is True, time steps backwards and velocities are inverted.
        """
        dt = self.params.timestep_seconds
        direction = -1 if is_backward else 1
        
        num_steps = int((duration_hours * 3600) / dt)
        current_time = start_time
        
        for step in range(num_steps):
            for p in particles:
                if p.state != ParticleState.ACTIVE:
                    if p.state == ParticleState.BEACHED:
                        p.beach() # push history
                    elif p.state == ParticleState.REJECTED:
                        p.reject() # push history
                    continue
                    
                # Query environment at current historical time
                c_vel = self.env.get_current(p.lon, p.lat, current_time)
                w_vel = self.env.get_wind(p.lon, p.lat, current_time)
                
                if c_vel is None or w_vel is None:
                    # Missing data bounds exceeded
                    p.reject()
                    continue
                    
                u_c, v_c = c_vel
                u_w, v_w = w_vel
                
                # Inverse velocity if backtracking
                if is_backward:
                    u_c, v_c = -u_c, -v_c
                    u_w, v_w = -u_w, -v_w
                    
                u_diff, v_diff = self._sample_diffusion()
                
                u_tot, v_tot = calculate_kinematic_transport(u_c, v_c, u_w, v_w, p.windage, u_diff, v_diff)
                
                new_lon, new_lat = step_geographic(p.lon, p.lat, u_tot, v_tot, dt)
                
                if self.env.is_land(new_lon, new_lat):
                    p.beach()
                else:
                    p.update_position(new_lon, new_lat)
                    
            current_time += timedelta(seconds=(dt * direction))
            
        return True
