/**
 * useCrop - 裁剪功能 Hook
 *
 * 处理图片裁剪功能，包括：
 * - 应用裁剪
 * - 取消裁剪
 * - 裁剪框状态管理
 */

import { useCallback } from 'react';
import type { CropArea, ArrowShape, RectShape, TextShape, MosaicShape, ToolId } from '../types';

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
  setArrows: (updater: (prev: ArrowShape[]) => ArrowShape[]) => void;
  setRects: (updater: (prev: RectShape[]) => RectShape[]) => void;
  setTexts: (updater: (prev: TextShape[]) => TextShape[]) => void;
  setMosaics: (updater: (prev: MosaicShape[]) => MosaicShape[]) => void;
  setSelectedArrowIds: (ids: string[]) => void;
  setSelectedRectIds: (ids: string[]) => void;
  setSelectedTextIds: (ids: string[]) => void;
  setSelectedMosaicIds: (ids: string[]) => void;
  setCropArea: (area: CropArea | null) => void;
  setImageNaturalSize: (size: Size) => void;
  setImageDisplaySize: (size: Size | null) => void;
  setActiveTool: (tool: ToolId) => void;
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

    // 裁剪区域在 displaySize 坐标系中的偏移和缩放比例
    const cropOffX = currentCropArea.x;
    const cropOffY = currentCropArea.y;
    const cropDispW = currentCropArea.width;
    const cropDispH = currentCropArea.height;

    // 裁剪后新图片的 displaySize 与标注坐标的比例
    // 标注坐标在旧 displaySize 系中，需要变换到新 displaySize 系
    // 新 displaySize 会在图片加载后重新计算，标注按比例缩放即可
    const ratioX = cropDispW > 0 ? 1 : 1; // 标注相对于裁剪区域的坐标不变
    const ratioY = cropDispH > 0 ? 1 : 1;

    const img = new window.Image();
    img.onload = () => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = cropWidth;
      tempCanvas.height = cropHeight;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      tempCtx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      const croppedImageData = tempCanvas.toDataURL('image/png');

      // 按裁剪区域调整标注坐标：减去裁剪偏移，保留在裁剪区域内的标注
      callbacks.setArrows((prev) =>
        prev
          .map((a) => ({
            ...a,
            startX: (a.startX - cropOffX) * ratioX,
            startY: (a.startY - cropOffY) * ratioY,
            endX: (a.endX - cropOffX) * ratioX,
            endY: (a.endY - cropOffY) * ratioY,
          }))
          .filter(
            (a) =>
              a.startX >= -10 && a.startY >= -10 &&
              a.endX >= -10 && a.endY >= -10 &&
              a.startX <= cropDispW + 10 && a.startY <= cropDispH + 10 &&
              a.endX <= cropDispW + 10 && a.endY <= cropDispH + 10
          )
      );
      callbacks.setRects((prev) =>
        prev
          .map((r) => ({
            ...r,
            x: (r.x - cropOffX) * ratioX,
            y: (r.y - cropOffY) * ratioY,
          }))
          .filter(
            (r) =>
              r.x + r.width > -10 &&
              r.y + r.height > -10 &&
              r.x < cropDispW + 10 &&
              r.y < cropDispH + 10
          )
      );
      callbacks.setTexts((prev) =>
        prev
          .map((t) => ({
            ...t,
            x: (t.x - cropOffX) * ratioX,
            y: (t.y - cropOffY) * ratioY,
          }))
          .filter(
            (t) =>
              t.x > -10 &&
              t.y > -10 &&
              t.x < cropDispW + 10 &&
              t.y < cropDispH + 10
          )
      );
      callbacks.setMosaics((prev) =>
        prev
          .map((m) => ({
            ...m,
            x: (m.x - cropOffX) * ratioX,
            y: (m.y - cropOffY) * ratioY,
          }))
          .filter(
            (m) =>
              m.x + m.width > -10 &&
              m.y + m.height > -10 &&
              m.x < cropDispW + 10 &&
              m.y < cropDispH + 10
          )
      );
      callbacks.setSelectedArrowIds([]);
      callbacks.setSelectedRectIds([]);
      callbacks.setSelectedTextIds([]);
      callbacks.setSelectedMosaicIds([]);
      callbacks.setCropArea(null);
      callbacks.setImageData(croppedImageData);
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
