/**
 * OceanIntel — Spill Intelligence Geometry Map Component
 *
 * Renders a large, high-fidelity vector visualization of the detected oil spill,
 * featuring interactive geometric measurement overlays:
 * - Spill Polygon (High-resolution NRCS boundary contour)
 * - Bounding Box (Oriented Minimum Bounding Rectangle with dimension callouts)
 * - Centroid (Center of mass crosshair with geographic coordinates)
 * - Length & Width Measurement Calipers (Major & Minor axis vectors with labels)
 * - Orientation Vector (Azimuth indicator N 18° W)
 * - Distance to Coast Vector (Perpendicular coastal baseline vector to Ras Az-Zawr)
 * - Scale bar, Graticule grid, and North arrow
 *
 * All geometry and values are simulated demonstration data.
 */

import React, { useState, useRef, useCallback } from 'react';
import { Compass, Ruler } from 'lucide-react';
import { useMapPanZoom } from '../../hooks/useMapPanZoom';
import { MapControls } from '../../components/map/MapControls';

export interface OverlayToggles {
  polygon: boolean;
  boundingBox: boolean;
  centroid: boolean;
  calipers: boolean;
  orientation: boolean;
  coastDistance: boolean;
  grid: boolean;
}

interface SpillMapProps {
  toggles: OverlayToggles;
  onToggleChange: (key: keyof OverlayToggles) => void;
  selectedMetric: string | null;
  onMetricSelect: (metricKey: string | null) => void;
}

