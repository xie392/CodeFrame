import React, { useRef } from 'react';
import { PRESET_COLORS } from '../../constants';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange }) => {
  const colorInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-[var(--color-editor-hint)] font-body leading-none">
        stroke:
      </span>
      <div className="flex gap-1 flex-wrap">
        {PRESET_COLORS.map((presetColor) => (
          <button
            key={presetColor}
            onClick={() => onChange(presetColor)}
            className="w-6 h-6 rounded-full shrink-0 cursor-pointer transition-transform hover:scale-110"
            style={{
              backgroundColor: presetColor,
              border:
                color === presetColor
                  ? '2px solid var(--color-field-focus)'
                  : '1px solid #d1d5db',
            }}
          />
        ))}
        {/* 自定义颜色选择器 */}
        <button
          onClick={() => colorInputRef.current?.click()}
          className="w-6 h-6 rounded-full shrink-0 cursor-pointer overflow-hidden"
          style={{
            background:
              'linear-gradient(135deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080)',
            border: '1px solid #d1d5db',
          }}
        >
          <input
            ref={colorInputRef}
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full opacity-0 cursor-pointer"
          />
        </button>
      </div>
    </div>
  );
};

export default ColorPicker;
