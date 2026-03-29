import { STORAGE_KEYS } from '@shared/constants';
import type { CaptureResult, RegionRect } from '@shared/types';

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
  chrome.tabs.create({ url: chrome.runtime.getURL('src/editor/index.html') });
}

export async function handleCaptureRequest(): Promise<CaptureResult> {
  const result = await captureVisibleTab();
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

    // dataURL 转 ArrayBuffer
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

    const offscreen = new OffscreenCanvas(sw, sh);
    const ctx = offscreen.getContext('2d');
    if (!ctx) {
      throw new Error('无法获取 OffscreenCanvas 2D 上下文');
    }
    ctx.drawImage(imageBitmap, sx, sy, sw, sh, 0, 0, sw, sh);

    const blob = await offscreen.convertToBlob({ type: 'image/png' });
    const croppedDataUrl = await blobToDataUrl(blob);

    imageBitmap.close();

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
