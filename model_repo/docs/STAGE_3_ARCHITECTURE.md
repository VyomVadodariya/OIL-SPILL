# Stage 3 Architecture — Spill Intelligence & Characterization Engine

## Overview
Stage 3 bridges the gap between the raw Machine Learning model output (a binary segmentation mask) and the structured downstream intelligence components (Drift Engine, AIS Engine, Evidence Engine). 

Instead of passing ambiguous tensors directly to downstream services, the Characterization Engine explicitly post-processes the ML output and builds a strictly-typed `SpillDetection` object. 

## Workflow
1. **Raw ML Prediction**: Stage 2 ML segmentation pipeline produces a binary mask (`H x W`).
2. **Mask Postprocessing**: `process_mask()` removes tiny artifacts, performs morphological operations (configurable closing/opening), and applies size thresholding.
3. **Component Labeling**: `label_connected_components()` isolates distinct oil spill areas.
4. **Object Extraction**: `extract_spill_objects()` calculates shape geometries (area, perimeter, bounding box, compactness, elongation, major/minor axes).
5. **Geospatial Translation**: Bounding boxes and centroids are converted to geo-coordinates via affine transform logic in `pixel_to_geo()`. If resolution metadata exists, pixel measurements are translated to physical space (km²).
6. **Domain Packaging**: A `SpillDetection` domain object is initialized, wrapping all properties, physical bounds, source references, and provenance, ready to be ingested by the AIS/Drift components.

## Sub-Modules
- `src/characterization/schema.py`: Domain schema definition.
- `src/characterization/mask_processing.py`: Noise and artifact reduction.
- `src/characterization/object_extraction.py`: Geometric region property derivation.
- `src/characterization/geospatial.py`: Pixel-to-Geo scaling and transformations.
