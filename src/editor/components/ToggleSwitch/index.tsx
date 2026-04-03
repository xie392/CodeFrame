import React from 'react';

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  enabled,
  onChange,
}) => (
  <button
    onClick={() => onChange(!enabled)}
    className="w-9 h-5 rounded-full relative cursor-pointer transition-colors shrink-0"
    style={{
      backgroundColor: enabled
        ? 'var(--color-switch-on)'
        : 'var(--color-switch-off)',
    }}
  >
    <div
      className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
      style={{
        backgroundColor: '#fff',
        left: enabled ? '18px' : '2px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }}
    />
  </button>
);

export default ToggleSwitch;
