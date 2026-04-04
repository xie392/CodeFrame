import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import type { ConflictResult } from '@shared/utils/shortcut-utils';

interface ConflictAlertProps {
  conflict: ConflictResult;
  suggestions?: string[];
  onClose?: () => void;
  className?: string;
}

/**
 * 快捷键冲突提示组件
 */
export const ConflictAlert: React.FC<ConflictAlertProps> = ({
  conflict,
  suggestions = [],
  onClose,
  className = '',
}) => {
  if (!conflict.hasConflict) return null;

  return (
    <div
      className={`flex items-start gap-2 px-3 py-2 rounded-md ${className}`}
      style={{
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
      }}
    >
      <AlertCircle className="w-4 h-4 text-[#EF4444] flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-[12px] text-[#EF4444] font-body">
          {conflict.message}
        </p>
        {suggestions.length > 0 && (
          <p className="text-[11px] text-[#999999] font-body mt-1">
            建议: {suggestions.join(', ')}
          </p>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-0.5 text-[#EF4444] hover:text-[#DC2626] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
