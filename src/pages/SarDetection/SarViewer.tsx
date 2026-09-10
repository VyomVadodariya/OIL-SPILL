/**
 * OceanIntel — SAR Image & Map Viewer Component
 *
 * Renders simulated satellite Synthetic Aperture Radar (SAR) imagery across:
 * - RAW SAR (Grayscale backscatter intensity + speckle clutter)
 * - PREPROCESSED SAR (Calibrated dB heatmap + speckle suppressed)
 * - AI SEGMENTATION (Color-coded semantic classification map)
 * - SLIDER COMPARE (Side-by-side interactive split slider)
 *
 * All imagery and data are simulated for UI demonstration purposes only.
 */

import React, { useState, useRef, useCallback } from 'react';
import { Sliders, RefreshCw, Info } from 'lucide-react';
import { useMapPanZoom } from '../../hooks/useMapPanZoom';
import { MapControls } from '../../components/map/MapControls';

export type SarViewMode = 'raw' | 'preprocessed' | 'segmentation' | 'slider';
export type ClassCategory = 'sea' | 'oil' | 'lookalike' | 'ship' | 'land';

interface SarViewerProps {
  viewMode: SarViewMode;
  onViewModeChange: (mode: SarViewMode) => void;
  activeStageId: string;
  onStageChange: (stageId: string) => void;
  highlightCategory?: ClassCategory | null;
  isProcessing?: boolean;
}

/* Category colors & metadata */
export const CATEGORIES: Record<ClassCategory, { name: string; color: string; bg: string; border: string; desc: string }> = {
  sea:       { name: 'SEA',        color: '#2e7af0', bg: 'rgba(46,122,240,0.18)',   border: '#1a5dc2', desc: 'Open sea surface (background NRCS -14 to -10 dB)' },
  oil:       { name: 'OIL',        color: '#f97316', bg: 'rgba(249,115,22,0.45)',    border: '#ea580c', desc: 'Hydrocarbon slick attenuation (NRCS < -22 dB)' },
  lookalike: { name: 'LOOK-ALIKE', color: '#eab308', bg: 'rgba(234,179,8,0.30)',    border: '#ca8a04', desc: 'Low-wind area / biogenic film (NRCS ~ -18 dB)' },
  ship:      { name: 'SHIP',       color: '#00b4d8', bg: 'rgba(0,180,216,0.60)',    border: '#00cef5', desc: 'Metallic vessel point target (NRCS > +6 dB)' },
  land:      { name: 'LAND',       color: '#64748b', bg: 'rgba(100,116,139,0.35)', border: '#94a3b8', desc: 'Terrestrial coastline (NRCS > -4 dB)' },
};

