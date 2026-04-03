import { STORAGE_KEYS, DEFAULT_SETTINGS } from '@shared/constants';
import type { CaptureResult, RegionRect, UserSettings } from '@shared/types';
import { logger } from '@shared/utils/logger';
import {
  dataUrlToBitmap,
  blobToDataUrl,
  scaleImage,
  isRestrictedUrl,
} from './utils/image';

/**
 * 获取用户截图质量设置
 */
async function getQualitySetting(): Promise<'1x' | '2x' | '3x'> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    const settings = result[STORAGE_KEYS.SETTINGS] as UserSettings | undefined;
    return settings?.quality ?? DEFAULT_SETTINGS.quality;
  } catch {
    return DEFAULT_SETTINGS.quality;
  }
}

async function captureVisibleTab(): Promise<CaptureResult> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id || !tab.windowId || isRestrictedUrl(tab.url)) {
    return { success: false, error: '受限页面不支持截图' };
  }

  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'png',
    });
    return { success: true, imageData: dataUrl };
  } catch (error) {
    const message = error instanceof Error ? error.message : '截图失败';
    return { success: false, error: message };
  }
}

function openEditor(): void {
  chrome.tabs.create({
    url: chrome.runtime.getURL('src/editor/index.html?source=capture'),
  });
}

export async function handleCaptureRequest(): Promise<CaptureResult> {
  const result = await captureVisibleTab();

  if (result.success && result.imageData) {
    const quality = await getQualitySetting();
    const scale = quality === '1x' ? 1 : quality === '3x' ? 3 : 2;

    try {
      const scaledImageData = await scaleImage(result.imageData, scale);
      result.imageData = scaledImageData;
    } catch (error) {
      logger.error('缩放图片失败:', error);
      // 缩放失败时使用原图
    }
  }

  await chrome.storage.local.set({
    [STORAGE_KEYS.CAPTURE_RESULT]: { ...result, timestamp: Date.now() },
  });
  if (result.success) {
    openEditor();
  }
  return result;
}

/**
 * 区域截图：先 captureVisibleTab 获取全屏，再 OffscreenCanvas 裁剪
 */
export async function handleRegionCapture(
  region: RegionRect,
): Promise<CaptureResult> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id || !tab.windowId || isRestrictedUrl(tab.url)) {
    return { success: false, error: '受限页面不支持截图' };
  }

  try {
    logger.log('区域截图开始，区域:', region);
    
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'png',
    });
    
    logger.log('截图捕获成功，数据长度:', dataUrl?.length ?? 0);

    // 通过 OffscreenCanvas 裁剪目标区域
    const { x, y, width, height, dpr } = region;
    const sx = Math.round(x * dpr);
    const sy = Math.round(y * dpr);
    const sw = Math.round(width * dpr);
    const sh = Math.round(height * dpr);
    
    logger.log('裁剪参数:', { sx, sy, sw, sh });

    // dataURL 转 ImageBitmap（使用共享模块，带错误处理）
    const imageBitmap = await dataUrlToBitmap(dataUrl);
    logger.log('ImageBitmap 创建成功，尺寸:', imageBitmap.width, 'x', imageBitmap.height);

    try {
      // 先裁剪
      const croppedCanvas = new OffscreenCanvas(sw, sh);
      const croppedCtx = croppedCanvas.getContext('2d');
      if (!croppedCtx) {
        throw new Error('无法获取 OffscreenCanvas 2D 上下文');
      }
      croppedCtx.drawImage(imageBitmap, sx, sy, sw, sh, 0, 0, sw, sh);

      // 应用截图质量设置
      const quality = await getQualitySetting();
      const scale = quality === '1x' ? 1 : quality === '3x' ? 3 : 2;

      let finalCanvas: OffscreenCanvas;
      if (scale === 1) {
        finalCanvas = croppedCanvas;
      } else {
        // 缩放裁剪后的图片
        const newWidth = Math.round(sw * scale);
        const newHeight = Math.round(sh * scale);
        finalCanvas = new OffscreenCanvas(newWidth, newHeight);
        const finalCtx = finalCanvas.getContext('2d');
        if (!finalCtx) {
          throw new Error('无法获取 OffscreenCanvas 2D 上下文');
        }
        finalCtx.imageSmoothingEnabled = true;
        finalCtx.imageSmoothingQuality = 'high';

        // 从裁剪后的画布创建新的 ImageBitmap
        const croppedBlob = await croppedCanvas.convertToBlob({
          type: 'image/png',
        });
        const croppedBitmap = await createImageBitmap(croppedBlob);
        try {
          finalCtx.drawImage(croppedBitmap, 0, 0, newWidth, newHeight);
        } finally {
          croppedBitmap.close();
        }
      }

      const blob = await finalCanvas.convertToBlob({ type: 'image/png' });
      const croppedDataUrl = await blobToDataUrl(blob);
      
      logger.log('区域截图完成');

      const result: CaptureResult = {
        success: true,
        imageData: croppedDataUrl,
        region,
      };

      await chrome.storage.local.set({
        [STORAGE_KEYS.CAPTURE_RESULT]: {
          ...result,
          timestamp: Date.now(),
        },
      });

      openEditor();
      return result;
    } finally {
      imageBitmap.close();
    }
  } catch (error) {
    logger.error('区域截图失败:', error);
    const message = error instanceof Error ? error.message : '区域截图失败';
    const result: CaptureResult = { success: false, error: message };
    await chrome.storage.local.set({
      [STORAGE_KEYS.CAPTURE_RESULT]: { ...result, timestamp: Date.now() },
    });
    return result;
  }
}
