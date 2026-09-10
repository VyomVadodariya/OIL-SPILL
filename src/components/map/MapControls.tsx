import React from 'react';
import { Plus, Minus, RotateCcw, Palette } from 'lucide-react';
import './MapControls.css';

export type BasemapTheme = 'liberty' | 'bright' | 'dark';

export interface MapControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  currentTheme?: BasemapTheme;
  onThemeChange?: (theme: BasemapTheme) => void;
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  showPercentage?: boolean;
}

export const MapControls: React.FC<MapControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  currentTheme = 'liberty',
  onThemeChange,
  position = 'top-right',
  showPercentage = true,
}) => {
  const zoomPct = Math.round(zoom * 100);

  const cycleTheme = () => {
    if (!onThemeChange) return;
    if (currentTheme === 'liberty') onThemeChange('bright');
    else if (currentTheme === 'bright') onThemeChange('dark');
    else onThemeChange('liberty');
  };

  const getThemeLabel = (theme: BasemapTheme) => {
    switch (theme) {
      case 'liberty':
        return 'HIGH VIS (LIBERTY)';
      case 'bright':
        return 'BRIGHT MAP';
      case 'dark':
        return 'DARK MAP';
    }
  };

  return (
    <div
      className={`map-controls map-controls--${position}`}
      role="toolbar"
      aria-label="Map Navigation Controls"
    >
      {showPercentage && (
        <div
          className="map-control-badge"
          title="Current Zoom Level"
          aria-label={`Zoom level ${zoomPct}%`}
        >
          {zoomPct}%
        </div>
      )}

      {onThemeChange && (
        <button
          type="button"
          className="map-control-btn map-control-btn--theme"
          onClick={(e) => {
            e.stopPropagation();
            cycleTheme();
          }}
          title="Toggle Basemap Theme (Liberty / Bright / Dark)"
          aria-label="Toggle basemap theme"
        >
          <Palette size={13} aria-hidden="true" />
          <span className="map-control-theme-text">{getThemeLabel(currentTheme)}</span>
        </button>
      )}

      <div className="map-control-group">
        <button
          type="button"
          className="map-control-btn"
          onClick={(e) => {
            e.stopPropagation();
            onZoomIn();
          }}
          title="Zoom In (+ or =)"
          aria-label="Zoom in"
        >
          <Plus size={14} aria-hidden="true" />
        </button>

        <button
          type="button"
          className="map-control-btn"
          onClick={(e) => {
            e.stopPropagation();
            onZoomOut();
          }}
          title="Zoom Out (-)"
          aria-label="Zoom out"
        >
          <Minus size={14} aria-hidden="true" />
        </button>

        <button
          type="button"
          className="map-control-btn map-control-btn--reset"
          onClick={(e) => {
            e.stopPropagation();
            onReset();
          }}
          title="Reset View (0)"
          aria-label="Reset map view"
        >
          <RotateCcw size={13} aria-hidden="true" />
          <span className="map-control-reset-text">RESET</span>
        </button>
      </div>
    </div>
  );
};
