/**
 * OceanIntel — Evidence Timeline Connected Diagram Component
 *
 * Renders the 8-stage scientific evidence chain:
 * SAR Evidence → Spill Geometry → Temporal Evidence → Environmental Drift →
 * AIS Evidence → Candidate Vessel → Supporting / Contradicting → Investigation Assessment
 *
 * All data is DEMO MODE · SIMULATED DATA.
 */

import React, { useState } from 'react';
import { Satellite, MapPin, Clock, Wind, Radio, Ship, Check, Scale } from 'lucide-react';

export interface TimelineNode {
  id: string;
  step: number;
  label: string;
  subLabel: string;
  icon: React.ReactNode;
  timestamp: string;
  source: string;
  quality: string;
  uncertainty: string;
  details: string;
  compatibility: 'supporting' | 'neutral' | 'contradicting';
}

const TIMELINE_NODES: TimelineNode[] = [
  {
    id: 'node-sar',
    step: 1,
    label: 'SAR Evidence',
    subLabel: 'Sentinel-1A C-SAR',
    icon: <Satellite size={14} />,
    timestamp: '2026-09-07 06:12:04 UTC',
    source: 'ESA Copernicus Open Access',
    quality: '92% Confidence (Lee Filtered)',
    uncertainty: '±8.0% speckle intensity noise',
    details: 'Single-channel VV acquisition in IW mode captures 42.7 km² surface backscatter depression (-24.6 dB).',
    compatibility: 'supporting',
  },
  {
    id: 'node-geom',
    step: 2,
    label: 'Spill Geometry',
    subLabel: '42.7 km² · N 18° W',
    icon: <MapPin size={14} />,
    timestamp: '2026-09-07 06:15:00 UTC',
    source: 'Morphological Boundary Extraction',
    quality: 'High Morphological Fit (92/100)',
    uncertainty: '±0.4 km boundary resolution',
    details: 'Centroid isolated at 26°09′N, 051°48′E with 2.8:1 elongation ratio oriented along NNW transport axis.',
    compatibility: 'supporting',
  },
  {
    id: 'node-temporal',
    step: 3,
    label: 'Temporal Evidence',
    subLabel: 'Origin Window 02–04Z',
    icon: <Clock size={14} />,
    timestamp: '2026-09-07 07:00:00 UTC',
    source: 'Time Window Back-Projection',
    quality: 'Constrained Coincidence',
    uncertainty: '±1.0 hour temporal release margin',
    details: 'Slick weathering and thickness parameters indicate crude oil discharge occurred 2 to 4 hours prior to satellite pass.',
    compatibility: 'supporting',
  },
  {
    id: 'node-drift',
    step: 4,
    label: 'Environmental Drift',
    subLabel: 'OpenDrift + CMEMS',
    icon: <Wind size={14} />,
    timestamp: '2026-09-07 07:30:00 UTC',
    source: 'CMEMS Currents + ERA5 Wind',
    quality: '82% Backward Particle Match',
    uncertainty: '±1.2 km spatial trajectory margin',
    details: 'Multi-particle reverse drift tracks surface slick origin to a 28.0 km² source corridor (26°11′N, 051°45′E).',
    compatibility: 'supporting',
  },
  {
    id: 'node-ais',
    step: 5,
    label: 'AIS Evidence',
    subLabel: '4h 08m Gap Detected',
    icon: <Radio size={14} />,
    timestamp: '2026-09-07 10:14–14:22 UTC',
    source: 'Terrestrial & Satellite AIS Stream',
    quality: 'AIS Observation Gap Detected',
    uncertainty: 'Reconstructed track interpolation error',
    details: 'Vessel track reconstruction confirms transiting presence. An observation gap of 4h 08m occurred during the release window.',
    compatibility: 'supporting',
  },
  {
    id: 'node-candidate',
    step: 6,
    label: 'Candidate Vessel',
    subLabel: 'HARBOR PIONEER (#1)',
    icon: <Ship size={14} />,
    timestamp: '2026-09-07 09:15:00 UTC',
    source: 'Correlation Ranking Engine',
    quality: 'Highest-Ranked Candidate',
    uncertainty: 'Multi-vessel corridor ambiguity',
    details: 'Highest-Ranked Investigation Candidate with 87/100 Investigation Score across spatial, temporal, drift, and heading factors.',
    compatibility: 'supporting',
  },
  {
    id: 'node-assessment',
    step: 7,
    label: 'Investigation Assessment',
    subLabel: 'Hypothesis Compatible',
    icon: <Scale size={14} />,
    timestamp: '2026-09-07 10:00:00 UTC',
    source: 'OceanIntel Synthesis Engine',
    quality: 'Investigation Decision Support',
    uncertainty: 'Non-legal attribution statement',
    details: 'Evidence is compatible with the investigation hypothesis. Supports formal Port State Control inspection.',
    compatibility: 'supporting',
  },
];

