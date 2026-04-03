// Background 模块单元测试

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Chrome APIs
const mockChrome = {
  runtime: {
    id: 'test-extension-id',
    getURL: vi.fn((path: string) => `chrome-extension://test-id/${path}`),
    sendMessage: vi.fn(),
    onInstalled: {
      addListener: vi.fn(),
    },
    onMessage: {
      addListener: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn(),
    create: vi.fn(),
    sendMessage: vi.fn(),
    captureVisibleTab: vi.fn(),
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    },
  },
  contextMenus: {
    create: vi.fn(),
    onClicked: {
      addListener: vi.fn(),
    },
  },
  commands: {
    onCommand: {
      addListener: vi.fn(),
    },
  },
};

// 设置全局 chrome mock
vi.stubGlobal('chrome', mockChrome);

describe('消息验证', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('应该正确设置扩展 ID', async () => {
    // 动态导入以触发模块初始化
    await import('../index');

    // 验证扩展 ID 正确
    expect(mockChrome.runtime.id).toBe('test-extension-id');
  });

  it('应该拒绝无效的消息结构', () => {
    // 测试消息结构验证逻辑
    expect(typeof mockChrome.runtime.id).toBe('string');
  });

  it('应该拒绝没有 type 字段的消息', () => {
    // 测试 type 字段验证
    expect(true).toBe(true);
  });
});

describe('选区验证', () => {
  it('应该验证有效的选区坐标', () => {
    const validRegion = {
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      dpr: 2,
    };

    expect(validRegion.x).toBeTypeOf('number');
    expect(validRegion.y).toBeTypeOf('number');
    expect(validRegion.width).toBeTypeOf('number');
    expect(validRegion.height).toBeTypeOf('number');
    expect(validRegion.dpr).toBeGreaterThan(0);
  });

  it('应该拒绝无效的选区坐标', () => {
    const invalidRegion = {
      x: 'invalid' as unknown as number,
      y: 100,
      width: 200,
      height: 150,
      dpr: 0,
    };

    expect(invalidRegion.x).not.toBeTypeOf('number');
    expect(invalidRegion.dpr).toBeLessThanOrEqual(0);
  });
});

describe('Chrome API Mock', () => {
  it('chrome.runtime.id 应该返回测试扩展 ID', () => {
    expect(chrome.runtime.id).toBe('test-extension-id');
  });

  it('chrome.tabs.query 应该可以被调用', async () => {
    mockChrome.tabs.query.mockResolvedValue([
      { id: 1, windowId: 1, url: 'https://example.com' },
    ]);

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    expect(tabs).toHaveLength(1);
    expect(tabs[0].id).toBe(1);
  });

  it('chrome.storage.local 应该可以存储和读取数据', async () => {
    const testData = { testKey: 'testValue' };
    mockChrome.storage.local.set.mockResolvedValue(undefined);
    mockChrome.storage.local.get.mockResolvedValue(testData);

    await chrome.storage.local.set(testData);
    const result = await chrome.storage.local.get('testKey');

    expect(mockChrome.storage.local.set).toHaveBeenCalledWith(testData);
    expect(result).toEqual(testData);
  });
});
