/**
 * ZoomControls 组件
 * 缩放控制栏
 */

import React from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { MIN_SCALE, MAX_SCALE } from '../constants';

interface ZoomControlsProps {
  scale: number;
  zoomPercent: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onSliderChange: (value: number) => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  scale,
  zoomPercent,
  onZoomIn,
  onZoomOut,
  onReset,
  onSliderChange,
}) => (
  <div
    className="absolute bottom-4 left-1/2 h-8 flex items-center gap-2 rounded-lg px-2"
    style={{
      backgroundColor: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      border: '1px solid rgba(0,0,0,0.1)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      transform: 'translateX(-50%)',
    }}
  >
    <button
      onClick={onZoomOut}
      className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/5"
    >
      <Minus size={14} />
    </button>
    <span
      className="text-[12px] w-10 text-center tabular-nums"
      style={{ color: '#333' }}
    >
      {zoomPercent}%
    </span>
    <input
      type="range"
      min={MIN_SCALE}
      max={MAX_SCALE}
      step={0.01}
      value={scale}
      onChange={(e) => onSliderChange(parseFloat(e.target.value))}
      className="w-20"
      style={{ accentColor: 'var(--color-field-focus)' }}
    />
    <button
      onClick={onZoomIn}
      className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/5"
    >
      <Plus size={14} />
    </button>
    <div className="w-px h-4 bg-gray-300" />
    <button
      onClick={onReset}
      className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/5"
    >
      <RotateCcw size={14} />
    </button>
  </div>
);
