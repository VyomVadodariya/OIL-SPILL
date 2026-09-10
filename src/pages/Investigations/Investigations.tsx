/**
 * OceanIntel — Investigation Dashboard
 *
 * Dedicated single-incident investigation workstation.
 * Language follows OceanIntel terminology guidelines — see inline comments.
 */

import React, { useState, useRef, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import { InvestigationMap, type InvVesselMark, type VesselStatus } from './InvestigationMap';
import { DEMO_CANDIDATES } from '../../data/demo/incident';
import { DataStatusBadge } from '../../components/common/DataStatusBadge';
import './Investigations.css';

/* ============================================================
   CANONICAL CANDIDATES (Imported from DEMO_INCIDENT)
   ============================================================ */

interface Vessel extends InvVesselMark {
  mmsi: string;
  flag: string;
  flagName: string;
  type: string;
  dwt: string;
  aisGapDuration?: string;
  lastAis: string;
  invScore?: number;
  spatialScore?: number;
  temporalScore?: number;
  driftScore?: number;
  aisContinuity?: 'high' | 'moderate' | 'low';
}

const VESSELS: Vessel[] = DEMO_CANDIDATES as unknown as Vessel[];

/* Layer config */
const MAP_LAYERS = [
  { id: 'sar',        label: 'SAR Scene',        color: '#00b4d8' },
  { id: 'oilsig',    label: 'Oil Signature',     color: '#f97316' },
  { id: 'vessels',   label: 'Vessels',           color: '#3b82f6' },
  { id: 'aistracks', label: 'AIS Tracks',        color: '#3b82f6' },
  { id: 'bwddrift',  label: 'Backward Drift',    color: '#f59e0b' },
  { id: 'fwddrift',  label: 'Forward Drift',     color: '#06b6d4' },
  { id: 'environment', label: 'Environment',     color: '#10b981' },
];

/* Timeline stages */
interface Stage {
  id: string;
  label: string;
  shortLabel: string;
  detail: string;
  status: 'done' | 'active' | 'pending';
}

const STAGES: Stage[] = [
  {
    id: 's1',  label: 'SAR Detection',      shortLabel: 'SAR',
    detail: 'Sentinel-1A ascending pass — surface anomaly detected at 06:12 UTC, 2026-09-07. Scene footprint: 250×160 km.',
    status: 'done',
  },
  {
    id: 's2',  label: 'Oil Segmentation',   shortLabel: 'Segmentation',
    detail: 'NRCS-based threshold segmentation isolated 42.7 km² hydrocarbon signature from background clutter. Quality Score: 92/100.',
    status: 'done',
  },
  {
    id: 's3',  label: 'Spill Characterization', shortLabel: 'Characterization',
    detail: 'Elongation 2.8:1 · Orientation N 18° W · Estimated volume 4,820 bbl · Weathering state: fresh-intermediate.',
    status: 'done',
  },
  {
    id: 's4',  label: 'Backward Drift',     shortLabel: 'Bwd. Drift',
    detail: 'CMEMS current reanalysis + ECMWF ERA5 wind. Source window modelled to 2026-09-07 02:00–04:00 UTC (±1h uncertainty).',
    status: 'done',
  },
  {
    id: 's5',  label: 'Source Corridor',    shortLabel: 'Corridor',
    detail: 'Probable release corridor: 28.38°–28.52°N / 52.10°–52.25°E. Area 28 km².',
    status: 'done',
  },
  {
    id: 's6',  label: 'AIS Reconstruction', shortLabel: 'AIS Recon.',
    detail: '5 vessels observed transiting the source corridor within the modelled release window. Data from MarineTraffic historic AIS.',
    status: 'done',
  },
  {
    id: 's7',  label: 'Candidate Ranking',  shortLabel: 'Ranking',
    detail: 'Multi-factor scoring applied: spatial, temporal, drift, AIS continuity. HARBOR PIONEER ranked first (Score 87/100).',
    status: 'done',
  },
  {
    id: 's8',  label: 'Evidence Analysis',  shortLabel: 'Evidence',
    detail: 'Cross-correlation of spill geometry, vessel track, cargo grade, and AIS observation gap. Evidence is compatible with investigation hypothesis.',
    status: 'active',
  },
  {
    id: 's9',  label: 'Forward Drift',      shortLabel: 'Fwd. Drift',
    detail: 'Modelled trajectory indicates potential exposure to sensitive zones, subject to uncertainty. 72h outlook computed.',
    status: 'pending',
  },
  {
    id: 's10', label: 'Environmental Exposure', shortLabel: 'Exposure',
    detail: '3 sensitive marine zones observed within 72h drift corridor. Modelled trajectory indicates potential exposure, subject to uncertainty.',
    status: 'pending',
  },
];

/* Evidence items */
const EVIDENCE = [
  {
    text: 'SAR detection window coincides with AIS observation gap period for vessel.',
    weight: 'Strong',
    level: 'strong',
  },
  {
    text: 'Vessel\'s last known position intersects backward drift source corridor.',
    weight: 'Strong',
    level: 'strong',
  },
  {
    text: 'Vessel heading and speed consistent with modelled spill origin trajectory.',
    weight: 'Moderate',
    level: 'moderate',
  },
  {
    text: 'Vessel previously transited the same route on two prior occasions.',
    weight: 'Circumstantial',
    level: 'circumstantial',
  },
  {
    text: 'Spill oil composition is consistent with vessel\'s declared cargo grade.',
    weight: 'Moderate',
    level: 'moderate',
  },
];

/* ============================================================
   SUB-COMPONENTS
   ============================================================ */

/* ---- Score ring ---- */
const ScoreRing: React.FC<{ score: number; size?: number }> = ({ score, size = 52 }) => {
  const R = (size / 2) - 5;
  const C = 2 * Math.PI * R;
  const fill = (score / 100) * C;
  const color = score >= 75 ? '#e8423a' : score >= 50 ? '#e5a020' : '#2ece7a';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size/2} cy={size/2} r={R}
              fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4"/>
      <circle cx={size/2} cy={size/2} r={R}
              fill="none" stroke={color} strokeWidth="4"
              strokeDasharray={`${fill} ${C}`}
              strokeLinecap="round"
              transform={`rotate(-90 ${size/2} ${size/2})`}
              style={{ transition: 'stroke-dasharray 0.4s ease' }}/>
    </svg>
  );
};

