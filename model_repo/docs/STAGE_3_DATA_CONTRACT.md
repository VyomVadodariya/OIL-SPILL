# Stage 3 Data Contract

The `SpillDetection` domain object guarantees a stable interface for downstream modules. 

## Distinctions

1. **Centroids**: Separated into `pixel_centroid` (row, col) and `geo_centroid` (longitude, latitude) to prevent ambiguous Tuple assumptions.
2. **Measurement Units**: All metrics explicitly specify units in the property name (e.g., `area_pixels`, `area_km2`, `major_axis_pixels`).
3. **Optional Physical Measurements**: If no geospatial resolution/metadata is available from the dataset, the `_km` or `_km2` properties are strictly enforced as `null` / `None`, and the `UncertaintyStatus` records the missing metadata status.
4. **GeoJSON Geometry**: Boundaries are passed using structured GeoJSON format.
5. **Separation of Confidence**:
   - `model_confidence`: Float representing the raw ML probability.
   - `segmentation_uncertainty`: Description of model readiness.
   - `geolocation_certainty`: Quality of the spatial metadata provided.
   - `attribution_confidence`: Assigned later by the AIS module.

## Example Usage
```python
detection = SpillDetection(
    pixel_centroid=PixelCentroid(row=49.5, col=49.5),
    geo_centroid=GeoCentroid(longitude=15.0, latitude=15.0),
    area_pixels=400,
    area_km2=0.04,
    source_scene_id="S1A_IW_GRDH_1SDV_20260909"
)
```
Downstream tools rely *only* on this contract.
