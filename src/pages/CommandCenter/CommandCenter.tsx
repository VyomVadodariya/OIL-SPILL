/**
 * OceanIntel — Command Center Workstation
 *
 * Primary maritime oil spill investigation workstation.
 * Layout structure:
 * - LEFT: Navigation (persistent sidebar)
 * - CENTER: Interactive MapLibre GL Maritime Map (dominant workspace)
 * - RIGHT: Docked Investigation Intelligence Panel
 * - BOTTOM: Chronological Investigation Timeline & Case File Cards
 *
 * All data is simulated for UI demonstration purposes only.
 * Language follows strict scientific and decision-support guidelines.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  AlertTriangle,
  Satellite,
  Activity,
  Play,
  Layers as LayersIcon,
  Compass,
  FileSearch,
} from 'lucide-react';
import type { MapVessel } from '../../components/map/MapLibreMap';
import {
  DEMO_INCIDENT,
  DEMO_CANDIDATES,
  DEMO_TIMELINE,
  type IncidentCandidate,
  type TimelineStep,
} from '../../data/demo/incident';
import { DataStatusBadge } from '../../components/common/DataStatusBadge';
import './CommandCenter.css';

const MapLibreMap = React.lazy(() =>
  import('../../components/map/MapLibreMap').then((m) => ({ default: m.MapLibreMap }))
);

/* ============================================================
   LAYER CONFIGURATION (Design System Unified Palette)
   ============================================================ */

const LAYERS = [
  { id: 'spill',     label: 'Oil Signature',      color: '#f97316' }, // Orange
  { id: 'tracks',    label: 'Vessel Tracks',       color: '#3b82f6' }, // Blue
  { id: 'drift',     label: 'Drift Corridors',     color: '#06b6d4' }, // Teal
  { id: 'lookalike', label: 'Look-alikes',         color: '#eab308' }, // Yellow/Olive
  { id: 'env',       label: 'Environmental Zones', color: '#10b981' }, // Green
  { id: 'exclusion', label: 'Protection Sector',   color: '#f59e0b' }, // Amber
];

/* Investigation Case Index */
const INVESTIGATIONS = [
  {
    id: DEMO_INCIDENT.id,
    name: DEMO_INCIDENT.name,
    status: 'active' as const,
    area: `${DEMO_INCIDENT.detection.areaKm2} km²`,
    candidates: 2,
    since: DEMO_INCIDENT.openedDate,
    isCurrent: true,
  },
  {
    id: 'INC-2026-038',
    name: 'Gulf of Oman — SPILL-2026-038',
    status: 'monitoring' as const,
    area: '12.1 km²',
    candidates: 1,
    since: '2026-08-19',
    isCurrent: false,
  },
  {
    id: 'INC-2026-019',
    name: 'Red Sea Passage — SPILL-2026-019',
    status: 'closed' as const,
    area: '8.4 km²',
    candidates: 0,
    since: '2026-07-12',
    isCurrent: false,
  },
];

/* ============================================================
   SUB-COMPONENTS
   ============================================================ */

const CompatRow: React.FC<{ label: string; score: number }> = ({ label, score }) => (
  <div className="compat-row">
    <span className="compat-row-label">{label}</span>
    <div className="compat-bar-track">
      <div className="compat-bar-fill" style={{ width: `${score}%` }} />
    </div>
    <span className="compat-pct">{score}%</span>
  </div>
);

const ScoreRing: React.FC<{ score: number }> = ({ score }) => {
  const R = 32;
  const C = 2 * Math.PI * R;
  const filled = (score / 100) * C;
  const color = score >= 75 ? '#f97316' : score >= 50 ? '#f59e0b' : '#10b981';

  return (
    <svg
      width={76}
      height={76}
      viewBox="0 0 76 76"
      className="intel-score-ring"
      aria-hidden="true"
    >
      <circle
        cx={38}
        cy={38}
        r={R}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="5"
      />
      <circle
        cx={38}
        cy={38}
        r={R}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeDasharray={`${filled} ${C}`}
        strokeLinecap="round"
        transform="rotate(-90 38 38)"
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
      <text
        x={38}
        y={43}
        textAnchor="middle"
        fontSize="22"
        fontFamily="JetBrains Mono, monospace"
        fontWeight="700"
        fill={color}
      >
        {score}
      </text>
    </svg>
  );
};

