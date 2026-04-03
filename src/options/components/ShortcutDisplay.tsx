import React from 'react';

interface ShortcutDisplayProps {
  keys: string[];
  className?: string;
}

export const ShortcutDisplay: React.FC<ShortcutDisplayProps> = ({
  keys,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {keys.map((key, index) => (
        <React.Fragment key={index}>
          <div
            className="h-[26px] rounded-md px-2 flex items-center justify-center"
            style={{
              background: '#F0F0F0',
            }}
          >
            <span
              className="text-[11px] font-semibold font-body"
              style={{
                color: key.length === 1 ? '#FF6B35' : '#1A1A1A',
              }}
            >
              {key}
            </span>
          </div>
          {index < keys.length - 1 && (
            <span className="text-[11px] text-[#CCCCCC] font-body">+</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
