/**
 * OceanIntel — Maritime Map SVG Component
 *
 * Pure SVG maritime chart for the Command Center.
 * All coordinates are pre-computed from lat/lon using:
 *   ViewBox: 0 0 1600 800
 *   Lon range: 50.8°E – 53.8°E  (3.0°)
 *   Lat range: 27.2°N – 29.8°N  (2.6°)
 *
 *   x = (lon - 50.8) / 3.0 * 1600
 *   y = (29.8 - lat) / 2.6 * 800
 *
 * Region: Central Persian Gulf — Iranian coast (N) / Arabian Peninsula (S)
 * All data is simulated for UI demonstration purposes.
 */

import React from 'react';
import { useMapPanZoom } from '../../hooks/useMapPanZoom';
import { MapControls } from '../../components/map/MapControls';

export const VW = 1600;
export const VH = 800;

const BOUNDS = { lonMin: 50.3, lonMax: 53.3, latMin: 24.65, latMax: 27.65 };

/** Convert geographic coordinates to SVG viewport coordinates. */
export function toSVG(lat: number, lon: number): [number, number] {
  const x = (lon - BOUNDS.lonMin) / (BOUNDS.lonMax - BOUNDS.lonMin) * VW;
  const y = (BOUNDS.latMax - lat) / (BOUNDS.latMax - BOUNDS.latMin) * VH;
  return [Math.round(x), Math.round(y)];
}

/* Graticule intervals */
const GRID_LONS = [51, 51.5, 52, 52.5, 53, 53.5];
const GRID_LATS = [27.5, 28, 28.5, 29, 29.5];

export type VesselStatus = 'highest-ranked' | 'under-review' | 'monitored' | 'cleared';

export interface VesselMark {
  id: string;
  name: string;
  status: VesselStatus;
  lat: number;
  lon: number;
  heading: number;
  speed: number;
  aisGap: boolean;
  trackPath: string;
}

interface MaritimeMapProps {
  vessels: VesselMark[];
  selectedId: string | null;
  activeLayers: Set<string>;
  onVesselClick: (id: string) => void;
  onVesselEnter: (id: string, clientX: number, clientY: number) => void;
  onVesselLeave: () => void;
}

const vesselColor = (status: VesselStatus) =>
  status === 'highest-ranked' || status === 'under-review' ? '#e8423a' :
  status === 'monitored' ? '#e5a020' : '#2ece7a';

