/**
 * OceanIntel — Environment Exposure Map Component
 *
 * Visualizes sensitive coastal ecosystems, marine protected areas,
 * desalination intake infrastructure, and 72h spill exposure cones.
 *
 * All data is simulated for UI demonstration purposes only.
 */

import React, { useState } from 'react';
import { useMapPanZoom } from '../../hooks/useMapPanZoom';
import { MapControls } from '../../components/map/MapControls';

export interface SensitiveZone {
  id: string;
  name: string;
  type: 'mangrove' | 'coral' | 'desalination' | 'fishery';
  sensitivity: 'Critical' | 'High' | 'Moderate';
  distToSpill: string;
  etaExposure: string;
  color: string;
  x: number;
  y: number;
}

export const SENSITIVE_ZONES: SensitiveZone[] = [
  {
    id: 'z-mangrove',
    name: 'Ras Laffan Coastal & Coral Reserve',
    type: 'mangrove',
    sensitivity: 'Critical',
    distToSpill: '28.4 km (15.3 NM)',
    etaExposure: 'T+18h ± 3h',
    color: '#e8423a',
    x: 180, y: 560,
  },
  {
    id: 'z-coral',
    name: 'Halul Island Coral Shoal Habitat',
    type: 'coral',
    sensitivity: 'High',
    distToSpill: '24.8 km (13.4 NM)',
    etaExposure: 'T+34h',
    color: '#e5a020',
    x: 780, y: 390,
  },
  {
    id: 'z-desal',
    name: 'Ras Laffan Desalination Intake',
    type: 'desalination',
    sensitivity: 'Critical',
    distToSpill: '31.2 km (16.8 NM)',
    etaExposure: 'T+42h',
    color: '#00b4d8',
    x: 140, y: 590,
  },
  {
    id: 'z-fishery',
    name: 'Al Shaheen Marine Fishery Reserve',
    type: 'fishery',
    sensitivity: 'Moderate',
    distToSpill: '18.0 km (9.7 NM)',
    etaExposure: 'T+26h',
    color: '#2ece7a',
    x: 620, y: 220,
  },
];

interface EnvironmentMapProps {
  selectedZoneId: string | null;
  onSelectZone: (id: string) => void;
  showExposureCone: boolean;
}

export const EnvironmentMap: React.FC<EnvironmentMapProps> = ({
  selectedZoneId,
  onSelectZone,
  showExposureCone,
}) => {
  const { zoom, pan, zoomIn, zoomOut, resetView, bindContainerProps } = useMapPanZoom();
  const [hoveredZone, setHoveredZone] = useState<SensitiveZone | null>(null);

  return (
    <div className="env-map-container" role="region" aria-label="Environmental Vulnerability Map">
      <div className="env-map-viewport" {...bindContainerProps}>
        <MapControls zoom={zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetView} />
        <svg className="env-map-svg" viewBox="0 0 1000 650" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <radialGradient id="envOcean" cx="45%" cy="45%" r="75%">
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="60%" stopColor="#dbeafe" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </radialGradient>
            <pattern id="mangrovePattern" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#dc2626" strokeWidth="1.5" strokeOpacity="0.4" />
            </pattern>
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>

          <rect x="0" y="0" width="1000" height="650" fill="url(#envOcean)" />

          {/* Graticule */}
          <g opacity="0.45">
            {Array.from({ length: 10 }).map((_, i) => (
              <line key={`v-${i}`} x1={i * 100} y1="0" x2={i * 100} y2="650" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="4 4" />
            ))}
            {Array.from({ length: 7 }).map((_, i) => (
              <line key={`h-${i}`} x1="0" y1={i * 100} x2="1000" y2={i * 100} stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="4 4" />
            ))}
          </g>

          {/* Shoreline (Southwest Qatar Coastline) */}
          <path d="M 0,450 C 60,460 110,490 140,540 C 170,590 190,620 220,650 L 0,650 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
          <text x="15" y="620" fill="#475569" fontSize="10" fontFamily="JetBrains Mono" fontWeight="700">RAS LAFFAN COASTLINE</text>

          {/* 72h Exposure Cone */}
          {showExposureCone && (
            <g className="env-exposure-cone">
              <path d="M 470,340 L 320,440 L 140,590 L 180,520 L 380,310 Z" fill="rgba(234,88,12,0.18)" stroke="#ea580c" strokeWidth="1.8" strokeDasharray="5 3" />
              <text x="240" y="440" fill="#c2410c" fontSize="10" fontFamily="JetBrains Mono" fontWeight="700">72H POTENTIAL EXPOSURE CONE</text>
            </g>
          )}

          {/* Spill Slick T0 */}
          <path d="M 330,260 C 380,230 460,220 540,240 C 600,255 640,290 620,350 C 600,410 530,440 450,430 C 380,420 340,390 310,340 Z" fill="rgba(234,88,12,0.45)" stroke="#ea580c" strokeWidth="2.5" />
          <circle cx="470" cy="340" r="5" fill="#ea580c" />

          {/* Sensitive Zones Markers */}
          {SENSITIVE_ZONES.map(zone => {
            const isSelected = zone.id === selectedZoneId;
            return (
              <g
                key={zone.id}
                transform={`translate(${zone.x}, ${zone.y})`}
                onClick={() => onSelectZone(zone.id)}
                onMouseEnter={() => setHoveredZone(zone)}
                onMouseLeave={() => setHoveredZone(null)}
                style={{ cursor: 'pointer' }}
              >
                <circle r={isSelected ? 16 : 10} fill="#ffffff" stroke={zone.color} strokeWidth={isSelected ? 2.5 : 1.8} />
                <circle r="4" fill={zone.color} />
                {isSelected && <circle r="22" fill="none" stroke={zone.color} strokeWidth="1" strokeDasharray="3 3" />}
                <text x="14" y="4" fill="#0f172a" fontSize="10" fontFamily="JetBrains Mono" fontWeight="700">{zone.name}</text>
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

      {hoveredZone && (
        <div className="env-zone-tooltip" style={{ left: hoveredZone.x + 14, top: hoveredZone.y - 45 }}>
          <div style={{ fontWeight: 700, color: hoveredZone.color }}>{hoveredZone.name}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
            Sensitivity: <strong>{hoveredZone.sensitivity}</strong> · Distance: {hoveredZone.distToSpill} · ETA: {hoveredZone.etaExposure}
          </div>
        </div>
      )}
    </div>
  );
};
