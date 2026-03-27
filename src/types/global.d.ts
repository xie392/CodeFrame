// CodeFrame - 全局类型声明

// 扩展 Window 接口
declare global {
  interface Window {
    chrome: typeof chrome;
  }
}

export {};
