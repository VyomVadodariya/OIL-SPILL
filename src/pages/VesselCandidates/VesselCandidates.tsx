/**
 * OceanIntel — Vessel Candidates Screen
 *
 * Investigation workstation for evaluating and ranking candidate vessels
 * based on spatial, temporal, drift, and heading compatibility with the detected spill signature.
 *
 * All data is simulated for UI demonstration purposes only.
 * Language rules strictly enforced:
 * - Uses "Highest-Ranked Investigation Candidate"
 * - Uses "Investigation Score"
 * - Evaluates candidates against physical, temporal, and drift compatibility criteria.
 */

import React, { useState } from 'react';
import {
  Ship,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ArrowUpDown,
} from 'lucide-react';
import { DEMO_CANDIDATES, type IncidentCandidate } from '../../data/demo/incident';
import { DataStatusBadge } from '../../components/common/DataStatusBadge';
import './VesselCandidates.css';

/* ============================================================
   CANONICAL CANDIDATE DATA (Imported from DEMO_INCIDENT)
   ============================================================ */

export type Candidate = IncidentCandidate;
const CANDIDATES: Candidate[] = DEMO_CANDIDATES;

/* ============================================================
   SUB-COMPONENTS
   ============================================================ */

/* Score Ring */
const ScoreRing: React.FC<{ score: number; size?: number }> = ({ score, size = 64 }) => {
  const R = (size / 2) - 6;
  const C = 2 * Math.PI * R;
  const fill = (score / 100) * C;
  const color = score >= 75 ? '#e8423a' : score >= 50 ? '#e5a020' : '#2ece7a';

  return (
    <div className="vc-score-ring-wrapper" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size/2} cy={size/2} r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
        <circle
          cx={size/2} cy={size/2} r={R} fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={`${fill} ${C}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
      </svg>
      <div className="vc-score-ring-text">
        <span className="vc-score-ring-val" style={{ color }}>{score}</span>
        <span className="vc-score-ring-sub">/ 100</span>
      </div>
    </div>
  );
};

/* Compatibility progress bar row */
const CompatRow: React.FC<{ label: string; score: number }> = ({ label, score }) => {
  const cls = score >= 75 ? 'high' : score >= 45 ? 'mod' : 'low';
  return (
    <div className="vc-compat-bar-row">
      <span className="vc-compat-bar-label">{label}</span>
      <div className="vc-compat-track">
        <div className={`vc-compat-fill vc-compat-fill--${cls}`} style={{ width: `${score}%` }} />
      </div>
      <span className="vc-compat-pct">{score}%</span>
    </div>
  );
};

/* ============================================================
   VESSEL CANDIDATES MAIN PAGE
   ============================================================ */

export const VesselCandidates: React.FC = () => {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('harbor-pioneer');
  const [expandedCardId, setExpandedCardId] = useState<string | null>('harbor-pioneer');
  const [sortBy, setSortBy] = useState<'rank' | 'score' | 'spatial' | 'temporal'>('rank');

  const selectedCandidate = CANDIDATES.find(c => c.id === selectedCandidateId) ?? CANDIDATES[0];

  const handleRowClick = (c: Candidate) => {
    setSelectedCandidateId(c.id);
    setExpandedCardId(prev => (prev === c.id ? null : c.id));
  };

  /* Sort candidates */
  const sortedCandidates = [...CANDIDATES].sort((a, b) => {
    if (sortBy === 'score') return b.invScore - a.invScore;
    if (sortBy === 'spatial') return b.spatialScore - a.spatialScore;
    if (sortBy === 'temporal') return b.temporalScore - a.temporalScore;
    return a.rank - b.rank;
  });

  return (
    <div className="vc-container" role="main" aria-label="OceanIntel Vessel Candidates Investigation Workstation">
      {/* ============================================================
          TOP TOOLBAR
          ============================================================ */}
      <div className="vc-toolbar">
        <div className="vc-toolbar-left">
          <div className="vc-toolbar-title">
            <Ship size={15} color="var(--text-cyan)" aria-hidden="true" />
            Candidate Ranking Matrix
            <span className="vc-candidate-count">{CANDIDATES.length} Candidates Evaluated</span>
          </div>

          <div className="vc-sort-group" role="group" aria-label="Sort candidate list">
            <ArrowUpDown size={12} className="vc-sort-label" aria-hidden="true" />
            <span className="vc-sort-label">Sort:</span>
            <button
              className={`vc-sort-btn ${sortBy === 'rank' ? 'vc-sort-btn--active' : ''}`}
              onClick={() => setSortBy('rank')}
            >
              Rank #
            </button>
            <button
              className={`vc-sort-btn ${sortBy === 'score' ? 'vc-sort-btn--active' : ''}`}
              onClick={() => setSortBy('score')}
            >
              Investigation Score
            </button>
            <button
              className={`vc-sort-btn ${sortBy === 'spatial' ? 'vc-sort-btn--active' : ''}`}
              onClick={() => setSortBy('spatial')}
            >
              Spatial
            </button>
            <button
              className={`vc-sort-btn ${sortBy === 'temporal' ? 'vc-sort-btn--active' : ''}`}
              onClick={() => setSortBy('temporal')}
            >
              Temporal
            </button>
          </div>
        </div>

        {/* Demo Mode Badge */}
        <DataStatusBadge status="DEMO MODE · SIMULATED DATA" />
      </div>

      {/* ============================================================
          MAIN SPLIT WORKSPACE
          ============================================================ */}
      <div className="vc-workspace">
        {/* ----- LEFT: RANKED CANDIDATE LIST (~60%) ----- */}
        <div className="vc-list-pane" role="region" aria-label="Ranked Candidate List">
          {sortedCandidates.map((candidate) => {
            const isSelected = candidate.id === selectedCandidateId;
            const isExpanded = candidate.id === expandedCardId;

            return (
              <div
                key={candidate.id}
                className={`vc-card vc-card-rank-${candidate.rank} ${isSelected ? 'vc-card--selected' : ''}`}
                onClick={() => handleRowClick(candidate)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleRowClick(candidate);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                aria-label={`Candidate #${candidate.rank}: ${candidate.name}`}
              >
                {/* Main Card Header Row */}
                <div className="vc-card-main">
                  {/* Rank Badge */}
                  <div className="vc-rank-badge">#{candidate.rank}</div>

                  {/* Identity */}
                  <div className="vc-card-identity">
                    <div className="vc-card-name">{candidate.name}</div>
                    <div className="vc-card-meta">
                      <span>{candidate.type}</span>
                      <span>·</span>
                      <span>{candidate.flag} ({candidate.flagName})</span>
                      <span>·</span>
                      <span className="vc-chip" style={{ fontSize: '9px', padding: '1px 5px' }}>
                        MMSI {candidate.mmsi}
                      </span>
                    </div>
                  </div>

                  {/* Compatibility Mini Scores */}
                  <div className="vc-card-scores">
                    <div className="vc-mini-score">
                      <span className="vc-mini-score-label">Spatial</span>
                      <span className="vc-mini-score-val">{candidate.spatialScore}%</span>
                    </div>

                    <div className="vc-mini-score">
                      <span className="vc-mini-score-label">Temporal</span>
                      <span className="vc-mini-score-val">{candidate.temporalScore}%</span>
                    </div>

                    <div className="vc-mini-score">
                      <span className="vc-mini-score-label">Drift</span>
                      <span className="vc-mini-score-val">{candidate.driftScore}%</span>
                    </div>

                    <div className="vc-mini-score">
                      <span className="vc-mini-score-label">Heading</span>
                      <span className="vc-mini-score-val">{candidate.headingScore}%</span>
                    </div>

                    {/* Total Investigation Score Box */}
                    <div className="vc-total-score-box">
                      <span
                        className="vc-total-score-num"
                        style={{ color: candidate.invScore >= 75 ? '#e8423a' : candidate.invScore >= 50 ? '#e5a020' : '#2ece7a' }}
                      >
                        {candidate.invScore}
                      </span>
                      <span className="vc-total-score-lbl">Score</span>
                    </div>
                  </div>

                  {/* Expand Chevron Icon */}
                  <div style={{ color: 'var(--text-muted)' }} aria-hidden="true">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Expandable Summary Drawer */}
                {isExpanded && (
                  <div className="vc-card-expanded">
                    <div className="vc-expand-grid">
                      <div className="vc-expand-item">
                        <span className="vc-expand-lbl">Dist to Spill Centroid</span>
                        <span className="vc-expand-val">{candidate.distToCentroid}</span>
                      </div>
                      <div className="vc-expand-item">
                        <span className="vc-expand-lbl">Heading at Incident</span>
                        <span className="vc-expand-val">{candidate.headingAtIncident}</span>
                      </div>
                      <div className="vc-expand-item">
                        <span className="vc-expand-lbl">AIS Signal Continuity</span>
                        <span className="vc-expand-val" style={{ color: candidate.aisContinuity === 'low' ? '#e8423a' : 'var(--text-primary)' }}>
                          {candidate.aisContinuity.toUpperCase()}
                        </span>
                      </div>
                      <div className="vc-expand-item">
                        <span className="vc-expand-lbl">AIS Observation Gap</span>
                        <span className="vc-expand-val" style={{ color: candidate.aisGap ? '#e8423a' : 'var(--text-muted)' }}>
                          {candidate.aisGap ? `GAP: ${candidate.aisGapDuration}` : 'None Detected'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ----- RIGHT: DETAILED EVIDENCE & COMPATIBILITY PANEL (~40%) ----- */}
        <aside className="vc-evidence-panel" aria-label="Candidate Detailed Evidence Panel">
          {/* Header */}
          <div className="vc-panel-header">
            <span className="vc-panel-title">Investigation Evidence Dossier</span>
            <span className="vc-demo-pill" title="All values are simulated demonstration data">
              <span className="vc-demo-dot" aria-hidden="true" />
              DEMO MODE · SIMULATED DATA
            </span>
          </div>

          {/* Panel Body */}
          <div className="vc-panel-body">

            {/* Candidate Identity Section */}
            <div className="vc-section">
              <div className="vc-section-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    {/* REQUIRED LANGUAGE RULE: "Highest-Ranked Investigation Candidate" */}
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wider)' }}>
                      {selectedCandidate.rank === 1 ? 'Highest-Ranked Investigation Candidate' : `Rank #${selectedCandidate.rank} Candidate`}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                      {selectedCandidate.name}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>
                      {selectedCandidate.type} · {selectedCandidate.flag} ({selectedCandidate.flagName}) · {selectedCandidate.dwt}
                    </div>
                  </div>

                  <span className={`vc-chip ${
                    selectedCandidate.status === 'highest-ranked' || selectedCandidate.status === 'under-review' ? 'vc-evidence-icon--strong' :
                    selectedCandidate.status === 'monitored' ? 'vc-evidence-icon--mod' : 'vc-evidence-icon--circ'
                  }`}>
                    {selectedCandidate.status === 'highest-ranked' ? 'HIGHEST-RANKED INVESTIGATION CANDIDATE' :
                     selectedCandidate.status === 'under-review' ? 'UNDER REVIEW' : selectedCandidate.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 1: Explainable Investigation Score Breakdown (7 Criteria) */}
            <div className="vc-section">
              <div className="vc-section-header">
                <span className="vc-section-title">Investigation Score Breakdown (Explainable Ranking)</span>
                <span className="badge badge-warning" style={{ fontSize: '9px' }}>DEMO SCORE · SIMULATED</span>
              </div>
              <div className="vc-section-body">
                <div className="vc-score-hero-row">
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <ScoreRing score={selectedCandidate.invScore} size={68} />
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      SIMULATED SCORE
                    </span>
                  </div>
                  <div className="vc-compat-bars">
                    <CompatRow label="Spatial" score={selectedCandidate.spatialScore} />
                    <CompatRow label="Temporal" score={selectedCandidate.temporalScore} />
                    <CompatRow label="Drift" score={selectedCandidate.driftScore} />
                    <CompatRow label="Heading" score={selectedCandidate.headingScore} />
                    <CompatRow label="Speed" score={Math.max(10, selectedCandidate.spatialScore - 4)} />
                    <CompatRow label="AIS Cont." score={selectedCandidate.aisContinuity === 'high' ? 92 : selectedCandidate.aisContinuity === 'moderate' ? 64 : 28} />
                    <CompatRow label="SAR Match" score={selectedCandidate.rank === 1 ? 88 : selectedCandidate.rank === 2 ? 65 : 20} />
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: 4 }}>
                  Explainable candidate ranking across 7 criteria: Spatial proximity ({selectedCandidate.spatialScore}%), Temporal release window ({selectedCandidate.temporalScore}%), Backward drift corridor ({selectedCandidate.driftScore}%), Heading compatibility ({selectedCandidate.headingScore}%), Speed profile, AIS signal continuity, and SAR-AIS spatial overlap.
                </div>
              </div>
            </div>

            {/* SECTION 2: AIS Continuity & Observation Gap Analysis */}
            <div className="vc-section">
              <div className="vc-section-header">
                <span className="vc-section-title">AIS Signal &amp; Transmission Continuity</span>
              </div>
              <div className="vc-section-body">
                {selectedCandidate.aisGap ? (
                  <div style={{ background: 'rgba(232,66,58,0.12)', border: '1px solid rgba(232,66,58,0.40)', borderRadius: 'var(--radius-xs)', padding: '10px 12px', display: 'flex', gap: 8 }}>
                    <AlertTriangle size={15} color="var(--status-critical)" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
                      {/* MANDATORY REQUIRED LANGUAGE: "AIS observation gap detected" */}
                      <strong style={{ color: 'var(--status-critical)' }}>AIS observation gap detected.&nbsp;</strong>
                      Signal missing for {selectedCandidate.aisGapDuration} during the modelled release window.
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    Continuous AIS transmission maintained. No signal gaps detected.
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 3: Candidate Evidence Matrix */}
            <div className="vc-section">
              <div className="vc-section-header">
                <span className="vc-section-title">Candidate Evidence Matrix</span>
              </div>
              <div className="vc-section-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedCandidate.evidenceItems.map((ev, idx) => (
                    <div key={idx} className="vc-evidence-item">
                      <div className={`vc-evidence-icon vc-evidence-icon--${ev.level}`} aria-hidden="true">
                        {ev.level === 'strong' ? '✓' : ev.level === 'mod' ? '◑' : '○'}
                      </div>
                      <div>
                        <div className="vc-evidence-text">{ev.text}</div>
                        <div className="vc-evidence-weight">{ev.weight} Weight</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SECTION 4: Mandatory Legal Disclaimer Statement Box */}
            <div className="vc-legal-statement" role="note">
              <strong>Investigation Evaluation Summary:</strong> Evidence is compatible with investigation hypothesis. Findings support further formal investigation. No legal determination has been made and attribution is not legally established.
            </div>

          </div>{/* end panel body */}
        </aside>
      </div>

      {/* ============================================================
          BOTTOM STRIP — DISCLAIMER
          ============================================================ */}
      <div className="vc-bottom-strip" role="region" aria-label="Workstation disclaimer">
        <div className="vc-disclaimer">
          <ShieldAlert size={12} color="var(--status-warning)" aria-hidden="true" />
          <span>
            <strong>DEMO MODE · SIMULATED DATA</strong> — Candidate evaluation scores are generated for UI workstation demonstration. Investigation outputs support decision making and do not constitute legal attribution.
          </span>
        </div>
      </div>
    </div>
  );
};
