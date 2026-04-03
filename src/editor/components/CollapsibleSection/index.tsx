import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { ToggleSwitch } from '../ToggleSwitch';

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  enabled?: boolean;
  onToggle?: (enabled: boolean) => void;
  children: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  defaultOpen = true,
  open,
  onOpenChange,
  enabled,
  onToggle,
  children,
}) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = open !== undefined ? open : internalOpen;
  const hasToggle = enabled !== undefined && onToggle !== undefined;

  const handleToggle = () => {
    if (onOpenChange) {
      onOpenChange(!isOpen);
    } else {
      setInternalOpen(!isOpen);
    }
  };

  return (
    <div className="flex flex-col gap-[10px]">
      <div className="flex items-center justify-between">
        <button
          onClick={handleToggle}
          className="flex items-center gap-1 cursor-pointer"
        >
          <ChevronRight
            size={12}
            style={{
              color: 'var(--color-accent-orange)',
              transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s ease',
            }}
          />
          <span
            className="text-[11px] font-body font-semibold"
            style={{ color: 'var(--color-accent-orange)' }}
          >
            {title}
          </span>
        </button>
        {hasToggle && (
          <ToggleSwitch enabled={enabled!} onChange={onToggle!} />
        )}
      </div>
      {isOpen && (!hasToggle || enabled) && (
        <div className="pl-3 flex flex-col gap-[8px]">{children}</div>
      )}
    </div>
  );
};

export default CollapsibleSection;