/* ---- Docked Investigation Panel (Hierarchy Phase 6) ---- */
interface IntelPanelProps {
  vessel: IncidentCandidate;
}

const IntelPanel: React.FC<IntelPanelProps> = ({ vessel }) => {
  const hasScores = vessel.investigationScore != null;

  return (
    <div className="cc-intel-panel" role="complementary" aria-label="Investigation intelligence panel">
      {/* Header */}
      <div className="intel-header">
        <div className="intel-header-title-group">
          <FileSearch size={14} className="intel-header-icon" aria-hidden="true" />
          <span className="intel-header-label">Investigation Dossier</span>
        </div>
        <DataStatusBadge status="DEMO MODE · SIMULATED DATA" />
      </div>

      {/* 1. ACTIVE DETECTION (What & Where & How Large & How Confident) */}
      <div className="intel-section">
        <div className="intel-section-title">ACTIVE DETECTION</div>
        <div className="intel-feature-name">Detected Oil Signature</div>

        <div className="intel-metrics-grid">
          <div className="intel-metric-box">
            <div className="intel-metric-label">Quality</div>
            <div className="quality-badge quality-badge--high">
              <Satellite size={10} aria-hidden="true" />
              HIGH · SAR
            </div>
          </div>
          <div className="intel-metric-box">
            <div className="intel-metric-label">Confidence</div>
            <div className="intel-metric-value">{DEMO_INCIDENT.detection.confidence}%</div>
          </div>
          <div className="intel-metric-box">
            <div className="intel-metric-label">Spill Area</div>
            <div className="intel-metric-value intel-metric-value--accent">{DEMO_INCIDENT.detection.areaKm2} km²</div>
          </div>
          <div className="intel-metric-box">
            <div className="intel-metric-label">Est. Volume</div>
            <div className="intel-metric-value">{DEMO_INCIDENT.detection.volumeBbl.toLocaleString()} bbl</div>
          </div>
        </div>

        <div className="intel-location-meta">
          <div>Centroid: <span className="intel-mono">{DEMO_INCIDENT.centroid.text}</span> (Offshore Gulf)</div>
          <div>Ref: <span className="intel-mono">{DEMO_INCIDENT.id}</span> · Pass: <span className="intel-mono">06:12:04 UTC</span></div>
        </div>
      </div>

      {/* 2. HIGHEST-RANKED INVESTIGATION CANDIDATE */}
      <div className="intel-section">
        <div className="intel-section-title">HIGHEST-RANKED INVESTIGATION CANDIDATE</div>
        <div className="intel-candidate-name">{vessel.name}</div>

        <div className="intel-candidate-meta">
          <span className="intel-candidate-meta-item">MMSI {vessel.mmsi}</span>
          <span className="intel-candidate-meta-sep">·</span>
          <span className="intel-candidate-meta-item">{vessel.flagName}</span>
          <span className="intel-candidate-meta-sep">·</span>
          <span className="intel-candidate-meta-item">{vessel.type}</span>
        </div>

        <div className="intel-candidate-badges">
          <span className={`intel-status-chip intel-status-chip--${vessel.status}`}>
            Rank #{vessel.rank} · {vessel.status === 'highest-ranked' ? 'HIGHEST-RANKED CANDIDATE' :
                                   vessel.status === 'under-review' ? 'UNDER REVIEW' : vessel.status.toUpperCase()}
          </span>
          {vessel.aisGap && (
            <span className="intel-ais-gap" title="Signal missing during estimated release window">
              <AlertTriangle size={11} aria-hidden="true" />
              AIS observation gap: {vessel.aisGapDuration}
            </span>
          )}
        </div>
      </div>

      {/* 3. INVESTIGATION SCORE */}
      {hasScores && (
        <div className="intel-section">
          <div className="intel-section-title">INVESTIGATION SCORE</div>
          <div className="intel-score-row">
            <ScoreRing score={vessel.investigationScore} />
            <div className="intel-score-details">
              <div className="intel-score-value-row">
                <span className="intel-score-number">{vessel.investigationScore}</span>
                <span className="intel-score-denominator">/ 100</span>
              </div>
              <p className="intel-score-subtext">
                Aggregated multi-factor correlation index (Spatial, Temporal, Drift Trajectory, and Telemetry continuity).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. COMPATIBILITY ANALYSIS */}
      {hasScores && (
        <div className="intel-section">
          <div className="intel-section-title">COMPATIBILITY ANALYSIS (EXPLAINABLE)</div>
          <div className="compat-rows">
            <CompatRow label="Spatial Proximity" score={vessel.spatialScore} />
            <CompatRow label="Temporal Window"  score={vessel.temporalScore} />
            <CompatRow label="Drift Backtrace"  score={vessel.driftScore} />
            <CompatRow label="Heading Alignment" score={vessel.headingScore} />
            <CompatRow label="Speed Profile"     score={Math.max(15, vessel.spatialScore - 6)} />
            <CompatRow label="AIS Continuity"    score={vessel.aisContinuity === 'high' ? 92 : vessel.aisContinuity === 'moderate' ? 65 : 30} />
            <CompatRow label="SAR-AIS Match"    score={vessel.rank === 1 ? 88 : 60} />
          </div>
        </div>
      )}

      {/* 5. EVIDENCE SUMMARY */}
      <div className="intel-section">
        <div className="intel-section-title">EVIDENCE SYNTHESIS</div>
        <p className="intel-evidence-statement">
          Evidence is compatible with investigation hypothesis. Modelled trajectory indicates potential exposure,
          subject to uncertainty. Observed AIS observation gap coincides with backward drift release window.
        </p>
      </div>
    </div>
  );
};