interface EvidenceTimelineProps {
  onNodeClick?: (node: TimelineNode) => void;
}

export const EvidenceTimeline: React.FC<EvidenceTimelineProps> = ({ onNodeClick }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-candidate');
  const selectedNode = TIMELINE_NODES.find((n) => n.id === selectedNodeId) ?? TIMELINE_NODES[5];

  const handleSelect = (node: TimelineNode) => {
    setSelectedNodeId(node.id);
    onNodeClick?.(node);
  };

  return (
    <div className="ev-timeline-container" role="region" aria-label="Evidence Chain Timeline">
      <div className="ev-timeline-header">
        <span className="ev-timeline-title">Connected Investigation Evidence Chain</span>
        <span className="ev-timeline-sub">
          7-Stage Physical, Environmental, and AIS Telemetry Correlation
        </span>
      </div>

      {/* Connected Flow Diagram */}
      <div className="ev-timeline-flow">
        <svg className="ev-flow-svg-line" aria-hidden="true">
          <line x1="6%" y1="18" x2="94%" y2="18" stroke="var(--border-default)" strokeWidth="2" />
          <line
            x1="6%"
            y1="18"
            x2="94%"
            y2="18"
            stroke="var(--cyan-primary)"
            strokeWidth="2"
            strokeDasharray="6 4"
            className="ev-flow-pulse"
          />
        </svg>

        <div className="ev-timeline-nodes">
          {TIMELINE_NODES.map((node) => {
            const isSelected = node.id === selectedNodeId;
            return (
              <button
                key={node.id}
                id={`ev-node-${node.id}`}
                className={`ev-node-btn ${isSelected ? 'ev-node-btn--active' : ''}`}
                onClick={() => handleSelect(node)}
                aria-pressed={isSelected}
                aria-label={`Evidence Step ${node.step}: ${node.label}`}
                type="button"
              >
                <div className="ev-node-icon-wrapper">
                  <span className="ev-node-icon">{node.icon}</span>
                  <span className="ev-node-step-num">{node.step}</span>
                </div>
                <span className="ev-node-label">{node.label}</span>
                <span className="ev-node-sub">{node.subLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Node Expanded Details Card */}
      <div className="ev-node-detail-card" role="status">
        <div className="ev-node-detail-header">
          <div className="ev-detail-header-left">
            <span className="ev-detail-step-badge">STEP {selectedNode.step}</span>
            <strong className="ev-detail-title">{selectedNode.label}</strong>
            <span className="ev-detail-sep">·</span>
            <span className="ev-detail-sub">{selectedNode.subLabel}</span>
          </div>

          <div className="ev-detail-header-right">
            <span className="ev-detail-source">
              Source: {selectedNode.source}
            </span>
            <span className="ev-detail-compat-badge">
              <Check size={11} />
              COMPATIBLE
            </span>
          </div>
        </div>

        <div className="ev-node-detail-body">
          <p className="ev-detail-desc">{selectedNode.details}</p>
          <div className="ev-detail-meta-row">
            <div className="ev-detail-meta-item">
              <strong>Timestamp:</strong> <span>{selectedNode.timestamp}</span>
            </div>
            <div className="ev-detail-meta-item">
              <strong>Quality:</strong> <span>{selectedNode.quality}</span>
            </div>
            <div className="ev-detail-meta-item">
              <strong>Uncertainty Margin:</strong> <span>{selectedNode.uncertainty}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
