// CodeFrame - Content Script
// 注入到网页中执行截图等功能

import { startRegionCapture } from './overlay';

export function onExecute(): void {
  chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
    if (message.type === 'START_CAPTURE') {
      startRegionCapture();
    }
    return false;
  });
}

onExecute();
