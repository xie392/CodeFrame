import { STORAGE_KEYS, DEFAULT_SETTINGS } from '@shared/constants';
import type { CaptureResult, RegionRect, UserSettings } from '@shared/types';

// 受限页面 URL 前缀（这些页面无法被 captureVisibleTab 捕获）
const RESTRICTED_URL_PREFIXES = [
  'chrome://',
  'chrome-extension://',
  'about:',
  'devtools://',
  'edge://',
  'brave://',
] as const;

function isRestrictedUrl(url?: string): boolean {
  if (!url) return true;
  return RESTRICTED_URL_PREFIXES.some((prefix) => url.startsWith(prefix));
}

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

/**
 * 将图片缩放到指定倍数
 * @param dataUrl 原始图片 dataURL
 * @param scale 缩放倍数 (1, 2, 3)
 * @returns 缩放后的 dataURL
 */
async function scaleImage(dataUrl: string, scale: number): Promise<string> {
  if (scale === 1) return dataUrl;

  // dataURL 转 ImageBitmap
  const base64Part = dataUrl.split(',')[1];
  if (!base64Part) {
    throw new Error('无效的 data URL');
  }
  const binaryStr = atob(base64Part);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  const imageBitmap = await createImageBitmap(
    new Blob([bytes], { type: 'image/png' }),
  );

  // 创建缩放后的画布
  const newWidth = Math.round(imageBitmap.width * scale);
  const newHeight = Math.round(imageBitmap.height * scale);
  const offscreen = new OffscreenCanvas(newWidth, newHeight);
  const ctx = offscreen.getContext('2d');

  if (!ctx) {
    imageBitmap.close();
    throw new Error('无法获取 OffscreenCanvas 2D 上下文');
  }

  // 使用高质量插值
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(imageBitmap, 0, 0, newWidth, newHeight);

  const blob = await offscreen.convertToBlob({ type: 'image/png' });
  imageBitmap.close();

  return blobToDataUrl(blob);
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
    // 应用截图质量设置
    const quality = await getQualitySetting();
    const scale = quality === '1x' ? 1 : quality === '3x' ? 3 : 2;

    try {
      const scaledImageData = await scaleImage(result.imageData, scale);
      result.imageData = scaledImageData;
    } catch (error) {
      console.error('缩放图片失败:', error);
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
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'png',
    });

    // 通过 OffscreenCanvas 裁剪目标区域
    const { x, y, width, height, dpr } = region;
    const sx = Math.round(x * dpr);
    const sy = Math.round(y * dpr);
    const sw = Math.round(width * dpr);
    const sh = Math.round(height * dpr);

    // dataURL 转 ImageBitmap
    const base64Part = dataUrl.split(',')[1];
    if (!base64Part) {
      throw new Error('captureVisibleTab 返回了无效的 data URL');
    }
    const binaryStr = atob(base64Part);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const imageBitmap = await createImageBitmap(
      new Blob([bytes], { type: 'image/png' }),
    );

    // 先裁剪
    const croppedCanvas = new OffscreenCanvas(sw, sh);
    const croppedCtx = croppedCanvas.getContext('2d');
    if (!croppedCtx) {
      imageBitmap.close();
      throw new Error('无法获取 OffscreenCanvas 2D 上下文');
    }
    croppedCtx.drawImage(imageBitmap, sx, sy, sw, sh, 0, 0, sw, sh);
    imageBitmap.close();

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
      const croppedBlob = await croppedCanvas.convertToBlob({ type: 'image/png' });
      const croppedBitmap = await createImageBitmap(croppedBlob);
      finalCtx.drawImage(croppedBitmap, 0, 0, newWidth, newHeight);
      croppedBitmap.close();
    }

    const blob = await finalCanvas.convertToBlob({ type: 'image/png' });
    const croppedDataUrl = await blobToDataUrl(blob);

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
  } catch (error) {
    const message = error instanceof Error ? error.message : '区域截图失败';
    const result: CaptureResult = { success: false, error: message };
    await chrome.storage.local.set({
      [STORAGE_KEYS.CAPTURE_RESULT]: { ...result, timestamp: Date.now() },
    });
    return result;
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
