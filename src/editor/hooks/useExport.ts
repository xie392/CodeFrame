/**
 * 导出功能 Hook
 * 处理图片导出和复制到剪贴板
 */

import { useState, useCallback, useMemo } from 'react';
import { snapdom } from '@zumer/snapdom';
import { EXPORT_FORMATS } from '@shared/constants';
import { useSettingsStore } from '@shared/stores/settings-store';
import type { ExportFormat } from '@shared/types';
import type { ArrowShape, RectShape, TextShape, MosaicShape, ImageFrameSettings } from '../types';
import { calculateAspectRatioSize } from '../utils/editor';
import { CanvasRenderer } from '../services/canvas-renderer';

interface UseExportOptions {
  exportContainerRef: React.RefObject<HTMLDivElement | null>;
  imageData: string | null;
  frameSettings: ImageFrameSettings;
  imageDisplaySizeRef: React.MutableRefObject<{ width: number; height: number } | null>;
  arrowsRef: React.MutableRefObject<ArrowShape[]>;
  rectsRef: React.MutableRefObject<RectShape[]>;
  textsRef: React.MutableRefObject<TextShape[]>;
  mosaicsRef: React.MutableRefObject<MosaicShape[]>;
}

interface UseExportReturn {
  isExporting: boolean;
  copied: boolean;
  exportError: string | null;
  setIsExporting: (isExporting: boolean) => void;
  setCopied: (copied: boolean) => void;
  handleExportImage: () => Promise<void>;
  handleCopyToClipboard: () => Promise<void>;
}

// 内联绘制函数（用于导出时的临时 canvas 绘制）
function drawRect(ctx: CanvasRenderingContext2D, rect: RectShape): void {
  const renderer = new CanvasRenderer(ctx);
  renderer.drawRect(rect, false);
}

function drawArrow(ctx: CanvasRenderingContext2D, arrow: ArrowShape): void {
  const renderer = new CanvasRenderer(ctx);
  renderer.drawArrow(arrow, false);
}

function drawText(ctx: CanvasRenderingContext2D, text: TextShape): void {
  const renderer = new CanvasRenderer(ctx);
  renderer.drawText(text, false);
}

function drawMosaic(ctx: CanvasRenderingContext2D, mosaic: MosaicShape): void {
  // 导出时不需要 imageCanvas，简化处理
  const { x, y, width, height, blockSize, opacity } = mosaic;
  if (width <= 0 || height <= 0) return;

  ctx.save();
  ctx.globalAlpha = opacity / 100;

  // 使用简单的马赛克效果
  const cols = Math.ceil(width / blockSize);
  const rows = Math.ceil(height / blockSize);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const px = col * blockSize;
      const py = row * blockSize;
      const blockW = Math.min(blockSize, width - px);
      const blockH = Math.min(blockSize, height - py);

      // 随机颜色模拟马赛克效果
      const gray = Math.floor(Math.random() * 100 + 100);
      ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
      ctx.fillRect(x + px, y + py, blockW, blockH);
    }
  }

  ctx.restore();
}

