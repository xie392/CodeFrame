/**
 * useCrop - 裁剪功能 Hook
 *
 * 处理图片裁剪功能，包括：
 * - 应用裁剪
 * - 取消裁剪
 * - 裁剪框状态管理
 */

import { useCallback } from 'react';
import type { CropArea } from '../types';

/**
 * 尺寸信息
 */
interface Size {
  width: number;
  height: number;
}

/**
 * 裁剪回调函数
 */
interface CropCallbacks {
  pushHistory: () => void;
  setImageData: (data: string) => void;
  setArrows: (updater: (prev: unknown[]) => unknown[]) => void;
  setRects: (updater: (prev: unknown[]) => unknown[]) => void;
  setTexts: (updater: (prev: unknown[]) => unknown[]) => void;
  setMosaics: (updater: (prev: unknown[]) => unknown[]) => void;
  setSelectedArrowIds: (ids: string[]) => void;
  setSelectedRectIds: (ids: string[]) => void;
  setSelectedTextIds: (ids: string[]) => void;
  setSelectedMosaicIds: (ids: string[]) => void;
  setCropArea: (area: CropArea | null) => void;
  setImageNaturalSize: (size: Size) => void;
  setImageDisplaySize: (size: Size | null) => void;
  setActiveTool: (tool: string) => void;
  setScale: (scale: number) => void;
  setOffset: (offset: { x: number; y: number }) => void;
}

/**
 * 裁剪配置
 */
interface CropConfig {
  imageData: string | null;
  cropAreaRef: React.MutableRefObject<CropArea | null>;
  imageNaturalSizeRef: React.MutableRefObject<Size | null>;
  imageDisplaySizeRef: React.MutableRefObject<Size | null>;
  scaleRef: React.MutableRefObject<number>;
  offsetRef: React.MutableRefObject<{ x: number; y: number }>;
}

/**
 * 裁剪功能 Hook
 */
export function useCrop(
  config: CropConfig,
  callbacks: CropCallbacks
): {
  applyCrop: () => void;
  cancelCrop: () => void;
} {
  const {
    imageData,
    cropAreaRef,
    imageNaturalSizeRef,
    imageDisplaySizeRef,
    scaleRef,
    offsetRef,
  } = config;

  /**
   * 应用裁剪
   */
  const applyCrop = useCallback(() => {
    const currentCropArea = cropAreaRef.current;
    const naturalSize = imageNaturalSizeRef.current;
    const displaySize = imageDisplaySizeRef.current;

    if (!currentCropArea || !imageData || !naturalSize || !displaySize) return;

    callbacks.pushHistory();

    const scaleX = naturalSize.width / displaySize.width;
    const scaleY = naturalSize.height / displaySize.height;

    const cropX = Math.round(currentCropArea.x * scaleX);
    const cropY = Math.round(currentCropArea.y * scaleY);
    const cropWidth = Math.round(currentCropArea.width * scaleX);
    const cropHeight = Math.round(currentCropArea.height * scaleY);

    const img = new window.Image();
    img.onload = () => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = cropWidth;
      tempCanvas.height = cropHeight;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      tempCtx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      const croppedImageData = tempCanvas.toDataURL('image/png');

      callbacks.setImageData(croppedImageData);
      callbacks.setArrows(() => []);
      callbacks.setRects(() => []);
      callbacks.setTexts(() => []);
      callbacks.setMosaics(() => []);
      callbacks.setSelectedArrowIds([]);
      callbacks.setSelectedRectIds([]);
      callbacks.setSelectedTextIds([]);
      callbacks.setSelectedMosaicIds([]);
      callbacks.setCropArea(null);
      callbacks.setImageNaturalSize({ width: cropWidth, height: cropHeight });
      callbacks.setImageDisplaySize(null);
      callbacks.setActiveTool('select');
      scaleRef.current = 1;
      offsetRef.current = { x: 0, y: 0 };
      callbacks.setScale(1);
      callbacks.setOffset({ x: 0, y: 0 });
    };
    img.src = imageData;
  }, [imageData, callbacks, cropAreaRef, imageNaturalSizeRef, imageDisplaySizeRef, scaleRef, offsetRef]);

  /**
   * 取消裁剪
   */
  const cancelCrop = useCallback(() => {
    callbacks.setCropArea(null);
    callbacks.setActiveTool('select');
  }, [callbacks]);

  return {
    applyCrop,
    cancelCrop,
  };
}

export default useCrop;
