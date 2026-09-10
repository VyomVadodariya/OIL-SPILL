/**
 * OceanIntel — Response Routes & Countermeasure Deployment Map
 *
 * Displays containment booms, skimmer vessels, patrol interception vectors,
 * and optimal response vessel routes.
 *
 * All data is simulated for UI demonstration purposes only.
 */

import React from 'react';
import { useMapPanZoom } from '../../hooks/useMapPanZoom';
import { MapControls } from '../../components/map/MapControls';

export interface ResponseAssets {
  id: string;
  name: string;
  type: string;
  eta: string;
  speed: string;
  status: string;
  x: number;
  y: number;
}

export const RESPONSE_ASSETS: ResponseAssets[] = [
  { id: 'a1', name: 'PATROL OCEAN SCOUT', type: 'Interception Patrol', eta: 'T+00:22', speed: '18.5 kn', status: 'En Route', x: 720, y: 390 },
  { id: 'a2', name: 'SKIMMER ALPHA 1', type: 'Offshore Skimmer', eta: 'T+01:45', speed: '12.0 kn', status: 'Deployed', x: 520, y: 280 },
  { id: 'a3', name: 'BOOM BARGE 4', type: 'Containment Boom', eta: 'T+02:10', speed: '8.4 kn', status: 'Positioning', x: 610, y: 220 },
];

interface ResponseMapProps {
  selectedAssetId: string | null;
  onSelectAsset: (id: string) => void;
}

export const ResponseMap: React.FC<ResponseMapProps> = ({
  selectedAssetId,
  onSelectAsset,
}) => {
  const { zoom, pan, zoomIn, zoomOut, resetView, bindContainerProps } = useMapPanZoom();

  return (
    <div className="resp-map-container" role="region" aria-label="Response Tactical Map">
      <div className="resp-map-viewport" {...bindContainerProps}>
        <MapControls zoom={zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetView} />
        <svg className="resp-map-svg" viewBox="0 0 1000 650" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <radialGradient id="respOcean" cx="45%" cy="45%" r="75%">
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="60%" stopColor="#dbeafe" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </radialGradient>
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>

          <rect x="0" y="0" width="1000" height="650" fill="url(#respOcean)" />

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
          <text x="15" y="620" fill="#475569" fontSize="10" fontFamily="JetBrains Mono" fontWeight="700">RAS LAFFAN COASTLINE</text>

          {/* Containment Boom Barrier Vector */}
          <path d="M 580,240 L 640,320" fill="none" stroke="#d97706" strokeWidth="3.5" strokeDasharray="8 4" />
          <text x="610" y="270" fill="#b45309" fontSize="9" fontFamily="JetBrains Mono" fontWeight="700">CONTAINMENT BOOM (3,500m)</text>

          {/* Spill Slick T0 */}
          <path d="M 330,260 C 380,230 460,220 540,240 C 600,255 640,290 620,350 C 600,410 530,440 450,430 C 380,420 340,390 310,340 Z" fill="rgba(234,88,12,0.35)" stroke="#ea580c" strokeWidth="2" />
          <circle cx="470" cy="340" r="5" fill="#ea580c" />

          {/* Interception Routing Paths */}
          <path d="M 720,390 L 520,280" fill="none" stroke="#0284c7" strokeWidth="2" strokeDasharray="5 3" />
          <path d="M 610,220 L 470,340" fill="none" stroke="#16a34a" strokeWidth="2" strokeDasharray="5 3" />

          {/* Asset Markers */}
          {RESPONSE_ASSETS.map(asset => {
            const isSelected = asset.id === selectedAssetId;
            return (
              <g
                key={asset.id}
                transform={`translate(${asset.x}, ${asset.y})`}
                onClick={() => onSelectAsset(asset.id)}
                style={{ cursor: 'pointer' }}
              >
                <circle r={isSelected ? 14 : 9} fill="#ffffff" stroke={isSelected ? '#0284c7' : '#16a34a'} strokeWidth="2" />
                <circle r="3" fill={isSelected ? '#0284c7' : '#16a34a'} />
                <text x="14" y="4" fill="#0f172a" fontSize="10" fontFamily="JetBrains Mono" fontWeight="700">{asset.name}</text>
              </g>
            );
          })}
          </g>
        </svg>
      </div>
    </div>
  );
};
