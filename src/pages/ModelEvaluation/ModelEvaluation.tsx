/**
 * OceanIntel — Model Evaluation Screen
 *
 * ML Foundation Architecture & Scientific Evaluation Framework
 * Problem: SIH26143 — Satellite SAR Oil Spill Detection & AIS Correlation
 *
 * ABSOLUTE RULE: NO FABRICATION
 * - Architecture: U-Net + ResNet34, Single-channel SAR input (VV), Binary segmentation
 * - If no real evaluation artifacts are connected: STATUS: NOT CONNECTED
 * - Clearly separates PROJECT EVALUATION RESULTS from DEMO / PLANNED BENCHMARKS
 */

import React, { useState } from 'react';
import {
  Cpu,
  AlertTriangle,
  Layers,
  Activity,
  Zap,
  ShieldAlert,
  Info,
  ExternalLink,
} from 'lucide-react';
import { DataStatusBadge } from '../../components/common/DataStatusBadge';
import '../../components/ui/Button/Button.css';
import './ModelEvaluation.css';

interface MetricDefinition {
  name: string;
  code: string;
  description: string;
  targetBenchmark: string;
}

const EVALUATION_METRICS: MetricDefinition[] = [
  {
    name: 'IoU (Intersection over Union)',
    code: 'Mean IoU',
    description: 'Measures spatial overlap between predicted oil mask and ground truth polygon.',
    targetBenchmark: '> 0.800',
  },
  {
    name: 'Dice / F1 Score',
    code: 'F1 Score',
    description: 'Harmonic mean of precision and recall for binary segmentation pixels.',
    targetBenchmark: '> 0.850',
  },
  {
    name: 'Precision',
    code: 'Positive Predictive Value',
    description: 'Proportion of predicted oil pixels that correspond to ground-truth slicks.',
    targetBenchmark: '> 0.880',
  },
  {
    name: 'Recall (Sensitivity)',
    code: 'True Positive Rate',
    description: 'Proportion of actual oil slick pixels correctly detected by model.',
    targetBenchmark: '> 0.850',
  },
  {
    name: 'Pixel Accuracy',
    code: 'Overall Classification',
    description: 'Ratio of correctly classified pixels (slick + sea background) over total pixels.',
    targetBenchmark: '> 97.0%',
  },
  {
    name: 'Oil-Specific IoU',
    code: 'Foreground IoU',
    description: 'Strict intersection-over-union evaluated exclusively on foreground oil pixels.',
    targetBenchmark: '> 0.780',
  },
  {
    name: 'Look-Alike FP Analysis',
    code: 'False Positive Ratio',
    description: 'False-alarm rate on oceanic look-alikes (low wind calms, biogenic films, internal waves).',
    targetBenchmark: '< 5.0%',
  },
];

const PLANNED_LOOKALIKE_CATEGORIES = [
  {
    type: 'Calm Sea Slicks (Low Wind < 3 m/s)',
    riskLevel: 'High',
    mechanism: 'Specular reflection mimicking slick backscatter reduction due to low capillary wave action.',
    plannedProtocol: 'Co-analyze with ECMWF ERA5 wind speed grid to flag low-wind zones.',
  },
  {
    type: 'Biogenic & Algal Slicks',
    riskLevel: 'Medium',
    mechanism: 'Natural surfactant films from marine biological activity dampening capillary waves.',
    plannedProtocol: 'Cross-reference with Sentinel-3 OLCI chlorophyll-a & MODIS SST products.',
  },
  {
    type: 'Internal Ocean Waves',
    riskLevel: 'Medium',
    mechanism: 'Subsurface density variations producing alternating dark and bright acoustic wave bands.',
    plannedProtocol: 'Spatial periodicity and wavelength pattern extraction in SAR spatial domain.',
  },
  {
    type: 'Rain Cells & Atmospheric Fronts',
    riskLevel: 'Low',
    mechanism: 'Heavy precipitation downdrafts altering sea surface roughness in localized cells.',
    plannedProtocol: 'Flag precipitation footprints using atmospheric reanalysis and infrared bands.',
  },
  {
    type: 'Ship Wakes & Turbulence',
    riskLevel: 'Low',
    mechanism: 'Turbulent boundary layer behind fast-moving vessels causing linear radar dampening.',
    plannedProtocol: 'Correlate wake vector with AIS candidate vessel trajectories.',
  },
];

