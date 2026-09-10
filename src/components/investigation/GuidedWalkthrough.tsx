/**
 * OceanIntel — Guided Investigation Walkthrough Widget
 *
 * Floating step-by-step walkthrough bar for demonstrating the 8-stage
 * maritime oil spill investigation workflow to judges and analysts.
 *
 * All data shown is simulated for demonstration purposes.
 */

import React, { useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import type { NavItemId } from '../navigation/Sidebar';
import './GuidedWalkthrough.css';

export interface WalkthroughStep {
  step: number;
  navId: NavItemId;
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  requiredPhrasing: string;
}

export const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    step: 1,
    navId: 'command-center',
    title: '01 · COMMAND CENTER',
    subtitle: 'Incident Overview & Map Intelligence',
    badge: 'Active Incident · INC-2026-047',
    description: 'Active Detection: 42.7 km² surface slick centered at 26°09′N, 051°48′E in the Persian Gulf. Map-first geospatial overview establishes detection parameters.',
    requiredPhrasing: 'Active Detection · 42.7 km² Oil Slick Signature',
  },
  {
    step: 2,
    navId: 'sar-detection',
    title: '02 · SAR DETECTION',
    subtitle: 'Satellite SAR Scene & AI Segmentation',
    badge: 'U-Net + ResNet34 Preview',
    description: 'Sentinel-1A C-band SAR VV acquisition isolates the backscatter attenuation anomaly. Processing pipeline segments the detected oil signature from ambient ocean clutter.',
    requiredPhrasing: 'Detected Oil Signature · Single-Channel VV SAR',
  },
  {
    step: 3,
    navId: 'spill-intelligence',
    title: '03 · SPILL INTELLIGENCE',
    subtitle: 'Spill Geometry & Morphometry',
    badge: 'Geometry Characterization',
    description: 'Geometric extraction computes morphological parameters: 42.7 km² area, 14.8 km length, 5.3 km width, 2.8:1 elongation ratio, and N 18° W orientation axis.',
    requiredPhrasing: 'Area: 42.7 km² · Orientation: N 18° W · Aspect: 2.8:1',
  },
  {
    step: 4,
    navId: 'drift',
    title: '04 · DRIFT MODELLING',
    subtitle: 'Backward Hindcast & 72h Forecast',
    badge: 'Source Corridor Reconstructed',
    description: 'Modelled trajectory indicates potential source corridor, subject to environmental and model uncertainty. Backward drift constrains origin window between 02:00Z and 04:00Z.',
    requiredPhrasing: 'Modelled trajectory indicates potential exposure, subject to uncertainty.',
  },
  {
    step: 5,
    navId: 'ais-intelligence',
    title: '05 · AIS INTELLIGENCE',
    subtitle: 'Telemetry Tracking & Observation Gaps',
    badge: 'AIS Observation Gap Detected',
    description: 'Reconstructed AIS tracks for transiting commercial vessels. AIS observation gap detected on HARBOR PIONEER (4h 08m duration) coinciding with backward drift release window.',
    requiredPhrasing: 'AIS observation gap detected · 4h 08m Duration',
  },
  {
    step: 6,
    navId: 'vessel-candidates',
    title: '06 · VESSEL CANDIDATES',
    subtitle: 'Explainable Multi-Factor Ranking',
    badge: 'Highest-Ranked Candidate',
    description: 'Highest-Ranked Investigation Candidate: HARBOR PIONEER with an Investigation Score of 87/100 across spatial, temporal, drift, heading, and speed compatibility criteria.',
    requiredPhrasing: 'Highest-Ranked Investigation Candidate · Investigation Score 87/100',
  },
  {
    step: 7,
    navId: 'evidence',
    title: '07 · EVIDENCE',
    subtitle: 'Connected Investigation Evidence Chain',
    badge: 'Evidence Synthesis',
    description: 'Evidence is compatible with investigation hypothesis. Correlates physical observations, drift models, and vessel telemetry to support further formal investigation.',
    requiredPhrasing: 'Evidence is compatible with investigation hypothesis.',
  },
  {
    step: 8,
    navId: 'reports',
    title: '08 · RESPONSE / REPORT',
    subtitle: 'Investigation Dossier & Export Workstation',
    badge: 'Investigation Support Output',
    description: 'Generates demonstration investigation report with explainable 6-factor response priority, print-ready report layout, and exportable JSON & GeoJSON packages.',
    requiredPhrasing: 'This report is an investigation-support output and does not constitute legal attribution.',
  },
];