/* ---- Vessel Map Tooltip ---- */
const statusLabel: Record<string, string> = {
  'highest-ranked': 'Highest-Ranked Candidate',
  'under-review': 'Under Review',
  monitored: 'Monitored',
  cleared: 'Cleared',
};

const VesselTooltip: React.FC<{ vessel: IncidentCandidate }> = ({ vessel }) => (
  <div>
    <div className="tooltip-vessel-name">{vessel.name}</div>
    <div className="tooltip-row">
      <span className="tooltip-row-label">Status</span>
      <span className="tooltip-row-value">{statusLabel[vessel.status]}</span>
    </div>
    <div className="tooltip-row">
      <span className="tooltip-row-label">MMSI</span>
      <span className="tooltip-row-value">{vessel.mmsi}</span>
    </div>
    <div className="tooltip-row">
      <span className="tooltip-row-label">Type</span>
      <span className="tooltip-row-value">{vessel.type}</span>
    </div>
    <div className="tooltip-row">
      <span className="tooltip-row-label">Speed</span>
      <span className="tooltip-row-value">{vessel.speed.toFixed(1)} kn</span>
    </div>
    <div className="tooltip-row">
      <span className="tooltip-row-label">Heading</span>
      <span className="tooltip-row-value">{vessel.heading}°</span>
    </div>
    {vessel.aisGap && (
      <div className="tooltip-row" style={{ color: 'var(--status-warning)', marginTop: 4 }}>
        <span>⚠ AIS observation gap: {vessel.aisGapDuration}</span>
      </div>
    )}
    {vessel.investigationScore != null && (
      <div className="tooltip-row" style={{ marginTop: 4 }}>
        <span className="tooltip-row-label">Investigation Score</span>
        <span className="tooltip-row-value" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
          {vessel.investigationScore} / 100
        </span>
      </div>
    )}
  </div>
);

