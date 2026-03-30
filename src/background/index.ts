// CodeFrame - Background Service Worker
// Chrome Extension Manifest V3

import { handleCaptureRequest, handleRegionCapture } from './handlers/capture';
import { handleFullPageCapture } from './handlers/fullpage';
import type { CaptureRequestPayload } from '@shared/messages';
import type { CaptureResult, RegionRect } from '@shared/types';

console.log('[CodeFrame] Service Worker started');

// 监听扩展安装
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[CodeFrame] Extension installed:', details.reason);

  // 创建右键菜单
  chrome.contextMenus.create({
    id: 'codeframe-screenshot',
    title: '使用 CodeFrame 截图',
    contexts: ['page', 'selection', 'image'],
  });
});

// 监听右键菜单点击
chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'codeframe-screenshot') {
    handleCaptureRequest().catch((err) => {
      console.error('[CodeFrame] Context menu capture failed:', err);
    });
  }
});

// 校验 RegionRect payload
function validateRegionRect(
  payload: Record<string, unknown>,
): RegionRect | null {
  const { x, y, width, height, dpr } = payload;
  if (
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    typeof width !== 'number' ||
    typeof height !== 'number' ||
    typeof dpr !== 'number' ||
    dpr <= 0
  ) {
    return null;
  }
  return { x, y, width, height, dpr };
}

// 向 Content Script 发送 START_CAPTURE 消息
async function startRegionCapture(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  await chrome.tabs.sendMessage(tab.id, {
    type: 'START_CAPTURE',
    payload: {},
    timestamp: Date.now(),
  });
}

// 监听消息
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('[CodeFrame] Message received:', message.type);

  switch (message.type) {
    case 'CAPTURE_REQUEST': {
      const { mode } = message.payload as CaptureRequestPayload;
      if (mode === 'visible') {
        handleCaptureRequest()
          .then(sendResponse)
          .catch((err: unknown) => {
            const errorMsg = err instanceof Error ? err.message : '截图请求失败';
            sendResponse({ success: false, error: errorMsg } as CaptureResult);
          });
        return true;
      }
      if (mode === 'region') {
        startRegionCapture()
          .then(() => sendResponse({ success: true } as CaptureResult))
          .catch((err: unknown) => {
            const errorMsg = err instanceof Error ? err.message : '启动区域截图失败';
            sendResponse({ success: false, error: errorMsg } as CaptureResult);
          });
        return true;
      }
      if (mode === 'fullpage') {
        handleFullPageCapture()
          .then(sendResponse)
          .catch((err: unknown) => {
            const errorMsg = err instanceof Error ? err.message : '整页截图失败';
            sendResponse({ success: false, error: errorMsg } as CaptureResult);
          });
        return true;
      }
      sendResponse({ success: false, error: `不支持的截图模式: ${mode}` } as CaptureResult);
      return false;
    }
    case 'CAPTURE_REGION': {
      const region = validateRegionRect(
        message.payload as Record<string, unknown>,
      );
      if (!region) {
        sendResponse({
          success: false,
          error: '无效的选区坐标',
        } as CaptureResult);
        return false;
      }
      handleRegionCapture(region)
        .then(sendResponse)
        .catch((err: unknown) => {
          const errorMsg = err instanceof Error ? err.message : '区域截图失败';
          sendResponse({ success: false, error: errorMsg } as CaptureResult);
        });
      return true;
    }

    case 'CANCEL_CAPTURE':
      sendResponse({ success: true });
      return false;
    default:
      break;
  }

  return false;
});

// 监听快捷键命令
chrome.commands.onCommand.addListener((command) => {
  if (command === 'capture-visible') {
    handleCaptureRequest().catch((err) => {
      console.error('[CodeFrame] Command capture failed:', err);
    });
  }
  if (command === 'capture-region') {
    startRegionCapture().catch((err) => {
      console.error('[CodeFrame] Command region capture failed:', err);
    });
  }
  if (command === 'capture-fullpage') {
    handleFullPageCapture().catch((err: unknown) => {
      console.error('[CodeFrame] Command fullpage capture failed:', err);
    });
  }
});

export {};
