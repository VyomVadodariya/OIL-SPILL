/**
 * OceanIntel — AIS Tactical Map Component
 *
 * Map-first visualization of AIS vessel positions, headings, historic tracks,
 * AIS observation gaps, spill centroid/polygon, and backward drift source corridor.
 *
 * All data is simulated for UI demonstration purposes only.
 */

import React, { useState, useRef } from 'react';
import { useMapPanZoom } from '../../hooks/useMapPanZoom';
import { MapControls } from '../../components/map/MapControls';

export interface AisVessel {
  id: string;
  mmsi: string;
  name: string;
  flag: string;
  flagName: string;
  type: string;
  dwt?: string;
  status: 'highest-ranked' | 'under-review' | 'monitored' | 'cleared';
  lat: number;
  lon: number;
  heading: number;
  speed: number;
  lastObs: string;
  distToSpill: string;
  temporalComp: number;
  aisContinuity: 'high' | 'moderate' | 'low';
  aisGap: boolean;
  aisGapDuration?: string;
  aisGapWindow?: string;
  mapX: number;
  mapY: number;
  trackPath: string;
  gapTrackPath?: string;
  waypoints: { time: string; speed: number; x: number; y: number }[];
}

interface AisMapProps {
  vessels: AisVessel[];
  selectedVesselId: string | null;
  onSelectVessel: (id: string) => void;
  showHistoricTracks: boolean;
  showSourceCorridor: boolean;
  showSpillPolygon: boolean;
  hoveredVesselId: string | null;
  onHoverVessel: (id: string | null) => void;
}