interface GuidedWalkthroughProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  onExit: () => void;
}

export const GuidedWalkthrough: React.FC<GuidedWalkthroughProps> = ({
  currentStep,
  onStepChange,
  onExit,
}) => {
  const stepData = WALKTHROUGH_STEPS[currentStep - 1] ?? WALKTHROUGH_STEPS[0];
  const isFirst = currentStep === 1;
  const isLast = currentStep === WALKTHROUGH_STEPS.length;

  /* Keyboard controls: ArrowLeft, ArrowRight, Escape */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        if (!isLast) onStepChange(currentStep + 1);
      } else if (e.key === 'ArrowLeft') {
        if (!isFirst) onStepChange(currentStep - 1);
      } else if (e.key === 'Escape') {
        onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, isFirst, isLast, onStepChange, onExit]);

  return (
    <div
      className="gw-overlay"
      role="region"
      aria-label="Guided Investigation Walkthrough Controller"
    >
      <div className="gw-card">
        {/* Top Header / Progress Track */}
        <div className="gw-header">
          <div className="gw-header-left">
            <span className="gw-badge-pulse">
              <Sparkles size={11} className="gw-sparkle-icon" />
              GUIDED INVESTIGATION DEMO
            </span>
            <span className="gw-step-count">
              STEP {String(currentStep).padStart(2, '0')} / {String(WALKTHROUGH_STEPS.length).padStart(2, '0')}
            </span>
          </div>

          <div className="gw-dots">
            {WALKTHROUGH_STEPS.map((s) => {
              const isActive = s.step === currentStep;
              const isPast = s.step < currentStep;
              return (
                <button
                  key={s.step}
                  className={`gw-dot ${isActive ? 'gw-dot--active' : ''} ${isPast ? 'gw-dot--past' : ''}`}
                  onClick={() => onStepChange(s.step)}
                  title={`Jump to Step ${s.step}: ${s.title}`}
                  aria-label={`Jump to Step ${s.step}`}
                />
              );
            })}
          </div>

          <div className="gw-header-right">
            <span className="gw-demo-pill" title="All metrics shown are simulated">
              <ShieldAlert size={10} style={{ marginRight: 3, display: 'inline' }} />
              DEMO MODE · SIMULATED DATA
            </span>
            <button
              className="gw-close-btn"
              onClick={onExit}
              title="Exit Guided Walkthrough (Esc)"
              aria-label="Exit Guided Walkthrough"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="gw-body">
          <div className="gw-title-row">
            <div className="gw-title">
              <span className="gw-title-step">{stepData.title}</span>
              <span className="gw-title-sub">— {stepData.subtitle}</span>
            </div>
            <span className="gw-pill-badge">{stepData.badge}</span>
          </div>

          <p className="gw-description">{stepData.description}</p>

          <div className="gw-phrasing-strip">
            <CheckCircle2 size={12} color="var(--text-cyan)" style={{ flexShrink: 0 }} />
            <span className="gw-phrasing-label">Required Language:</span>
            <span className="gw-phrasing-val">"{stepData.requiredPhrasing}"</span>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="gw-footer">
          <button
            className="btn btn-sm btn-secondary gw-nav-btn"
            onClick={() => onStepChange(currentStep - 1)}
            disabled={isFirst}
          >
            <ChevronLeft size={14} />
            BACK
          </button>

          <span className="gw-hint">
            Tip: Use Left/Right Arrow keys to navigate · Esc to exit
          </span>

          {isLast ? (
            <button
              className="btn btn-sm btn-primary gw-nav-btn gw-finish-btn"
              onClick={onExit}
            >
              FINISH TOUR &amp; EXIT
              <CheckCircle2 size={14} />
            </button>
          ) : (
            <button
              className="btn btn-sm btn-primary gw-nav-btn"
              onClick={() => onStepChange(currentStep + 1)}
            >
              NEXT STEP
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