const PLANNED_SEA_STATES = [
  { state: 'Calm (Beaufort 0–2, wind < 3.3 m/s)', condition: 'Challenging (Look-alike risk high)', note: 'Low capillary wave activity causes broad radar backscatter drop, requiring auxiliary wind gating.' },
  { state: 'Moderate (Beaufort 3–4, wind 3.4–7.9 m/s)', condition: 'Optimal SAR Detection', note: 'Ideal sea surface roughness provides clear contrast between damped oil slick and ambient sea.' },
  { state: 'Rough (Beaufort 5–6, wind 8.0–13.8 m/s)', condition: 'Moderate (Slick fragmentation)', note: 'Wave breaking induces oil emulsification and dispersion, reducing slick boundary sharpness.' },
  { state: 'High Sea (Beaufort > 6, wind > 13.9 m/s)', condition: 'Severe Degradation', note: 'Turbulent ocean mixing drives oil into the water column, rendering surface slick invisible to SAR.' },
];

export const ModelEvaluation: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'status' | 'metrics' | 'lookalikes' | 'sea_states'>('status');

  const handleTabClick = (tab: 'status' | 'metrics' | 'lookalikes' | 'sea_states') => {
    setSelectedTab(tab);
    const targetMap: Record<string, string> = {
      status: 'sec-spec',
      metrics: 'sec-metrics',
      lookalikes: 'sec-lookalikes',
      sea_states: 'sec-seastates',
    };
    const targetId = targetMap[tab];
    if (targetId) {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className="modeval-container" role="main" aria-label="OceanIntel Model Evaluation Workstation">
      {/* Top Toolbar */}
      <div className="modeval-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Cpu size={18} style={{ color: 'var(--accent-cyan)' }} />
          <div>
            <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: 0 }}>
              MODEL EVALUATION — PROJECT EVALUATION STATUS
            </h2>
            <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
              Scientific Evaluation Framework · Deep Learning SAR Segmentation Foundation · SIH26143
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <DataStatusBadge status="MODEL PREVIEW" />

          <div className="modeval-tabs-container" role="tablist" aria-label="Evaluation View Tabs">
            <button
              role="tab"
              aria-selected={selectedTab === 'status'}
              className={`modeval-tab-btn ${selectedTab === 'status' ? 'modeval-tab-btn--active' : ''}`}
              onClick={() => handleTabClick('status')}
            >
              Evaluation Status
            </button>
            <button
              role="tab"
              aria-selected={selectedTab === 'metrics'}
              className={`modeval-tab-btn ${selectedTab === 'metrics' ? 'modeval-tab-btn--active' : ''}`}
              onClick={() => handleTabClick('metrics')}
            >
              Required Metrics (7)
            </button>
            <button
              role="tab"
              aria-selected={selectedTab === 'lookalikes'}
              className={`modeval-tab-btn ${selectedTab === 'lookalikes' ? 'modeval-tab-btn--active' : ''}`}
              onClick={() => handleTabClick('lookalikes')}
            >
              Look-Alike Protocol
            </button>
            <button
              role="tab"
              aria-selected={selectedTab === 'sea_states'}
              className={`modeval-tab-btn ${selectedTab === 'sea_states' ? 'modeval-tab-btn--active' : ''}`}
              onClick={() => handleTabClick('sea_states')}
            >
              Sea State Robustness
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="modeval-main">
        {/* ML Foundation Architecture Card */}
        <div
          id="sec-spec"
          style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            flexShrink: 0,
            overflow: 'visible',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Zap size={18} style={{ color: 'var(--accent-cyan)' }} />
              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  ML FOUNDATION SPECIFICATION
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Rigorous scientific baseline for satellite radar oil slick characterization
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <DataStatusBadge status="EXTERNAL DATA REQUIRED" />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--status-warning)',
                  background: 'rgba(229,160,32,0.12)',
                  border: '1px solid rgba(229,160,32,0.3)',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-xs)',
                  fontWeight: 600,
                }}
              >
                STATUS: NOT CONNECTED
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
              marginTop: 4,
            }}
          >
            <div style={{ background: 'var(--surface-base)', padding: '10px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-faint)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Architecture</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: 2 }}>U-Net + ResNet34</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 2 }}>Encoder-decoder segmentation with skip connections</div>
            </div>

            <div style={{ background: 'var(--surface-base)', padding: '10px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-faint)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Input Modality</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: 2 }}>Single-Channel SAR (VV)</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 2 }}>Sentinel-1 C-band vertical copolarization (calibrated dB)</div>
            </div>

            <div style={{ background: 'var(--surface-base)', padding: '10px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-faint)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Segmentation Task</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: 2 }}>Binary Segmentation</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 2 }}>Class 0: Sea Background · Class 1: Oil Slick</div>
            </div>

            <div style={{ background: 'var(--surface-base)', padding: '10px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-faint)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Runtime Environment</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>PyTorch / ONNX Runtime</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>Weights file awaiting ingestion: unet_resnet34_sar.pth</div>
            </div>
          </div>
        </div>

        {/* SECTION 1: PROJECT-REPORTED EVALUATION */}
        <div id="sec-reported" className="modeval-card">
          <div className="modeval-card-header" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="modeval-card-title">
              <Activity size={16} style={{ color: 'var(--accent-cyan)' }} />
              <span>PROJECT EVALUATION RESULTS — PROJECT-REPORTED EVALUATION</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <DataStatusBadge status="PROJECT EVALUATION RESULTS" />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--accent-cyan)',
                  background: 'rgba(0,180,216,0.12)',
                  border: '1px solid rgba(0,180,216,0.3)',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-xs)',
                  fontWeight: 600,
                }}
              >
                PROJECT-REPORTED EVALUATION
              </span>
            </div>
          </div>

          <div className="modeval-card-body">
            <div
              style={{
                background: 'rgba(0,180,216,0.06)',
                border: '1px solid rgba(0,180,216,0.25)',
                borderRadius: 'var(--radius-xs)',
                padding: '12px 16px',
                fontSize: '12px',
                lineHeight: 1.5,
                color: 'var(--text-secondary)',
                marginBottom: 16,
              }}
            >
              <strong style={{ color: 'var(--accent-cyan)' }}>Evaluation Protocol &amp; Dataset Scope: </strong>
              These findings represent project-reported evaluation results from offline research documentation.
              <strong> NOT A LIVE MODEL RESULT · NOT PRODUCTION VALIDATION.</strong> Synthetic samples were utilized exclusively during data augmentation training and were strictly excluded from final benchmark evaluation.
            </div>

            {/* Reported Evaluation Numbers Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div style={{ background: 'var(--surface-base)', padding: '12px 14px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Training Dataset</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>1,795 Real Samples</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 2 }}>+ Synthetic augmentation during training pipeline</div>
              </div>

              <div style={{ background: 'var(--surface-base)', padding: '12px 14px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Holdout Evaluation Set</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>218 Real Test Samples</div>
                <div style={{ fontSize: '11px', color: 'var(--status-nominal)', marginTop: 2 }}>Zero synthetic samples in final test set</div>
              </div>

              <div style={{ background: 'var(--surface-base)', padding: '12px 14px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Mean IoU (mIoU) Gain</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--status-nominal)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>+6.0 pp</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 2 }}>Percentage point gain via synthetic augmentation</div>
              </div>

              <div style={{ background: 'var(--surface-base)', padding: '12px 14px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Oil-Specific IoU Gain</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--status-nominal)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>+10.81 pp</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 2 }}>Foreground slick IoU improvement over baseline</div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: MODEL INFERENCE INTEGRATION */}
        <div id="sec-metrics" className="modeval-card">
          <div className="modeval-card-header" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="modeval-card-title">
              <Cpu size={16} style={{ color: 'var(--status-warning)' }} />
              <span>MODEL INFERENCE INTEGRATION</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--status-warning)',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}
              >
                STATUS: NOT CONNECTED
              </span>
            </div>
          </div>

          <div className="modeval-card-body">
            <div
              style={{
                background: 'rgba(229,160,32,0.08)',
                border: '1px solid rgba(229,160,32,0.25)',
                borderRadius: 'var(--radius-xs)',
                padding: '12px 16px',
                fontSize: '12px',
                lineHeight: 1.5,
                color: 'var(--text-secondary)',
                marginBottom: 16,
              }}
            >
              <strong style={{ color: 'var(--status-warning)' }}>Model Inference Integration: </strong>
              The in-browser workstation is operating in demo mode. The PyTorch inference service (U-Net + ResNet34) is not connected to a live inference endpoint.
              In adherence to SIH 2026 scientific defensibility rules, no live IoU, Dice, or pixel accuracy metrics are fabricated.
            </div>

            {/* Metrics List with NOT CONNECTED status */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 12,
              }}
            >
              {EVALUATION_METRICS.map((metric, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--surface-base)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xs)',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {metric.name}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          color: 'var(--status-warning)',
                          background: 'rgba(229,160,32,0.1)',
                          border: '1px solid rgba(229,160,32,0.25)',
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-xs)',
                          fontWeight: 600,
                        }}
                      >
                        STATUS: NOT CONNECTED
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 4 }}>
                      {metric.description}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: 8,
                      borderTop: '1px solid var(--border-faint)',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <span>Target Threshold:</span>
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{metric.targetBenchmark}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Confusion Matrix Architecture Schematic (Unpopulated) */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={14} style={{ color: 'var(--accent-cyan)' }} />
                <span>Confusion Matrix Protocol (Binary Pixel Classification)</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 400 }}>
                  (Structure awaiting pipeline execution)
                </span>
              </div>

              <div
                style={{
                  background: 'var(--surface-base)',
                  border: '1px dashed var(--border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '16px',
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr 1fr',
                  gap: 8,
                  fontSize: '11px',
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Ground Truth \ Pred</div>
                <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', textAlign: 'center' }}>Predicted Oil (Positive)</div>
                <div style={{ fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>Predicted Sea (Negative)</div>

                <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Actual Oil Slick</div>
                <div style={{ background: 'var(--surface-overlay)', padding: '12px', borderRadius: 'var(--radius-xs)', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>True Positive (TP)</div>
                  <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--status-warning)', fontWeight: 600, marginTop: 4 }}>STATUS: NOT CONNECTED</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Sensitivity / Recall component</div>
                </div>
                <div style={{ background: 'var(--surface-overlay)', padding: '12px', borderRadius: 'var(--radius-xs)', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>False Negative (FN)</div>
                  <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--status-warning)', fontWeight: 600, marginTop: 4 }}>STATUS: NOT CONNECTED</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Missed detection rate</div>
                </div>

                <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Actual Non-Oil / Look-Alike</div>
                <div style={{ background: 'var(--surface-overlay)', padding: '12px', borderRadius: 'var(--radius-xs)', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>False Positive (FP)</div>
                  <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--status-warning)', fontWeight: 600, marginTop: 4 }}>STATUS: NOT CONNECTED</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>False alarm / look-alike error</div>
                </div>
                <div style={{ background: 'var(--surface-overlay)', padding: '12px', borderRadius: 'var(--radius-xs)', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>True Negative (TN)</div>
                  <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--status-warning)', fontWeight: 600, marginTop: 4 }}>STATUS: NOT CONNECTED</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Specificity component</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: DEMO / PLANNED BENCHMARKS */}
        <div id="sec-benchmarks" className="modeval-card">
          <div className="modeval-card-header" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="modeval-card-title">
              <Layers size={16} style={{ color: 'var(--accent-cyan)' }} />
              <span>DEMO / PLANNED BENCHMARKS</span>
            </div>
            <DataStatusBadge status="DEMO / PLANNED BENCHMARKS" />
          </div>

          <div className="modeval-card-body">
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
              Planned benchmarking methodology and literature target performance thresholds established for SIH26143.
              These criteria define acceptance validation when testing the U-Net + ResNet34 network against benchmark datasets.
            </div>

            <div className="modeval-grid-2col">
              {/* Look-alike analysis */}
              <div id="sec-lookalikes" style={{ background: 'var(--surface-base)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)', padding: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={14} style={{ color: 'var(--status-warning)' }} />
                  <span>Planned Look-Alike False Positive Mitigation Protocol</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: 12 }}>
                  SAR sensors capture low backscatter from numerous natural phenomena that can be mistaken for crude oil slicks.
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {PLANNED_LOOKALIKE_CATEGORIES.map((cat, i) => (
                    <div key={i} style={{ padding: '8px 10px', background: 'var(--surface-overlay)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-faint)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>{cat.type}</span>
                        <span style={{ fontSize: '9px', fontWeight: 700, color: cat.riskLevel === 'High' ? '#e8423a' : '#e5a020', fontFamily: 'var(--font-mono)' }}>
                          {cat.riskLevel.toUpperCase()} RISK
                        </span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 3 }}>
                        <strong>Mechanism:</strong> {cat.mechanism}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--accent-cyan)', marginTop: 2 }}>
                        <strong>Mitigation:</strong> {cat.plannedProtocol}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sea state robustness protocol */}
              <div id="sec-seastates" style={{ background: 'var(--surface-base)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)', padding: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Activity size={14} style={{ color: 'var(--accent-cyan)' }} />
                  <span>Planned Sea State & Wind Speed Testing Protocol</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: 12 }}>
                  Evaluation stratifies SAR scenes across the Beaufort Wind Scale to measure environmental detection limits.
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {PLANNED_SEA_STATES.map((st, i) => (
                    <div key={i} style={{ padding: '8px 10px', background: 'var(--surface-overlay)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-faint)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>{st.state}</span>
                        <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                          {st.condition}
                        </span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 3 }}>
                        {st.note}
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: 12,
                    padding: '8px 10px',
                    background: 'rgba(6,182,212,0.08)',
                    border: '1px solid rgba(6,182,212,0.25)',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Info size={13} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                  <span>
                    Validation protocol mandates cross-evaluation with ECMWF ERA5 10m neutral wind speeds ($U_{10}$).
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="modeval-bottom-strip">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '11px', color: 'var(--text-secondary)' }}>
          <ShieldAlert size={13} style={{ color: 'var(--status-warning)' }} />
          <span>PROJECT EVALUATION STATUS: <strong>NOT CONNECTED</strong> (Awaiting model weights integration)</span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span>ARCHITECTURE: <strong>U-Net + ResNet34</strong> (Single-Channel VV SAR)</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          <ExternalLink size={12} />
          <span>SIH26143 · SCIENTIFIC DEFENSE BENCHMARKS</span>
        </div>
      </div>
    </div>
  );
};
