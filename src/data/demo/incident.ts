/**
 * OceanIntel — Centralized Demonstration Incident Data Store
 *
 * SINGLE SOURCE OF TRUTH FOR THE DEMO INCIDENT
 *
 * All coordinates, geometry, candidates, drift envelopes, timeline events,
 * and environmental parameters MUST reference this module.
 *
 * Geographic Location: Central Persian Gulf Offshore (Open Water)
 * Approximate Centroid: Latitude 26.15°N, Longitude 51.80°E
 * (DMS: 26° 09′ 00″ N, 051° 48′ 00″ E)
 *
 * STATUS: DEMO MODE · SIMULATED DATA
 * Not real satellite observations or live AIS telemetry.
 */

import type { FeatureCollection, Polygon, LineString, Point } from 'geojson';

export interface IncidentCandidate {
  rank: number;
  id: string;
  mmsi: string;
  name: string;
  flag: string;
  flagName: string;
  type: string;
  dwt: string;
  status: 'highest-ranked' | 'under-review' | 'monitored' | 'cleared';
  lat: number;
  lon: number;
  heading: number;
  speed: number;
  lastAis: string;
  lastObs: string;
  distToCentroid: string;
  distToSpill: string;
  investigationScore: number;
  invScore: number;
  spatialScore: number;
  temporalScore: number;
  temporalComp: number;
  driftScore: number;
  headingScore: number;
  headingAtIncident: string;
  speedAtIncident: string;
  aisContinuity: 'low' | 'moderate' | 'high';
  aisGap: boolean;
  aisGapDuration?: string;
  aisGapWindow?: string;
  mapX: number;
  mapY: number;
  trackPath: string;
  gapTrackPath?: string;
  waypoints: { time: string; speed: number; x: number; y: number }[];
  evidenceItems: {
    text: string;
    weight: 'Strong' | 'Moderate' | 'Circumstantial';
    level: 'strong' | 'mod' | 'circ';
  }[];
}

export interface TimelineStep {
  time: string;
  label: string;
  subLabel?: string;
  color: string;
  pos: number; // percentage along track (0-100)
  stage: string;
}

export interface DemoIncidentData {
  id: string;
  name: string;
  region: string;
  status: 'active' | 'monitoring' | 'closed';
  isCurrent: boolean;
  openedDate: string;

  /* Geography */
  centroid: {
    lat: number;
    lon: number;
    dmsLat: string;
    dmsLon: string;
    text: string;
  };
  distanceToNearestCoast: {
    km: number;
    nm: number;
    coastlineName: string;
  };

  /* Detection & SAR */
  detection: {
    timestamp: string;
    sensor: string;
    mode: string;
    polarization: string;
    quality: string;
    confidence: number;
    areaKm2: number;
    volumeBbl: number;
    volumeM3: number;
    meanThicknessMm: number;
    elongationRatio: string;
    orientationAngle: string;
    classification: string;
  };

  /* Environmental Forcing */
  environment: {
    surfaceCurrent: {
      speedKn: number;
      directionDeg: number;
      directionCardinal: string;
      source: string;
    };
    wind: {
      speedKn: number;
      directionDeg: number;
      directionCardinal: string;
      source: string;
    };
    stokesWaveDriftKn: number;
    seaSurfaceTempC: number;
    seaStateBeaufort: string;
  };

  /* Candidates & Timeline */
  candidates: IncidentCandidate[];
  timeline: TimelineStep[];

  /* GeoJSON layers */
  geoJson: {
    spill: FeatureCollection<Polygon>;
    drift: FeatureCollection<Polygon>;
    lookalike: FeatureCollection<Polygon>;
    exclusion: FeatureCollection<Polygon>;
  };
}

/* ============================================================
   DEMO GEOMETRIES (Offshore Persian Gulf: 26.15°N, 51.80°E)
   Elongated along the NNW-SSE current drift axis, surrounded by water.
   ============================================================ */

