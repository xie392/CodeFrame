// Content 模块单元测试

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { REGION_CAPTURE } from '@shared/constants';

// Mock Chrome APIs
const mockChrome = {
  runtime: {
    sendMessage: vi.fn(),
  },
};

vi.stubGlobal('chrome', mockChrome);

// Mock i18n
vi.mock('@shared/i18n/content', () => ({
  initContentI18n: vi.fn().mockResolvedValue(undefined),
  t: (key: string) => key,
}));

describe('getSelectionRect', () => {
  let getSelectionRect: typeof import('../overlay').getSelectionRect;

  beforeEach(async () => {
    vi.clearAllMocks();
    // 重新导入以获取最新模块
    const module = await import('../overlay');
    getSelectionRect = module.getSelectionRect;
  });

  it('应该计算正确的选区矩形（从左上到右下拖拽）', () => {
    const selection = { startX: 100, startY: 100, endX: 300, endY: 200 };
    const rect = getSelectionRect(selection);

    expect(rect.x).toBe(100);
    expect(rect.y).toBe(100);
    expect(rect.width).toBe(200);
    expect(rect.height).toBe(100);
  });

  it('应该计算正确的选区矩形（从右下到左上拖拽）', () => {
    const selection = { startX: 300, startY: 200, endX: 100, endY: 100 };
    const rect = getSelectionRect(selection);

    expect(rect.x).toBe(100);
    expect(rect.y).toBe(100);
    expect(rect.width).toBe(200);
    expect(rect.height).toBe(100);
  });

  it('应该计算正确的选区矩形（从右上到左下拖拽）', () => {
    const selection = { startX: 300, startY: 100, endX: 100, endY: 200 };
    const rect = getSelectionRect(selection);

    expect(rect.x).toBe(100);
    expect(rect.y).toBe(100);
    expect(rect.width).toBe(200);
    expect(rect.height).toBe(100);
  });

  it('应该计算正确的选区矩形（从左下到右上拖拽）', () => {
    const selection = { startX: 100, startY: 200, endX: 300, endY: 100 };
    const rect = getSelectionRect(selection);

    expect(rect.x).toBe(100);
    expect(rect.y).toBe(100);
    expect(rect.width).toBe(200);
    expect(rect.height).toBe(100);
  });

  it('应该处理零宽度的选区', () => {
    const selection = { startX: 100, startY: 100, endX: 100, endY: 200 };
    const rect = getSelectionRect(selection);

    expect(rect.width).toBe(0);
    expect(rect.height).toBe(100);
  });

  it('应该处理零高度的选区', () => {
    const selection = { startX: 100, startY: 100, endX: 200, endY: 100 };
    const rect = getSelectionRect(selection);

    expect(rect.width).toBe(100);
    expect(rect.height).toBe(0);
  });
});

describe('createOverlay 和 destroyOverlay', () => {
  let createOverlay: typeof import('../overlay').createOverlay;
  let destroyOverlay: typeof import('../overlay').destroyOverlay;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await import('../overlay');
    createOverlay = module.createOverlay;
    destroyOverlay = module.destroyOverlay;
  });

  afterEach(() => {
    // 清理 DOM
    const host = document.getElementById('codeframe-overlay-host');
    if (host) host.remove();
  });

  it('应该创建覆盖层并添加到 DOM', () => {
    const root = createOverlay();

    expect(root).toBeDefined();
    expect(document.getElementById('codeframe-overlay-host')).not.toBeNull();
  });

  it('应该创建 Shadow DOM', () => {
    const root = createOverlay();

    // ShadowRoot 应该存在
    expect(root).toBeInstanceOf(ShadowRoot);
  });

  it('应该包含必要的 UI 元素', () => {
    const root = createOverlay();

    // 检查关键元素
    expect(root.querySelector('.cf-overlay')).not.toBeNull();
    expect(root.querySelector('.cf-selection')).not.toBeNull();
    expect(root.querySelector('.cf-hint')).not.toBeNull();
    expect(root.querySelector('.cf-actions')).not.toBeNull();
    expect(root.querySelector('.cf-btn--confirm')).not.toBeNull();
    expect(root.querySelector('.cf-btn--cancel')).not.toBeNull();
  });

  it('应该创建四个角标记', () => {
    const root = createOverlay();

    expect(root.querySelector('.cf-corner--tl')).not.toBeNull();
    expect(root.querySelector('.cf-corner--tr')).not.toBeNull();
    expect(root.querySelector('.cf-corner--bl')).not.toBeNull();
    expect(root.querySelector('.cf-corner--br')).not.toBeNull();
  });

  it('destroyOverlay 应该移除覆盖层', () => {
    createOverlay();
    expect(document.getElementById('codeframe-overlay-host')).not.toBeNull();

    destroyOverlay();
    expect(document.getElementById('codeframe-overlay-host')).toBeNull();
  });

  it('重复创建覆盖层应该先销毁旧的', () => {
    createOverlay();
    const firstHost = document.getElementById('codeframe-overlay-host');

    createOverlay();
    const secondHost = document.getElementById('codeframe-overlay-host');

    // 应该只有一个覆盖层
    expect(document.querySelectorAll('#codeframe-overlay-host')).toHaveLength(1);
    expect(firstHost).not.toBe(secondHost);
  });
});

