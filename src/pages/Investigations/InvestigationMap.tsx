/**
 * OceanIntel — Investigation Map Component
 *
 * Dedicated investigation-mode maritime chart.
 * Region: Central Persian Gulf Offshore (Open Waters: 26.15°N, 51.80°E).
 *
 * ViewBox: 0 0 1400 800
 * Lon range: 50.55°E – 53.05°E (2.5°)
 * Lat range: 24.90°N – 27.40°N (2.5°)
 * Centroid (26.15°N, 51.80°E) maps to (700, 400) — completely offshore in deep open water.
 *
 * All data is simulated for UI demonstration purposes only.
 */

import React from 'react';
import { useMapPanZoom } from '../../hooks/useMapPanZoom';
import { MapControls } from '../../components/map/MapControls';

const VW = 1400;
const VH = 800;
const BOUNDS = { lonMin: 50.55, lonMax: 53.05, latMin: 24.90, latMax: 27.40 };

function toInvSVG(lat: number, lon: number): [number, number] {
  const x = ((lon - BOUNDS.lonMin) / (BOUNDS.lonMax - BOUNDS.lonMin)) * VW;
  const y = ((BOUNDS.latMax - lat) / (BOUNDS.latMax - BOUNDS.latMin)) * VH;
  return [Math.round(x), Math.round(y)];
}

const GRID_LONS = [51.0, 51.5, 52.0, 52.5, 53.0];
const GRID_LATS = [25.0, 25.5, 26.0, 26.5, 27.0];

export type VesselStatus = 'highest-ranked' | 'under-review' | 'monitored' | 'cleared';