const SPILL_POLYGON_COORDS: [number, number][] = [
  [51.7820, 26.1950],
  [51.8050, 26.2080],
  [51.8320, 26.2150],
  [51.8550, 26.1980],
  [51.8680, 26.1750],
  [51.8610, 26.1520],
  [51.8420, 26.1380],
  [51.8250, 26.1280],
  [51.8080, 26.1150],
  [51.7880, 26.1020],
  [51.7680, 26.0880],
  [51.7510, 26.0760],
  [51.7420, 26.0850],
  [51.7540, 26.1010],
  [51.7690, 26.1200],
  [51.7780, 26.1380],
  [51.7620, 26.1490],
  [51.7480, 26.1620],
  [51.7430, 26.1780],
  [51.7580, 26.1890],
  [51.7820, 26.1950],
];

const SHEEN_1_COORDS: [number, number][] = [
  [51.7350, 26.0680],
  [51.7480, 26.0740],
  [51.7520, 26.0610],
  [51.7380, 26.0540],
  [51.7350, 26.0680],
];

const SHEEN_2_COORDS: [number, number][] = [
  [51.8620, 26.2250],
  [51.8740, 26.2300],
  [51.8780, 26.2180],
  [51.8650, 26.2140],
  [51.8620, 26.2250],
];

export const DEMO_SPILL_GEOJSON: FeatureCollection<Polygon> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'spill-047-main',
        name: 'Detected Oil Signature — Core Plume (SPILL-2026-047)',
        areaKm2: 42.7,
        volumeBbl: 4820,
        classification: 'AI Classification: Heavy Crude Oil',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [SPILL_POLYGON_COORDS],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'spill-047-sheen-1',
        name: 'Trailing Oil Sheen Streak',
        areaKm2: 4.1,
        volumeBbl: 180,
        classification: 'AI Classification: Thin Surface Sheen',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [SHEEN_1_COORDS],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'spill-047-sheen-2',
        name: 'Detached Surface Slick Droplet',
        areaKm2: 1.8,
        volumeBbl: 90,
        classification: 'AI Classification: Surface Sheen',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [SHEEN_2_COORDS],
      },
    },
  ],
};

export const DEMO_DRIFT_GEOJSON: FeatureCollection<Polygon> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'drift-backward',
        type: 'backward',
        label: 'Modelled Source Corridor (Backward Drift Hindcast)',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [51.840, 26.180],
            [51.880, 26.240],
            [51.940, 26.310],
            [52.020, 26.370],
            [52.070, 26.340],
            [51.990, 26.270],
            [51.910, 26.200],
            [51.840, 26.180],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'drift-forward',
        type: 'forward',
        label: '72h Potential Coastal Exposure Corridor (Forward Drift Forecast)',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [51.765, 26.090],
            [51.730, 26.040],
            [51.680, 25.980],
            [51.630, 25.920],
            [51.580, 25.900],
            [51.620, 25.960],
            [51.680, 26.030],
            [51.745, 26.100],
            [51.765, 26.090],
          ],
        ],
      },
    },
  ],
};

export const DEMO_LOOKALIKE_GEOJSON: FeatureCollection<Polygon> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'lookalike-1',
        label: 'Biogenic Film Anomaly (Natural Look-alike)',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [51.45, 26.26],
            [51.51, 26.24],
            [51.54, 26.29],
            [51.47, 26.31],
            [51.45, 26.26],
          ],
        ],
      },
    },
  ],
};

export const DEMO_EXCLUSION_GEOJSON: FeatureCollection<Polygon> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'exclusion-zone',
        label: 'Maritime Environmental Protection Sector',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [51.30, 25.70],
            [52.30, 25.70],
            [52.30, 26.60],
            [51.30, 26.60],
            [51.30, 25.70],
          ],
        ],
      },
    },
  ],
};

/* ============================================================
   CANDIDATE VESSELS
   ============================================================ */

