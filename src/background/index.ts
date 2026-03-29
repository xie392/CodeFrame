// CodeFrame - Background Service Worker
// Chrome Extension Manifest V3

import { handleCaptureRequest } from './handlers/capture';
import type { CaptureRequestPayload } from '@shared/messages';
import type { CaptureResult } from '@shared/types';

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
      sendResponse({ success: false, error: `不支持的截图模式: ${mode}` } as CaptureResult);
      return false;
    }
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
});

export {};
