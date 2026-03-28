// CodeFrame - Background Service Worker
// Chrome Extension Manifest V3

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
chrome.contextMenus.onClicked.addListener((info, _tab) => {
  if (info.menuItemId === 'codeframe-screenshot') {
    console.log('[CodeFrame] Context menu clicked');
    // TODO: 触发截图
  }
});

// 监听消息
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  console.log('[CodeFrame] Message received:', message.type);
  
  switch (message.type) {
    case 'CAPTURE_REQUEST':
      // TODO: 处理截图请求
      break;
    default:
      break;
  }
  
  return true;
});

export {};
