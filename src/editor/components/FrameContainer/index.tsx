/**
 * FrameContainer - 帧容器组件
 *
 * 负责渲染图片的帧容器，包括：
 * - 背景
 * - 内边距
 * - 边框圆角
 * - 阴影
 * - 水印
 */

import React from 'react';
import type { ImageFrameSettings } from '../../types';
import { getBackgroundStyle, calculateAspectRatioSize } from '../../utils/editor';
import { CanvasImage } from '../CanvasImage';
import { WatermarkRenderer } from '../WatermarkRenderer';

export interface FrameContainerProps {
  imageData: string;
  imageDisplaySize: { width: number; height: number } | null;
  frameSettings: ImageFrameSettings;
  onImageSizeChange: (w: number, h: number) => void;
  onNaturalSizeChange: (w: number, h: number) => void;
  exportContainerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * 帧容器组件
 */
export function FrameContainer({
  imageData,
  imageDisplaySize,
  frameSettings,
  onImageSizeChange,
  onNaturalSizeChange,
  exportContainerRef,
}: FrameContainerProps): React.ReactElement {
  const imgDisplaySize = imageDisplaySize;

  if (!imgDisplaySize) {
    return (
      <div
        ref={exportContainerRef}
        style={{
          ...getBackgroundStyle(frameSettings.background),
          borderRadius: `${frameSettings.borderRadius.topLeft}${frameSettings.borderRadius.unit} ${frameSettings.borderRadius.topRight}${frameSettings.borderRadius.unit} ${frameSettings.borderRadius.bottomRight}${frameSettings.borderRadius.unit} ${frameSettings.borderRadius.bottomLeft}${frameSettings.borderRadius.unit}`,
          padding: frameSettings.padding.linked
            ? frameSettings.padding.top
            : `${frameSettings.padding.top}px ${frameSettings.padding.right}px ${frameSettings.padding.bottom}px ${frameSettings.padding.left}px`,
          display: 'inline-block',
          boxShadow: frameSettings.shadow.enabled
            ? `0 ${frameSettings.shadow.offsetY}px ${frameSettings.shadow.blur}px ${frameSettings.shadow.color}40`
            : 'none',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            borderRadius: `${frameSettings.imageRadius.topLeft}${frameSettings.imageRadius.unit} ${frameSettings.imageRadius.topRight}${frameSettings.imageRadius.unit} ${frameSettings.imageRadius.bottomRight}${frameSettings.imageRadius.unit} ${frameSettings.imageRadius.bottomLeft}${frameSettings.imageRadius.unit}`,
            overflow: 'hidden',
            display: 'inline-block',
            boxShadow: frameSettings.imageShadow.enabled
              ? `${frameSettings.imageShadow.offsetX}px ${frameSettings.imageShadow.offsetY}px ${frameSettings.imageShadow.blur}px ${frameSettings.imageShadow.color}40`
              : 'none',
          }}
        >
          <CanvasImage src={imageData} onSizeChange={onImageSizeChange} onNaturalSizeChange={onNaturalSizeChange} />
        </div>
        <WatermarkRenderer watermark={frameSettings.watermark} bgColor={frameSettings.background} />
      </div>
    );
  }

  const containerSize = calculateAspectRatioSize(
    frameSettings.aspectRatio,
    imgDisplaySize.width,
    imgDisplaySize.height,
    frameSettings.customAspectRatio
  );

  const isAuto = frameSettings.aspectRatio === 'auto';

  return (
    <div
      ref={exportContainerRef}
      style={{
        ...getBackgroundStyle(frameSettings.background),
        borderRadius: `${frameSettings.borderRadius.topLeft}${frameSettings.borderRadius.unit} ${frameSettings.borderRadius.topRight}${frameSettings.borderRadius.unit} ${frameSettings.borderRadius.bottomRight}${frameSettings.borderRadius.unit} ${frameSettings.borderRadius.bottomLeft}${frameSettings.borderRadius.unit}`,
        padding: frameSettings.padding.linked
          ? frameSettings.padding.top
          : `${frameSettings.padding.top}px ${frameSettings.padding.right}px ${frameSettings.padding.bottom}px ${frameSettings.padding.left}px`,
        display: 'inline-block',
        boxShadow: frameSettings.shadow.enabled
          ? `0 ${frameSettings.shadow.offsetY}px ${frameSettings.shadow.blur}px ${frameSettings.shadow.color}40`
          : 'none',
        overflow: 'hidden',
        position: 'relative',
        ...(isAuto ? {} : { width: containerSize.width, height: containerSize.height }),
      }}
    >
      <div
        style={{
          position: 'relative',
          width: isAuto ? 'auto' : '100%',
          height: isAuto ? 'auto' : '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            borderRadius: `${frameSettings.imageRadius.topLeft}${frameSettings.imageRadius.unit} ${frameSettings.imageRadius.topRight}${frameSettings.imageRadius.unit} ${frameSettings.imageRadius.bottomRight}${frameSettings.imageRadius.unit} ${frameSettings.imageRadius.bottomLeft}${frameSettings.imageRadius.unit}`,
            overflow: 'hidden',
            display: 'inline-block',
            boxShadow: frameSettings.imageShadow.enabled
              ? `${frameSettings.imageShadow.offsetX}px ${frameSettings.imageShadow.offsetY}px ${frameSettings.imageShadow.blur}px ${frameSettings.imageShadow.color}40`
              : 'none',
          }}
        >
          <CanvasImage src={imageData} onSizeChange={onImageSizeChange} onNaturalSizeChange={onNaturalSizeChange} />
        </div>
      </div>
      <WatermarkRenderer watermark={frameSettings.watermark} bgColor={frameSettings.background} />
    </div>
  );
}

export default FrameContainer;