export const SarViewer: React.FC<SarViewerProps> = ({
  viewMode,
  onViewModeChange,
  activeStageId,
  highlightCategory,
  isProcessing = false,
}) => {
  const { zoom, pan, zoomIn, zoomOut, resetView, bindContainerProps } = useMapPanZoom();
  const [sliderPos, setSliderPos] = useState(50); // percentage 0-100
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [hoverPixel, setHoverPixel] = useState<{
    x: number; y: number; lat: string; lon: string; nrcs: string; classCat: ClassCategory; label: string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  /* Mouse move inspector handler */
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingSlider && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const pct = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
      setSliderPos(pct);
      return;
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const rx = (e.clientX - rect.left) / rect.width;
    const ry = (e.clientY - rect.top) / rect.height;

    // Map rx, ry to simulated Lat/Lon aligned with DEMO_INCIDENT (26.15°N, 51.80°E)
    const lat = (26.30 - ry * 0.30).toFixed(4);
    const lon = (51.65 + rx * 0.30).toFixed(4);

    // Determine simulated class based on SVG geometry regions
    let classCat: ClassCategory = 'sea';
    let nrcs = '-12.4 dB';
    let label = 'Open Ocean Surface';

    // Check land region (top right coastline)
    if (rx > 0.72 || (rx > 0.65 && ry < 0.25)) {
      classCat = 'land';
      nrcs = '+2.1 dB';
      label = 'Terrestrial Coastline / Island';
    }
    // Check main oil slick region
    else if (rx >= 0.30 && rx <= 0.62 && ry >= 0.35 && ry <= 0.68) {
      classCat = 'oil';
      nrcs = '-24.6 dB';
      label = 'Hydrocarbon Slick (High Damping)';
    }
    // Check look-alike region (bottom left low wind zone)
    else if (rx >= 0.12 && rx <= 0.32 && ry >= 0.65 && ry <= 0.88) {
      classCat = 'lookalike';
      nrcs = '-18.2 dB';
      label = 'Biogenic Film / Low Wind Anomaly';
    }
    // Check ship target 1 (near slick)
    else if (Math.abs(rx - 0.58) < 0.03 && Math.abs(ry - 0.42) < 0.03) {
      classCat = 'ship';
      nrcs = '+8.7 dB';
      label = 'Vessel HARBOR PIONEER (Metallic Target)';
    }
    // Check ship target 2
    else if (Math.abs(rx - 0.40) < 0.03 && Math.abs(ry - 0.30) < 0.03) {
      classCat = 'ship';
      nrcs = '+6.4 dB';
      label = 'Vessel DELTA STAR';
    }

    setHoverPixel({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      lat: `${lat}°N`,
      lon: `${lon}°E`,
      nrcs,
      classCat,
      label,
    });
  }, [isDraggingSlider]);

  const handleMouseLeave = useCallback(() => {
    setHoverPixel(null);
    setIsDraggingSlider(false);
  }, []);

  /* Slider drag handlers */
  const handleSliderMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingSlider(true);
  };

  const handleMouseUp = () => {
    setIsDraggingSlider(false);
  };

  return (
    <div
      className="sar-viewer-container"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      role="region"
      aria-label="SAR Satellite Scene Viewer"
    >
      {/* ------------------------------------------------------------
          TOOLBAR / CONTROLS (Top Left & Top Right Overlays)
          ------------------------------------------------------------ */}
      <div className="sar-viewer-header">
        {/* Left: View Mode Tabs */}
        <div className="sar-mode-tabs" role="tablist" aria-label="SAR View Mode Switcher">
          <button
            id="sar-mode-raw"
            className={`sar-mode-btn ${viewMode === 'raw' ? 'sar-mode-btn--active' : ''}`}
            onClick={() => onViewModeChange('raw')}
            role="tab"
            aria-selected={viewMode === 'raw'}
          >
            Raw SAR
          </button>
          <button
            id="sar-mode-preprocessed"
            className={`sar-mode-btn ${viewMode === 'preprocessed' ? 'sar-mode-btn--active' : ''}`}
            onClick={() => onViewModeChange('preprocessed')}
            role="tab"
            aria-selected={viewMode === 'preprocessed'}
          >
            Preprocessed
          </button>
          <button
            id="sar-mode-segmentation"
            className={`sar-mode-btn ${viewMode === 'segmentation' ? 'sar-mode-btn--active' : ''}`}
            onClick={() => onViewModeChange('segmentation')}
            role="tab"
            aria-selected={viewMode === 'segmentation'}
          >
            AI Segmentation
          </button>
          <button
            id="sar-mode-slider"
            className={`sar-mode-btn ${viewMode === 'slider' ? 'sar-mode-btn--active' : ''}`}
            onClick={() => onViewModeChange('slider')}
            role="tab"
            aria-selected={viewMode === 'slider'}
            title="Split-screen Raw vs Segmentation comparison slider"
          >
            <Sliders size={12} style={{ display: 'inline', marginRight: 4 }} />
            Slider Compare
          </button>
        </div>

        {/* Right: Quick Telemetry */}
        <div className="sar-viewer-badge">
          <span className="sar-status-dot" aria-hidden="true" />
          <span>S1A · IW VV · 10m</span>
        </div>
      </div>

      {/* ------------------------------------------------------------
          PROCESSING SCANNING OVERLAY (Animation when stage changes)
          ------------------------------------------------------------ */}
      {isProcessing && (
        <div className="sar-scanning-overlay" aria-label="Processing SAR Data">
          <div className="sar-scan-line" />
          <div className="sar-scan-text">
            <RefreshCw size={14} className="sar-spin-icon" />
            Running Neural Segmentation &amp; NRCS Calibration...
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------
          SVG SAR SCENE RENDERER
          ------------------------------------------------------------ */}
      <div className="sar-viewport" {...bindContainerProps}>
        <MapControls zoom={zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetView} />
        <svg
          className="sar-svg"
          viewBox="0 0 1000 650"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            {/* Background Ocean Grayscale (Raw) */}
            <radialGradient id="rawOceanGrad" cx="40%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#1a222e" />
              <stop offset="60%" stopColor="#121822" />
              <stop offset="100%" stopColor="#0a0e16" />
            </radialGradient>

            {/* Preprocessed dB Heatmap Gradient */}
            <radialGradient id="prepOceanGrad" cx="45%" cy="45%" r="75%">
              <stop offset="0%" stopColor="#0d2438" />
              <stop offset="40%" stopColor="#091b2b" />
              <stop offset="100%" stopColor="#05101a" />
            </radialGradient>

            {/* Oil Slick Dark Attenuation Fill */}
            <linearGradient id="oilSlickRaw" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#05070a" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#020305" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#080b10" stopOpacity="0.90" />
            </linearGradient>

            {/* Segmentation Category Patterns */}
            <pattern id="lookalikePattern" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="12" stroke="#e5a020" strokeWidth="2.5" strokeOpacity="0.4" />
            </pattern>
            <pattern id="landHatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
              <line x1="0" y1="0" x2="0" y2="10" stroke="#6c7a89" strokeWidth="2" strokeOpacity="0.5" />
            </pattern>

            {/* Glowing filter for AI overlays */}
            <filter id="glowOil" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowShip" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>

          {/* ========================================================
              LAYER GROUP A: BASE SCENE (RAW SAR or PREPROCESSED)
              ======================================================== */}
          <g className="sar-layer-base">
            {/* Background Sea Surface */}
            <rect
              x="0" y="0" width="1000" height="650"
              fill={viewMode === 'preprocessed' ? 'url(#prepOceanGrad)' : 'url(#rawOceanGrad)'}
            />

            {/* Speckle Noise Simulation Grid */}
            <g opacity={viewMode === 'raw' ? 0.35 : 0.12}>
              {Array.from({ length: 40 }).map((_, i) => (
                <line
                  key={`h-${i}`}
                  x1="0" y1={i * 18} x2="1000" y2={i * 18}
                  stroke="#ffffff" strokeWidth="0.5" strokeDasharray="1 12 3 8"
                />
              ))}
            </g>

            {/* Land Mass Coastline (Top Right) */}
            <path
              d="M 680,0 C 700,60 740,110 780,140 C 820,170 860,160 910,210 C 950,250 970,310 1000,340 L 1000,0 Z"
              fill={viewMode === 'segmentation' ? CATEGORIES.land.bg : '#24303f'}
              stroke={viewMode === 'segmentation' ? CATEGORIES.land.color : '#3d4f66'}
              strokeWidth="1.5"
              opacity={highlightCategory && highlightCategory !== 'land' ? 0.25 : 1}
            />
            {viewMode === 'segmentation' && (
              <path
                d="M 680,0 C 700,60 740,110 780,140 C 820,170 860,160 910,210 C 950,250 970,310 1000,340 L 1000,0 Z"
                fill="url(#landHatch)"
                opacity={highlightCategory && highlightCategory !== 'land' ? 0.1 : 0.6}
              />
            )}

            {/* Look-alike Region (Bottom Left - Biogenic / Low Wind) */}
            <path
              d="M 140,430 C 190,420 240,450 290,490 C 330,520 310,570 260,600 C 200,630 150,590 120,540 Z"
              fill={
                viewMode === 'segmentation'
                  ? CATEGORIES.lookalike.bg
                  : viewMode === 'preprocessed'
                  ? '#0a1a26'
                  : '#0e141c'
              }
              stroke={viewMode === 'segmentation' ? CATEGORIES.lookalike.color : 'none'}
              strokeWidth="1.5"
              strokeDasharray={viewMode === 'segmentation' ? '4 3' : undefined}
              opacity={highlightCategory && highlightCategory !== 'lookalike' ? 0.2 : 0.9}
            />
            {viewMode === 'segmentation' && (
              <path
                d="M 140,430 C 190,420 240,450 290,490 C 330,520 310,570 260,600 C 200,630 150,590 120,540 Z"
                fill="url(#lookalikePattern)"
                opacity={highlightCategory && highlightCategory !== 'lookalike' ? 0.1 : 0.5}
              />
            )}

            {/* Main Detected Oil Spill Patch (Center) */}
            <path
              d="M 330,260 C 380,230 460,220 540,240 C 600,255 640,290 620,350 C 600,410 530,440 450,430 C 380,420 340,390 310,340 C 290,300 300,280 330,260 Z"
              fill={
                viewMode === 'segmentation'
                  ? CATEGORIES.oil.bg
                  : 'url(#oilSlickRaw)'
              }
              stroke={
                viewMode === 'segmentation'
                  ? CATEGORIES.oil.color
                  : viewMode === 'preprocessed'
                  ? 'rgba(232,66,58,0.4)'
                  : '#000000'
              }
              strokeWidth={viewMode === 'segmentation' ? '2.5' : '1'}
              filter={viewMode === 'segmentation' ? 'url(#glowOil)' : undefined}
              opacity={highlightCategory && highlightCategory !== 'oil' ? 0.2 : 1}
            />

            {/* Preprocessed dB Contour Overlay (Stage 2 or Preprocessed mode) */}
            {(viewMode === 'preprocessed' || activeStageId === 'stg-prep') && (
              <path
                d="M 320,250 C 370,220 470,210 550,230 C 615,248 650,285 630,360 C 610,425 538,452 450,440 C 370,430 330,400 300,345 C 280,300 290,270 320,250 Z"
                fill="none"
                stroke="#00b4d8"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.6"
              />
            )}

            {/* Vessel Targets (Metallic Point Backscatter) */}
            {/* Target 1: HARBOR PIONEER */}
            <g
              transform="translate(580, 270)"
              opacity={highlightCategory && highlightCategory !== 'ship' ? 0.25 : 1}
            >
              <polygon
                points="0,-8 6,6 -6,6"
                fill={viewMode === 'segmentation' ? CATEGORIES.ship.color : '#ffffff'}
                filter="url(#glowShip)"
              />
              <circle r="12" fill="none" stroke={CATEGORIES.ship.color} strokeWidth="1" strokeDasharray="2 2" />
            </g>

            {/* Target 2: DELTA STAR */}
            <g
              transform="translate(400, 195)"
              opacity={highlightCategory && highlightCategory !== 'ship' ? 0.25 : 1}
            >
              <polygon
                points="0,-7 5,5 -5,5"
                fill={viewMode === 'segmentation' ? CATEGORIES.ship.color : '#e0e0e0'}
              />
              <circle r="9" fill="none" stroke={CATEGORIES.ship.color} strokeWidth="0.8" opacity="0.7" />
            </g>
          </g>

          {/* ========================================================
              LAYER GROUP B: STAGE SPECIFIC ANNOTATIONS & GEOMETRY
              ======================================================== */}
          {(activeStageId === 'stg-geom' || activeStageId === 'stg-class') && (
            <g className="sar-layer-annotations">
              {/* Spill Centroid Crosshair */}
              <g transform="translate(470, 340)">
                <line x1="-16" y1="0" x2="16" y2="0" stroke="#f97316" strokeWidth="1.5" />
                <line x1="0" y1="-16" x2="0" y2="16" stroke="#f97316" strokeWidth="1.5" />
                <circle r="22" fill="none" stroke="#f97316" strokeWidth="1" strokeDasharray="3 3" />
                <text x="26" y="4" fill="#f97316" fontSize="11" fontFamily="JetBrains Mono" fontWeight="700">
                  CENTROID: 26°09′N 051°48′E
                </text>
              </g>

              {/* Spill Major Axis Vector */}
              <line
                x1="330" y1="380" x2="610" y2="280"
                stroke="#ffaa00" strokeWidth="1.8" strokeDasharray="6 3"
              />
              <text x="480" y="315" fill="#ffaa00" fontSize="10" fontFamily="JetBrains Mono">
                MAJOR AXIS: 14.8 km (N 18° W)
              </text>
            </g>
          )}

          {/* ========================================================
              SLIDER COMPARE MODE (SPLIT CANVAS CUTOUT)
              ======================================================== */}
          {viewMode === 'slider' && (
            <g className="sar-layer-slider-cutout" clipPath="url(#sliderClip)">
              <clipPath id="sliderClip">
                <rect x="0" y="0" width={sliderPos * 10} height="650" />
              </clipPath>

              {/* Left Side: RAW SAR Canvas */}
              <rect x="0" y="0" width="1000" height="650" fill="url(#rawOceanGrad)" />
              {/* Raw Oil Slick */}
              <path
                d="M 330,260 C 380,230 460,220 540,240 C 600,255 640,290 620,350 C 600,410 530,440 450,430 C 380,420 340,390 310,340 C 290,300 300,280 330,260 Z"
                fill="url(#oilSlickRaw)" stroke="#000" strokeWidth="1"
              />
              {/* Raw Ships */}
              <polygon points="580,262 586,276 574,276" fill="#fff" />
              <polygon points="400,188 405,198 395,198" fill="#e0e0e0" />
            </g>
          )}

          {/* ========================================================
              SLIDER DIVIDER LINE & HANDLE
              ======================================================== */}
          {viewMode === 'slider' && (
            <g className="sar-slider-handle-group" transform={`translate(${sliderPos * 10}, 0)`}>
              <line x1="0" y1="0" x2="0" y2="650" stroke="#0284c7" strokeWidth="2.5" />
              <circle cx="0" cy="325" r="18" fill="#ffffff" stroke="#0284c7" strokeWidth="2.5" filter="drop-shadow(0 1px 3px rgba(15,23,42,0.3))" />
              <path d="M -6,325 L -2,321 L -2,329 Z M 6,325 L 2,321 L 2,329 Z" fill="#0284c7" />
            </g>
          )}

          {/* ========================================================
              GRATICULE / GEOSPATIAL GRID OVERLAY
              ======================================================== */}
          <g className="sar-graticule" opacity="0.35">
            <line x1="250" y1="0" x2="250" y2="650" stroke="#4a5e78" strokeWidth="0.5" strokeDasharray="4 4" />
            <line x1="500" y1="0" x2="500" y2="650" stroke="#4a5e78" strokeWidth="0.5" strokeDasharray="4 4" />
            <line x1="750" y1="0" x2="750" y2="650" stroke="#4a5e78" strokeWidth="0.5" strokeDasharray="4 4" />

            <line x1="0" y1="200" x2="1000" y2="200" stroke="#4a5e78" strokeWidth="0.5" strokeDasharray="4 4" />
            <line x1="0" y1="420" x2="1000" y2="420" stroke="#4a5e78" strokeWidth="0.5" strokeDasharray="4 4" />

            <text x="254" y="20" fill="#7a92b2" fontSize="9" fontFamily="JetBrains Mono">51°40′E</text>
            <text x="504" y="20" fill="#7a92b2" fontSize="9" fontFamily="JetBrains Mono">51°50′E</text>
            <text x="754" y="20" fill="#7a92b2" fontSize="9" fontFamily="JetBrains Mono">52°00′E</text>

            <text x="10" y="196" fill="#7a92b2" fontSize="9" fontFamily="JetBrains Mono">26°15′N</text>
            <text x="10" y="416" fill="#7a92b2" fontSize="9" fontFamily="JetBrains Mono">26°05′N</text>
          </g>

          {/* North Arrow & Scale Bar */}
          <g transform="translate(30, 40)">
            <circle cx="0" cy="0" r="14" fill="rgba(8,12,20,0.7)" stroke="var(--border-subtle)" />
            <path d="M 0,-10 L 4,4 L 0,1 L -4,4 Z" fill="#00b4d8" />
            <text x="0" y="-13" textAnchor="middle" fill="#00b4d8" fontSize="8" fontWeight="bold">N</text>
          </g>

          <g transform="translate(30, 600)">
            <rect x="0" y="-12" width="110" height="24" fill="rgba(8,12,20,0.75)" rx="3" stroke="var(--border-subtle)" />
            <line x1="10" y1="2" x2="100" y2="2" stroke="#ffffff" strokeWidth="2" />
            <line x1="10" y1="-2" x2="10" y2="6" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="100" y1="-2" x2="100" y2="6" stroke="#ffffff" strokeWidth="1.5" />
            <text x="55" y="-3" textAnchor="middle" fill="#ffffff" fontSize="9" fontFamily="JetBrains Mono">5 km</text>
          </g>
          </g>
        </svg>

        {/* ------------------------------------------------------------
            SLIDER DRAG HANDLE TOUCH OVERLAY
            ------------------------------------------------------------ */}
        {viewMode === 'slider' && (
          <div
            className="sar-slider-touch-area"
            style={{ left: `${sliderPos}%` }}
            onMouseDown={handleSliderMouseDown}
          />
        )}
      </div>

      {/* ------------------------------------------------------------
          HOVER PIXEL TELEMETRY INSPECTOR (Floating tooltip)
          ------------------------------------------------------------ */}
      {hoverPixel && (
        <div
          className="sar-pixel-tooltip"
          style={{
            left: Math.min(hoverPixel.x + 14, 580),
            top: Math.max(hoverPixel.y - 70, 10),
          }}
          role="status"
          aria-live="polite"
        >
          <div className="sar-tooltip-title">
            <span className="sar-tooltip-cat-dot" style={{ background: CATEGORIES[hoverPixel.classCat].color }} />
            {hoverPixel.label}
          </div>
          <div className="sar-tooltip-kv">
            <span>Class:</span>
            <strong style={{ color: CATEGORIES[hoverPixel.classCat].color }}>{CATEGORIES[hoverPixel.classCat].name}</strong>
          </div>
          <div className="sar-tooltip-kv">
            <span>Backscatter (σ⁰):</span>
            <strong className="sar-mono-val">{hoverPixel.nrcs}</strong>
          </div>
          <div className="sar-tooltip-kv">
            <span>Location:</span>
            <strong className="sar-mono-val">{hoverPixel.lat} {hoverPixel.lon}</strong>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------
          BOTTOM BAR OVERLAYS (View mode legend / indicator)
          ------------------------------------------------------------ */}
      <div className="sar-viewer-footer">
        <div className="sar-view-status">
          <Info size={12} style={{ marginRight: 4, color: 'var(--text-cyan)' }} />
          <span>
            {viewMode === 'raw' && 'Viewing Unprocessed C-band SAR Amplitude (Intensity + Speckle Noise)'}
            {viewMode === 'preprocessed' && 'Viewing Speckle-Filtered & Radiometrically Calibrated dB Heatmap'}
            {viewMode === 'segmentation' && 'Viewing Deep Learning AI Semantic Classification Overlay'}
            {viewMode === 'slider' && `Split Comparison: Raw (Left ${Math.round(sliderPos)}%) vs AI Segmentation (Right ${Math.round(100 - sliderPos)}%)`}
          </span>
        </div>

        {/* Categories Legend Chips */}
        <div className="sar-category-chips">
          {(Object.keys(CATEGORIES) as ClassCategory[]).map(cat => {
            const info = CATEGORIES[cat];
            const isHighlight = highlightCategory === cat;
            return (
              <span
                key={cat}
                className={`sar-cat-chip ${isHighlight ? 'sar-cat-chip--active' : ''}`}
                style={{
                  borderColor: info.border,
                  backgroundColor: isHighlight ? info.bg : 'transparent',
                }}
                title={info.desc}
              >
                <span className="sar-cat-dot" style={{ background: info.color }} />
                {info.name}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};
