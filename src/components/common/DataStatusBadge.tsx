import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  Cpu,
  Layers,
  CloudOff,
  Activity,
  History,
} from 'lucide-react';
import './DataStatusBadge.css';

export type DataStatusType =
  | 'IMPLEMENTED'
  | 'VALIDATED'
  | 'DEMO MODE'
  | 'SIMULATED DATA'
  | 'DEMO MODE · SIMULATED DATA'
  | 'DEMO SAR · SIMULATED DATA'
  | 'DEMO ROUTE · SIMULATED'
  | 'MODEL PREVIEW'
  | 'PLANNED MODULE'
  | 'NOT IMPLEMENTED'
  | 'EXTERNAL DATA REQUIRED'
  | 'PROJECT EVALUATION RESULTS'
  | 'DEMO / PLANNED BENCHMARKS'
  | 'HISTORICAL DEMONSTRATION MODE';

interface DataStatusBadgeProps {
  status: DataStatusType;
  subText?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const DataStatusBadge: React.FC<DataStatusBadgeProps> = ({
  status,
  subText,
  className = '',
  size = 'md',
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'IMPLEMENTED':
      case 'VALIDATED':
        return {
          icon: <ShieldCheck size={size === 'sm' ? 10 : 12} />,
          variant: 'status-valid',
          defaultSub: 'Validated functional implementation',
        };
      case 'MODEL PREVIEW':
        return {
          icon: <Cpu size={size === 'sm' ? 10 : 12} />,
          variant: 'status-preview',
          defaultSub: 'Architecture preview (inference simulated for demo)',
        };
      case 'PROJECT EVALUATION RESULTS':
        return {
          icon: <Activity size={size === 'sm' ? 10 : 12} />,
          variant: 'status-eval',
          defaultSub: 'U-Net + ResNet34 binary segmentation specification',
        };
      case 'PLANNED MODULE':
      case 'NOT IMPLEMENTED':
        return {
          icon: <Clock size={size === 'sm' ? 10 : 12} />,
          variant: 'status-planned',
          defaultSub: 'Module planned for future roadmap release',
        };
      case 'EXTERNAL DATA REQUIRED':
        return {
          icon: <CloudOff size={size === 'sm' ? 10 : 12} />,
          variant: 'status-external',
          defaultSub: 'Requires live CMEMS / satellite downlink API',
        };
      case 'HISTORICAL DEMONSTRATION MODE':
        return {
          icon: <History size={size === 'sm' ? 10 : 12} />,
          variant: 'status-hist',
          defaultSub: 'Archival demonstration records',
        };
      case 'DEMO / PLANNED BENCHMARKS':
        return {
          icon: <Layers size={size === 'sm' ? 10 : 12} />,
          variant: 'status-benchmark',
          defaultSub: 'Synthetic benchmarks for UI evaluation preview',
        };
      case 'DEMO MODE':
      case 'SIMULATED DATA':
      case 'DEMO MODE · SIMULATED DATA':
      default:
        return {
          icon: <AlertTriangle size={size === 'sm' ? 10 : 12} />,
          variant: 'status-demo',
          defaultSub: 'Demonstration only · Synthetic incident data',
        };
    }
  };

  const { icon, variant, defaultSub } = getStatusConfig();

  return (
    <div
      className={`data-status-badge data-status-badge--${variant} data-status-badge--${size} ${className}`}
      title={subText || defaultSub}
      role="status"
    >
      <span className="data-status-icon" aria-hidden="true">{icon}</span>
      <span className="data-status-text">{status}</span>
    </div>
  );
};

export const DemoBanner: React.FC<{
  title?: string;
  message: string;
  status?: DataStatusType;
}> = ({
  title = 'DEMONSTRATION WORKSTATION',
  message,
  status = 'DEMO MODE · SIMULATED DATA',
}) => {
  return (
    <div className="demo-banner-box" role="note">
      <div className="demo-banner-header">
        <DataStatusBadge status={status} size="sm" />
        <span className="demo-banner-title">{title}</span>
      </div>
      <p className="demo-banner-msg">{message}</p>
    </div>
  );
};