describe('updateSelectionUI', () => {
  let createOverlay: typeof import('../overlay').createOverlay;
  let destroyOverlay: typeof import('../overlay').destroyOverlay;
  let updateSelectionUI: typeof import('../overlay').updateSelectionUI;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await import('../overlay');
    createOverlay = module.createOverlay;
    destroyOverlay = module.destroyOverlay;
    updateSelectionUI = module.updateSelectionUI;
  });

  afterEach(() => {
    destroyOverlay();
  });

  it('应该更新选区的位置和尺寸', () => {
    const root = createOverlay();
    const rect = { x: 50, y: 50, width: 200, height: 150 };

    updateSelectionUI(root, rect, false);

    const selection = root.querySelector('.cf-selection') as HTMLElement;
    expect(selection.style.left).toBe('50px');
    expect(selection.style.top).toBe('50px');
    expect(selection.style.width).toBe('200px');
    expect(selection.style.height).toBe('150px');
    expect(selection.style.display).toBe('block');
  });

  it('应该显示尺寸标签（选区足够大时）', () => {
    const root = createOverlay();
    const rect = { x: 50, y: 50, width: 200, height: 150 };

    updateSelectionUI(root, rect, false);

    const label = root.querySelector('.cf-label') as HTMLElement;
    expect(label.style.display).toBe('block');
    expect(label.textContent).toBe('200 x 150');
  });

  it('应该隐藏尺寸标签（选区太小时）', () => {
    const root = createOverlay();
    const rect = { x: 50, y: 50, width: 50, height: 20 };

    updateSelectionUI(root, rect, false);

    const label = root.querySelector('.cf-label') as HTMLElement;
    expect(label.style.display).toBe('none');
  });

  it('应该在选区太小时显示错误提示', () => {
    const root = createOverlay();
    const rect = { x: 50, y: 50, width: 200, height: 150 };

    updateSelectionUI(root, rect, true);

    const errorTip = root.querySelector('.cf-error-tip') as HTMLElement;
    expect(errorTip.style.display).toBe('block');
  });

  it('应该在选区太小时禁用确认按钮', () => {
    const root = createOverlay();
    const rect = { x: 50, y: 50, width: 200, height: 150 };

    updateSelectionUI(root, rect, true);

    const confirmBtn = root.querySelector('.cf-btn--confirm') as HTMLButtonElement;
    expect(confirmBtn.disabled).toBe(true);
  });

  it('应该隐藏提示文本', () => {
    const root = createOverlay();
    const rect = { x: 50, y: 50, width: 200, height: 150 };

    updateSelectionUI(root, rect, false);

    const hint = root.querySelector('.cf-hint') as HTMLElement;
    expect(hint.style.opacity).toBe('0');
  });
});

describe('选区尺寸验证', () => {
  it('REGION_CAPTURE 常量应该定义最小选区尺寸', () => {
    expect(REGION_CAPTURE.MIN_SELECTION_SIZE).toBe(10);
  });

  it('选区宽度和高度都大于最小值时应该有效', () => {
    const width = 100;
    const height = 100;
    const isValid =
      width >= REGION_CAPTURE.MIN_SELECTION_SIZE &&
      height >= REGION_CAPTURE.MIN_SELECTION_SIZE;

    expect(isValid).toBe(true);
  });

  it('选区宽度小于最小值时应该无效', () => {
    const width = 5;
    const height = 100;
    const isValid =
      width >= REGION_CAPTURE.MIN_SELECTION_SIZE &&
      height >= REGION_CAPTURE.MIN_SELECTION_SIZE;

    expect(isValid).toBe(false);
  });

  it('选区高度小于最小值时应该无效', () => {
    const width = 100;
    const height = 5;
    const isValid =
      width >= REGION_CAPTURE.MIN_SELECTION_SIZE &&
      height >= REGION_CAPTURE.MIN_SELECTION_SIZE;

    expect(isValid).toBe(false);
  });
});
