import React from 'react';
import { cn } from '@shared/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface SettingItemProps {
  icon?: LucideIcon;
  label: string;
  children: React.ReactNode;
  className?: string;
}

export const SettingItem: React.FC<SettingItemProps> = ({
  icon: Icon,
  label,
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        'w-full h-[52px] px-5 flex items-center justify-between',
        'border-b border-black/[0.03] last:border-b-0',
        className
      )}
    >
      {/* 左侧：图标 + 标签 */}
      <div className="flex items-center gap-3">
        {Icon && (
          <Icon className="w-[18px] h-[18px] text-[#777777]" />
        )}
        <span className="text-[13px] text-[#1A1A1A] font-body">
          {label}
        </span>
      </div>
      
      {/* 右侧：控件 */}
      <div className="shrink-0">
        {children}
      </div>
    </div>
  );
};
