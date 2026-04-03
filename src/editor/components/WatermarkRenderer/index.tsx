import React from 'react';
import type { ImageFrameSettings } from '../../types';

/** 根据背景颜色计算水印颜色（自动适配） */
function getWatermarkColor(bg: ImageFrameSettings['background']): string {
  let r = 0,
    g = 0,
    b = 0;

  if (bg.type === 'solid' && bg.color !== 'transparent') {
    // 解析纯色
    const hex = bg.color.replace('#', '');
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else if (bg.type === 'linear' || bg.type === 'radial') {
    // 取渐变色的平均值
    const c1 = bg.gradientColors[0].replace('#', '');
    const c2 = bg.gradientColors[1].replace('#', '');
    const r1 = parseInt(c1.substring(0, 2), 16);
    const g1 = parseInt(c1.substring(2, 4), 16);
    const b1 = parseInt(c1.substring(4, 6), 16);
    const r2 = parseInt(c2.substring(0, 2), 16);
    const g2 = parseInt(c2.substring(2, 4), 16);
    const b2 = parseInt(c2.substring(4, 6), 16);
    r = (r1 + r2) / 2;
    g = (g1 + g2) / 2;
    b = (b1 + b2) / 2;
  }

  // 计算亮度
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

  // 深色背景用白色，浅色背景用黑色
  return luminance < 128
    ? 'rgba(255, 255, 255, 0.9)'
    : 'rgba(0, 0, 0, 0.7)';
}

interface WatermarkRendererProps {
  watermark: ImageFrameSettings['watermark'];
  bgColor: ImageFrameSettings['background'];
}

export const WatermarkRenderer: React.FC<WatermarkRendererProps> = ({
  watermark,
  bgColor,
}) => {
  if (!watermark.enabled) return null;

  const opacity = watermark.opacity / 100;

  // 位置样式映射
  const positionStyles: Record<string, React.CSSProperties> = {
    'top-left': { top: '8px', left: '8px' },
    'top-right': { top: '8px', right: '8px' },
    'bottom-left': { bottom: '8px', left: '8px' },
    'bottom-right': { bottom: '8px', right: '8px' },
  };

  const positionStyle =
    positionStyles[watermark.position] || positionStyles['bottom-right'];

  // 图片水印
  if (watermark.imageUrl) {
    return (
      <img
        src={watermark.imageUrl}
        alt="水印"
        style={{
          position: 'absolute',
          ...positionStyle,
          width: watermark.imageSize,
          height: watermark.imageSize,
          objectFit: 'contain',
          opacity,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />
    );
  }

  // 文字水印
  if (!watermark.text) return null;

  const textColor = getWatermarkColor(bgColor);

  return (
    <div
      style={{
        position: 'absolute',
        ...positionStyle,
        fontSize: watermark.fontSize,
        fontFamily: 'JetBrains Mono, IBM Plex Mono, monospace',
        color: textColor,
        opacity,
        pointerEvents: 'none',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {watermark.text}
    </div>
  );
};

export default WatermarkRenderer;
