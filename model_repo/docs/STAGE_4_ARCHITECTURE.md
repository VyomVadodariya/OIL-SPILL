# Stage 4 Architecture — Drift / Source-Corridor Engine

## Overview
Stage 4 ingests a Stage 3 `SpillDetection` object and simulates the trajectory of the oil spill using a Lagrangian particle-tracking model. It produces a strongly typed `DriftResult` representing forward trajectories (impact corridors) or backward trajectories (source corridors).

## Core Components
1. **Particle Initialization**: Particles are instantiated strictly inside the actual spatial boundary of the `SpillDetection` multi-polygon via rejection sampling. Centroid bounding boxes are purely used as spatial acceleration structures.
2. **Environmental Adapters (`src/drift/environment.py`)**: Strict separation of `get_current()` and `get_wind()` allows dynamic windage analysis. Synthetic time-varying fixtures are used for validation.
3. **Kinematic Physics (`src/drift/physics.py` & `integration.py`)**: 
   - Transport Equation: $\vec{v} = \vec{U}_{current} + \alpha \vec{U}_{wind} + \vec{U}_{diffusion}$
   - Forward Euler step integrated with Haversine-based metric-to-geographic conversions. Numerical uncertainty calculations internally operate in local planar metric space (meters).
4. **Particle State Machine (`src/drift/particle.py`)**: Particles hold explicit `ACTIVE`, `BEACHED`, or `REJECTED` states. Land boundaries transition particles to `BEACHED`. Missing data outside the environmental grid transitions particles to `REJECTED`.
5. **Simulation Engine (`src/drift/simulation.py`)**: Maintains the ensemble. Backtracking explicitly queries historical environmental fields at each historical timestep ($T-\Delta t, T-2\Delta t, \dots$).
6. **Uncertainty & Ensembles (`src/drift/uncertainty.py`)**: Particles are dispersed using diffusion. Covariance (spatial dispersion matrix) is computed strictly in metric space (meters squared) relative to the local centroid.
7. **Corridor Geometry (`src/drift/corridor.py`)**: Generates density polygons via 2D histogram thresholding to encapsulate the primary particle concentrations, ignoring extremely sparse outliers.

## Limitations
- **Prototype Status**: This is an MVP decision-support drift model, NOT an operational oceanographic model.
- **Backtracking Approximation**: Backtracking produces a plausible source corridor based on historical forcing; it is NOT an exact inverse source solver and cannot definitively prove a single exact point origin.
- **No Weathering**: Emulsification and evaporation physics are excluded.