/* ---- Chronological Timeline (Phase 14) ---- */
const Timeline: React.FC<{ events: TimelineStep[] }> = ({ events }) => (
  <div className="cc-timeline-section" role="region" aria-label="Investigation chronological timeline">
    <div className="cc-timeline-title">
      <Activity size={12} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle', color: 'var(--accent-cyan)' }} aria-hidden="true" />
      Investigation Chronology — {DEMO_INCIDENT.id}
    </div>
    <div className="cc-timeline-track-container">
      <div className="cc-timeline-track" />
      {events.map((ev, i) => (
        <div
          key={i}
          className="cc-timeline-event"
          style={{ left: `${ev.pos}%` }}
          title={`${ev.time} [${ev.stage}]: ${ev.label}`}
        >
          {/* Alternating top label */}
          <div
            className="cc-timeline-event-label cc-timeline-event-label--top"
            style={{
              display: i % 2 === 0 ? 'block' : 'none',
              color: 'var(--text-secondary)',
            }}
          >
            {ev.label}
          </div>

          <div
            className="cc-timeline-dot"
            style={{ borderColor: ev.color, backgroundColor: 'var(--surface-raised)' }}
          />

          {/* Time indicator */}
          <div
            className="cc-timeline-event-label cc-timeline-event-label--bottom"
            style={{
              color: ev.time === 'NOW' ? '#10b981' : 'var(--text-primary)',
              fontWeight: 700,
            }}
          >
            {ev.time}
          </div>

          {/* Alternating bottom label */}
          {i % 2 !== 0 && (
            <div className="cc-timeline-event-label cc-timeline-event-label--alt-bottom">
              {ev.label}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

/* ---- Investigation Case Cards ---- */
const statusChipClass: Record<'active' | 'monitoring' | 'closed', string> = {
  active: 'inv-card-status--active',
  monitoring: 'inv-card-status--monitoring',
  closed: 'inv-card-status--closed',
};

const statusChipLabel: Record<'active' | 'monitoring' | 'closed', string> = {
  active: 'ACTIVE',
  monitoring: 'MONITORING',
  closed: 'CLOSED',
};

const InvestigationCards: React.FC = () => (
  <div className="cc-cards-section" role="region" aria-label="Active incident case files">
    {INVESTIGATIONS.map((inv) => (
      <div
        key={inv.id}
        className={`inv-card ${inv.isCurrent ? 'inv-card--active' : ''}`}
        role="button"
        tabIndex={0}
        aria-label={`Case ${inv.id}: ${inv.name}`}
      >
        <div className="inv-card-header">
          <span className="inv-card-id">{inv.id}</span>
          <span className={`inv-card-status ${statusChipClass[inv.status]}`}>
            {statusChipLabel[inv.status]}
          </span>
        </div>
        <div className="inv-card-body">
          <div className="inv-card-name">{inv.name}</div>
          <div className="inv-card-row">
            <span className="inv-card-row-label">Spill area</span>
            <span className="inv-card-row-value">{inv.area}</span>
          </div>
          <div className="inv-card-row">
            <span className="inv-card-row-label">Candidates</span>
            <span className="inv-card-row-value">{inv.candidates}</span>
          </div>
          <div className="inv-card-row">
            <span className="inv-card-row-label">Logged</span>
            <span className="inv-card-row-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
              {inv.since}
            </span>
          </div>
        </div>
      </div>
    ))}
  </div>
);

/* ============================================================
   COMMAND CENTER MAIN WORKSTATION COMPONENT
   ============================================================ */

interface CommandCenterProps {
  onStartGuidedMode?: () => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({ onStartGuidedMode }) => {
  const [selectedVesselId, setSelectedVesselId] = useState<string>('harbor-pioneer');
  const [hoveredVesselId, setHoveredVesselId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [activeLayers, setActiveLayers] = useState<Set<string>>(
    () => new Set(LAYERS.map((l) => l.id))
  );
  const mapAreaRef = useRef<HTMLDivElement>(null);

  const selectedVessel =
    DEMO_CANDIDATES.find((v) => v.id === selectedVesselId) ?? DEMO_CANDIDATES[0];
  const hoveredVessel =
    DEMO_CANDIDATES.find((v) => v.id === hoveredVesselId) ?? null;

  const toggleLayer = useCallback((id: string) => {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleVesselEnter = useCallback((id: string, clientX: number, clientY: number) => {
    const rect = mapAreaRef.current?.getBoundingClientRect();
    if (rect) {
      const x = Math.min(clientX - rect.left + 14, rect.width - 220);
      const y = Math.max(clientY - rect.top - 80, 10);
      setTooltipPos({ x, y });
    }
    setHoveredVesselId(id);
  }, []);

  const handleVesselLeave = useCallback(() => {
    setHoveredVesselId(null);
  }, []);

  return (
    <div className="cc-container" role="main" aria-label="OceanIntel Command Center Workstation">

      {/* ================================================================
          PRIMARY WORKSPACE — MAP (Dominant Center) + DOCKED INTEL PANEL (Right)
          ================================================================ */}
      <div className="cc-workspace">

        {/* Dominant Map Canvas */}
        <div className="cc-map-area" ref={mapAreaRef}>
          <React.Suspense
            fallback={
              <div className="cc-map-loading">
                <Compass size={20} className="animate-spin" />
                <span>Loading Geospatial Basemap...</span>
              </div>
            }
          >
            <MapLibreMap
              vessels={DEMO_CANDIDATES as unknown as MapVessel[]}
              selectedId={selectedVesselId}
              activeLayers={activeLayers}
              onVesselClick={setSelectedVesselId}
              onVesselEnter={handleVesselEnter}
              onVesselLeave={handleVesselLeave}
            />
          </React.Suspense>

          {/* Layer Controls Dock — Unobtrusive Top Left */}
          <div className="cc-layer-controls" aria-label="Geospatial layer controls">
            <div className="cc-layer-controls-title">
              <LayersIcon size={11} aria-hidden="true" />
              <span>LAYERS</span>
            </div>
            {LAYERS.map((layer) => (
              <button
                key={layer.id}
                id={`layer-toggle-${layer.id}`}
                className="layer-toggle"
                data-active={activeLayers.has(layer.id)}
                onClick={() => toggleLayer(layer.id)}
                aria-pressed={activeLayers.has(layer.id)}
                title={activeLayers.has(layer.id) ? `Hide ${layer.label}` : `Show ${layer.label}`}
              >
                <span className="layer-dot" style={{ background: layer.color }} aria-hidden="true" />
                <span>{layer.label}</span>
              </button>
            ))}
          </div>

          {/* Guided Investigation Walkthrough Trigger */}
          {onStartGuidedMode && (
            <div className="cc-guided-cta-box">
              <button
                className="cc-guided-btn"
                onClick={onStartGuidedMode}
                title="Launch 8-Stage Maritime Investigation Walkthrough"
              >
                <Play size={12} fill="currentColor" aria-hidden="true" />
                START GUIDED INVESTIGATION
              </button>
            </div>
          )}

          {/* Vessel Hover Tooltip */}
          {hoveredVessel && (
            <div
              className="cc-map-tooltip"
              style={{ left: tooltipPos.x, top: tooltipPos.y }}
              role="tooltip"
              aria-live="polite"
            >
              <VesselTooltip vessel={hoveredVessel} />
            </div>
          )}
        </div>

        {/* Docked Right Investigation Intelligence Panel */}
        <aside className="cc-intel-dock" aria-label="Investigation intelligence dossier">
          <IntelPanel vessel={selectedVessel} />
        </aside>

      </div>

      {/* ================================================================
          BOTTOM STRIP — Chronological Timeline + Incident Cards
          ================================================================ */}
      <div className="cc-bottom-strip" role="region" aria-label="Investigation chronology and active incidents">
        <Timeline events={DEMO_TIMELINE} />
        <InvestigationCards />
      </div>

    </div>
  );
};