export const DEMO_CANDIDATES: IncidentCandidate[] = [
  {
    rank: 1,
    id: 'harbor-pioneer',
    mmsi: '538009842',
    name: 'HARBOR PIONEER',
    flag: 'MH',
    flagName: 'Marshall Islands',
    type: 'Oil Tanker',
    dwt: '38,400 DWT',
    status: 'highest-ranked',
    lat: 26.15,
    lon: 51.80,
    heading: 142,
    speed: 0.2,
    lastAis: '2026-09-07 14:22 UTC',
    lastObs: '2026-09-07 14:22 UTC',
    distToCentroid: '0.8 NM (1.5 km)',
    distToSpill: '0.8 NM (1.5 km)',
    investigationScore: 87,
    invScore: 87,
    spatialScore: 88,
    temporalScore: 92,
    temporalComp: 92,
    driftScore: 82,
    headingScore: 86,
    headingAtIncident: '142° (SE)',
    speedAtIncident: '0.2 knots',
    aisContinuity: 'low',
    aisGap: true,
    aisGapDuration: '4h 08m',
    aisGapWindow: '2026-09-07 10:14 UTC – 14:22 UTC',
    mapX: 736,
    mapY: 415,
    trackPath: 'M 880,345 C 855,352 830,362 800,369 C 778,375 760,386 757,394 L 747,406 L 736,415',
    gapTrackPath: 'M 747,406 C 730,412 700,420 684,390',
    waypoints: [
      { time: '08:00Z', speed: 12.4, x: 880, y: 345 },
      { time: '09:00Z', speed: 11.8, x: 830, y: 362 },
      { time: '10:00Z', speed: 4.2,  x: 778, y: 375 },
      { time: '10:14Z', speed: 0.5,  x: 747, y: 406 },
      { time: '14:22Z', speed: 0.2,  x: 736, y: 415 },
    ],
    evidenceItems: [
      {
        text: 'SAR detection window coincides with 4h 08m AIS observation gap period.',
        weight: 'Strong',
        level: 'strong',
      },
      {
        text: 'Reconstructed vessel trajectory directly intersects modelled backward drift source corridor.',
        weight: 'Strong',
        level: 'strong',
      },
      {
        text: 'Vessel heading 142° (SE) aligns with the observed oil plume elongation axis.',
        weight: 'Moderate',
        level: 'mod',
      },
      {
        text: 'Draft variation recorded prior to transit indicates crude cargo operations.',
        weight: 'Moderate',
        level: 'mod',
      },
      {
        text: 'Transited identical route sector on two occasions within preceding 30 days.',
        weight: 'Circumstantial',
        level: 'circ',
      },
    ],
  },
  {
    rank: 2,
    id: 'delta-star',
    mmsi: '636019241',
    name: 'DELTA STAR',
    flag: 'LR',
    flagName: 'Liberia',
    type: 'Oil Tanker',
    dwt: '44,100 DWT',
    status: 'under-review',
    lat: 26.22,
    lon: 51.68,
    heading: 180,
    speed: 0.0,
    lastAis: '2026-09-07 17:45 UTC',
    lastObs: '2026-09-07 17:45 UTC',
    distToCentroid: '2.4 NM (4.4 km)',
    distToSpill: '2.4 NM (4.4 km)',
    investigationScore: 62,
    invScore: 62,
    spatialScore: 74,
    temporalScore: 55,
    temporalComp: 55,
    driftScore: 60,
    headingScore: 58,
    headingAtIncident: '180° (S)',
    speedAtIncident: '0.0 knots (Anchored)',
    aisContinuity: 'moderate',
    aisGap: false,
    mapX: 693,
    mapY: 406,
    trackPath: 'M 747,308 C 735,328 721,348 721,354 C 718,362 715,374 715,385 L 693,406',
    waypoints: [
      { time: '12:00Z', speed: 10.1, x: 747, y: 308 },
      { time: '14:00Z', speed: 8.5,  x: 721, y: 354 },
      { time: '16:00Z', speed: 2.1,  x: 715, y: 385 },
      { time: '17:45Z', speed: 0.0,  x: 693, y: 406 },
    ],
    evidenceItems: [
      {
        text: 'Stationary anchorage observed within 2.4 NM of detection centroid 12h prior to SAR pass.',
        weight: 'Moderate',
        level: 'mod',
      },
      {
        text: 'Maintained continuous AIS telemetry transmissions throughout incident window.',
        weight: 'Moderate',
        level: 'mod',
      },
      {
        text: 'Trajectory does not cross the core backward drift origin corridor.',
        weight: 'Circumstantial',
        level: 'circ',
      },
    ],
  },
  {
    rank: 3,
    id: 'pacific-endeavor',
    mmsi: '477213650',
    name: 'PACIFIC ENDEAVOR',
    flag: 'HK',
    flagName: 'Hong Kong',
    type: 'Chemical Tanker',
    dwt: '22,500 DWT',
    status: 'monitored',
    lat: 26.08,
    lon: 51.92,
    heading: 248,
    speed: 4.1,
    lastAis: '2026-09-07 18:02 UTC',
    lastObs: '2026-09-07 18:02 UTC',
    distToCentroid: '6.1 NM (11.3 km)',
    distToSpill: '6.1 NM (11.3 km)',
    investigationScore: 34,
    invScore: 34,
    spatialScore: 48,
    temporalScore: 28,
    temporalComp: 28,
    driftScore: 25,
    headingScore: 35,
    headingAtIncident: '248° (WSW)',
    speedAtIncident: '4.1 knots',
    aisContinuity: 'high',
    aisGap: false,
    mapX: 661,
    mapY: 434,
    trackPath: 'M 725,400 L 683,415 L 661,434',
    waypoints: [
      { time: '14:00Z', speed: 14.2, x: 725, y: 400 },
      { time: '16:00Z', speed: 8.4,  x: 683, y: 415 },
      { time: '18:02Z', speed: 4.1,  x: 661, y: 434 },
    ],
    evidenceItems: [
      {
        text: 'Transited outer periphery of source corridor 4 hours prior to detection.',
        weight: 'Moderate',
        level: 'mod',
      },
      {
        text: 'Declared cargo: refined chemical solvent (differs from observed crude signature).',
        weight: 'Circumstantial',
        level: 'circ',
      },
    ],
  },
  {
    rank: 4,
    id: 'norse-carrier',
    mmsi: '304010417',
    name: 'NORSE CARRIER',
    flag: 'AG',
    flagName: 'Antigua & Barbuda',
    type: 'Bulk Carrier',
    dwt: '56,200 DWT',
    status: 'monitored',
    lat: 26.02,
    lon: 51.72,
    heading: 45,
    speed: 6.3,
    lastAis: '2026-09-07 18:05 UTC',
    lastObs: '2026-09-07 18:05 UTC',
    distToCentroid: '9.4 NM (17.4 km)',
    distToSpill: '9.4 NM (17.4 km)',
    investigationScore: 18,
    invScore: 18,
    spatialScore: 22,
    temporalScore: 15,
    temporalComp: 15,
    driftScore: 18,
    headingScore: 17,
    headingAtIncident: '045° (NE)',
    speedAtIncident: '6.3 knots',
    aisContinuity: 'high',
    aisGap: false,
    mapX: 629,
    mapY: 460,
    trackPath: 'M 587,477 L 619,462 L 629,460',
    waypoints: [
      { time: '15:00Z', speed: 12.1, x: 587, y: 477 },
      { time: '17:00Z', speed: 9.8,  x: 619, y: 462 },
      { time: '18:05Z', speed: 6.3,  x: 629, y: 460 },
    ],
    evidenceItems: [
      {
        text: 'Bulk dry cargo vessel transiting shipping lane; unladen for liquid hydrocarbons.',
        weight: 'Circumstantial',
        level: 'circ',
      },
      {
        text: 'Continuous telemetry maintained without anomalies.',
        weight: 'Circumstantial',
        level: 'circ',
      },
    ],
  },
  {
    rank: 5,
    id: 'ocean-scout',
    mmsi: '229109000',
    name: 'OCEAN SCOUT',
    flag: 'MT',
    flagName: 'Malta',
    type: 'Patrol Vessel',
    dwt: '—',
    status: 'cleared',
    lat: 26.25,
    lon: 51.85,
    heading: 310,
    speed: 8.7,
    lastAis: '2026-09-07 18:15 UTC',
    lastObs: '2026-09-07 18:15 UTC',
    distToCentroid: '4.2 NM (7.8 km)',
    distToSpill: '4.2 NM (7.8 km)',
    investigationScore: 5,
    invScore: 5,
    spatialScore: 8,
    temporalScore: 4,
    temporalComp: 4,
    driftScore: 3,
    headingScore: 5,
    headingAtIncident: '310° (NW)',
    speedAtIncident: '8.7 knots',
    aisContinuity: 'high',
    aisGap: false,
    mapX: 757,
    mapY: 397,
    trackPath: 'M 853,369 C 822,376 792,383 789,385 L 757,397',
    waypoints: [
      { time: '16:00Z', speed: 16.5, x: 853, y: 369 },
      { time: '17:00Z', speed: 12.0, x: 792, y: 383 },
      { time: '18:15Z', speed: 8.7,  x: 757, y: 397 },
    ],
    evidenceItems: [
      {
        text: 'Designated maritime environmental patrol unit conducting response surveillance.',
        weight: 'Circumstantial',
        level: 'circ',
      },
      {
        text: 'Cleared as non-source response asset.',
        weight: 'Circumstantial',
        level: 'circ',
      },
    ],
  },
];

