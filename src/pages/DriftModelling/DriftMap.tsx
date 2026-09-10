/**
 * OceanIntel — Drift Map Visualizer Component
 *
 * Visualizes oceanographic particle drift dynamics:
 * - BACKWARD DRIFT (Hindcast particle trajectory & source corridor reconstruction)
 * - FORWARD DRIFT (Forecast drift trajectory cone & coastal impact envelope over 72h)
 * - ENVIRONMENTAL FORCING (Surface currents, ERA5 wind vectors, Stokes wave drift)
 *
 * All geometry and values are simulated demonstration data.
 */

import React, { useState, useRef } from 'react';
import { useMapPanZoom } from '../../hooks/useMapPanZoom';
import { MapControls } from '../../components/map/MapControls';

export type DriftViewMode = 'backward' | 'forward' | 'both';

interface DriftMapProps {
  mode: DriftViewMode;
  timeOffsetHours: number; // -12 to +72
  showCurrentVectors: boolean;
  showWindVectors: boolean;
  showParticles: boolean;
}

export const DriftMap: React.FC<DriftMapProps> = ({
  mode,
  timeOffsetHours,
  showCurrentVectors,
  showWindVectors,
  showParticles,
}) => {
  const { zoom, pan, zoomIn, zoomOut, resetView, bindContainerProps } = useMapPanZoom();
  const [hoverParticle, setHoverParticle] = useState<{
    x: number; y: number; time: string; depth: string; status: string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="drift-map-container"
      ref={containerRef}
      role="region"
      aria-label="Drift Particle Simulation Map"
    >
      <div className="drift-map-viewport" {...bindContainerProps}>
        <MapControls zoom={zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetView} />
        <svg
          className="drift-map-svg"
          viewBox="0 0 1000 650"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            {/* Ocean Depth Gradient (Light hydrographic maritime chart) */}
            <radialGradient id="driftOcean" cx="45%" cy="45%" r="75%">
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="60%" stopColor="#dbeafe" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </radialGradient>

            {/* Backward Drift Corridor Hatch Pattern */}
            <pattern id="bwdPattern" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="10" stroke="#d97706" strokeWidth="1.5" strokeOpacity="0.4" />
            </pattern>

            {/* Forward Drift Impact Zone Hatch Pattern */}
            <pattern id="fwdPattern" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
              <line x1="0" y1="0" x2="0" y2="10" stroke="#0d9488" strokeWidth="1.5" strokeOpacity="0.35" />
            </pattern>

            {/* Glow filters */}
            <filter id="glowBwd" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowFwd" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>

          {/* Ocean Background */}
          <rect x="0" y="0" width="1000" height="650" fill="url(#driftOcean)" />

          {/* Graticule Grid */}
          <g className="drift-graticule" opacity="0.45">
            {Array.from({ length: 10 }).map((_, i) => (
              <line key={`v-${i}`} x1={i * 100} y1="0" x2={i * 100} y2="650" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="4 4" />
            ))}
            {Array.from({ length: 7 }).map((_, i) => (
              <line key={`h-${i}`} x1="0" y1={i * 100} x2="1000" y2={i * 100} stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="4 4" />
            ))}
            <text x="254" y="20" fill="#64748b" fontSize="9" fontFamily="JetBrains Mono">51°40′E</text>
            <text x="504" y="20" fill="#64748b" fontSize="9" fontFamily="JetBrains Mono">51°50′E</text>
            <text x="754" y="20" fill="#64748b" fontSize="9" fontFamily="JetBrains Mono">52°00′E</text>

            <text x="10" y="196" fill="#64748b" fontSize="9" fontFamily="JetBrains Mono">26°15′N</text>
            <text x="10" y="416" fill="#64748b" fontSize="9" fontFamily="JetBrains Mono">26°05′N</text>
          </g>

          {/* Coastline Polygon (Southwest Qatar Coastline) */}
          <path
            d="M 0,450 C 60,460 110,490 140,540 C 170,590 190,620 220,650 L 0,650 Z"
            fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"
          />
          <text x="15" y="620" fill="#475569" fontSize="10" fontFamily="JetBrains Mono" fontWeight="700">
            RAS LAFFAN SHORELINE
          </text>

          {/* ------------------------------------------------------------
              BACKWARD DRIFT (HINDCAST RECONSTRUCTION)
              ------------------------------------------------------------ */}
          {(mode === 'backward' || mode === 'both') && (
            <g className="drift-backward-layer">
              {/* Backward Source Corridor Envelope */}
              <path
                d="M 370,230 L 580,170 L 630,310 L 400,390 Z"
                fill="url(#bwdPattern)"
                stroke="#e5a020" strokeWidth="2" strokeDasharray="6 3"
                filter="url(#glowBwd)"
              />
              <text x="430" y="210" fill="#e5a020" fontSize="10" fontFamily="JetBrains Mono" fontWeight="700">
                BACKWARD DRIFT ORIGIN CORRIDOR (T−4H to T−2H)
              </text>

              {/* Backward Particle Stream Trajectory Lines */}
              <path d="M 470,340 C 440,310 420,280 390,240" fill="none" stroke="#e5a020" strokeWidth="2.5" strokeDasharray="4 2" />
              <path d="M 470,340 C 460,290 440,260 410,210" fill="none" stroke="#e5a020" strokeWidth="1.8" strokeDasharray="4 2" opacity="0.7" />
              <path d="M 470,340 C 490,300 480,250 450,190" fill="none" stroke="#e5a020" strokeWidth="1.8" strokeDasharray="4 2" opacity="0.7" />

              {/* Origin Particle Cluster (Monte Carlo Seed) */}
              <circle cx="390" cy="240" r="18" fill="rgba(229,160,32,0.25)" stroke="#e5a020" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx="390" cy="240" r="4" fill="#e5a020" />
              <text x="390" y="222" textAnchor="middle" fill="#e5a020" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">
                ESTIMATED RELEASE POINT (03:00Z)
              </text>
            </g>
          )}

          {/* ------------------------------------------------------------
              FORWARD DRIFT (FORECAST TRAJECTORY & IMPACT CONE)
              ------------------------------------------------------------ */}
          {(mode === 'forward' || mode === 'both') && (
            <g className="drift-forward-layer">
              {/* Forward Forecast Trajectory Cone (T+0 to T+72h) */}
              <path
                d="M 470,340 L 660,270 L 790,200 L 760,130 L 580,240 Z"
                fill="url(#fwdPattern)"
                stroke="#00b4d8" strokeWidth="2" strokeDasharray="6 3"
                filter="url(#glowFwd)"
              />
              <text x="590" y="310" fill="#00b4d8" fontSize="10" fontFamily="JetBrains Mono" fontWeight="700">
                FORWARD DRIFT FORECAST CONE (72H OUTLOOK)
              </text>

              {/* 24h, 48h, 72h Isochron Lines */}
              {/* 24h Isochron */}
              <path d="M 540,310 C 560,290 575,275 585,260" fill="none" stroke="#00b4d8" strokeWidth="1.8" strokeDasharray="3 3" />
              <text x="590" y="270" fill="#00b4d8" fontSize="9" fontFamily="JetBrains Mono">T+24h</text>

              {/* 48h Isochron */}
              <path d="M 640,275 C 670,250 690,230 705,210" fill="none" stroke="#00b4d8" strokeWidth="1.8" strokeDasharray="3 3" />
              <text x="710" y="225" fill="#00b4d8" fontSize="9" fontFamily="JetBrains Mono">T+48h (Potential Coastal Contact)</text>

              {/* 72h Isochron */}
              <path d="M 740,235 C 770,200 780,170 785,140" fill="none" stroke="#00b4d8" strokeWidth="1.8" strokeDasharray="3 3" />
              <text x="790" y="150" fill="#00b4d8" fontSize="9" fontFamily="JetBrains Mono">T+72h</text>

              {/* Forecast Mean Trajectory Line */}
              <path
                d="M 470,340 C 570,300 670,250 765,185"
                fill="none" stroke="#00b4d8" strokeWidth="3"
              />

              {/* Predicted Coastal Impact Zone Marker */}
              <g transform="translate(765, 185)">
                <circle r="14" fill="rgba(232,66,58,0.3)" stroke="#e8423a" strokeWidth="2" />
                <circle r="4" fill="#e8423a" />
                <text x="18" y="4" fill="#e8423a" fontSize="10" fontFamily="JetBrains Mono" fontWeight="700">
                  POTENTIAL COASTAL CONTACT ETA: T+18h (84% Modelled Risk)
                </text>
              </g>
            </g>
          )}

          {/* ------------------------------------------------------------
              CURRENT OBSERVED SPILL SLICK AT T_0
              ------------------------------------------------------------ */}
          <g className="drift-slick-t0">
            <path
              d="M 330,260 C 380,230 460,220 540,240 C 600,255 640,290 620,350 C 600,410 530,440 450,430 C 380,420 340,390 310,340 Z"
              fill="rgba(249,115,22,0.5)" stroke="#f97316" strokeWidth="2.5"
            />
            {/* Centroid T0 */}
            <circle cx="470" cy="340" r="5" fill="#f97316" />
            <text x="470" y="362" textAnchor="middle" fill="#ffffff" fontSize="10" fontFamily="JetBrains Mono" fontWeight="700">
              SPILL AT T_0 (2026-09-07 06:12Z)
            </text>
          </g>

          {/* ------------------------------------------------------------
              MONTE CARLO DRIFT PARTICLES (Simulated Cloud)
              ------------------------------------------------------------ */}
          {showParticles && (
            <g className="drift-particles-cloud">
              {Array.from({ length: 35 }).map((_, i) => {
                // Dynamically scale particle dispersion based on timeOffsetHours (-12 to +72)
                const normOffset = (timeOffsetHours + 12) / 84;
                const px = 390 + normOffset * 370 + ((i * 17) % 50) - 25;
                const py = 240 + normOffset * (-55) + ((i * 13) % 40) - 20;

                return (
                  <circle
                    key={`part-${i}`}
                    cx={px} cy={py} r="2.5"
                    fill={timeOffsetHours < 0 ? '#e5a020' : '#00b4d8'}
                    opacity="0.8"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoverParticle({
                      x: px, y: py,
                      time: timeOffsetHours >= 0 ? `T+${timeOffsetHours}h` : `T${timeOffsetHours}h`,
                      depth: 'Surface (0.0m)',
                      status: timeOffsetHours < 0 ? 'Backward Hindcast Seed' : 'Forward Forecast Particle',
                    })}
                    onMouseLeave={() => setHoverParticle(null)}
                  />
                );
              })}
            </g>
          )}

          {/* ------------------------------------------------------------
              ENVIRONMENTAL FORCING VECTOR ARROWS
              ------------------------------------------------------------ */}
          {/* Surface Current Vector (Cyan Arrows) */}
          {showCurrentVectors && (
            <g className="drift-vector-currents" transform="translate(150, 160)">
              <rect x="-10" y="-14" width="160" height="28" fill="rgba(8,12,20,0.85)" rx="3" stroke="var(--border-subtle)" />
              <text x="0" y="4" fill="#00b4d8" fontSize="10" fontFamily="JetBrains Mono" fontWeight="700">
                CURRENT: 1.4 kn @ 148° SE
              </text>
              {/* Arrow */}
              <line x1="120" y1="0" x2="145" y2="10" stroke="#00b4d8" strokeWidth="2" />
              <polygon points="147,11 138,5 140,14" fill="#00b4d8" />
            </g>
          )}

          {/* Wind Vector (Yellow Arrows) */}
          {showWindVectors && (
            <g className="drift-vector-wind" transform="translate(150, 200)">
              <rect x="-10" y="-14" width="160" height="28" fill="rgba(8,12,20,0.85)" rx="3" stroke="var(--border-subtle)" />
              <text x="0" y="4" fill="#e5a020" fontSize="10" fontFamily="JetBrains Mono" fontWeight="700">
                ERA5 WIND: 14.2 kn @ 328° NNW
              </text>
              {/* Arrow */}
              <line x1="120" y1="0" x2="145" y2="-10" stroke="#e5a020" strokeWidth="2" />
              <polygon points="147,-11 140,-14 138,-5" fill="#e5a020" />
            </g>
          )}

          {/* North Arrow & Scale Bar */}
          <g transform="translate(30, 40)">
            <circle cx="0" cy="0" r="14" fill="rgba(8,12,20,0.85)" stroke="var(--border-subtle)" />
            <path d="M 0,-10 L 4,4 L 0,1 L -4,4 Z" fill="#00b4d8" />
            <text x="0" y="-13" textAnchor="middle" fill="#00b4d8" fontSize="8" fontWeight="bold">N</text>
          </g>

          <g transform="translate(30, 600)">
            <rect x="0" y="-12" width="110" height="24" fill="rgba(8,12,20,0.85)" rx="3" stroke="var(--border-subtle)" />
            <line x1="10" y1="2" x2="100" y2="2" stroke="#ffffff" strokeWidth="2" />
            <line x1="10" y1="-2" x2="10" y2="6" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="100" y1="-2" x2="100" y2="6" stroke="#ffffff" strokeWidth="1.5" />
            <text x="55" y="-3" textAnchor="middle" fill="#ffffff" fontSize="9" fontFamily="JetBrains Mono">5 NM</text>
          </g>
          </g>
        </svg>
      </div>

      {/* ------------------------------------------------------------
          HOVER PARTICLE TOOLTIP
          ------------------------------------------------------------ */}
      {hoverParticle && (
        <div
          className="drift-particle-tooltip"
          style={{ left: hoverParticle.x + 12, top: hoverParticle.y - 45 }}
          role="tooltip"
        >
          <div style={{ fontWeight: 700, color: 'var(--text-cyan)' }}>{hoverParticle.status}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
            Sim Time: <strong style={{ color: '#fff' }}>{hoverParticle.time}</strong> · Depth: {hoverParticle.depth}
          </div>
        </div>
      )}
    </div>
  );
};
