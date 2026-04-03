/**
 * ZoomControls - 缩放控制组件
 *
 * 显示缩放控制条，包括：
 * - 缩小按钮
 * - 缩放比例显示
 * - 滑块控制
 * - 放大按钮
 * - 重置按钮
 */

import React from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { MIN_SCALE, MAX_SCALE } from '../../constants';

export interface ZoomControlsProps {
  scale: number;
  zoomPercent: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onSliderChange: (value: number) => void;
}

/**
 * 缩放控制组件
 */
export function ZoomControls({
  scale,
  zoomPercent,
  onZoomIn,
  onZoomOut,
  onReset,
  onSliderChange,
}: ZoomControlsProps): React.ReactElement {
  return (
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
        aria-label="缩小"
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
        aria-label="缩放滑块"
      />
      <button
        onClick={onZoomIn}
        className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/5"
        aria-label="放大"
      >
        <Plus size={14} />
      </button>
      <div className="w-px h-4 bg-gray-300" />
      <button
        onClick={onReset}
        className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/5"
        aria-label="重置视图"
      >
        <RotateCcw size={14} />
      </button>
    </div>
  );
}

export default ZoomControls;