/* ============================================================
   CHRONOLOGICAL INVESTIGATION TIMELINE
   ============================================================ */

export const DEMO_TIMELINE: TimelineStep[] = [
  {
    time: 'T−72H',
    stage: 'Regional Ingress',
    label: 'Candidate ingress to Arabian Gulf transit corridor',
    color: '#00b4d8',
    pos: 8,
  },
  {
    time: 'T−48H',
    stage: 'Corridor Approach',
    label: 'HARBOR PIONEER track approaches source corridor',
    color: '#3b82f6',
    pos: 24,
  },
  {
    time: 'T−0',
    stage: 'SAR Detection',
    label: 'Sentinel-1A pass detects 42.7 km² hydrocarbon anomaly',
    color: '#f97316',
    pos: 44,
  },
  {
    time: 'T+6H',
    stage: 'Drift Modelling',
    label: 'Hydrodynamic backtracking establishes origin window',
    color: '#06b6d4',
    pos: 62,
  },
  {
    time: 'T+12H',
    stage: 'Evidence Fusion',
    label: 'AIS gap correlation ranks HARBOR PIONEER (#1 Score 87)',
    color: '#e5a020',
    pos: 80,
  },
  {
    time: 'NOW',
    stage: 'Active Case',
    label: 'Active decision-support investigation ongoing',
    color: '#10b981',
    pos: 96,
  },
];