export function useExport({
  exportContainerRef,
  imageData,
  frameSettings,
  imageDisplaySizeRef,
  arrowsRef,
  rectsRef,
  textsRef,
  mosaicsRef,
}: UseExportOptions): UseExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const { settings } = useSettingsStore();

  // 准备导出：创建标注图层并叠加到图片容器上
  const prepareExport = useCallback(() => {
    const container = exportContainerRef.current;
    if (!container || !imageData) return null;

    const displaySize = imageDisplaySizeRef.current;
    if (!displaySize) return null;

    // 计算 padding
    const padLeft = frameSettings.padding.linked
      ? frameSettings.padding.top
      : frameSettings.padding.left;
    const padTop = frameSettings.padding.linked
      ? frameSettings.padding.top
      : frameSettings.padding.top;
    const padRight = frameSettings.padding.linked
      ? frameSettings.padding.top
      : frameSettings.padding.right;
    const padBottom = frameSettings.padding.linked
      ? frameSettings.padding.top
      : frameSettings.padding.bottom;
    const padW = padLeft + padRight;
    const padH = padTop + padBottom;

    // 计算容器尺寸
    const containerSize = calculateAspectRatioSize(
      frameSettings.aspectRatio,
      displaySize.width,
      displaySize.height,
      frameSettings.customAspectRatio
    );

    const isAuto = frameSettings.aspectRatio === 'auto';
    const canvasWidth = isAuto ? containerSize.width + padW : containerSize.width;
    const canvasHeight = isAuto ? containerSize.height + padH : containerSize.height;

    // 创建临时 canvas 用于绘制标注
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasWidth;
    tempCanvas.height = canvasHeight;
    const tempCtx = tempCanvas.getContext('2d');
    let annotationImg: HTMLImageElement | null = null;

    if (tempCtx) {
      // 绘制标注（不带选中状态）
      rectsRef.current.forEach((rect) => {
        drawRect(tempCtx, rect);
      });
      arrowsRef.current.forEach((arrow) => {
        drawArrow(tempCtx, arrow);
      });
      textsRef.current.forEach((text) => {
        drawText(tempCtx, text);
      });
      mosaicsRef.current.forEach((mosaic) => {
        drawMosaic(tempCtx, mosaic);
      });

      // 创建标注图片并叠加到容器
      annotationImg = document.createElement('img');
      annotationImg.src = tempCanvas.toDataURL('image/png');
      annotationImg.style.position = 'absolute';
      annotationImg.style.top = '0';
      annotationImg.style.left = '0';
      annotationImg.style.width = '100%';
      annotationImg.style.height = '100%';
      annotationImg.style.pointerEvents = 'none';
      annotationImg.style.zIndex = '10';
      container.appendChild(annotationImg);
    }

    return { container, annotationImg };
  }, [imageData, frameSettings, exportContainerRef, imageDisplaySizeRef, arrowsRef, rectsRef, textsRef, mosaicsRef]);

  // 清理导出：移除临时元素
  const cleanupExport = useCallback((annotationImg: HTMLImageElement | null) => {
    if (annotationImg && annotationImg.parentNode) {
      annotationImg.parentNode.removeChild(annotationImg);
    }
  }, []);

  // 等待 DOM 渲染完成
  const waitForRender = useCallback(() => {
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
  }, []);

  // 导出图片
  const handleExportImage = useCallback(async () => {
    const prepared = prepareExport();
    if (!prepared) return;

    setIsExporting(true);
    setExportError(null);

    try {
      await waitForRender();

      const format = settings.defaultFormat as ExportFormat;
      const scale = settings.quality === '1x' ? 1 : settings.quality === '3x' ? 3 : 2;
      const timestamp = Date.now();

      let img: HTMLImageElement;
      let extension: string;

      switch (format) {
        case EXPORT_FORMATS.JPG: {
          const blob = await snapdom.toBlob(prepared.container, {
            scale,
            type: 'jpeg',
            backgroundColor: '#ffffff',
            quality: 0.92,
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `codeframe-${timestamp}.jpg`;
          a.click();
          URL.revokeObjectURL(url);
          return;
        }
        case EXPORT_FORMATS.WEBP:
          img = await snapdom.toWebp(prepared.container, { scale });
          extension = 'webp';
          break;
        case EXPORT_FORMATS.PNG:
        default:
          img = await snapdom.toPng(prepared.container, { scale });
          extension = 'png';
          break;
      }

      const a = document.createElement('a');
      a.href = img.src;
      a.download = `codeframe-${timestamp}.${extension}`;
      a.click();
    } catch (err) {
      console.error('导出失败:', err);
      setExportError('导出失败，请重试');
      setTimeout(() => setExportError(null), 3000);
    } finally {
      cleanupExport(prepared.annotationImg);
      setIsExporting(false);
    }
  }, [prepareExport, waitForRender, cleanupExport, settings.defaultFormat, settings.quality]);

  // 复制到剪贴板
  const handleCopyToClipboard = useCallback(async () => {
    if (!navigator.clipboard?.write) {
      setExportError('当前浏览器不支持复制图片到剪贴板');
      setTimeout(() => setExportError(null), 3000);
      return;
    }

    const prepared = prepareExport();
    if (!prepared) return;

    setIsExporting(true);
    setExportError(null);

    try {
      await waitForRender();

      const blob = await snapdom.toBlob(prepared.container, {
        scale: 2,
        type: 'png',
      });

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
      setExportError('复制失败，请重试');
      setTimeout(() => setExportError(null), 3000);
    } finally {
      cleanupExport(prepared.annotationImg);
      setIsExporting(false);
    }
  }, [prepareExport, waitForRender, cleanupExport]);

  return useMemo(() => ({
    isExporting,
    copied,
    exportError,
    setIsExporting,
    setCopied,
    handleExportImage,
    handleCopyToClipboard,
  }), [
    isExporting, copied, exportError,
    setIsExporting, setCopied,
    handleExportImage, handleCopyToClipboard,
  ]);
}