/* ---- Compat bar row ---- */
const CompatBar: React.FC<{ label: string; score: number }> = ({ label, score }) => {
  const cls = score >= 75 ? 'high' : score >= 45 ? 'moderate' : 'low';
  return (
    <div className="inv-compat-row">
      <span className="inv-compat-label">{label}</span>
      <div className="inv-compat-track">
        <div className={`inv-compat-fill inv-compat-fill--${cls}`}
             style={{ width: `${score}%` }}/>
      </div>
      <span className="inv-compat-pct">{score}%</span>
    </div>
  );
};

/* ---- Right intelligence panel ---- */
interface RightPanelProps { vessel: Vessel }

const RightPanel: React.FC<RightPanelProps> = ({ vessel }) => {
  const hasScores = vessel.invScore != null;

  return (
    <div className="inv-right-panel" role="complementary" aria-label="Investigation intelligence panel">
      {/* Header */}
      <div className="inv-panel-header">
        <span className="inv-panel-title">Investigation · INC-2026-047</span>
        <DataStatusBadge status="DEMO MODE · SIMULATED DATA" />
      </div>

      <div className="inv-panel-body">

        {/* ========================================
            SECTION 1 — Detected Oil Signature
            ======================================== */}
        <div className="inv-section">
          <div className="inv-section-header">
            <span className="inv-section-num">1</span>
            <span className="inv-section-name">Detected Oil Signature</span>
          </div>
          <div className="inv-section-body">

            <div className="inv-kv">
              <span className="inv-kv-label">Detection Quality</span>
              <span className="inv-quality-badge">HIGH · SAR</span>
            </div>

            <div className="inv-kv">
              <span className="inv-kv-label">Spill Area</span>
              <span className="inv-kv-value inv-kv-value--primary">42.7 km²</span>
            </div>

            <div className="inv-kv">
              <span className="inv-kv-label">Centroid</span>
              <span className="inv-kv-value inv-kv-value--mono">26°09′N · 051°48′E</span>
            </div>

            <div className="inv-kv">
              <span className="inv-kv-label">Elongation</span>
              <span className="inv-kv-value">2.8 : 1</span>
            </div>

            <div className="inv-kv">
              <span className="inv-kv-label">Orientation</span>
              <span className="inv-kv-value">N 18° W</span>
            </div>

            <div className="inv-kv">
              <span className="inv-kv-label">Sensor</span>
              <span className="inv-kv-value">Sentinel-1A · IW · VV</span>
            </div>

            <div className="inv-kv">
              <span className="inv-kv-label">Detected</span>
              <span className="inv-kv-value inv-kv-value--mono">2026-09-07 06:12 UTC</span>
            </div>

          </div>
        </div>

        {/* ========================================
            SECTION 2 — Highest-Ranked Candidate
            Candidate evaluation and compatibility
            ======================================== */}
        <div className="inv-section">
          <div className="inv-section-header">
            <span className="inv-section-num">2</span>
            <span className="inv-section-name">Highest-Ranked Investigation Candidate</span>
          </div>
          <div className="inv-section-body">

            <div>
              <div className="inv-candidate-name">{vessel.name}</div>
              <div className="inv-candidate-meta">
                <span>{vessel.type}</span>
                <span>·</span>
                <span>{vessel.flag} · {vessel.flagName}</span>
                <span>·</span>
                <span>{vessel.dwt}</span>
              </div>
              <div style={{ marginTop: 6, display: 'flex', gap: 'var(--space-1-5)', flexWrap: 'wrap' }}>
                <span className={`inv-chip inv-chip--${vessel.status}`}>
                  {vessel.status === 'highest-ranked' ? 'HIGHEST-RANKED INVESTIGATION CANDIDATE' :
                   vessel.status === 'under-review' ? 'UNDER REVIEW' : vessel.status.toUpperCase()}
                </span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  MMSI {vessel.mmsi}
                </span>
              </div>
            </div>

            {/* Investigation score */}
            {hasScores && (
              <div className="inv-score-row">
                <ScoreRing score={vessel.invScore!}/>
                <div>
                  <div className="inv-score-number"
                       style={{ color: vessel.invScore! >= 75 ? '#e8423a' : vessel.invScore! >= 50 ? '#e5a020' : '#2ece7a' }}>
                    {vessel.invScore}
                  </div>
                  <div className="inv-score-sub">Investigation Score</div>
                </div>
              </div>
            )}

            {/* Compatibility scores */}
            {hasScores && (
              <div className="inv-compat-list">
                <CompatBar label="Spatial"   score={vessel.spatialScore!}/>
                <CompatBar label="Temporal"  score={vessel.temporalScore!}/>
                <CompatBar label="Drift"     score={vessel.driftScore!}/>
              </div>
            )}

            {/* AIS Continuity */}
            <div className="inv-kv">
              <span className="inv-kv-label">AIS Continuity</span>
              <span className={`inv-chip ${
                vessel.aisContinuity === 'low'      ? 'inv-chip--under-review' :
                vessel.aisContinuity === 'moderate' ? 'inv-chip--monitored'    : 'inv-chip--cleared'
              }`}>
                {vessel.aisContinuity?.toUpperCase() ?? '—'}
              </span>
            </div>

            {vessel.aisGap && (
              <div className="inv-ais-alert" role="alert">
                <AlertTriangle size={12} className="inv-ais-alert-icon"
                               color="var(--status-warning)" aria-hidden="true"/>
                <div className="inv-ais-alert-text">
                  {/* REQUIRED LANGUAGE */}
                  <span className="inv-ais-alert-label">AIS observation gap detected.&nbsp;</span>
                  Duration: {vessel.aisGapDuration}.
                  Last transmission: {vessel.lastAis}.
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ========================================
            SECTION 3 — Evidence
            LANGUAGE: "Evidence is compatible with investigation hypothesis."
            ======================================== */}
        <div className="inv-section">
          <div className="inv-section-header">
            <span className="inv-section-num">3</span>
            <span className="inv-section-name">Evidence</span>
          </div>
          <div className="inv-section-body">

            <div className="inv-evidence-list">
              {EVIDENCE.map((ev, i) => (
                <div key={i} className="inv-evidence-item">
                  <div className={`inv-evidence-icon inv-evidence-icon--${ev.level}`}
                       aria-hidden="true">
                    {ev.level === 'strong' ? '✓' : ev.level === 'moderate' ? '◑' : '○'}
                  </div>
                  <div>
                    <div className="inv-evidence-text">{ev.text}</div>
                    <div className="inv-evidence-weight">{ev.weight}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mandatory scientific disclaimer statement */}
            <div className="inv-evidence-stmt">
              Evidence is compatible with investigation hypothesis.
              Findings support further formal investigation. No legal determination
              has been made.
            </div>

          </div>
        </div>

      </div>{/* end panel-body */}
    </div>
  );
};

/* ---- Bottom timeline ---- */
interface TimelineProps {
  stages: Stage[];
  activeStageId: string;
  onStageClick: (id: string) => void;
}

const Timeline: React.FC<TimelineProps> = ({ stages, activeStageId, onStageClick }) => {
  const activeStage = stages.find(s => s.id === activeStageId) ?? stages[7];
  const doneCount = stages.filter(s => s.status === 'done').length;

  return (
    <div className="inv-timeline" role="region" aria-label="Investigation pipeline timeline">
      {/* Header */}
      <div className="inv-timeline-header">
        <span className="inv-timeline-label">
          Investigation Pipeline · INC-2026-047
        </span>
        <span className="inv-timeline-step-count">
          {doneCount}/{stages.length} stages complete
        </span>
      </div>

      {/* Stages */}
      <div className="inv-stage-track" role="tablist" aria-label="Investigation stages">
        {stages.map((stage) => {
          const isActive = stage.id === activeStageId;
          const nodeClass =
            stage.status === 'done'    ? 'inv-stage-node--done'    :
            stage.status === 'active'  ? 'inv-stage-node--active'  : 'inv-stage-node--pending';

          return (
            <button
              key={stage.id}
              id={`stage-btn-${stage.id}`}
              className="inv-stage"
              data-active={isActive}
              data-done={stage.status === 'done'}
              onClick={() => onStageClick(stage.id)}
              role="tab"
              aria-selected={isActive}
              title={stage.label}
            >
              <div className={`inv-stage-node ${nodeClass}`} aria-hidden="true">
                {stage.status === 'done'    ? '✓'  :
                 stage.status === 'active'  ? '◉'  : '○'}
              </div>
              <span className="inv-stage-name">{stage.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Selected stage detail */}
      <div className="inv-stage-detail" role="tabpanel" aria-labelledby={`stage-btn-${activeStageId}`}>
        <span className="inv-stage-detail-badge">{activeStage.label}</span>
        <span className="inv-stage-detail-sep">—</span>
        <span className="inv-stage-detail-text">{activeStage.detail}</span>
      </div>
    </div>
  );
};

/* ---- Vessel hover tooltip ---- */
const VTooltip: React.FC<{ vessel: Vessel }> = ({ vessel }) => (
  <div>
    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
      {vessel.name}
    </div>
    {([
      ['MMSI',   vessel.mmsi],
      ['Type',   vessel.type],
      ['Flag',   `${vessel.flag} · ${vessel.flagName}`],
      ['Speed',  `${vessel.speed.toFixed(1)} kn`],
      ['Heading',`${vessel.heading}°`],
    ] as [string,string][]).map(([l,v]) => (
      <div key={l} style={{ display:'flex', justifyContent:'space-between', gap:16, fontSize:'var(--text-xs)', marginTop:2 }}>
        <span style={{ color:'var(--text-muted)' }}>{l}</span>
        <span style={{ color:'var(--text-secondary)', fontFamily:'var(--font-data)', fontVariantNumeric:'tabular-nums' }}>{v}</span>
      </div>
    ))}
    {vessel.aisGap && (
      <div style={{ color:'var(--status-warning)', fontSize:'var(--text-xs)', marginTop:5, display:'flex', gap:4 }}>
        <AlertTriangle size={10} style={{ flexShrink:0, marginTop:1 }} aria-hidden="true"/>
        AIS observation gap: {vessel.aisGapDuration}
      </div>
    )}
    {vessel.invScore != null && (
      <div style={{ fontSize:'var(--text-xs)', marginTop:5, paddingTop:4, borderTop:'1px solid var(--border-faint)', display:'flex', justifyContent:'space-between' }}>
        <span style={{ color:'var(--text-muted)' }}>Investigation Score</span>
        <span style={{ color:'var(--text-primary)', fontFamily:'var(--font-data)', fontWeight:700 }}>{vessel.invScore}</span>
      </div>
    )}
  </div>
);

/* ============================================================
   INVESTIGATIONS — main page
   ============================================================ */

export const Investigations: React.FC = () => {
  /* Default: show HARBOR PIONEER (highest-ranked) in the panel */
  const [selectedVesselId, setSelectedVesselId] = useState<string>('harbor-pioneer');
  const [hoveredVesselId, setHoveredVesselId]   = useState<string | null>(null);
  const [tooltipPos, setTooltipPos]   = useState({ x: 0, y: 0 });
  const [activeStageId, setActiveStageId] = useState<string>('s8');  /* Evidence Analysis — active */
  const [activeLayers, setActiveLayers] = useState<Set<string>>(
    () => new Set(MAP_LAYERS.map(l => l.id))
  );

  const mapAreaRef = useRef<HTMLDivElement>(null);

  const selectedVessel = VESSELS.find(v => v.id === selectedVesselId) ?? VESSELS[0];
  const hoveredVessel  = VESSELS.find(v => v.id === hoveredVesselId) ?? null;

  const toggleLayer = useCallback((id: string) => {
    setActiveLayers(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }, []);

  const handleVesselEnter = useCallback((id: string, clientX: number, clientY: number) => {
    const rect = mapAreaRef.current?.getBoundingClientRect();
    if (rect) {
      const x = Math.min(clientX - rect.left + 14, rect.width  - 200);
      const y = Math.max(clientY - rect.top  - 72, 8);
      setTooltipPos({ x, y });
    }
    setHoveredVesselId(id);
  }, []);

  const handleVesselLeave = useCallback(() => setHoveredVesselId(null), []);

  /* Narrow InvVesselMark for map component */
  const vesselMarks: InvVesselMark[] = VESSELS.map(v => ({
    id: v.id, name: v.name, status: v.status as VesselStatus,
    lat: v.lat, lon: v.lon, heading: v.heading, speed: v.speed,
    aisGap: v.aisGap, trackPath: v.trackPath,
  }));

  return (
    <div className="inv-container" role="main" aria-label="OceanIntel Investigation Dashboard">

      {/* ==================================================
          WORKSPACE — map (center) + right panel
          ================================================== */}
      <div className="inv-workspace">

        {/* ----- MAP AREA ----- */}
        <div className="inv-map-area" ref={mapAreaRef}>
          <InvestigationMap
            vessels={vesselMarks}
            selectedId={selectedVesselId}
            activeLayers={activeLayers}
            onVesselClick={setSelectedVesselId}
            onVesselEnter={handleVesselEnter}
            onVesselLeave={handleVesselLeave}
          />

          {/* Layer controls — floating top-left */}
          <div className="inv-layer-controls" aria-label="Map layer controls">
            {MAP_LAYERS.map(layer => (
              <button
                key={layer.id}
                id={`invlayer-${layer.id}`}
                className="inv-layer-btn"
                data-on={activeLayers.has(layer.id)}
                onClick={() => toggleLayer(layer.id)}
                aria-pressed={activeLayers.has(layer.id)}
                title={activeLayers.has(layer.id) ? `Hide ${layer.label}` : `Show ${layer.label}`}
              >
                <span className="inv-layer-dot" style={{ background: layer.color }} aria-hidden="true"/>
                {layer.label}
              </button>
            ))}
          </div>

          {/* Vessel hover tooltip */}
          {hoveredVessel && (
            <div
              role="tooltip"
              style={{
                position: 'absolute',
                left: tooltipPos.x,
                top: tooltipPos.y,
                zIndex: 30,
                pointerEvents: 'none',
                background: 'rgba(10,18,34,0.97)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
                boxShadow: 'var(--shadow-lg)',
                animation: 'oceanintel-fade-in 80ms ease',
                minWidth: 168,
              }}
            >
              <VTooltip vessel={hoveredVessel}/>
            </div>
          )}
        </div>

        {/* ----- RIGHT INTELLIGENCE PANEL ----- */}
        <RightPanel vessel={selectedVessel}/>

      </div>{/* end .inv-workspace */}

      {/* ==================================================
          BOTTOM TIMELINE — 10-stage investigation pipeline
          ================================================== */}
      <Timeline
        stages={STAGES}
        activeStageId={activeStageId}
        onStageClick={setActiveStageId}
      />

    </div>
  );
};