/* ============================================================
   DEMO INCIDENT OBJECT (SINGLE SOURCE OF TRUTH)
   ============================================================ */

export const DEMO_INCIDENT: DemoIncidentData = {
  id: 'INC-2026-047',
  name: 'Arabian Gulf — SPILL-2026-047',
  region: 'Central Persian Gulf (Offshore Sector)',
  status: 'active',
  isCurrent: true,
  openedDate: '2026-09-07',

  centroid: {
    lat: 26.15,
    lon: 51.80,
    dmsLat: '26° 09′ 00″ N',
    dmsLon: '051° 48′ 00″ E',
    text: '26°09′N · 051°48′E',
  },

  distanceToNearestCoast: {
    km: 22.4,
    nm: 12.1,
    coastlineName: 'Qatar Northeast Offshore Baseline (Ras Laffan)',
  },

  detection: {
    timestamp: '2026-09-07 06:12:04 UTC',
    sensor: 'Sentinel-1A C-SAR',
    mode: 'Interferometric Wide (IW)',
    polarization: 'VV',
    quality: 'HIGH · SAR',
    confidence: 92,
    areaKm2: 42.7,
    volumeBbl: 4820,
    volumeM3: 766,
    meanThicknessMm: 0.11,
    elongationRatio: '2.8 : 1',
    orientationAngle: 'N 18° W (342°)',
    classification: 'Heavy Crude Oil Anomaly',
  },

  environment: {
    surfaceCurrent: {
      speedKn: 1.4,
      directionDeg: 148,
      directionCardinal: 'SSE',
      source: 'Copernicus Marine (CMEMS MED/GULF)',
    },
    wind: {
      speedKn: 14.2,
      directionDeg: 328,
      directionCardinal: 'NNW',
      source: 'ECMWF ERA5 Reanalysis',
    },
    stokesWaveDriftKn: 0.3,
    seaSurfaceTempC: 31.4,
    seaStateBeaufort: 'Beaufort 3 (Gentle Breeze, 0.6m swell)',
  },

  candidates: DEMO_CANDIDATES,
  timeline: DEMO_TIMELINE,

  geoJson: {
    spill: DEMO_SPILL_GEOJSON,
    drift: DEMO_DRIFT_GEOJSON,
    lookalike: DEMO_LOOKALIKE_GEOJSON,
    exclusion: DEMO_EXCLUSION_GEOJSON,
  },
};

