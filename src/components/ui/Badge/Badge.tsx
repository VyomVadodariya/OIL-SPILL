import React from 'react';
import './Badge.css';

export type BadgeVariant =
  | 'critical'
  | 'warning'
  | 'nominal'
  | 'info'
  | 'inactive'
  | 'cyan'
  | 'default';

export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  children,
  className = '',
}) => {
  const sizeClass = size === 'md' ? '' : `badge-${size}`;
  const classes = ['badge', `badge-${variant}`, sizeClass, className]
    .filter(Boolean)
    .join(' ');

  return <span className={classes}>{children}</span>;
};

/* ---- Status Dot Badge ---- */

interface StatusDotProps {
  variant?: BadgeVariant;
  label: string;
  pulse?: boolean;
  className?: string;
}

export const StatusDot: React.FC<StatusDotProps> = ({
  variant = 'default',
  label,
  pulse = false,
  className = '',
}) => (
  <span className={`badge badge-dot badge-${variant} ${className}`}>
    <span
      className={`badge-dot-indicator ${pulse ? 'badge-dot-pulse' : ''}`}
      aria-hidden="true"
    />
    {label}
  </span>
);
