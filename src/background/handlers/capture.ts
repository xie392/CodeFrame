import { STORAGE_KEYS } from '@shared/constants';
import type { CaptureResult } from '@shared/types';

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