/* Convert SVG pixel coordinates (x, y) to geographic coordinates [lon, lat] */
export const MAP_BOUNDS = {
  lonMin: 50.3,
  lonMax: 53.3,
  latMin: 24.65,
  latMax: 27.65,
  vw: 1600,
  vh: 800,
};

export function svgPointToLonLat(x: number, y: number): [number, number] {
  const lon = MAP_BOUNDS.lonMin + (x / MAP_BOUNDS.vw) * (MAP_BOUNDS.lonMax - MAP_BOUNDS.lonMin);
  const lat = MAP_BOUNDS.latMax - (y / MAP_BOUNDS.vh) * (MAP_BOUNDS.latMax - MAP_BOUNDS.latMin);
  return [Number(lon.toFixed(5)), Number(lat.toFixed(5))];
}

export function parseSvgPathToLonLatPoints(pathStr: string): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  const pairRegex = /([0-9.]+)[,\s]+([0-9.]+)/g;
  let match: RegExpExecArray | null;

  while ((match = pairRegex.exec(pathStr)) !== null) {
    const x = parseFloat(match[1]);
    const y = parseFloat(match[2]);
    if (!isNaN(x) && !isNaN(y)) {
      points.push(svgPointToLonLat(x, y));
    }
  }

  return points;
}

export function buildAisTrackGeoJSON(
  vessels: Array<{ id: string; name: string; trackPath: string }>
): FeatureCollection<LineString> {
  return {
    type: 'FeatureCollection',
    features: vessels.map((v) => ({
      type: 'Feature',
      properties: {
        vesselId: v.id,
        vesselName: v.name,
      },
      geometry: {
        type: 'LineString',
        coordinates: parseSvgPathToLonLatPoints(v.trackPath),
      },
    })),
  };
}

export function buildVesselsGeoJSON(
  vessels: Array<{
    id: string;
    name: string;
    status: string;
    lat: number;
    lon: number;
    heading: number;
    speed: number;
    mmsi: string;
    aisGap?: boolean;
    aisGapDuration?: string;
    investigationScore?: number;
  }>
): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: vessels.map((v) => ({
      type: 'Feature',
      properties: {
        id: v.id,
        name: v.name,
        status: v.status,
        heading: v.heading,
        speed: v.speed,
        mmsi: v.mmsi,
        aisGap: v.aisGap ?? false,
        aisGapDuration: v.aisGapDuration ?? '',
        investigationScore: v.investigationScore ?? 0,
      },
      geometry: {
        type: 'Point',
        coordinates: [v.lon, v.lat],
      },
    })),
  };
}
