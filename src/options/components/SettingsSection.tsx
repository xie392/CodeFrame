import React from 'react';
import { cn } from '@shared/lib/utils';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  children,
  className,
}) => {
  return (
    <div className={cn('w-full', className)}>
      {/* 区块标题 */}
      <div className="text-[13px] font-semibold text-[var(--color-accent-orange)] mb-4 font-body">
        {title}
      </div>
      
      {/* 区块内容卡片 */}
      <div
        className="w-full rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
        }}
      >
        {children}
      </div>
    </div>
  );
};
