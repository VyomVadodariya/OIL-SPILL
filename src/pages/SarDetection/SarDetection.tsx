/**
 * OceanIntel — SAR Detection Screen
 *
 * Satellite Synthetic Aperture Radar (SAR) processing workstation.
 * Explains how a satellite SAR observation is processed into an oil spill detection.
 *
 * Split-pane layout:
 * - LEFT: Dominant SAR viewer with RAW, PREPROCESSED, AI SEGMENTATION & SLIDER compare modes.
 * - RIGHT: Detection Intelligence panel (Quality, Model, Scene info, Segmentation summary, Category breakdown).
 * - BOTTOM: 5-Stage Processing Pipeline (SAR Scene → Preprocessing → Segmentation → Classification → Spill Geometry).
 *
 * All data is simulated for UI demonstration purposes only.
 */

import React, { useState, useCallback } from 'react';
import {
  Satellite,
  Cpu,
  CheckCircle2,
  ChevronRight,
  Info,
} from 'lucide-react';

import { SarViewer, CATEGORIES, type SarViewMode, type ClassCategory } from './SarViewer';
import { DataStatusBadge } from '../../components/common/DataStatusBadge';
import './SarDetection.css';

/* ============================================================
   PIPELINE STAGE DEFINITIONS
   ============================================================ */

interface Stage {
  id: string;
  num: number;
  name: string;
  shortName: string;
  defaultViewMode: SarViewMode;
  detail: string;
  subText: string;
}

const STAGES: Stage[] = [
  {
    id: 'stg-raw',
    num: 1,
    name: 'RAW SAR',
    shortName: '1. RAW SAR',
    defaultViewMode: 'raw',
    detail: 'Raw C-band SAR amplitude acquisition captured by Sentinel-1A (IW VV polarization). Contains speckle noise & ocean clutter.',
    subText: 'Raw backscatter (Intensity)',
  },
  {
    id: 'stg-prep',
    num: 2,
    name: 'PREPROCESSING',
    shortName: '2. PREPROCESSING',
    defaultViewMode: 'preprocessed',
    detail: 'Radiometric calibration converts digital numbers to NRCS σ⁰ (dB). Refined Lee speckle filter reduces sea surface noise.',
    subText: 'Calibrated σ⁰ dB Heatmap',
  },
  {
    id: 'stg-seg',
    num: 3,
    name: 'AI SEGMENTATION',
    shortName: '3. AI SEGMENTATION',
    defaultViewMode: 'segmentation',
    detail: 'Deep neural network (U-Net + ResNet34 architecture) isolates low-backscatter candidate regions from background ocean clutter.',
    subText: 'Binary Segmentation Mask',
  },
  {
    id: 'stg-oil',
    num: 4,
    name: 'OIL SIGNATURE',
    shortName: '4. OIL SIGNATURE',
    defaultViewMode: 'segmentation',
    detail: 'Isolates confirmed crude oil backscatter depression (mean damping -24.6 dB) from ambient open ocean surface.',
    subText: 'High-Damping Plume Extraction',
  },
  {
    id: 'stg-lookalike',
    num: 5,
    name: 'LOOK-ALIKE FILTER',
    shortName: '5. LOOK-ALIKE FILTER',
    defaultViewMode: 'segmentation',
    detail: 'Distinguishes natural low-wind calm slicks, biogenic surfactant films, and internal ocean wave artifacts from mineral crude.',
    subText: 'False-Positive Rejection',
  },
  {
    id: 'stg-geom',
    num: 6,
    name: 'SPILL CHARACTERIZATION',
    shortName: '6. SPILL CHARACTERIZATION',
    defaultViewMode: 'segmentation',
    detail: 'Morphological boundary closing extracts polygon metrics: 42.7 km² surface area, 2.8:1 elongation, N 18° W orientation.',
    subText: 'Vector Polygon & Metrics',
  },
];