export interface InvVesselMark {
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

interface InvMapProps {
  vessels: InvVesselMark[];
  selectedId: string | null;
  activeLayers: Set<string>;
  onVesselClick: (id: string) => void;
  onVesselEnter: (id: string, cx: number, cy: number) => void;
  onVesselLeave: () => void;
}

const vc = (s: VesselStatus) =>
  s === 'highest-ranked' || s === 'under-review' ? '#f97316' : s === 'monitored' ? '#3b82f6' : '#10b981';

export const InvestigationMap: React.FC<InvMapProps> = ({
  vessels,
  selectedId,
  activeLayers,
  onVesselClick,
  onVesselEnter,
  onVesselLeave,
}) => {
  const { zoom, pan, zoomIn, zoomOut, resetView, bindContainerProps } = useMapPanZoom();

  return (
    <div {...bindContainerProps} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <MapControls zoom={zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetView} />
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        preserveAspectRatio="xMidYMid slice"
        style={{ display: 'block', width: '100%', height: '100%' }}
        aria-label="Investigation chart — Central Persian Gulf Offshore, simulated data"
        role="img"
      >
        <defs>
          <linearGradient id="invOcean" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="50%" stopColor="#dbeafe" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>

          {/* Oil Spill Gradient — Unified Orange Palette */}
          <radialGradient id="invSpill" cx="48%" cy="45%" r="60%">
            <stop offset="0%" stopColor="rgba(249,115,22,0.92)" />
            <stop offset="55%" stopColor="rgba(234,88,12,0.72)" />
            <stop offset="100%" stopColor="rgba(194,65,12,0.25)" />
          </radialGradient>

          {/* Forward drift — Cyan / Teal */}
          <linearGradient id="fwdDriftGrad" x1="0.5" y1="1" x2="0.5" y2="0">
            <stop offset="0%" stopColor="rgba(13,148,136,0.50)" />
            <stop offset="80%" stopColor="rgba(13,148,136,0.12)" />
            <stop offset="100%" stopColor="rgba(13,148,136,0.00)" />
          </linearGradient>

          {/* Backward drift — Amber */}
          <linearGradient id="bwdDriftGrad" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="rgba(217,119,6,0.50)" />
            <stop offset="80%" stopColor="rgba(217,119,6,0.12)" />
            <stop offset="100%" stopColor="rgba(217,119,6,0.00)" />
          </linearGradient>

          <filter id="invSpillGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feComposite in="SourceGraphic" in2="b" operator="over" />
          </filter>

          {/* SAR Footprint Grid Lines */}
          <pattern id="sarLines" width="20" height="20" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="20" y2="20" stroke="rgba(2,132,199,0.06)" strokeWidth="0.8" />
          </pattern>

          <clipPath id="invClip">
            <rect width={VW} height={VH} />
          </clipPath>
        </defs>

        <g clipPath="url(#invClip)" transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* 1. OCEAN BASE */}
          <rect width={VW} height={VH} fill="url(#invOcean)" />

          {/* 2. BATHYMETRY CONTOURS */}
          <g opacity="0.30" fill="none" stroke="#93c5fd" strokeWidth="1">
            <ellipse cx={700} cy={400} rx={520} ry={240} />
            <ellipse cx={710} cy={390} rx={380} ry={170} />
            <ellipse cx={700} cy={400} rx={220} ry={105} />
          </g>

          {/* 3. GRATICULE LINES */}
          {GRID_LONS.map((lon) => {
            const [x] = toInvSVG(26.15, lon);
            return (
              <line
                key={`l${lon}`}
                x1={x}
                y1={0}
                x2={x}
                y2={VH}
                stroke="rgba(15,23,42,0.07)"
                strokeWidth="1"
              />
            );
          })}
          {GRID_LATS.map((lat) => {
            const [, y] = toInvSVG(lat, 51.8);
            return (
              <line
                key={`lt${lat}`}
                x1={0}
                y1={y}
                x2={VW}
                y2={y}
                stroke="rgba(15,23,42,0.07)"
                strokeWidth="1"
              />
            );
          })}

          {/* 4. SOUTHWEST LANDMASS — Qatar Peninsula Coastline (Far from offshore spill) */}
          <path
            d={`M 0,${VH} L 360,${VH}
                C 330,720 310,660 280,610
                C 250,560 220,530 190,505
                C 150,480 110,470 70,460
                L 0,450 Z`}
            fill="#e2e8f0"
            stroke="#94a3b8"
            strokeWidth="1.5"
          />
          <text
            x={110}
            y={650}
            fill="#64748b"
            fontSize="12"
            fontFamily="Inter, sans-serif"
            letterSpacing="3"
            fontWeight="700"
          >
            QATAR PENINSULA
          </text>
          <text
            x={190}
            y={525}
            fill="#64748b"
            fontSize="9"
            fontFamily="JetBrains Mono, monospace"
            fontWeight="600"
          >
            Ras Laffan
          </text>

          {/* 5. SHALLOW REEF / ATOLL (Fasht ad Dibal) */}
          <ellipse
            cx={260}
            cy={420}
            rx={28}
            ry={14}
            fill="#e2e8f0"
            stroke="#94a3b8"
            strokeWidth="1"
            transform="rotate(-18,260,420)"
          />
          <text
            x={260}
            y={445}
            textAnchor="middle"
            fontSize="8"
            fill="#64748b"
            fontFamily="Inter, sans-serif"
          >
            Fasht ad Dibal
          </text>

          {/* 6. WATER BODY LABEL */}
          <text
            x={700}
            y={480}
            textAnchor="middle"
            fontSize="16"
            fill="#0369a1"
            fontFamily="Inter, sans-serif"
            letterSpacing="10"
            fontStyle="italic"
            fontWeight="700"
            opacity="0.4"
          >
            PERSIAN GULF (CENTRAL OFFSHORE)
          </text>

          {/* 7. GRATICULE LABELS */}
          {GRID_LONS.map((lon) => {
            const [x] = toInvSVG(26.15, lon);
            return (
              <text
                key={`ll${lon}`}
                x={x}
                y={VH - 10}
                textAnchor="middle"
                fontSize="10"
                fill="#64748b"
                fontFamily="JetBrains Mono, monospace"
              >
                {lon.toFixed(1)}°E
              </text>
            );
          })}
          {GRID_LATS.map((lat) => {
            const [, y] = toInvSVG(lat, 51.8);
            return (
              <text
                key={`ll2${lat}`}
                x={12}
                y={y + 4}
                fontSize="10"
                fill="#64748b"
                fontFamily="JetBrains Mono, monospace"
              >
                {lat.toFixed(1)}°N
              </text>
            );
          })}

          {/* 8. SAR SCENE FOOTPRINT */}
          {activeLayers.has('sar') && (
            <g>
              <rect
                x={260}
                y={120}
                width={880}
                height={560}
                fill="rgba(2,132,199,0.03)"
                stroke="rgba(2,132,199,0.35)"
                strokeWidth="1"
                strokeDasharray="8,5"
              />
              <rect x={260} y={120} width={880} height={560} fill="url(#sarLines)" />
              <rect x={260} y={120} width={140} height={20} fill="#ffffff" stroke="#cbd5e1" rx="4" />
              <text
                x={330}
                y={134}
                textAnchor="middle"
                fontSize="10"
                fill="#0284c7"
                fontFamily="Inter, sans-serif"
                fontWeight="700"
                letterSpacing="0.8"
              >
                Sentinel-1A SAR · IW
              </text>
            </g>
          )}

          {/* 9. ENVIRONMENTAL SENSITIVE ZONE */}
          {activeLayers.has('environment') && (
            <g>
              <ellipse
                cx={360}
                cy={360}
                rx={70}
                ry={35}
                fill="rgba(16,185,129,0.06)"
                stroke="rgba(16,185,129,0.35)"
                strokeWidth="1.2"
                strokeDasharray="5,4"
                transform="rotate(-12,360,360)"
              />
              <text
                x={360}
                y={364}
                textAnchor="middle"
                fontSize="9"
                fill="rgba(16,185,129,0.70)"
                fontFamily="Inter, sans-serif"
                fontWeight="600"
                letterSpacing="1"
              >
                MARINE SANCTUARY SECTOR
              </text>
            </g>
          )}

          {/* 10. BACKWARD DRIFT CORRIDOR — Amber (Hindcast Origin) */}
          {activeLayers.has('bwddrift') && (
            <g>
              <path
                d="M 680,380 L 730,360 L 860,250 L 920,290 Z"
                fill="url(#bwdDriftGrad)"
                stroke="rgba(245,158,11,0.45)"
                strokeWidth="1.2"
                strokeDasharray="5,3"
              />
              <text
                x={800}
                y={290}
                textAnchor="middle"
                fontSize="10"
                fill="rgba(245,158,11,0.85)"
                fontFamily="JetBrains Mono, monospace"
                letterSpacing="1"
                transform="rotate(-26,800,290)"
              >
                HINDCAST SOURCE CORRIDOR (T−48H)
              </text>
            </g>
          )}

          {/* 11. FORWARD DRIFT CORRIDOR — Teal (72h Forecast Outlook) */}
          {activeLayers.has('fwddrift') && (
            <g>
              <path
                d="M 670,420 L 710,440 L 590,620 L 490,570 Z"
                fill="url(#fwdDriftGrad)"
                stroke="rgba(6,182,212,0.45)"
                strokeWidth="1.2"
                strokeDasharray="5,3"
              />
              <text
                x={590}
                y={530}
                textAnchor="middle"
                fontSize="10"
                fill="rgba(6,182,212,0.85)"
                fontFamily="JetBrains Mono, monospace"
                letterSpacing="1"
                transform="rotate(32,590,530)"
              >
                72H POTENTIAL EXPOSURE CONE (FORECAST)
              </text>
            </g>
          )}

          {/* 12. DETECTED OIL SIGNATURE — Centered at (700, 400) Offshore */}
          {activeLayers.has('oilsig') && (
            <g>
              {/* Outer Plume Ambient Glow */}
              <ellipse
                cx={700}
                cy={400}
                rx={88}
                ry={52}
                fill="rgba(249,115,22,0.22)"
                filter="url(#invSpillGlow)"
              />
              {/* Main Plume Boundary */}
              <path
                d={`M 630,370
                    C 660,350 710,345 745,360
                    C 780,375 800,395 795,420
                    C 790,445 760,465 730,470
                    C 695,475 660,465 635,445
                    C 610,425 605,395 630,370 Z`}
                fill="url(#invSpill)"
                stroke="#ea580c"
                strokeWidth="1.8"
              />
              {/* Dense Core */}
              <path
                d={`M 655,385
                    C 675,372 715,370 735,385
                    C 755,400 760,420 750,435
                    C 738,450 710,455 690,450
                    C 670,442 650,425 655,385 Z`}
                fill="rgba(249,115,22,0.65)"
              />
              {/* Incident ID Box */}
              <rect x={710} y={355} width={150} height={20} rx="3" fill="rgba(5,10,20,0.92)" stroke="#ea580c" strokeWidth="0.8" />
              <text
                x={785}
                y={369}
                textAnchor="middle"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="700"
                fill="#f97316"
                letterSpacing="0.6"
              >
                SPILL-2026-047 (42.7 km²)
              </text>
            </g>
          )}

          {/* 13. AIS HISTORIC TRACKS */}
          {activeLayers.has('aistracks') &&
            vessels.map((v) => (
              <path
                key={`t-${v.id}`}
                d={v.trackPath}
                fill="none"
                stroke={vc(v.status)}
                strokeWidth={v.status === 'highest-ranked' || v.status === 'under-review' ? 1.8 : 1.2}
                strokeDasharray="5,4"
                opacity={v.status === 'highest-ranked' || v.status === 'under-review' ? 0.85 : 0.45}
              />
            ))}

          {/* 14. VESSEL MARKERS */}
          {activeLayers.has('vessels') &&
            vessels.map((v) => {
              const [cx, cy] = toInvSVG(v.lat, v.lon);
              const color = vc(v.status);
              const sel = v.id === selectedId;

              return (
                <g
                  key={v.id}
                  transform={`translate(${cx},${cy})`}
                  onClick={() => onVesselClick(v.id)}
                  onMouseEnter={(e) => onVesselEnter(v.id, e.clientX, e.clientY)}
                  onMouseLeave={onVesselLeave}
                  style={{ cursor: 'pointer' }}
                  role="button"
                  tabIndex={0}
                  aria-label={`${v.name} — ${v.status}`}
                  onKeyDown={(e) => e.key === 'Enter' && onVesselClick(v.id)}
                >
                  {sel && <circle r={22} fill="none" stroke={color} strokeWidth="1.8" opacity={0.65} />}
                  {(v.status === 'highest-ranked' || v.status === 'under-review') && (
                    <circle
                      r={16}
                      fill="none"
                      stroke={color}
                      strokeWidth="1.2"
                      opacity={0.45}
                      style={{ animation: 'oceanintel-pulse 2.5s ease-in-out infinite' }}
                    />
                  )}
                  <g transform={`rotate(${v.heading - 180})`}>
                    <polygon points="0,-12 7,8 0,4 -7,8" fill={color} opacity={sel ? 1 : 0.88} />
                    {v.speed > 1 && (
                      <line x1={0} y1={8} x2={0} y2={22} stroke={color} strokeWidth="1" opacity={0.35} strokeDasharray="2,2" />
                    )}
                  </g>
                  {v.aisGap && (
                    <circle r={4} cx={12} cy={-10} fill="#f59e0b" stroke="rgba(0,0,0,0.6)" strokeWidth="1" />
                  )}
                  <text
                    x={sel ? 0 : 14}
                    y={sel ? 32 : 1}
                    textAnchor={sel ? 'middle' : 'start'}
                    fontSize="11"
                    fontFamily="Inter, sans-serif"
                    fontWeight={sel ? '700' : '500'}
                    fill={sel ? color : 'rgba(215,230,250,0.85)'}
                  >
                    {v.name}
                  </text>
                </g>
              );
            })}

          {/* 15. SCALE BAR (Offshore Nautical Miles) */}
          <g transform="translate(42, 755)" opacity={0.65}>
            <line x1={0} y1={0} x2={160} y2={0} stroke="rgba(148,194,238,0.75)" strokeWidth="1.5" />
            <line x1={0} y1={-5} x2={0} y2={5} stroke="rgba(148,194,238,0.75)" strokeWidth="1.5" />
            <line x1={80} y1={-3} x2={80} y2={3} stroke="rgba(148,194,238,0.50)" strokeWidth="1" />
            <line x1={160} y1={-5} x2={160} y2={5} stroke="rgba(148,194,238,0.75)" strokeWidth="1.5" />
            <text x={80} y={-8} textAnchor="middle" fontSize="10" fill="rgba(148,194,238,0.85)" fontFamily="JetBrains Mono, monospace">
              10 NM (18.5 km)
            </text>
          </g>

          {/* 16. NORTH COMPASS */}
          <g transform="translate(1350, 70)">
            <circle r={22} fill="rgba(4,11,22,0.85)" stroke="rgba(88,130,178,0.30)" strokeWidth="1" />
            <line x1={0} y1={-16} x2={0} y2={16} stroke="rgba(98,140,188,0.46)" strokeWidth="1" />
            <line x1={-16} y1={0} x2={16} y2={0} stroke="rgba(98,140,188,0.46)" strokeWidth="1" />
            <polygon points="0,-16 4,-5 0,-2 -4,-5" fill="#f97316" />
            <polygon points="0,16 4,5 0,2 -4,5" fill="rgba(124,160,202,0.45)" />
            <text x={0} y={-20} textAnchor="middle" fontSize="10" fill="#f97316" fontFamily="Inter, sans-serif" fontWeight="700">
              N
            </text>
          </g>

          {/* 17. DEMO MODE WATERMARK */}
          <text
            x={VW / 2}
            y={VH / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="84"
            fill="rgba(255,255,255,0.018)"
            fontFamily="Inter, sans-serif"
            fontWeight="800"
            letterSpacing="24"
            transform={`rotate(-24,${VW / 2},${VH / 2})`}
          >
            DEMO MODE · SIMULATED
          </text>
        </g>
      </svg>
    </div>
  );
};
