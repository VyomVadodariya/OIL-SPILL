import React from 'react';
import './DataCard.css';

type CardSeverity = 'critical' | 'warning' | 'nominal' | 'info' | 'cyan' | 'none';
type DeltaDirection = 'up' | 'down' | 'flat';

interface DataCardProps {
  label: string;
  value: string | number;
  unit?: string;
  sublabel?: string;
  delta?: string;
  deltaDir?: DeltaDirection;
  severity?: CardSeverity;
  icon?: React.ReactNode;
  compact?: boolean;
  skeleton?: boolean;
  className?: string;
}

export const DataCard: React.FC<DataCardProps> = ({
  label,
  value,
  unit,
  sublabel,
  delta,
  deltaDir = 'flat',
  severity = 'none',
  icon,
  compact = false,
  skeleton = false,
  className = '',
}) => {
  const classes = [
    'data-card',
    severity !== 'none' ? `data-card-${severity}` : '',
    compact ? 'data-card-compact' : '',
    skeleton ? 'data-card-skeleton' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const deltaArrow = deltaDir === 'up' ? '↑' : deltaDir === 'down' ? '↓' : '→';

  return (
    <div className={classes}>
      <div className="data-card-header">
        <span className="data-card-label">{label}</span>
        {icon && <span className="data-card-icon" aria-hidden="true">{icon}</span>}
      </div>

      <div className="data-card-value">
        {skeleton ? '' : value}
        {!skeleton && unit && <span className="data-card-unit">{unit}</span>}
      </div>

      {(delta || sublabel) && !skeleton && (
        <div className="data-card-footer">
          {delta && (
            <span className={`data-card-delta data-card-delta-${deltaDir}`}>
              {deltaArrow} {delta}
            </span>
          )}
          {sublabel && (
            <span className="data-card-sublabel">{sublabel}</span>
          )}
        </div>
      )}
    </div>
  );
};
