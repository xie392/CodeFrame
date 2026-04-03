/**
 * PaddingInput 组件
 * 边距输入控件
 */

import React from 'react';
import { MAX_PADDING_VALUE } from '../constants';

interface PaddingInputProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
}

export const PaddingInput: React.FC<PaddingInputProps> = ({
  label,
  value,
  onChange,
}) => (
  <div className="flex flex-col items-center gap-0.5">
    <span className="text-[9px] leading-none" style={{ color: '#999' }}>
      {label}
    </span>
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^0-9]/g, '');
        const cleaned = raw.replace(/^0+(?=\d)/, '');
        const v = Math.min(
          MAX_PADDING_VALUE,
          Math.max(0, parseInt(cleaned || '0', 10)),
        );
        onChange(v);
      }}
      onFocus={(e) => {
        e.target.select();
        e.target.style.borderColor = 'var(--color-field-focus)';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = '#d1d5db';
      }}
      className="w-full h-6 text-center text-[11px] tabular-nums border rounded outline-none transition-colors"
      style={{
        backgroundColor: '#FAFAFA',
        borderColor: '#d1d5db',
        color: '#333',
      }}
    />
  </div>
);