export const MaritimeMap: React.FC<MaritimeMapProps> = ({
  vessels,
  selectedId,
  activeLayers,
  onVesselClick,
  onVesselEnter,
  onVesselLeave,
}) => {
  const { zoom, pan, zoomIn, zoomOut, resetView, bindContainerProps } = useMapPanZoom();

  return (
    <div {...bindContainerProps}>
      <MapControls zoom={zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetView} />
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        preserveAspectRatio="xMidYMid slice"
        style={{ display: 'block', width: '100%', height: '100%' }}
        aria-label="Maritime intelligence map — Persian Gulf, simulated operational data"
        role="img"
      >
        <defs>
      {/* Ocean depth gradient (Light hydrographic maritime chart) */}
      <linearGradient id="oceanGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#e0f2fe" />
        <stop offset="55%"  stopColor="#dbeafe" />
        <stop offset="100%" stopColor="#e2e8f0" />
      </linearGradient>

      {/* Oil spill radial fill */}
      <radialGradient id="spillFill" cx="50%" cy="42%" r="62%">
        <stop offset="0%"   stopColor="rgba(234,88,12,0.85)" />
        <stop offset="52%"  stopColor="rgba(234,88,12,0.65)" />
        <stop offset="100%" stopColor="rgba(234,88,12,0.25)" />
      </radialGradient>

      {/* Drift corridor linear gradient (opaque near source, fade away) */}
      <linearGradient id="driftCorrGrad" x1="0.5" y1="1" x2="0.5" y2="0">
        <stop offset="0%"   stopColor="rgba(13,148,136,0.55)" />
        <stop offset="75%"  stopColor="rgba(13,148,136,0.15)" />
        <stop offset="100%" stopColor="rgba(13,148,136,0.00)" />
      </linearGradient>

      {/* Spill outer glow */}
      <filter id="spillGlow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>

      {/* Clip to viewport */}
      <clipPath id="mapClip">
        <rect width={VW} height={VH} />
      </clipPath>
    </defs>

    <g clipPath="url(#mapClip)" transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>

      {/* ================================================================
          1. OCEAN BACKGROUND
          ================================================================ */}
      <rect width={VW} height={VH} fill="url(#oceanGrad)" />

      {/* ================================================================
          2. BATHYMETRIC DEPTH CONTOURS
          Very subtle concentric ovals suggesting seafloor topography.
          ================================================================ */}
      <g opacity="0.30" stroke="#93c5fd" fill="none" strokeWidth="1">
        <ellipse cx={730} cy={490} rx={530} ry={195} />
        <ellipse cx={720} cy={475} rx={400} ry={145} />
        <ellipse cx={710} cy={460} rx={275} ry={95}  />
        <ellipse cx={700} cy={448} rx={160} ry={55}  />
      </g>

      {/* ================================================================
          3. GRATICULE GRID
          ================================================================ */}
      {GRID_LONS.map(lon => {
        const [x] = toSVG(28, lon);
        return <line key={`glon-${lon}`} x1={x} y1={0} x2={x} y2={VH}
                     stroke="rgba(15,23,42,0.07)" strokeWidth="1" />;
      })}
      {GRID_LATS.map(lat => {
        const [, y] = toSVG(lat, 52);
        return <line key={`glat-${lat}`} x1={0} y1={y} x2={VW} y2={y}
                     stroke="rgba(15,23,42,0.07)" strokeWidth="1" />;
      })}

      {/* ================================================================
          4. NORTHERN LAND MASS — Iranian coast
             Points cross-referenced to actual Gulf coastline shape.
          ================================================================ */}
      <path
        d={`M 0,0 L ${VW},0 L ${VW},292
          C 1490,274 1380,252 1260,232
          C 1140,212 1050,196 940,178
          C 840,162 748,146 630,126
          C 512,106 390,88 260,68
          C 158,52 70,30 0,14
          Z`}
        fill="#e2e8f0"
      />
      {/* Coastline edge — crisp slate boundary */}
      <path
        d={`M 0,14
          C 70,30 158,52 260,68
          C 390,88 512,106 630,126
          C 748,146 840,162 940,178
          C 1050,196 1140,212 1260,232
          C 1380,252 1490,274 ${VW},292`}
        fill="none" stroke="#94a3b8" strokeWidth="1.5"
      />
      {/* Inland terrain texture */}
      <path
        d={`M 0,0 L ${VW},0 L ${VW},240
          C 1490,222 1380,200 1260,180
          C 1140,160 1050,144 940,126
          C 840,110 748,94 630,74
          C 512,54 390,36 260,18
          L 0,4
          Z`}
        fill="rgba(15,23,42,0.02)"
      />

      {/* ================================================================
          5. SOUTHERN LAND MASS — Arabian Peninsula
          ================================================================ */}
      <path
        d={`M 0,${VH} L ${VW},${VH} L ${VW},523
          C 1485,535 1365,548 1245,562
          C 1105,576 985,590 865,604
          C 745,618 620,630 500,640
          C 375,650 255,660 155,668
          C 90,673 38,706 0,768
          Z`}
        fill="#e2e8f0"
      />
      {/* Coastline edge */}
      <path
        d={`M 0,768
          C 38,706 90,673 155,668
          C 255,660 375,650 500,640
          C 620,630 745,618 865,604
          C 985,590 1105,576 1245,562
          C 1365,548 1485,535 ${VW},523`}
        fill="none" stroke="#94a3b8" strokeWidth="1.5"
      />

      {/* ================================================================
          6. ISLANDS
          Small ellipses at approximate positions of Persian Gulf islands.
          ================================================================ */}
      {/* Island 1 — Farsi-like, NW */}
      <ellipse cx={295} cy={370} rx={19} ry={11}
               fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1"
               transform="rotate(-12,295,370)" />
      {/* Island 2 — central-east */}
      <ellipse cx={1040} cy={520} rx={13} ry={7}
               fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1"
               transform="rotate(6,1040,520)" />

      {/* ================================================================
          7. PLACE LABELS
          ================================================================ */}
      <text x={770} y={188} textAnchor="middle" fontSize="11"
            fill="#64748b" fontFamily="Inter,sans-serif"
            letterSpacing="5" fontWeight="600">IRAN</text>
      <text x={435} y={672} textAnchor="middle" fontSize="10"
            fill="#64748b" fontFamily="Inter,sans-serif"
            letterSpacing="2" fontWeight="600">ARABIAN PENINSULA</text>
      <text x={730} y={450} textAnchor="middle" fontSize="13"
            fill="#0369a1" fontFamily="Inter,sans-serif"
            letterSpacing="8" fontStyle="italic" fontWeight="600" opacity="0.4">PERSIAN GULF</text>

      {/* ================================================================
          8. GRATICULE LABELS
          ================================================================ */}
      {GRID_LONS.map(lon => {
        const [x] = toSVG(28, lon);
        return (
          <text key={`ll-${lon}`} x={x} y={VH - 9} textAnchor="middle"
                fontSize="9" fill="#64748b"
                fontFamily="JetBrains Mono,Fira Code,monospace">
            {lon}°E
          </text>
        );
      })}
      {GRID_LATS.map(lat => {
        const [, y] = toSVG(lat, 52);
        return (
          <text key={`ll2-${lat}`} x={10} y={y + 4}
                fontSize="9" fill="#64748b"
                fontFamily="JetBrains Mono,Fira Code,monospace">
            {lat}°N
          </text>
        );
      })}

      {/* ================================================================
          9. ENVIRONMENTAL / IMPACT ZONE — near Iranian coast
          Represents potential shoreline contamination impact area.
          ================================================================ */}
      {activeLayers.has('env') && (
        <g>
          <path
            d="M 565,192 C 648,168 750,158 838,170 C 896,178 940,204 952,244
               C 930,256 888,262 830,262 C 748,262 648,248 565,228 Z"
            fill="rgba(229,160,32,0.055)"
            stroke="rgba(229,160,32,0.30)"
            strokeWidth="1"
            strokeDasharray="5,4"
          />
          <text x={758} y={236} textAnchor="middle" fontSize="9"
                fill="rgba(229,160,32,0.48)" fontFamily="Inter,sans-serif"
                letterSpacing="1.5">IMPACT PROJECTION ZONE</text>
        </g>
      )}

      {/* ================================================================
          10. EXCLUSION ZONE — 2nm radius around spill centroid
          ================================================================ */}
      {activeLayers.has('exclusion') && (
        <g>
          <circle cx={736} cy={415} r={128}
                  fill="rgba(229,160,32,0.038)"
                  stroke="rgba(229,160,32,0.42)"
                  strokeWidth="1"
                  strokeDasharray="7,5" />
          <text x={875} y={418} fontSize="9"
                fill="rgba(229,160,32,0.52)" fontFamily="Inter,sans-serif"
                letterSpacing="1.5">2 NM EXCL.</text>
        </g>
      )}

      {/* ================================================================
          11. LOOK-ALIKE REGIONS
          SAR detections that resemble oil but are unconfirmed slicks.
          ================================================================ */}
      {activeLayers.has('lookalike') && (
        <g>
          {/* Look-alike A — east of spill */}
          <ellipse cx={940} cy={480} rx={38} ry={22}
                   fill="rgba(180,164,22,0.22)"
                   stroke="rgba(204,186,32,0.50)"
                   strokeWidth="1"
                   transform="rotate(-18,940,480)" />
          <text x={940} y={510} textAnchor="middle" fontSize="9"
                fill="rgba(204,186,32,0.58)" fontFamily="Inter,sans-serif"
                letterSpacing="1">look-alike A</text>

          {/* Look-alike B — west of spill */}
          <ellipse cx={510} cy={372} rx={28} ry={16}
                   fill="rgba(180,164,22,0.20)"
                   stroke="rgba(204,186,32,0.46)"
                   strokeWidth="1"
                   transform="rotate(12,510,372)" />
          <text x={510} y={398} textAnchor="middle" fontSize="9"
                fill="rgba(204,186,32,0.55)" fontFamily="Inter,sans-serif"
                letterSpacing="1">look-alike B</text>
        </g>
      )}

      {/* ================================================================
          12. DRIFT CORRIDOR — NNW trajectory from spill centroid
          Computed: 200px at bearing ~337.5° from (736,415)
          ================================================================ */}
      {activeLayers.has('drift') && (
        <g>
          {/* Corridor polygon — tapers from source, widens at 72h end */}
          <path
            d="M 714,428 L 758,403 L 736,146 L 550,224 Z"
            fill="url(#driftCorrGrad)"
            stroke="rgba(0,178,218,0.28)"
            strokeWidth="1"
          />
          {/* Directional arrows along corridor axis */}
          {[
            { tx: 702, ty: 365, rot: -22 },
            { tx: 674, ty: 300, rot: -22 },
            { tx: 648, ty: 238, rot: -21 },
          ].map((a, i) => (
            <g key={i} transform={`translate(${a.tx},${a.ty}) rotate(${a.rot})`} opacity={0.58}>
              <line x1={0} y1={11} x2={0} y2={-13}
                    stroke="rgba(0,192,228,0.78)" strokeWidth="1.5" />
              <polygon points="0,-15 4.5,-7 -4.5,-7"
                       fill="rgba(0,192,228,0.78)" />
            </g>
          ))}
          <text x={628} y={198} textAnchor="middle" fontSize="9"
                fill="rgba(0,180,216,0.55)" fontFamily="Inter,sans-serif"
                letterSpacing="1.5" transform="rotate(-21,628,198)">
            DRIFT T+72H
          </text>
        </g>
      )}

      {/* ================================================================
          13. OIL SPILL POLYGON — SPILL-2026-047
          Irregular organic blob representing SAR-detected hydrocarbon signature.
          Center: 28.45°N, 52.18°E → SVG (736, 415)
          Extent: ~6–8km in each direction, area ≈ 42.7 km²
          ================================================================ */}
      {activeLayers.has('spill') && (
        <g>
          {/* Ambient outer glow */}
          <ellipse cx={736} cy={424} rx={80} ry={57}
                   fill="rgba(188,46,30,0.22)"
                   filter="url(#spillGlow)" />

          {/* Main spill body — organic polygon */}
          <path
            d="M 702,372 C 728,360 756,358 780,368
               C 804,378 822,394 828,416
               C 834,438 826,458 810,468
               C 794,478 772,482 750,480
               C 728,478 708,468 694,454
               C 680,440 674,422 678,404
               C 682,386 692,378 702,372 Z"
            fill="url(#spillFill)"
            stroke="rgba(218,68,48,0.72)"
            strokeWidth="1.5"
          />

          {/* Inner brighter core — thicker concentration */}
          <path
            d="M 718,386 C 734,378 752,378 766,388
               C 780,398 786,414 784,428
               C 782,442 772,452 758,456
               C 744,460 730,454 720,446
               C 710,436 706,422 710,408 Z"
            fill="rgba(215,58,42,0.58)"
          />

          {/* Spill ID annotation */}
          <rect x={748} y={355} width={98} height={20} rx="4"
                fill="#ffffff" stroke="#ea580c" strokeWidth="1" />
          <text x={797} y={369} textAnchor="middle" fontSize="10"
                fontFamily="JetBrains Mono,monospace" fontWeight="700"
                fill="#c2410c" letterSpacing="0.6">
            SPILL-2026-047
          </text>
        </g>
      )}

      {/* ================================================================
          14. VESSEL TRACKS — historical AIS positions
          ================================================================ */}
      {activeLayers.has('tracks') && vessels.map(v => (
        <path
          key={`trk-${v.id}`}
          d={v.trackPath}
          fill="none"
          stroke={vesselColor(v.status)}
          strokeWidth={v.status === 'highest-ranked' || v.status === 'under-review' ? 1.5 : 1}
          strokeDasharray="4,4"
          opacity={v.status === 'highest-ranked' || v.status === 'under-review' ? 0.75 : 0.45}
        />
      ))}

      {/* ================================================================
          15. VESSEL MARKERS — triangle pointing in heading direction
          ================================================================ */}
      {vessels.map(v => {
        const [cx, cy] = toSVG(v.lat, v.lon);
        const color = vesselColor(v.status);
        const isSelected = v.id === selectedId;

        return (
          <g
            key={v.id}
            transform={`translate(${cx},${cy})`}
            onClick={() => onVesselClick(v.id)}
            onMouseEnter={e => onVesselEnter(v.id, e.clientX, e.clientY)}
            onMouseLeave={onVesselLeave}
            style={{ cursor: 'pointer' }}
            role="button"
            tabIndex={0}
            aria-label={`Vessel: ${v.name} — ${v.status}`}
            onKeyDown={e => e.key === 'Enter' && onVesselClick(v.id)}
          >
            {/* Outer selection ring */}
            {isSelected && (
              <circle r={22} fill="none" stroke={color}
                      strokeWidth="1.8" opacity={0.65} />
            )}
            {/* Pulse ring — under review candidates */}
            {(v.status === 'highest-ranked' || v.status === 'under-review') && (
              <circle r={15} fill="none" stroke={color}
                      strokeWidth="1.2" opacity={0.45}
                      style={{ animation: 'oceanintel-pulse 2.5s ease-in-out infinite' }} />
            )}
            {/* Vessel body arrow — rotated to heading */}
            <g transform={`rotate(${v.heading - 180})`}>
              <polygon
                points="0,-11 6,7 0,4 -6,7"
                fill={color}
                opacity={isSelected ? 1 : 0.88}
              />
              {/* Wake line */}
              {v.speed > 1 && (
                <line x1={0} y1={8} x2={0} y2={22}
                stroke={color} strokeWidth="1"
                opacity={0.35} strokeDasharray="2,2" />
              )}
            </g>
            {/* AIS gap indicator dot */}
            {v.aisGap && (
              <circle r={3.5} cx={11} cy={-10}
                      fill="#d97706" stroke="#ffffff" strokeWidth="1" />
            )}
            {/* Name label */}
            <text
              x={isSelected ? 0 : 13}
              y={isSelected ? 30 : -1}
              textAnchor={isSelected ? 'middle' : 'start'}
              fontSize="10"
              fontFamily="Inter,sans-serif"
              fontWeight={isSelected ? '700' : '600'}
              fill={isSelected ? color : '#1e293b'}
            >
              {v.name}
            </text>
          </g>
        );
      })}

      {/* ================================================================
          16. SCALE BAR — bottom-left
          200 SVG units ≈ 20 nautical miles at this map scale
          ================================================================ */}
      <g transform="translate(50,764)" opacity={0.8}>
        <line x1={0} y1={0} x2={200} y2={0}
              stroke="#64748b" strokeWidth="1.5" />
        <line x1={0} y1={-5} x2={0} y2={5}
              stroke="#64748b" strokeWidth="1.5" />
        <line x1={100} y1={-3} x2={100} y2={3}
              stroke="#64748b" strokeWidth="1" />
        <line x1={200} y1={-5} x2={200} y2={5}
              stroke="#64748b" strokeWidth="1.5" />
        <text x={100} y={-10} textAnchor="middle" fontSize="9"
              fill="#475569" fontWeight="600"
              fontFamily="JetBrains Mono,Fira Code,monospace">
          20 NM
        </text>
      </g>

      {/* ================================================================
          17. COMPASS ROSE — top-right
          ================================================================ */}
      <g transform="translate(1556,80)">
        <circle r={23} fill="#ffffff"
                stroke="#cbd5e1" strokeWidth="1" />
        <line x1={0} y1={-17} x2={0} y2={17}
              stroke="#94a3b8" strokeWidth="1" />
        <line x1={-17} y1={0} x2={17} y2={0}
              stroke="#94a3b8" strokeWidth="1" />
        {/* N arrow (red) */}
        <polygon points="0,-16 3.5,-5 0,-3 -3.5,-5"
                 fill="#dc2626" />
        {/* S arrow (dim) */}
        <polygon points="0,16 3.5,5 0,3 -3.5,5"
                 fill="#94a3b8" />
        <text x={0} y={-21} textAnchor="middle" fontSize="9"
              fill="#0f172a"
              fontFamily="Inter,sans-serif" fontWeight="700">N</text>
      </g>

      {/* ================================================================
          18. DEMO WATERMARK — very faint diagonal background text
          ================================================================ */}
      <text
        x={VW / 2} y={VH / 2}
        textAnchor="middle" dominantBaseline="middle"
        fontSize="90" fill="rgba(15,23,42,0.025)"
        fontFamily="Inter,sans-serif" fontWeight="700" letterSpacing="28"
        transform={`rotate(-28,${VW / 2},${VH / 2})`}
      >
        SIMULATED DATA
      </text>

    </g>
  </svg>
</div>
  );
};