export const AisMap: React.FC<AisMapProps> = ({
  vessels,
  selectedVesselId,
  onSelectVessel,
  showHistoricTracks,
  showSourceCorridor,
  showSpillPolygon,
  hoveredVesselId,
  onHoverVessel,
}) => {
  const { zoom, pan, zoomIn, zoomOut, resetView, bindContainerProps } = useMapPanZoom();
  const [hoveredWaypoint, setHoveredWaypoint] = useState<{
    vesselName: string;
    time: string;
    speed: number;
    x: number;
    y: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="ais-map-container"
      ref={containerRef}
      role="region"
      aria-label="AIS Interactive Maritime Investigation Map"
    >
      <div className="ais-map-viewport" {...bindContainerProps}>
        <MapControls zoom={zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetView} />
        <svg
          className="ais-map-svg"
          viewBox="0 0 1000 650"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            {/* Ocean Surface Gradient (Light hydrographic maritime chart) */}
            <radialGradient id="aisOcean" cx="45%" cy="45%" r="75%">
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="60%" stopColor="#dbeafe" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </radialGradient>

            {/* Source Corridor Hatch Pattern */}
            <pattern id="corridorHatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="10" stroke="#d97706" strokeWidth="1.5" strokeOpacity="0.45" />
            </pattern>

            {/* Glowing filter for selected tracks & vessels */}
            <filter id="glowVessel" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowTrack" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>

          {/* Ocean Background */}
          <rect x="0" y="0" width="1000" height="650" fill="url(#aisOcean)" />

          {/* Graticule Lines */}
          <g className="ais-graticule" opacity="0.45">
            {Array.from({ length: 10 }).map((_, i) => (
              <line key={`v-${i}`} x1={i * 100} y1="0" x2={i * 100} y2="650" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="4 4" />
            ))}
            {Array.from({ length: 7 }).map((_, i) => (
              <line key={`h-${i}`} x1="0" y1={i * 100} x2="1000" y2={i * 100} stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="4 4" />
            ))}

            <text x="204" y="20" fill="#64748b" fontSize="9" fontFamily="JetBrains Mono">51°40′E</text>
            <text x="504" y="20" fill="#64748b" fontSize="9" fontFamily="JetBrains Mono">51°50′E</text>
            <text x="704" y="20" fill="#64748b" fontSize="9" fontFamily="JetBrains Mono">52°00′E</text>

            <text x="10" y="196" fill="#64748b" fontSize="9" fontFamily="JetBrains Mono">26°15′N</text>
            <text x="10" y="416" fill="#64748b" fontSize="9" fontFamily="JetBrains Mono">26°05′N</text>
          </g>

          {/* Coastline Polygon (Southwest Qatar Coastline) */}
          <path
            d="M 0,450 C 60,460 110,490 140,540 C 170,590 190,620 220,650 L 0,650 Z"
            fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"
          />
          <text x="15" y="620" fill="#475569" fontSize="10" fontFamily="JetBrains Mono" fontWeight="700">
            RAS LAFFAN
          </text>

          {/* ------------------------------------------------------------
              BACKWARD DRIFT SOURCE CORRIDOR
              ------------------------------------------------------------ */}
          {showSourceCorridor && (
            <g className="ais-corridor-group">
              <path
                d="M 380,240 L 590,180 L 640,320 L 410,400 Z"
                fill="url(#corridorHatch)"
                stroke="#e5a020" strokeWidth="1.8" strokeDasharray="5 3"
                opacity="0.85"
              />
              <text x="440" y="220" fill="#e5a020" fontSize="10" fontFamily="JetBrains Mono" fontWeight="700">
                PROBABLE RELEASE CORRIDOR (2026-09-07 02:00–04:00Z)
              </text>
            </g>
          )}

          {/* ------------------------------------------------------------
              SPILL LOCATION & CENTROID
              ------------------------------------------------------------ */}
          {showSpillPolygon && (
            <g className="ais-spill-group">
              <path
                d="M 330,260 C 380,230 460,220 540,240 C 600,255 640,290 620,350 C 600,410 530,440 450,430 C 380,420 340,390 310,340 Z"
                fill="rgba(249,115,22,0.45)" stroke="#f97316" strokeWidth="2.5"
              />
              {/* Spill Centroid */}
              <circle cx="470" cy="340" r="5" fill="#f97316" />
              <circle cx="470" cy="340" r="14" fill="none" stroke="#f97316" strokeWidth="1" strokeDasharray="3 3" />
              <text x="490" y="344" fill="#f97316" fontSize="10" fontFamily="JetBrains Mono" fontWeight="700">
                SPILL-2026-047 (42.7 km²)
              </text>
            </g>
          )}

          {/* ------------------------------------------------------------
              VESSEL TRACKS & AIS GAP SEGMENTS
              ------------------------------------------------------------ */}
          {showHistoricTracks && vessels.map(vessel => {
            const isSelected = vessel.id === selectedVesselId;
            const isHovered = vessel.id === hoveredVesselId;
            const isHigh = isSelected || isHovered;

            const strokeColor =
              vessel.status === 'highest-ranked' || vessel.status === 'under-review' ? '#e8423a' :
              vessel.status === 'monitored' ? '#e5a020' : '#2ece7a';

            return (
              <g key={`track-${vessel.id}`} className="ais-track-group" opacity={isHigh ? 1 : 0.45}>
                {/* Normal Track Segment */}
                <path
                  d={vessel.trackPath}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={isHigh ? '2.5' : '1.5'}
                  filter={isHigh ? 'url(#glowTrack)' : undefined}
                />

                {/* AIS Observation Gap Track Segment (Dashed Warning Segment) */}
                {vessel.gapTrackPath && (
                  <g className="ais-gap-track-segment">
                    <path
                      d={vessel.gapTrackPath}
                      fill="none"
                      stroke="#ff4444"
                      strokeWidth="2.8"
                      strokeDasharray="6 4"
                    />
                    {/* Gap Start Marker */}
                    <g transform="translate(684, 390)">
                      <circle r="7" fill="#0d1520" stroke="#ff4444" strokeWidth="2" />
                      <line x1="-3" y1="-3" x2="3" y2="3" stroke="#ff4444" strokeWidth="1.5" />
                      <line x1="3" y1="-3" x2="-3" y2="3" stroke="#ff4444" strokeWidth="1.5" />
                    </g>
                    {/* AIS Gap Warning Text */}
                    <g transform="translate(700, 380)">
                      <rect x="0" y="-12" width="165" height="22" fill="#0c101a" stroke="#ff4444" strokeWidth="1" rx="3" />
                      <text x="6" y="3" fill="#ff4444" fontSize="9" fontFamily="JetBrains Mono" fontWeight="700">
                        ⚠ AIS GAP: {vessel.aisGapDuration}
                      </text>
                    </g>
                  </g>
                )}

                {/* Track Waypoints */}
                {vessel.waypoints.map((wp, idx) => (
                  <circle
                    key={`wp-${idx}`}
                    cx={wp.x} cy={wp.y} r={isHigh ? 4 : 2.5}
                    fill={strokeColor}
                    stroke="#000" strokeWidth="0.8"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredWaypoint({ vesselName: vessel.name, time: wp.time, speed: wp.speed, x: wp.x, y: wp.y })}
                    onMouseLeave={() => setHoveredWaypoint(null)}
                  />
                ))}
              </g>
            );
          })}

          {/* ------------------------------------------------------------
              VESSEL POSITION NODES & HEADING VECTORS
              ------------------------------------------------------------ */}
          {vessels.map(vessel => {
            const isSelected = vessel.id === selectedVesselId;
            const isHovered = vessel.id === hoveredVesselId;

            const iconColor =
              vessel.status === 'highest-ranked' || vessel.status === 'under-review' ? '#e8423a' :
              vessel.status === 'monitored' ? '#e5a020' : '#2ece7a';

            return (
              <g
                key={`vessel-${vessel.id}`}
                transform={`translate(${vessel.mapX}, ${vessel.mapY})`}
                onClick={() => onSelectVessel(vessel.id)}
                onMouseEnter={() => onHoverVessel(vessel.id)}
                onMouseLeave={() => onHoverVessel(null)}
                style={{ cursor: 'pointer' }}
                filter={isSelected || isHovered ? 'url(#glowVessel)' : undefined}
              >
                {/* Heading Arrow Vector */}
                <g transform={`rotate(${vessel.heading})`}>
                  <line x1="0" y1="0" x2="0" y2="-22" stroke={iconColor} strokeWidth="2" strokeDasharray="3 2" />
                  <polygon points="0,-24 5,-14 -5,-14" fill={iconColor} />
                </g>

                {/* Outer Selection Halo Ring */}
                {(isSelected || isHovered) && (
                  <circle r="18" fill="none" stroke={iconColor} strokeWidth="1.8" strokeDasharray="4 3" />
                )}

                {/* Vessel Target Circle Node */}
                <circle r="7" fill="#080e18" stroke={iconColor} strokeWidth="2.5" />
                <circle r="2.5" fill={iconColor} />

                {/* AIS Gap Indicator Icon Badge */}
                {vessel.aisGap && (
                  <g transform="translate(10, -10)">
                    <rect x="-6" y="-6" width="12" height="12" fill="#e8423a" rx="2" />
                    <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">!</text>
                  </g>
                )}

                {/* Vessel Label Callout Tag */}
                <g transform="translate(12, 14)">
                  <rect x="0" y="-11" width={vessel.name.length * 7 + 16} height="18" fill="rgba(8,14,24,0.92)" stroke={iconColor} strokeWidth="0.8" rx="3" />
                  <text x="8" y="2" fill="#ffffff" fontSize="10" fontFamily="JetBrains Mono" fontWeight="600">
                    {vessel.name}
                  </text>
                </g>
              </g>
            );
          })}

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
          WAYPOINT HOVER TOOLTIP
          ------------------------------------------------------------ */}
      {hoveredWaypoint && (
        <div
          className="ais-waypoint-tooltip"
          style={{ left: hoveredWaypoint.x + 14, top: hoveredWaypoint.y - 45 }}
          role="tooltip"
        >
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{hoveredWaypoint.vesselName}</div>
          <div style={{ color: 'var(--text-muted)' }}>
            UTC: <strong style={{ color: 'var(--text-secondary)' }}>{hoveredWaypoint.time}</strong> · Speed: <strong style={{ color: 'var(--text-secondary)' }}>{hoveredWaypoint.speed} kn</strong>
          </div>
        </div>
      )}
    </div>
  );
};
