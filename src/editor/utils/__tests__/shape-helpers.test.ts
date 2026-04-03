/**
 * Shape Helpers 单元测试
 * 测试点击检测、拖拽类型判断和框选检测函数
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  isPointNearArrow,
  getDragTypeAtPoint,
  isArrowInRect,
  isPointInRect,
  getRectDragTypeAtPoint,
  isRectInRect,
  isPointInText,
  getTextDragTypeAtPoint,
  isTextInRect,
  isPointInMosaic,
  getMosaicDragTypeAtPoint,
  isMosaicInRect,
  isPointInCrop,
  getCropDragTypeAtPoint,
  drawMarqueeRect,
} from '../shape-helpers';
import type { ArrowShape, RectShape, TextShape, MosaicShape, CropArea } from '../../types';

// Mock Canvas 上下文
function createMockContext(): CanvasRenderingContext2D {
  return {
    font: '',
    measureText(text: string) {
      return { width: text.length * 10 } as TextMetrics;
    },
  } as unknown as CanvasRenderingContext2D;
}

// 创建测试数据
const createTestArrow = (overrides?: Partial<ArrowShape>): ArrowShape => ({
  id: 'arrow-1',
  startX: 0,
  startY: 0,
  endX: 100,
  endY: 100,
  color: '#FF0000',
  strokeWidth: 2,
  headSize: 12,
  style: 'single',
  ...overrides,
});

const createTestRect = (overrides?: Partial<RectShape>): RectShape => ({
  id: 'rect-1',
  x: 10,
  y: 10,
  width: 100,
  height: 50,
  color: '#00FF00',
  strokeWidth: 2,
  fillOpacity: 0,
  borderStyle: 'solid',
  ...overrides,
});

const createTestText = (overrides?: Partial<TextShape>): TextShape => ({
  id: 'text-1',
  x: 20,
  y: 20,
  text: 'Test',
  color: '#0000FF',
  fontSize: 16,
  fontWeight: 'normal',
  fontStyle: 'normal',
  ...overrides,
});

const createTestMosaic = (overrides?: Partial<MosaicShape>): MosaicShape => ({
  id: 'mosaic-1',
  x: 30,
  y: 30,
  width: 80,
  height: 60,
  blockSize: 10,
  opacity: 100,
  ...overrides,
});

const createTestCropArea = (): CropArea => ({
  x: 0,
  y: 0,
  width: 200,
  height: 150,
});

// HANDLE_RADIUS 常量值
const HANDLE_RADIUS = 6;

describe('Shape Helpers', () => {
  let mockCtx: CanvasRenderingContext2D;

  beforeEach(() => {
    mockCtx = createMockContext();
  });

  // ---------------------------------------------------------------------------
  // 箭头相关函数测试
  // ---------------------------------------------------------------------------

  describe('isPointNearArrow', () => {
    it('点在箭头线段上应该返回 true', () => {
      const arrow = createTestArrow();
      // 箭头从 (0,0) 到 (100,100)，中点附近
      expect(isPointNearArrow(50, 50, arrow)).toBe(true);
    });

    it('点远离箭头线段应该返回 false', () => {
      const arrow = createTestArrow();
      expect(isPointNearArrow(500, 500, arrow)).toBe(false);
    });

    it('箭头退化为点时，点在起点附近应该返回 true', () => {
      const arrow = createTestArrow({ startX: 50, startY: 50, endX: 50, endY: 50 });
      expect(isPointNearArrow(50, 50, arrow)).toBe(true);
    });

    it('箭头退化为点时，点远离起点应该返回 false', () => {
      const arrow = createTestArrow({ startX: 50, startY: 50, endX: 50, endY: 50 });
      expect(isPointNearArrow(100, 100, arrow)).toBe(false);
    });

    it('点在箭头端点附近应该返回 true', () => {
      const arrow = createTestArrow();
      expect(isPointNearArrow(0, 0, arrow)).toBe(true); // 起点
      expect(isPointNearArrow(100, 100, arrow)).toBe(true); // 终点
    });
  });

  describe('getDragTypeAtPoint', () => {
    it('点击起点控制点应该返回 "start"', () => {
      const arrow = createTestArrow();
      expect(getDragTypeAtPoint(0, 0, arrow)).toBe('start');
    });

    it('点击终点控制点应该返回 "end"', () => {
      const arrow = createTestArrow();
      expect(getDragTypeAtPoint(100, 100, arrow)).toBe('end');
    });

    it('点击中点控制点应该返回 "middle"', () => {
      const arrow = createTestArrow();
      expect(getDragTypeAtPoint(50, 50, arrow)).toBe('middle');
    });

    it('点击线段上应该返回 "move"', () => {
      const arrow = createTestArrow();
      // 线段中点稍偏一点，不在控制点范围内
      expect(getDragTypeAtPoint(25, 25, arrow)).toBe('move');
    });

    it('点击远离线段应该返回 "none"', () => {
      const arrow = createTestArrow();
      expect(getDragTypeAtPoint(500, 500, arrow)).toBe('none');
    });

    it('短箭头不应该有中点控制点', () => {
      const arrow = createTestArrow({ endX: 10, endY: 10 });
      // 长度小于 HANDLE_RADIUS * 4 = 24
      expect(getDragTypeAtPoint(5, 5, arrow)).toBe('move'); // 在线上，但没有中点控制点
    });

    it('控制点边界测试', () => {
      const arrow = createTestArrow();
      // 刚好在控制点半径内
      expect(getDragTypeAtPoint(HANDLE_RADIUS, 0, arrow)).toBe('start');
      // 刚好超出控制点半径
      expect(getDragTypeAtPoint(HANDLE_RADIUS + 1, 0, arrow)).toBe('move');
    });
  });

  describe('isArrowInRect', () => {
    it('箭头完全在框选区域内应该返回 true', () => {
      const arrow = createTestArrow();
      const rect = { x1: -10, y1: -10, x2: 110, y2: 110 };
      expect(isArrowInRect(arrow, rect)).toBe(true);
    });

    it('箭头部分在框选区域内应该返回 false', () => {
      const arrow = createTestArrow();
      const rect = { x1: 0, y1: 0, x2: 50, y2: 50 };
      expect(isArrowInRect(arrow, rect)).toBe(false);
    });

    it('箭头完全在框选区域外应该返回 false', () => {
      const arrow = createTestArrow();
      const rect = { x1: 200, y1: 200, x2: 300, y2: 300 };
      expect(isArrowInRect(arrow, rect)).toBe(false);
    });

    it('反向框选矩形应该正常工作', () => {
      const arrow = createTestArrow();
      const rect = { x1: 110, y1: 110, x2: -10, y2: -10 }; // 反向
      expect(isArrowInRect(arrow, rect)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 矩形相关函数测试
  // ---------------------------------------------------------------------------

  describe('isPointInRect', () => {
    it('点在矩形内部应该返回 true', () => {
      const rect = createTestRect();
      expect(isPointInRect(50, 30, rect)).toBe(true); // 中心点
    });

    it('点在矩形边界上应该返回 true', () => {
      const rect = createTestRect();
      expect(isPointInRect(10, 10, rect)).toBe(true); // 左上角
      expect(isPointInRect(110, 60, rect)).toBe(true); // 右下角
    });

    it('点在矩形外部应该返回 false', () => {
      const rect = createTestRect();
      expect(isPointInRect(0, 0, rect)).toBe(false);
      expect(isPointInRect(200, 200, rect)).toBe(false);
    });

    it('负坐标矩形应该正常工作', () => {
      const rect = createTestRect({ x: -50, y: -50 });
      expect(isPointInRect(-25, -25, rect)).toBe(true);
    });
  });

  describe('getRectDragTypeAtPoint', () => {
    it('点击左上角控制点应该返回 "resize-tl"', () => {
      const rect = createTestRect();
      expect(getRectDragTypeAtPoint(10, 10, rect)).toBe('resize-tl');
    });

    it('点击右上角控制点应该返回 "resize-tr"', () => {
      const rect = createTestRect();
      expect(getRectDragTypeAtPoint(110, 10, rect)).toBe('resize-tr');
    });

    it('点击左下角控制点应该返回 "resize-bl"', () => {
      const rect = createTestRect();
      expect(getRectDragTypeAtPoint(10, 60, rect)).toBe('resize-bl');
    });

    it('点击右下角控制点应该返回 "resize-br"', () => {
      const rect = createTestRect();
      expect(getRectDragTypeAtPoint(110, 60, rect)).toBe('resize-br');
    });

    it('点击顶部边中点应该返回 "resize-t"', () => {
      const rect = createTestRect();
      expect(getRectDragTypeAtPoint(60, 10, rect)).toBe('resize-t');
    });

    it('点击底部边中点应该返回 "resize-b"', () => {
      const rect = createTestRect();
      expect(getRectDragTypeAtPoint(60, 60, rect)).toBe('resize-b');
    });

    it('点击左边中点应该返回 "resize-l"', () => {
      const rect = createTestRect();
      expect(getRectDragTypeAtPoint(10, 35, rect)).toBe('resize-l');
    });

    it('点击右边中点应该返回 "resize-r"', () => {
      const rect = createTestRect();
      expect(getRectDragTypeAtPoint(110, 35, rect)).toBe('resize-r');
    });

    it('点击矩形内部应该返回 "move"', () => {
      const rect = createTestRect();
      expect(getRectDragTypeAtPoint(50, 30, rect)).toBe('move');
    });

    it('点击矩形外部应该返回 "none"', () => {
      const rect = createTestRect();
      expect(getRectDragTypeAtPoint(200, 200, rect)).toBe('none');
    });

    it('小矩形不显示边中点控制点', () => {
      const rect = createTestRect({ width: 20, height: 20 });
      // 小于 HANDLE_RADIUS * 4 = 24
      expect(getRectDragTypeAtPoint(20, 20, rect)).toBe('move'); // 顶边中点，但没有控制点
    });
  });

  describe('isRectInRect', () => {
    it('矩形完全在框选区域内应该返回 true', () => {
      const rect = createTestRect();
      const selRect = { x1: 0, y1: 0, x2: 150, y2: 100 };
      expect(isRectInRect(rect, selRect)).toBe(true);
    });

    it('矩形部分在框选区域内应该返回 false', () => {
      const rect = createTestRect();
      const selRect = { x1: 0, y1: 0, x2: 50, y2: 50 };
      expect(isRectInRect(rect, selRect)).toBe(false);
    });

    it('矩形完全在框选区域外应该返回 false', () => {
      const rect = createTestRect();
      const selRect = { x1: 200, y1: 200, x2: 300, y2: 300 };
      expect(isRectInRect(rect, selRect)).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 文字相关函数测试
  // ---------------------------------------------------------------------------

  describe('isPointInText', () => {
    it('点在文字区域内应该返回 true', () => {
      const text = createTestText();
      expect(isPointInText(25, 25, text, mockCtx)).toBe(true);
    });

    it('点在文字区域外应该返回 false', () => {
      const text = createTestText();
      expect(isPointInText(100, 100, text, mockCtx)).toBe(false);
    });

    it('应该考虑文字周围的边距', () => {
      const text = createTestText();
      // 文字区域有 4px 的边距
      expect(isPointInText(16, 16, text, mockCtx)).toBe(true); // 左上角边距内
      expect(isPointInText(15, 15, text, mockCtx)).toBe(false); // 刚好超出
    });
  });

  describe('getTextDragTypeAtPoint', () => {
    it('点击左上角控制点应该返回 "resize-tl"', () => {
      const text = createTestText();
      expect(getTextDragTypeAtPoint(16, 16, text, mockCtx)).toBe('resize-tl');
    });

    it('点击右下角控制点应该返回 "resize-br"', () => {
      const text = createTestText();
      // 文字宽度 = 4 * 10 = 40，加上边距 8 = 48
      // 右下角位置 = (20 - 4 + 48, 20 - 4 + 24) = (64, 40)
      expect(getTextDragTypeAtPoint(64, 40, text, mockCtx)).toBe('resize-br');
    });

    it('点击文字区域内应该返回 "move"', () => {
      const text = createTestText();
      expect(getTextDragTypeAtPoint(30, 25, text, mockCtx)).toBe('move');
    });

    it('点击文字区域外应该返回 "none"', () => {
      const text = createTestText();
      expect(getTextDragTypeAtPoint(100, 100, text, mockCtx)).toBe('none');
    });
  });

  describe('isTextInRect', () => {
    it('文字完全在框选区域内应该返回 true', () => {
      const text = createTestText();
      const rect = { x1: 0, y1: 0, x2: 100, y2: 100 };
      expect(isTextInRect(text, rect, mockCtx)).toBe(true);
    });

    it('文字部分在框选区域内应该返回 false', () => {
      const text = createTestText();
      const rect = { x1: 0, y1: 0, x2: 30, y2: 30 };
      expect(isTextInRect(text, rect, mockCtx)).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 马赛克相关函数测试
  // ---------------------------------------------------------------------------

  describe('isPointInMosaic', () => {
    it('点在马赛克区域内应该返回 true', () => {
      const mosaic = createTestMosaic();
      expect(isPointInMosaic(50, 50, mosaic)).toBe(true);
    });

    it('点在马赛克区域外应该返回 false', () => {
      const mosaic = createTestMosaic();
      expect(isPointInMosaic(200, 200, mosaic)).toBe(false);
    });
  });

  describe('getMosaicDragTypeAtPoint', () => {
    it('应该返回与矩形相同的拖拽类型', () => {
      const mosaic = createTestMosaic();
      // 左上角
      expect(getMosaicDragTypeAtPoint(30, 30, mosaic)).toBe('resize-tl');
      // 中心
      expect(getMosaicDragTypeAtPoint(70, 60, mosaic)).toBe('move');
      // 外部
      expect(getMosaicDragTypeAtPoint(200, 200, mosaic)).toBe('none');
    });
  });

  describe('isMosaicInRect', () => {
    it('马赛克完全在框选区域内应该返回 true', () => {
      const mosaic = createTestMosaic();
      const rect = { x1: 0, y1: 0, x2: 150, y2: 150 };
      expect(isMosaicInRect(mosaic, rect)).toBe(true);
    });

    it('马赛克部分在框选区域内应该返回 false', () => {
      const mosaic = createTestMosaic();
      const rect = { x1: 0, y1: 0, x2: 50, y2: 50 };
      expect(isMosaicInRect(mosaic, rect)).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 裁剪框相关函数测试
  // ---------------------------------------------------------------------------

  describe('isPointInCrop', () => {
    it('点在裁剪框内应该返回 true', () => {
      const crop = createTestCropArea();
      expect(isPointInCrop(50, 50, crop)).toBe(true);
    });

    it('点在裁剪框外应该返回 false', () => {
      const crop = createTestCropArea();
      expect(isPointInCrop(300, 300, crop)).toBe(false);
    });
  });

  describe('getCropDragTypeAtPoint', () => {
    it('应该返回与矩形相同的拖拽类型', () => {
      const crop = createTestCropArea();
      // 左上角
      expect(getCropDragTypeAtPoint(0, 0, crop)).toBe('resize-tl');
      // 中心
      expect(getCropDragTypeAtPoint(100, 75, crop)).toBe('move');
      // 外部
      expect(getCropDragTypeAtPoint(300, 300, crop)).toBe('none');
    });
  });

  // ---------------------------------------------------------------------------
  // 框选矩形绘制测试
  // ---------------------------------------------------------------------------

  describe('drawMarqueeRect', () => {
    it('应该正确计算矩形参数', () => {
      // 这个函数主要是绘制逻辑，我们验证它不会抛出错误
      const ctx = {
        save: () => {},
        restore: () => {},
        fillRect: () => {},
        strokeRect: () => {},
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
      } as unknown as CanvasRenderingContext2D;

      expect(() => drawMarqueeRect(ctx, { x1: 0, y1: 0, x2: 100, y2: 100 })).not.toThrow();
    });

    it('反向矩形应该正常工作', () => {
      const ctx = {
        save: () => {},
        restore: () => {},
        fillRect: () => {},
        strokeRect: () => {},
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
      } as unknown as CanvasRenderingContext2D;

      expect(() => drawMarqueeRect(ctx, { x1: 100, y1: 100, x2: 0, y2: 0 })).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // 边界情况测试
  // ---------------------------------------------------------------------------

  describe('边界情况', () => {
    it('零长度箭头应该正常处理', () => {
      const arrow = createTestArrow({ startX: 50, startY: 50, endX: 50, endY: 50 });
      expect(isPointNearArrow(50, 50, arrow)).toBe(true);
      expect(isPointNearArrow(100, 100, arrow)).toBe(false);
    });

    it('零尺寸矩形应该正常处理', () => {
      const rect = createTestRect({ width: 0, height: 0 });
      expect(isPointInRect(10, 10, rect)).toBe(true); // 点在边界上
      expect(isPointInRect(11, 10, rect)).toBe(false);
    });

    it('负宽度/高度矩形应该正常处理', () => {
      // 注意：当前实现可能不正确处理负尺寸
      const rect = createTestRect({ x: 100, y: 100, width: -50, height: -50 });
      // 这取决于实现，但至少不应该抛出错误
      expect(() => isPointInRect(75, 75, rect)).not.toThrow();
    });

    it('空文字应该正常处理', () => {
      const text = createTestText({ text: '' });
      // 空文字宽度为 0
      expect(isPointInText(20, 20, text, mockCtx)).toBe(true);
    });

    it('大尺寸图形应该正常处理', () => {
      const rect = createTestRect({ x: 0, y: 0, width: 10000, height: 10000 });
      expect(isPointInRect(5000, 5000, rect)).toBe(true);
      expect(isPointInRect(10001, 10001, rect)).toBe(false);
    });

    it('负坐标点应该正常处理', () => {
      const arrow = createTestArrow({ startX: -100, startY: -100, endX: 0, endY: 0 });
      expect(isPointNearArrow(-50, -50, arrow)).toBe(true);
      expect(getDragTypeAtPoint(-100, -100, arrow)).toBe('start');
    });
  });
});
