import React from 'react';
import { cn } from '@shared/lib/utils';

interface SettingSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export const SettingSwitch: React.FC<SettingSwitchProps> = ({
  checked,
  onChange,
  className,
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'w-9 h-5 rounded-full relative transition-colors shrink-0 cursor-pointer',
        className
      )}
      style={{
        backgroundColor: checked ? '#6366f1' : '#d1d5db',
      }}
    >
      <div
        className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
        style={{
          backgroundColor: '#fff',
          left: checked ? '18px' : '2px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        }}
      />
    </button>
  );
};
