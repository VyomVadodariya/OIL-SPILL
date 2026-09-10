/**
 * OceanIntel — GeoJSON Adapter Utility
 *
 * Integrates with centralized DEMO_INCIDENT source of truth.
 * Location: Central Persian Gulf Offshore (26.15°N, 51.80°E)
 */

export {
  MAP_BOUNDS,
  svgPointToLonLat,
  parseSvgPathToLonLatPoints,
  DEMO_SPILL_GEOJSON,
  DEMO_DRIFT_GEOJSON,
  DEMO_LOOKALIKE_GEOJSON,
  DEMO_EXCLUSION_GEOJSON,
  buildAisTrackGeoJSON,
  buildVesselsGeoJSON,
  DEMO_INCIDENT,
  DEMO_CANDIDATES,
  DEMO_TIMELINE,
} from '../data/demo/incident';

export function toLonLat(lat: number, lon: number): [number, number] {
  return [lon, lat];
}
