/**
 * OceanIntel — Historical Intelligence Map Component
 *
 * Map-first visualization of historical oil spill incidents (2021-2026),
 * maritime risk hotspots, and historical vessel density corridors.
 *
 * All data is simulated for UI demonstration purposes only.
 */

import React, { useState } from 'react';
import { useMapPanZoom } from '../../hooks/useMapPanZoom';
import { MapControls } from '../../components/map/MapControls';
import { HISTORICAL_DEMO_DATA, type HistoricalIncident } from '../../data/demo/historical';

export type { HistoricalIncident };
export const HISTORICAL_INCIDENTS: HistoricalIncident[] = HISTORICAL_DEMO_DATA.incidents;

interface HistoricalMapProps {
  selectedIncidentId: string | null;
  onSelectIncident: (id: string) => void;
  showHotspots: boolean;
  showDensityHeat: boolean;
}

export const HistoricalMap: React.FC<HistoricalMapProps> = ({
  selectedIncidentId,
  onSelectIncident,
  showHotspots,
  showDensityHeat,
}) => {
  const { zoom, pan, zoomIn, zoomOut, resetView, bindContainerProps } = useMapPanZoom();
  const [hoveredInc, setHoveredInc] = useState<HistoricalIncident | null>(null);

  return (
    <div className="hist-map-container" role="region" aria-label="Historical Incident Map">
      <div className="hist-map-viewport" {...bindContainerProps}>
        <MapControls zoom={zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetView} />
        <svg className="hist-map-svg" viewBox="0 0 1000 650" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <radialGradient id="histOcean" cx="45%" cy="45%" r="75%">
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="60%" stopColor="#dbeafe" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </radialGradient>

            {/* Density Heatmap Radial Gradients */}
            <radialGradient id="hotspot1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#dc2626" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#d97706" stopOpacity="0.2" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="hotspot2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.35" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>

          <rect x="0" y="0" width="1000" height="650" fill="url(#histOcean)" />

          {/* Graticule */}
          <g opacity="0.45">
            {Array.from({ length: 10 }).map((_, i) => (
              <line key={`v-${i}`} x1={i * 100} y1="0" x2={i * 100} y2="650" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="4 4" />
            ))}
            {Array.from({ length: 7 }).map((_, i) => (
              <line key={`h-${i}`} x1="0" y1={i * 100} x2="1000" y2={i * 100} stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="4 4" />
            ))}
          </g>

          {/* Coastline (Southwest Qatar Coastline) */}
          <path d="M 0,450 C 60,460 110,490 140,540 C 170,590 190,620 220,650 L 0,650 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />

          {/* Risk Hotspots Density Overlays */}
          {showHotspots && (
            <g className="hist-hotspots">
              {/* Jubail Anchorage Risk Blob */}
              <circle cx="710" cy="310" r="110" fill="url(#hotspot1)" />
              {/* Central Shipping Lane Heat */}
              <circle cx="450" cy="300" r="140" fill="url(#hotspot1)" />
              {/* South Pars Zone */}
              <circle cx="580" cy="220" r="90" fill="url(#hotspot2)" />
              <text x="710" y="210" fill="#b91c1c" fontSize="10" fontFamily="JetBrains Mono" fontWeight="700">HOTSPOT 1: JUBAIL ANCHORAGE</text>
              <text x="320" y="320" fill="#b45309" fontSize="10" fontFamily="JetBrains Mono" fontWeight="700">HOTSPOT 2: TANKER TRANSIT CORRIDOR</text>
            </g>
          )}

          {/* Historical Vessel Activity Density Lines */}
          {showDensityHeat && (
            <g className="hist-density-lines" opacity="0.4">
              <path d="M 120,450 C 300,380 500,320 880,180" stroke="#0284c7" strokeWidth="6" strokeOpacity="0.25" fill="none" />
              <path d="M 140,460 C 320,390 520,330 900,190" stroke="#0284c7" strokeWidth="3" strokeOpacity="0.4" fill="none" />
              <path d="M 280,120 C 400,220 580,300 780,390" stroke="#d97706" strokeWidth="3" strokeOpacity="0.3" fill="none" />
            </g>
          )}

          {/* Historical Incident Nodes */}
          {HISTORICAL_INCIDENTS.map(inc => {
            const isSelected = inc.id === selectedIncidentId;
            const color = inc.severity === 'critical' ? '#dc2626' : inc.severity === 'warning' ? '#d97706' : '#16a34a';

            return (
              <g
                key={inc.id}
                transform={`translate(${inc.x}, ${inc.y})`}
                onClick={() => onSelectIncident(inc.id)}
                onMouseEnter={() => setHoveredInc(inc)}
                onMouseLeave={() => setHoveredInc(null)}
                style={{ cursor: 'pointer' }}
              >
                <circle r={isSelected ? 14 : 8} fill="#ffffff" stroke={color} strokeWidth={isSelected ? 2.5 : 1.8} />
                <circle r="3" fill={color} />
                {isSelected && <circle r="20" fill="none" stroke={color} strokeWidth="1" strokeDasharray="3 3" />}
                <text x="12" y="4" fill="#0f172a" fontSize="10" fontFamily="JetBrains Mono" fontWeight="700">{inc.name}</text>
              </g>
            );
          })}

          {/* Scale & North Arrow */}
          <g transform="translate(30, 40)">
            <circle cx="0" cy="0" r="14" fill="#ffffff" stroke="var(--border-default)" />
            <path d="M 0,-10 L 4,4 L 0,1 L -4,4 Z" fill="#0284c7" />
            <text x="0" y="-13" textAnchor="middle" fill="#0284c7" fontSize="8" fontWeight="bold">N</text>
          </g>
          </g>
        </svg>
      </div>

      {hoveredInc && (
        <div className="hist-tooltip" style={{ left: hoveredInc.x + 14, top: hoveredInc.y - 45 }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{hoveredInc.name} ({hoveredInc.year})</div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
            Area: {hoveredInc.area} · Volume: {hoveredInc.volume} · {hoveredInc.attributed}
          </div>
        </div>
      )}
    </div>
  );
};
