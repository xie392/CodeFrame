// CodeFrame - Content Script
// 注入到网页中执行截图等功能

console.log('[CodeFrame] Content script loaded');

// 监听来自 background 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[CodeFrame] Content received message:', message.type);

  switch (message.type) {
    case 'START_CAPTURE':
      // TODO: 开始截图
      break;
    default:
      break;
  }

  return true;
});

export {};
