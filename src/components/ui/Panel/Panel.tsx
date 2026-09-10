import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import './Panel.css';

/* ---- Panel Root ---- */
interface PanelProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Panel: React.FC<PanelProps> = ({ children, className = '', style }) => (
  <div className={`panel ${className}`} style={style}>{children}</div>
);

/* ---- Panel Header ---- */
interface PanelHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({
  title, subtitle, icon, actions, className = '',
}) => (
  <div className={`panel-header ${className}`}>
    <div className="panel-header-left">
      {icon && <span className="panel-icon">{icon}</span>}
      <div style={{ minWidth: 0 }}>
        <div className="panel-title">{title}</div>
        {subtitle && <div className="panel-subtitle">{subtitle}</div>}
      </div>
    </div>
    {actions && <div className="panel-header-right">{actions}</div>}
  </div>
);

/* ---- Panel Body ---- */
interface PanelBodyProps {
  children: React.ReactNode;
  padded?: boolean;
  className?: string;
}

export const PanelBody: React.FC<PanelBodyProps> = ({ children, padded = false, className = '' }) => (
  <div className={`panel-body ${padded ? 'panel-body-padded' : ''} ${className}`}>
    {children}
  </div>
);

/* ---- Panel Footer ---- */
interface PanelFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const PanelFooter: React.FC<PanelFooterProps> = ({ children, className = '' }) => (
  <div className={`panel-footer ${className}`}>{children}</div>
);

/* ---- Panel Section ---- */
interface PanelSectionProps {
  label?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
}

export const PanelSection: React.FC<PanelSectionProps> = ({
  label, children, collapsible = false, defaultOpen = true, className = '',
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`panel-section ${className}`}>
      {label && (
        <div
          className="panel-section-label"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          {label}
          {collapsible && (
            <button
              className={`panel-toggle ${open ? 'panel-toggle-open' : 'panel-toggle-closed'}`}
              onClick={() => setOpen(!open)}
              aria-label={open ? 'Collapse' : 'Expand'}
            >
              <ChevronDown size={12} />
            </button>
          )}
        </div>
      )}
      {(!collapsible || open) && children}
    </div>
  );
};

/* ---- Key-Value Row ---- */
interface KVRowProps {
  label: string;
  value: string | number | React.ReactNode;
  mono?: boolean;
  className?: string;
}

export const KVRow: React.FC<KVRowProps> = ({ label, value, mono = false, className = '' }) => (
  <div className={`kv-row ${className}`}>
    <span className="kv-key">{label}</span>
    <span className={`kv-value ${mono ? 'kv-value-mono' : ''}`}>{value}</span>
  </div>
);
