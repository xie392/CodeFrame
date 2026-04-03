/**
 * CropHint - 裁剪提示组件
 *
 * 显示裁剪操作的操作提示，包括：
 * - 绘制提示
 * - 调整提示
 * - 快捷键提示
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import type { CropArea } from '../../types';

export interface CropHintProps {
  cropArea: CropArea | null;
}

/**
 * 裁剪提示组件
 */
export function CropHint({ cropArea }: CropHintProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <div
      className="absolute top-4 left-1/2 flex items-center gap-3 rounded-lg px-4 py-2"
      style={{
        backgroundColor: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        transform: 'translateX(-50%)',
      }}
    >
      <span className="text-[12px] text-white">
        {cropArea ? t('crop.adjustHint') : t('crop.drawHint')}
      </span>
      <span className="text-[12px]" style={{ color: '#a5b4fc' }}>
        Enter
      </span>
      <span className="text-[12px] text-white">{t('crop.confirm')}</span>
      <span className="text-[12px] text-gray-400 mx-1">|</span>
      <span className="text-[12px] text-amber-400">Esc</span>
      <span className="text-[12px] text-white">{t('crop.cancel')}</span>
    </div>
  );
}

export default CropHint;
