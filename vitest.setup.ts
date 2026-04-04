/**
 * Vitest 测试设置文件
 */
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock Chrome APIs
const mockChromeStorage = {
  local: {
    get: vi.fn().mockResolvedValue({}),
    set: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
  },
};

vi.stubGlobal('chrome', {
  storage: mockChromeStorage,
  runtime: {
    id: 'test-extension-id',
    getURL: (path: string) => `chrome-extension://test-id/${path}`,
    sendMessage: vi.fn(),
  },
});

// Mock Canvas API
class MockCanvasRenderingContext2D {
  fillStyle = '#000000';
  strokeStyle = '#000000';
  lineWidth = 1;
  lineCap: CanvasLineCap = 'butt';
  globalAlpha = 1;
  font = '16px sans-serif';
  textBaseline: CanvasTextBaseline = 'alphabetic';

  private _lineDash: number[] = [];

  save() {}
  restore() {}

  clearRect(_x: number, _y: number, _w: number, _h: number) {}
  fillRect(_x: number, _y: number, _w: number, _h: number) {}
  strokeRect(_x: number, _y: number, _w: number, _h: number) {}

  beginPath() {}
  moveTo(_x: number, _y: number) {}
  lineTo(_x: number, _y: number) {}
  closePath() {}
  fill() {}
  stroke() {}

  arc(
    _x: number,
    _y: number,
    _radius: number,
    _startAngle: number,
    _endAngle: number
  ) {}

  setLineDash(segments: number[]) {
    this._lineDash = segments;
  }

  getLineDash() {
    return this._lineDash;
  }

  getImageData(_x: number, _y: number, _w: number, _h: number) {
    return {
      data: new Uint8ClampedArray(_w * _h * 4).fill(128),
      width: _w,
      height: _h,
    } as ImageData;
  }

  measureText(text: string) {
    // 简单模拟：每个字符约 10px 宽度
    const charWidth = 10;
    return {
      width: text.length * charWidth,
      actualBoundingBoxLeft: 0,
      actualBoundingBoxRight: text.length * charWidth,
      actualBoundingBoxAscent: 12,
      actualBoundingBoxDescent: 4,
    } as TextMetrics;
  }

  fillText(_text: string, _x: number, _y: number) {}
}

// 全局 Mock - 替换浏览器原生 CanvasRenderingContext2D
// 这是测试环境必需的 mock，用于在 Node.js 环境中模拟 Canvas API
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).CanvasRenderingContext2D = MockCanvasRenderingContext2D;

// Mock HTMLCanvasElement.getContext
// 由于返回类型与原生签名不完全匹配，使用类型断言
const originalGetContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function (
  contextId: string,
  _options?: CanvasRenderingContext2DSettings
): RenderingContext | null {
  if (contextId === '2d') {
    // 返回 mock 实例，类型断言为原生 CanvasRenderingContext2D 类型
    // 这是测试环境必需的 mock，用于模拟 Canvas 2D 上下文
    return new MockCanvasRenderingContext2D() as unknown as CanvasRenderingContext2D;
  }
  return originalGetContext.call(this, contextId, _options);
};
