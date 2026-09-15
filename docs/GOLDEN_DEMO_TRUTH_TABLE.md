# OceanIntel — Golden Demo Truth Table

This document defines the exact reality constraints of the SIH Golden Demo. It specifies what is real, what is synthetic, and how provenance is verified.

| Component | Status | Description & Provenance |
| :--- | :--- | :--- |
| **SAR Imagery** | **REAL** | Sentinel-1 SAR acquisition (`20191015.tif`). Hash verified in `result.json`. |
| **Model Architecture** | **REAL** | PyTorch ResNet-34 U-Net loaded dynamically at runtime. |
| **Model Weights** | **REAL** | Trained weights loaded from `best_model.pth`. Provenance guaranteed via SHA256 hashing. |
| **Inference Execution** | **REAL** | Segmentation runs live on GPU/CPU to produce `20191015_mask.tif`. |
| **Spill Characterization**| **REAL** | Geometry, area, and centroid dynamically extracted from inference mask via `rasterio`/`shapely`. |
| **Drift Forcing** | **SYNTHETIC**| Constant deterministic forcing vectors loaded from JSON fixture. |
| **Drift Simulation** | **REAL** | Particle physics engine executes live using forcing data and spill geometry. |
| **AIS Telemetry** | **SYNTHETIC**| Deterministic dummy trajectories (`DEMO_VESSEL_001`, etc.) generated before investigation. |
| **Evidence Engine** | **REAL** | Candidates are ranked dynamically based on spatial/temporal intersection. No predefined winners. |
| **Frontend Presentation** | **REAL** | UI consumes `result.json` output exclusively. All static mock data removed. |

### Provenance Tracking
The pipeline computes SHA256 hashes of all foundational inputs (SAR, model, mask, AIS, forcing) and embeds them into `result.json` along with generation timestamps. This guarantees the results rendered by the UI are strictly the product of the recorded inputs.
