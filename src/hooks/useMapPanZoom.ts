import React, { useState, useRef, useCallback, useEffect } from 'react';

export interface PanZoomState {
  zoom: number;
  pan: { x: number; y: number };
  isDragging: boolean;
}

export interface UseMapPanZoomOptions {
  minZoom?: number;
  maxZoom?: number;
  initialZoom?: number;
  initialPan?: { x: number; y: number };
  zoomSensitivity?: number;
  disabled?: boolean;
}

export function useMapPanZoom(options: UseMapPanZoomOptions = {}) {
  const {
    minZoom = 0.6,
    maxZoom = 5.0,
    initialZoom = 1.0,
    initialPan = { x: 0, y: 0 },
    zoomSensitivity = 0.0015,
    disabled = false,
  } = options;

  const [zoom, setZoom] = useState(initialZoom);
  const [pan, setPan] = useState(initialPan);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  /* Clamp pan coordinates to keep map within view */
  const clampPan = useCallback(
    (newPan: { x: number; y: number }, currentZoom: number) => {
      if (!containerRef.current) return newPan;
      const rect = containerRef.current.getBoundingClientRect();
      const w = rect.width || 800;
      const h = rect.height || 600;

      const maxX = w * 0.7;
      const minX = -w * (currentZoom - 0.3);
      const maxY = h * 0.7;
      const minY = -h * (currentZoom - 0.3);

      return {
        x: Math.max(minX, Math.min(maxX, newPan.x)),
        y: Math.max(minY, Math.min(maxY, newPan.y)),
      };
    },
    []
  );

  /* Reset transform */
  const resetView = useCallback(() => {
    setZoom(initialZoom);
    setPan(initialPan);
  }, [initialZoom, initialPan]);

  /* Cursor-centered zoom helper */
  const zoomAtPoint = useCallback(
    (targetZoom: number, clientX?: number, clientY?: number) => {
      if (disabled) return;

      const nextZoom = Math.max(minZoom, Math.min(maxZoom, targetZoom));
      if (!containerRef.current) {
        setZoom(nextZoom);
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const cx = clientX !== undefined ? clientX - rect.left : rect.width / 2;
      const cy = clientY !== undefined ? clientY - rect.top : rect.height / 2;

      setZoom((prevZoom) => {
        setPan((prevPan) => {
          const worldX = (cx - prevPan.x) / prevZoom;
          const worldY = (cy - prevPan.y) / prevZoom;
          const newPanX = cx - worldX * nextZoom;
          const newPanY = cy - worldY * nextZoom;
          return clampPan({ x: newPanX, y: newPanY }, nextZoom);
        });
        return nextZoom;
      });
    },
    [disabled, minZoom, maxZoom, clampPan]
  );

  const zoomIn = useCallback(() => {
    zoomAtPoint(zoom * 1.25);
  }, [zoom, zoomAtPoint]);

  const zoomOut = useCallback(() => {
    zoomAtPoint(zoom / 1.25);
  }, [zoom, zoomAtPoint]);

  /* Mouse / Pointer Drag handlers */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled || e.button !== 0) return; // Only left click
      // Prevent drag if clicking on interactive buttons or form elements
      const target = e.target as HTMLElement;
      if (target.closest('button, input, select, textarea, [role="button"], .sar-slider-touch-area')) {
        return;
      }

      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      panStartRef.current = { ...pan };
    },
    [disabled, pan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || disabled) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      const rawPan = {
        x: panStartRef.current.x + dx,
        y: panStartRef.current.y + dy,
      };
      setPan(clampPan(rawPan, zoom));
    },
    [isDragging, disabled, zoom, clampPan]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
    }
  }, [isDragging]);

  /* Wheel Zoom handler */
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (disabled) return;
      e.preventDefault();
      const delta = -e.deltaY * zoomSensitivity * 10;
      const zoomFactor = delta > 0 ? 1 + Math.abs(delta) : 1 / (1 + Math.abs(delta));
      zoomAtPoint(zoom * zoomFactor, e.clientX, e.clientY);
    },
    [disabled, zoom, zoomAtPoint, zoomSensitivity]
  );

  /* Double click zoom */
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      const target = e.target as HTMLElement;
      if (target.closest('button, input, select, textarea, [role="button"], .sar-slider-touch-area')) {
        return;
      }
      zoomAtPoint(zoom * 1.4, e.clientX, e.clientY);
    },
    [disabled, zoom, zoomAtPoint]
  );

  /* Keyboard shortcut handling (+/-, 0) */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isHovered || disabled) return;
      const activeEl = document.activeElement as HTMLElement | null;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.isContentEditable)
      ) {
        return;
      }

      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        zoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        resetView();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHovered, disabled, zoomIn, zoomOut, resetView]);

  return {
    zoom,
    pan,
    isDragging,
    containerRef,
    setIsHovered,
    resetView,
    zoomIn,
    zoomOut,
    zoomAtPoint,
    bindContainerProps: {
      ref: containerRef,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: () => {
        handleMouseUp();
        setIsHovered(false);
      },
      onMouseEnter: () => setIsHovered(true),
      onWheel: handleWheel,
      onDoubleClick: handleDoubleClick,
      style: {
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
      } as React.CSSProperties,
    },
  };
}