/* Category statistics */
interface CatStat {
  id: ClassCategory;
  area: string;
  pct: string;
  nrcs: string;
  qualityScore: string;
}

const CATEGORY_STATS: CatStat[] = [
  { id: 'sea',       area: '39,438 km²', pct: '98.6%', nrcs: '-12.4 dB', qualityScore: '99/100' },
  { id: 'oil',       area: '42.7 km²',   pct: '0.11%', nrcs: '-24.6 dB', qualityScore: '92/100' },
  { id: 'lookalike', area: '18.4 km²',   pct: '0.05%', nrcs: '-18.2 dB', qualityScore: '78/100' },
  { id: 'ship',      area: '2 targets',  pct: '<0.01%', nrcs: '+7.5 dB',  qualityScore: '96/100' },
  { id: 'land',      area: '500.9 km²',  pct: '1.25%', nrcs: '+2.1 dB',  qualityScore: '99/100' },
];

/* ============================================================
   MAIN COMPONENT — SarDetection
   ============================================================ */

export const SarDetection: React.FC = () => {
  const [activeStageId, setActiveStageId] = useState<string>('stg-class');
  const [viewMode, setViewMode] = useState<SarViewMode>('segmentation');
  const [highlightCat, setHighlightCat] = useState<ClassCategory | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  /* Handle stage selection with dynamic view switching & processing scan simulation */
  const handleStageSelect = useCallback((stage: Stage) => {
    setActiveStageId(stage.id);
    setIsProcessing(true);
    setViewMode(stage.defaultViewMode);

    // Simulate short processing scan burst
    setTimeout(() => {
      setIsProcessing(false);
    }, 450);
  }, []);

  const activeStage = STAGES.find(s => s.id === activeStageId) ?? STAGES[3];

  return (
    <div className="sar-detection-container" role="main" aria-label="OceanIntel SAR Detection Workstation">
      {/* ============================================================
          MAIN WORKSPACE — LEFT VIEWER (~65%) & RIGHT PANEL (~35%)
          ============================================================ */}
      <div className="sar-workspace">
        {/* ----- LEFT: SAR SCENE / MAP VIEWER ----- */}
        <SarViewer
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          activeStageId={activeStageId}
          onStageChange={(stgId) => {
            const stg = STAGES.find(s => s.id === stgId);
            if (stg) handleStageSelect(stg);
          }}
          highlightCategory={highlightCat}
          isProcessing={isProcessing}
        />

        {/* ----- RIGHT: DETECTION INTELLIGENCE PANEL ----- */}
        <aside className="sar-intel-panel" aria-label="Detection Intelligence Panel">
          {/* Header */}
          <div className="sar-panel-header">
            <span className="sar-panel-title">Detection Intelligence</span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <DataStatusBadge status="DEMO SAR · SIMULATED DATA" />
              <DataStatusBadge status="MODEL PREVIEW" />
            </div>
          </div>

          {/* Panel Body */}
          <div className="sar-panel-body">

            {/* SECTION 1: Detection Status & Model */}
            <div className="sar-section">
              <div className="sar-section-header">
                <span className="sar-section-num">1</span>
                <span className="sar-section-name">Detection &amp; Model Status</span>
              </div>
              <div className="sar-section-body">
                <div className="sar-kv">
                  <span className="sar-kv-label">Detection Quality</span>
                  <span className="badge badge-critical" style={{ fontSize: '10px' }}>
                    <Satellite size={9} style={{ marginRight: 3 }} />
                    HIGH · SAR
                  </span>
                </div>

                <div className="sar-kv">
                  <span className="sar-kv-label">AI Segmentation Model</span>
                  <span className="sar-kv-val sar-kv-val--mono">U-Net + ResNet34</span>
                </div>

                <div className="sar-kv">
                  <span className="sar-kv-label">Model Architecture</span>
                  <span className="sar-kv-val" style={{ fontSize: '11px' }}>U-Net + ResNet34 (Single-Channel VV SAR)</span>
                </div>

                <div className="sar-kv">
                  <span className="sar-kv-label">Processing Status</span>
                  <span className="sar-kv-val sar-kv-val--cyan">
                    <CheckCircle2 size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                    MODEL PREVIEW · DEMO DATA
                  </span>
                </div>

                <div className="sar-kv">
                  <span className="sar-kv-label">Inference Mode</span>
                  <span className="sar-kv-val sar-kv-val--mono" style={{ color: 'var(--status-warning)' }}>Offline Preview (Non-live)</span>
                </div>
              </div>
            </div>

            {/* SECTION 2: Scene Information */}
            <div className="sar-section">
              <div className="sar-section-header">
                <span className="sar-section-num">2</span>
                <span className="sar-section-name">Satellite Scene Information</span>
              </div>
              <div className="sar-section-body">
                <div className="sar-kv">
                  <span className="sar-kv-label">Satellite Constellation</span>
                  <span className="sar-kv-val">Sentinel-1A (ESA CopHub)</span>
                </div>

                <div className="sar-kv">
                  <span className="sar-kv-label">Sensor Mode</span>
                  <span className="sar-kv-val sar-kv-val--mono">IW (Interferometric Wide)</span>
                </div>

                <div className="sar-kv">
                  <span className="sar-kv-label">Polarization</span>
                  <span className="sar-kv-val sar-kv-val--mono">VV (Copolarized Single-Channel)</span>
                </div>

                <div className="sar-kv">
                  <span className="sar-kv-label">Pass Direction</span>
                  <span className="sar-kv-val">Ascending (Track 142)</span>
                </div>

                <div className="sar-kv">
                  <span className="sar-kv-label">Acquisition Timestamp</span>
                  <span className="sar-kv-val sar-kv-val--mono">2026-09-07 06:12:04 UTC</span>
                </div>

                <div className="sar-kv">
                  <span className="sar-kv-label">Spatial Resolution</span>
                  <span className="sar-kv-val sar-kv-val--mono">10m × 10m pixel size</span>
                </div>

                <div className="sar-kv">
                  <span className="sar-kv-label">Incidence Angle Range</span>
                  <span className="sar-kv-val sar-kv-val--mono">34.2° – 45.1°</span>
                </div>

                <div className="sar-kv">
                  <span className="sar-kv-label">Scene Footprint</span>
                  <span className="sar-kv-val sar-kv-val--mono">250 km × 160 km</span>
                </div>
              </div>
            </div>

            {/* SECTION 3: Classification Categories (PLANNED EXTENSION) */}
            <div className="sar-section">
              <div className="sar-section-header">
                <span className="sar-section-num">3</span>
                <span className="sar-section-name">Classification Categories (PLANNED EXTENSION)</span>
                <span className="badge badge-warning" style={{ fontSize: '8px', marginLeft: 'auto' }}>PLANNED EXTENSION</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.4 }}>
                Current executable model is Binary Segmentation (Sea vs Oil). Multi-class segmentation (Sea, Oil, Look-alike, Ship, Land) is a planned architectural extension.
              </div>
              <div className="sar-section-body">
                <div className="sar-cat-list">
                  {CATEGORY_STATS.map(stat => {
                    const catInfo = CATEGORIES[stat.id];
                    const isSelected = highlightCat === stat.id;

                    return (
                      <div
                        key={stat.id}
                        className={`sar-cat-card ${isSelected ? 'sar-cat-card--selected' : ''}`}
                        onClick={() => setHighlightCat(isSelected ? null : stat.id)}
                        role="button"
                        tabIndex={0}
                        aria-label={`Highlight category ${catInfo.name}`}
                      >
                        <div className="sar-cat-card-header">
                          <span className="sar-cat-card-title" style={{ color: catInfo.color }}>
                            <span className="sar-cat-card-dot" style={{ background: catInfo.color }} />
                            {catInfo.name}
                          </span>
                          <span className="sar-cat-card-area">{stat.area}</span>
                        </div>
                        <div className="sar-cat-card-meta">
                          <span>Footprint: {stat.pct}</span>
                          <span>Mean σ⁰: {stat.nrcs}</span>
                          <span>Quality: {stat.qualityScore}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SECTION 4: Segmentation & Metric Summary */}
            <div className="sar-section">
              <div className="sar-section-header">
                <span className="sar-section-num">4</span>
                <span className="sar-section-name">Segmentation Summary</span>
              </div>
              <div className="sar-section-body">
                <div className="sar-kv">
                  <span className="sar-kv-label">Candidate Surface Area</span>
                  <span className="sar-kv-val sar-kv-val--cyan" style={{ fontSize: '13px' }}>42.7 km²</span>
                </div>

                <div className="sar-kv">
                  <span className="sar-kv-label">Estimated Volume</span>
                  <span className="sar-kv-val sar-kv-val--mono">4,820 bbl (820 m³)</span>
                </div>

                <div className="sar-kv">
                  <span className="sar-kv-label">NRCS Contrast Ratio</span>
                  <span className="sar-kv-val sar-kv-val--mono">-12.2 dB (Oil vs Sea)</span>
                </div>

                <div className="sar-kv">
                  <span className="sar-kv-label">Slick Damping Ratio</span>
                  <span className="sar-kv-val sar-kv-val--mono">1.82 (Heavy Damping)</span>
                </div>

                <div className="sar-kv">
                  <span className="sar-kv-label">Local Wind Speed</span>
                  <span className="sar-kv-val sar-kv-val--mono">6.2 knots (Optimal SAR window)</span>
                </div>

                <div style={{ marginTop: 6, fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Notice: Hydrocarbon signature exhibits characteristic dark backscatter attenuation with crisp damping boundaries.
                </div>
              </div>
            </div>

          </div>{/* end panel body */}
        </aside>
      </div>

      {/* ============================================================
          BOTTOM PIPELINE BAR — 5 Stages
          ============================================================ */}
      <div className="sar-pipeline-bar" role="region" aria-label="SAR Processing Pipeline">
        <div className="sar-pipeline-header">
          <span className="sar-pipeline-title">
            <Cpu size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
            SAR Detection Processing Pipeline
          </span>
          <span className="sar-pipeline-sub">
            Click pipeline stage to inspect visual output &amp; transformation details
          </span>
        </div>

        {/* 5-Stage Track */}
        <div className="sar-pipeline-track" role="tablist" aria-label="Pipeline stages">
          {STAGES.map((stage, idx) => {
            const isActive = stage.id === activeStageId;
            return (
              <React.Fragment key={stage.id}>
                <button
                  id={`sar-stage-${stage.id}`}
                  className={`sar-pipe-stage ${isActive ? 'sar-pipe-stage--active' : ''}`}
                  onClick={() => handleStageSelect(stage)}
                  role="tab"
                  aria-selected={isActive}
                  title={stage.detail}
                >
                  <div className="sar-pipe-num">{stage.num}</div>
                  <div className="sar-pipe-info">
                    <span className="sar-pipe-name">{stage.name}</span>
                    <span className="sar-pipe-detail">{stage.subText}</span>
                  </div>
                </button>

                {idx < STAGES.length - 1 && (
                  <ChevronRight size={14} className="sar-pipe-arrow" aria-hidden="true" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Active Stage Detail Banner */}
        <div className="sar-stage-banner">
          <span className="sar-stage-tag">{activeStage.shortName}</span>
          <Info size={12} style={{ flexShrink: 0, color: 'var(--text-cyan)' }} aria-hidden="true" />
          <span>{activeStage.detail}</span>
        </div>
      </div>
    </div>
  );
};