export const SpillMap: React.FC<SpillMapProps> = ({
  toggles,
  onToggleChange,
  selectedMetric,
  onMetricSelect: _onMetricSelect,
}) => {
  const { zoom, pan, zoomIn, zoomOut, resetView, bindContainerProps } = useMapPanZoom();
  const [hoverTarget, setHoverTarget] = useState<{
    x: number;
    y: number;
    title: string;
    value: string;
    sub: string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Interactive hover regions over key SVG overlay elements
    // Bounding Box corner
    if (Math.abs(x - 650) < 30 && Math.abs(y - 190) < 30) {
      setHoverTarget({
        x, y,
        title: 'Minimum Bounding Rectangle',
        value: '14.8 km × 5.3 km',
        sub: 'Envelope Area: 78.4 km² · Filling Ratio: 54.4%',
      });
    }
    // Centroid
    else if (Math.abs(x - 490) < 30 && Math.abs(y - 330) < 30) {
      setHoverTarget({
        x, y,
        title: 'Spill Centroid (Center of Mass)',
        value: '26°09′00″N · 051°48′00″E',
        sub: 'Radiometric NRCS Weighted Center',
      });
    }
    // Length Caliper
    else if (Math.abs(x - 470) < 40 && Math.abs(y - 280) < 30) {
      setHoverTarget({
        x, y,
        title: 'Major Axis (Length)',
        value: '14.8 km (8.0 NM)',
        sub: 'Primary Drift Alignment',
      });
    }
    // Distance to Coast Vector
    else if (Math.abs(x - 670) < 40 && Math.abs(y - 250) < 40) {
      setHoverTarget({
        x, y,
        title: 'Distance to Coast Vector',
        value: '28.4 km (15.3 NM)',
        sub: 'Perpendicular baseline to Ras Laffan coastline',
      });
    } else {
      setHoverTarget(null);
    }
  }, []);

  return (
    <div
      className="spill-map-container"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverTarget(null)}
      role="region"
      aria-label="Geometric Spill Map Visualizer"
    >
      {/* ------------------------------------------------------------
          OVERLAY TOOLBAR (Top Floating Controls)
          ------------------------------------------------------------ */}
      <div className="spill-map-toolbar">
        <div className="spill-map-controls-group" role="group" aria-label="Measurement Layer Toggles">
          <button
            id="toggle-polygon"
            className={`spill-tool-btn ${toggles.polygon ? 'spill-tool-btn--active' : ''}`}
            onClick={() => onToggleChange('polygon')}
            title="Toggle Spill Polygon Boundary"
          >
            <span className="spill-tool-dot" style={{ background: '#f97316' }} />
            Polygon
          </button>
          <button
            id="toggle-bbox"
            className={`spill-tool-btn ${toggles.boundingBox ? 'spill-tool-btn--active' : ''}`}
            onClick={() => onToggleChange('boundingBox')}
            title="Toggle Minimum Bounding Rectangle"
          >
            <span className="spill-tool-dot" style={{ background: '#00b4d8' }} />
            Bounding Box
          </button>
          <button
            id="toggle-centroid"
            className={`spill-tool-btn ${toggles.centroid ? 'spill-tool-btn--active' : ''}`}
            onClick={() => onToggleChange('centroid')}
            title="Toggle Centroid Crosshair"
          >
            <span className="spill-tool-dot" style={{ background: '#ffaa00' }} />
            Centroid
          </button>
          <button
            id="toggle-calipers"
            className={`spill-tool-btn ${toggles.calipers ? 'spill-tool-btn--active' : ''}`}
            onClick={() => onToggleChange('calipers')}
            title="Toggle Length & Width Measurement Calipers"
          >
            <Ruler size={11} style={{ marginRight: 3 }} />
            Calipers
          </button>
          <button
            id="toggle-orientation"
            className={`spill-tool-btn ${toggles.orientation ? 'spill-tool-btn--active' : ''}`}
            onClick={() => onToggleChange('orientation')}
            title="Toggle Orientation Axis Vector"
          >
            <Compass size={11} style={{ marginRight: 3 }} />
            Orientation
          </button>
          <button
            id="toggle-coast"
            className={`spill-tool-btn ${toggles.coastDistance ? 'spill-tool-btn--active' : ''}`}
            onClick={() => onToggleChange('coastDistance')}
            title="Toggle Distance to Coast Vector Line"
          >
            <span className="spill-tool-dot" style={{ background: '#e5a020' }} />
            Coast Vector
          </button>
        </div>

        {/* Right Badge */}
        <div className="spill-map-badge">
          <span className="spill-badge-dot" />
          <span>SPILL-2026-047 · GEOMETRIC ANALYSIS</span>
        </div>
      </div>

      {/* ------------------------------------------------------------
          MAIN SVG GEOMETRY MAP CANVAS
          ------------------------------------------------------------ */}
      <div className="spill-svg-viewport" {...bindContainerProps}>
        <MapControls zoom={zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetView} />
        <svg
          className="spill-svg"
          viewBox="0 0 1000 650"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            {/* Light Sea Background Gradient */}
            <radialGradient id="spillBg" cx="45%" cy="45%" r="75%">
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="50%" stopColor="#dbeafe" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </radialGradient>

            {/* Oil Slick Gradient Fill */}
            <linearGradient id="slickFill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.55" />
              <stop offset="50%" stopColor="#ea580c" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#9a3412" stopOpacity="0.45" />
            </linearGradient>

            {/* Bounding Box Dash Pattern */}
            <pattern id="bboxHatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#0284c7" strokeWidth="1" strokeOpacity="0.25" />
            </pattern>

            {/* Glow filters for vector highlights */}
            <filter id="glowPoly" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowCentroid" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>

          {/* Background Ocean */}
          <rect x="0" y="0" width="1000" height="650" fill="url(#spillBg)" />

          {/* Graticule Grid */}
          {toggles.grid && (
            <g className="spill-grid" opacity="0.45">
              {Array.from({ length: 10 }).map((_, i) => (
                <line
                  key={`v-${i}`}
                  x1={i * 100} y1="0" x2={i * 100} y2="650"
                  stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="4 4"
                />
              ))}
              {Array.from({ length: 7 }).map((_, i) => (
                <line
                  key={`h-${i}`}
                  x1="0" y1={i * 100} x2="1000" y2={i * 100}
                  stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="4 4"
                />
              ))}
            </g>
          )}

          {/* ------------------------------------------------------------
              COASTLINE & DISTANCE VECTOR (Coastal Baseline Southwest/West)
              ------------------------------------------------------------ */}
          <g className="spill-coast-group">
            {/* Coastline Land Polygon (Southwest Qatar Coastline) */}
            <path
              d="M 0,450 C 60,460 110,490 140,540 C 170,590 190,620 220,650 L 0,650 Z"
              fill="#e2e8f0"
              stroke="#94a3b8"
              strokeWidth="1.5"
            />
            <text x="15" y="620" fill="#475569" fontSize="11" fontFamily="JetBrains Mono" fontWeight="700">
              RAS LAFFAN COASTLINE
            </text>

            {/* Distance to Coast Vector Line (Centroid -> Coastline) */}
            {toggles.coastDistance && (
              <g className="spill-coast-vector">
                <line
                  x1="490" y1="330" x2="140" y2="540"
                  stroke="#d97706"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  className={selectedMetric === 'distance' ? 'spill-highlight-pulse' : ''}
                />
                {/* Distance Callout Label */}
                <g transform="translate(315, 435)">
                  <rect x="-65" y="-14" width="130" height="24" fill="#ffffff" stroke="#d97706" strokeWidth="1.2" rx="4" />
                  <text x="0" y="2" textAnchor="middle" fill="#b45309" fontSize="11" fontFamily="JetBrains Mono" fontWeight="700">
                    DIST: 28.4 km (15.3 NM)
                  </text>
                </g>
              </g>
            )}
          </g>

          {/* ------------------------------------------------------------
              BOUNDING BOX (Oriented Minimum Bounding Rectangle)
              ------------------------------------------------------------ */}
          {toggles.boundingBox && (
            <g className="spill-bbox-group">
              {/* Rotated Bounding Rectangle (-18 deg) around Centroid (490, 330) */}
              <g transform="translate(490, 330) rotate(-18) translate(-490, -330)">
                <rect
                  x="240" y="220" width="500" height="220"
                  fill="url(#bboxHatch)"
                  stroke="#00b4d8"
                  strokeWidth="1.8"
                  strokeDasharray="5 4"
                  className={selectedMetric === 'bbox' ? 'spill-highlight-pulse' : ''}
                />
                {/* Bounding Box Corner Marks */}
                <circle cx="240" cy="220" r="4" fill="#00b4d8" />
                <circle cx="740" cy="220" r="4" fill="#00b4d8" />
                <circle cx="740" cy="440" r="4" fill="#00b4d8" />
                <circle cx="240" cy="440" r="4" fill="#00b4d8" />
              </g>
              {/* Bounding Box Label Callout */}
              <g transform="translate(730, 200)">
                <rect x="-80" y="-12" width="160" height="24" fill="#060f1c" stroke="#00b4d8" strokeWidth="1" rx="3" />
                <text x="0" y="4" textAnchor="middle" fill="#00b4d8" fontSize="10" fontFamily="JetBrains Mono" fontWeight="700">
                  BBOX: 14.8 km × 5.3 km
                </text>
              </g>
            </g>
          )}

          {/* ------------------------------------------------------------
              PRIMARY SPILL POLYGON
              ------------------------------------------------------------ */}
          {toggles.polygon && (
            <g className="spill-polygon-group">
              <path
                d="M 310,270 C 370,230 460,220 560,240 C 640,255 690,300 660,370 C 630,440 550,470 450,450 C 370,430 320,400 290,350 C 270,310 280,285 310,270 Z"
                fill="url(#slickFill)"
                stroke="#f97316"
                strokeWidth="2.8"
                filter="url(#glowPoly)"
                className={selectedMetric === 'area' || selectedMetric === 'perimeter' ? 'spill-highlight-pulse' : ''}
              />
              {/* Interior Sub-slick Texture Contours */}
              <path
                d="M 380,270 C 440,250 510,245 580,265 C 630,280 650,320 620,360 C 590,400 520,420 440,410 C 380,400 350,370 340,330 Z"
                fill="rgba(249,115,22,0.25)"
                stroke="#fb923c"
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />
            </g>
          )}

          {/* ------------------------------------------------------------
              ORIENTATION VECTOR AXIS (N 18° W)
              ------------------------------------------------------------ */}
          {toggles.orientation && (
            <g className="spill-orientation-group">
              {/* Major Axis Extension Line through Centroid */}
              <line
                x1="200" y1="420" x2="780" y2="230"
                stroke="#00b4d8"
                strokeWidth="1.5"
                strokeDasharray="8 4"
                className={selectedMetric === 'orientation' ? 'spill-highlight-pulse' : ''}
              />
              {/* Azimuth Angle Indicator Arc */}
              <g transform="translate(490, 330)">
                <path d="M 0,-60 A 60 60 0 0 0 -18,-57" fill="none" stroke="#00b4d8" strokeWidth="2" />
                <line x1="0" y1="0" x2="0" y2="-80" stroke="#7a92b2" strokeWidth="1" strokeDasharray="3 3" />
                <text x="-32" y="-68" fill="#00b4d8" fontSize="10" fontFamily="JetBrains Mono" fontWeight="700">
                  N 18° W (342°)
                </text>
              </g>
            </g>
          )}

          {/* ------------------------------------------------------------
              MEASUREMENT CALIPERS (Length & Width Vectors)
              ------------------------------------------------------------ */}
          {toggles.calipers && (
            <g className="spill-calipers-group">
              {/* LENGTH CALIPER (Major Axis: 310,380 -> 670,260) */}
              <g className="spill-length-caliper">
                <line x1="310" y1="380" x2="670" y2="260" stroke="#ffaa00" strokeWidth="2.5" />
                {/* End ticks */}
                <line x1="302" y1="372" x2="318" y2="388" stroke="#ffaa00" strokeWidth="2.5" />
                <line x1="662" y1="252" x2="678" y2="268" stroke="#ffaa00" strokeWidth="2.5" />
                {/* Callout Tag */}
                <g transform="translate(490, 305)">
                  <rect x="-60" y="-12" width="120" height="24" fill="#0d1520" stroke="#ffaa00" strokeWidth="1.2" rx="3" />
                  <text x="0" y="4" textAnchor="middle" fill="#ffaa00" fontSize="11" fontFamily="JetBrains Mono" fontWeight="700">
                    LENGTH: 14.8 km
                  </text>
                </g>
              </g>

              {/* WIDTH CALIPER (Minor Axis: 430,225 -> 530,435) */}
              <g className="spill-width-caliper">
                <line x1="430" y1="225" x2="530" y2="435" stroke="#ffaa00" strokeWidth="2.5" />
                {/* End ticks */}
                <line x1="420" y1="220" x2="440" y2="230" stroke="#ffaa00" strokeWidth="2.5" />
                <line x1="520" y1="430" x2="540" y2="440" stroke="#ffaa00" strokeWidth="2.5" />
                {/* Callout Tag */}
                <g transform="translate(495, 385)">
                  <rect x="-55" y="-12" width="110" height="24" fill="#0d1520" stroke="#ffaa00" strokeWidth="1.2" rx="3" />
                  <text x="0" y="4" textAnchor="middle" fill="#ffaa00" fontSize="11" fontFamily="JetBrains Mono" fontWeight="700">
                    WIDTH: 5.3 km
                  </text>
                </g>
              </g>
            </g>
          )}

          {/* ------------------------------------------------------------
              CENTROID CROSSHAIR & COORDINATES
              ------------------------------------------------------------ */}
          {toggles.centroid && (
            <g className="spill-centroid-group" transform="translate(490, 330)">
              <circle r="6" fill="#f97316" filter="url(#glowCentroid)" />
              <circle r="18" fill="none" stroke="#ffaa00" strokeWidth="1.5" strokeDasharray="4 3" />
              <line x1="-26" y1="0" x2="26" y2="0" stroke="#ffaa00" strokeWidth="1.5" />
              <line x1="0" y1="-26" x2="0" y2="26" stroke="#ffaa00" strokeWidth="1.5" />

              {/* Centroid Tag */}
              <g transform="translate(32, 22)">
                <rect x="0" y="-14" width="165" height="26" fill="#060f1c" stroke="#ffaa00" strokeWidth="1" rx="3" />
                <text x="8" y="3" fill="#ffffff" fontSize="10" fontFamily="JetBrains Mono" fontWeight="700">
                  CENTROID: 26°09′N 051°48′E
                </text>
              </g>
            </g>
          )}

          {/* ------------------------------------------------------------
              MAP METRICS LEGEND & SCALE BAR OVERLAYS
              ------------------------------------------------------------ */}
          {/* North Arrow */}
          <g transform="translate(40, 45)">
            <circle cx="0" cy="0" r="16" fill="rgba(8,12,20,0.85)" stroke="var(--border-subtle)" />
            <path d="M 0,-12 L 4,5 L 0,2 L -4,5 Z" fill="#00b4d8" />
            <text x="0" y="-15" textAnchor="middle" fill="#00b4d8" fontSize="9" fontWeight="bold">N</text>
          </g>

          {/* Scale Bar (5 km) */}
          <g transform="translate(40, 595)">
            <rect x="-6" y="-16" width="130" height="28" fill="rgba(8,12,20,0.85)" rx="4" stroke="var(--border-subtle)" />
            <line x1="10" y1="2" x2="110" y2="2" stroke="#ffffff" strokeWidth="2.5" />
            <line x1="10" y1="-3" x2="10" y2="7" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="110" y1="-3" x2="110" y2="7" stroke="#ffffff" strokeWidth="1.5" />
            <text x="60" y="-4" textAnchor="middle" fill="#ffffff" fontSize="10" fontFamily="JetBrains Mono" fontWeight="700">
              5 km (2.7 NM)
            </text>
          </g>
          </g>
        </svg>
      </div>

      {/* ------------------------------------------------------------
          HOVER INSPECTION TOOLTIP (Floating callout)
          ------------------------------------------------------------ */}
      {hoverTarget && (
        <div
          className="spill-hover-tooltip"
          style={{
            left: Math.min(hoverTarget.x + 16, 560),
            top: Math.max(hoverTarget.y - 70, 16),
          }}
          role="status"
          aria-live="polite"
        >
          <div className="spill-hover-title">{hoverTarget.title}</div>
          <div className="spill-hover-val">{hoverTarget.value}</div>
          <div className="spill-hover-sub">{hoverTarget.sub}</div>
        </div>
      )}
    </div>
  );
};
