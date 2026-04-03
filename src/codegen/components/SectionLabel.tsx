/**
 * SectionLabel 组件
 * 区域标签
 */

import React from 'react';

interface SectionLabelProps {
  children: React.ReactNode;
}

export const SectionLabel: React.FC<SectionLabelProps> = ({ children }) => (
  <span
    className="text-[11px] leading-none shrink-0"
    style={{ color: '#3D3D3D' }}
  >
    {children}
  </span>
);
