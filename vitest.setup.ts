/**
 * Vitest 测试设置文件
 */
import '@testing-library/jest-dom/vitest';

// Mock Canvas API
class MockCanvasRenderingContext2D {
  fillStyle = '#000000';
  strokeStyle = '#000000';
  lineWidth = 1;
  lineCap = 'butt';
  globalAlpha = 1;
  font = '16px sans-serif';
  textBaseline = 'alphabetic';

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

  arc(_x: number, _y: number, _radius: number, _startAngle: number, _endAngle: number) {}
  
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
    };
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
    };
  }

  fillText(_text: string, _x: number, _y: number) {}
}

// 全局 Mock
(globalThis as any).CanvasRenderingContext2D = MockCanvasRenderingContext2D;

// Mock HTMLCanvasElement
HTMLCanvasElement.prototype.getContext = function (contextId: string) {
  if (contextId === '2d') {
    return new MockCanvasRenderingContext2D() as any;
  }
  return null;
};
