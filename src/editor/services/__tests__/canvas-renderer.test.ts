/**
 * CanvasRenderer 单元测试
 * 测试 CanvasRenderer 类的所有绘图方法
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CanvasRenderer, createCanvasRenderer } from '../canvas-renderer';
import type { ArrowShape, RectShape, TextShape, MosaicShape, CropArea } from '../../types';

// 创建 Mock Canvas 上下文
function createMockContext(): {
  ctx: CanvasRenderingContext2D;
  mockCalls: Record<string, any[]>;
} {
  const mockCalls: Record<string, any[]> = {
    clearRect: [],
    fillRect: [],
    strokeRect: [],
    beginPath: [],
    moveTo: [],
    lineTo: [],
    closePath: [],
    fill: [],
    stroke: [],
    arc: [],
    save: [],
    restore: [],
    setLineDash: [],
    measureText: [],
    fillText: [],
    getImageData: [],
  };

  // 内部状态存储
  const state = {
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    lineCap: 'butt' as CanvasLineCap,
    globalAlpha: 1,
    font: '16px sans-serif',
    textBaseline: 'alphabetic' as CanvasTextBaseline,
    lineDash: [] as number[],
  };

  const ctx = {
    get fillStyle() { return state.fillStyle; },
    set fillStyle(v: string) { state.fillStyle = v; },
    get strokeStyle() { return state.strokeStyle; },
    set strokeStyle(v: string) { state.strokeStyle = v; },
    get lineWidth() { return state.lineWidth; },
    set lineWidth(v: number) { state.lineWidth = v; },
    get lineCap() { return state.lineCap; },
    set lineCap(v: CanvasLineCap) { state.lineCap = v; },
    get globalAlpha() { return state.globalAlpha; },
    set globalAlpha(v: number) { state.globalAlpha = v; },
    get font() { return state.font; },
    set font(v: string) { state.font = v; },
    get textBaseline() { return state.textBaseline; },
    set textBaseline(v: CanvasTextBaseline) { state.textBaseline = v; },

    save() {
      mockCalls.save.push([]);
    },
    restore() {
      mockCalls.restore.push([]);
    },
    clearRect(x: number, y: number, w: number, h: number) {
      mockCalls.clearRect.push([x, y, w, h]);
    },
    fillRect(x: number, y: number, w: number, h: number) {
      mockCalls.fillRect.push([x, y, w, h]);
    },
    strokeRect(x: number, y: number, w: number, h: number) {
      mockCalls.strokeRect.push([x, y, w, h]);
    },
    beginPath() {
      mockCalls.beginPath.push([]);
    },
    moveTo(x: number, y: number) {
      mockCalls.moveTo.push([x, y]);
    },
    lineTo(x: number, y: number) {
      mockCalls.lineTo.push([x, y]);
    },
    closePath() {
      mockCalls.closePath.push([]);
    },
    fill() {
      mockCalls.fill.push([]);
    },
    stroke() {
      mockCalls.stroke.push([]);
    },
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
      mockCalls.arc.push([x, y, radius, startAngle, endAngle]);
    },
    setLineDash(segments: number[]) {
      state.lineDash = segments;
      mockCalls.setLineDash.push([...segments]);
    },
    getLineDash() {
      return state.lineDash;
    },
    measureText(text: string) {
      mockCalls.measureText.push([text]);
      return { width: text.length * 10 };
    },
    fillText(text: string, x: number, y: number) {
      mockCalls.fillText.push([text, x, y]);
    },
    getImageData(x: number, y: number, w: number, h: number) {
      mockCalls.getImageData.push([x, y, w, h]);
      return {
        data: new Uint8ClampedArray(w * h * 4).fill(128),
        width: w,
        height: h,
      };
    },
  } as unknown as CanvasRenderingContext2D;

  return { ctx, mockCalls };
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
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  blockSize: 10,
  opacity: 100,
  ...overrides,
});

const createTestCropArea = (): CropArea => ({
  x: 10,
  y: 10,
  width: 200,
  height: 150,
});

describe('CanvasRenderer', () => {
  let renderer: CanvasRenderer;
  let mockContext: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    mockContext = createMockContext();
    renderer = new CanvasRenderer(mockContext.ctx);
  });

  // ---------------------------------------------------------------------------
  // 工厂函数测试
  // ---------------------------------------------------------------------------

  describe('createCanvasRenderer', () => {
    it('应该创建 CanvasRenderer 实例', () => {
      const renderer = createCanvasRenderer(mockContext.ctx);
      expect(renderer).toBeInstanceOf(CanvasRenderer);
    });
  });

  // ---------------------------------------------------------------------------
  // clear 方法测试
  // ---------------------------------------------------------------------------

  describe('clear', () => {
    it('应该调用 clearRect 清除画布', () => {
      renderer.clear(800, 600);
      
      expect(mockContext.mockCalls.clearRect).toHaveLength(1);
      expect(mockContext.mockCalls.clearRect[0]).toEqual([0, 0, 800, 600]);
    });
  });

  // ---------------------------------------------------------------------------
  // drawArrow 方法测试
  // ---------------------------------------------------------------------------

  describe('drawArrow', () => {
    it('应该绘制箭头线条', () => {
      const arrow = createTestArrow();
      renderer.drawArrow(arrow, false);
      
      // 验证调用了 beginPath, moveTo, lineTo, stroke
      expect(mockContext.mockCalls.beginPath.length).toBeGreaterThan(0);
      expect(mockContext.mockCalls.moveTo.length).toBeGreaterThan(0);
      expect(mockContext.mockCalls.lineTo.length).toBeGreaterThan(0);
      expect(mockContext.mockCalls.stroke.length).toBeGreaterThan(0);
    });

    it('应该绘制箭头头部', () => {
      const arrow = createTestArrow();
      renderer.drawArrow(arrow, false);
      
      // 箭头头部使用 fill
      expect(mockContext.mockCalls.fill.length).toBeGreaterThan(0);
    });

    it('箭头长度为 0 时不应该绘制', () => {
      const arrow = createTestArrow({ startX: 50, startY: 50, endX: 50, endY: 50 });
      renderer.drawArrow(arrow, false);
      
      // 退化的箭头应该直接返回
      expect(mockContext.mockCalls.beginPath.length).toBe(0);
    });

    it('选中状态应该绘制高亮效果', () => {
      const arrow = createTestArrow();
      renderer.drawArrow(arrow, true);
      
      // 选中状态会先绘制高亮线条
      expect(mockContext.mockCalls.stroke.length).toBeGreaterThan(1);
    });

    it('选中状态应该绘制控制点', () => {
      const arrow = createTestArrow();
      renderer.drawArrow(arrow, true);
      
      // 控制点使用 arc 绘制圆形
      expect(mockContext.mockCalls.arc.length).toBeGreaterThan(0);
    });

    it('双箭头样式应该绘制两端箭头头部', () => {
      const arrow = createTestArrow({ style: 'double' });
      renderer.drawArrow(arrow, false);
      
      // 双箭头会有两个 fill 调用
      expect(mockContext.mockCalls.fill.length).toBe(2);
    });

    it('足够长的箭头应该显示中点控制点', () => {
      const arrow = createTestArrow();
      renderer.drawArrow(arrow, true);
      
      // 起点、终点、中点 = 3 个控制点
      expect(mockContext.mockCalls.arc.length).toBe(3);
    });

    it('短箭头不显示中点控制点', () => {
      const arrow = createTestArrow({ endX: 10, endY: 10 });
      renderer.drawArrow(arrow, true);
      
      // 只有起点和终点 = 2 个控制点
      expect(mockContext.mockCalls.arc.length).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // drawHandle 方法测试
  // ---------------------------------------------------------------------------

  describe('drawHandle', () => {
    it('应该绘制圆形控制点', () => {
      renderer.drawHandle(100, 200);
      
      expect(mockContext.mockCalls.arc.length).toBe(1);
      expect(mockContext.mockCalls.arc[0][0]).toBe(100); // x
      expect(mockContext.mockCalls.arc[0][1]).toBe(200); // y
    });

    it('应该支持自定义半径', () => {
      renderer.drawHandle(100, 200, 10);
      
      expect(mockContext.mockCalls.arc[0][2]).toBe(10); // radius
    });
  });

  // ---------------------------------------------------------------------------
  // drawRect 方法测试
  // ---------------------------------------------------------------------------

  describe('drawRect', () => {
    it('应该绘制矩形边框', () => {
      const rect = createTestRect();
      renderer.drawRect(rect, false);
      
      expect(mockContext.mockCalls.strokeRect.length).toBe(1);
      expect(mockContext.mockCalls.strokeRect[0]).toEqual([10, 10, 100, 50]);
    });

    it('有填充透明度时应该绘制填充', () => {
      const rect = createTestRect({ fillOpacity: 50 });
      renderer.drawRect(rect, false);
      
      expect(mockContext.mockCalls.fillRect.length).toBe(1);
    });

    it('虚线边框应该设置虚线样式', () => {
      const rect = createTestRect({ borderStyle: 'dashed' });
      renderer.drawRect(rect, false);
      
      expect(mockContext.mockCalls.setLineDash.length).toBeGreaterThan(0);
      expect(mockContext.mockCalls.setLineDash[0]).toEqual([8, 4]);
    });

    it('选中状态应该绘制高亮效果', () => {
      const rect = createTestRect();
      renderer.drawRect(rect, true);
      
      // 选中状态会额外绘制一次 strokeRect
      expect(mockContext.mockCalls.strokeRect.length).toBeGreaterThan(1);
    });

    it('选中状态应该绘制控制点', () => {
      const rect = createTestRect();
      renderer.drawRect(rect, true);
      
      // 四个角控制点
      expect(mockContext.mockCalls.arc.length).toBeGreaterThanOrEqual(4);
    });

    it('足够大的矩形应该显示边中点控制点', () => {
      const rect = createTestRect({ width: 100, height: 100 });
      renderer.drawRect(rect, true);
      
      // 4角 + 4边中点 = 8 个控制点
      expect(mockContext.mockCalls.arc.length).toBe(8);
    });
  });

  // ---------------------------------------------------------------------------
  // drawText 方法测试
  // ---------------------------------------------------------------------------

  describe('drawText', () => {
    it('应该绘制文字', () => {
      const text = createTestText();
      renderer.drawText(text, false);
      
      expect(mockContext.mockCalls.fillText.length).toBe(1);
      expect(mockContext.mockCalls.fillText[0][0]).toBe('Test');
    });

    it('应该设置正确的字体样式', () => {
      const text = createTestText({ fontStyle: 'italic', fontWeight: 'bold', fontSize: 24 });
      renderer.drawText(text, false);
      
      // 字体格式：italic bold 24px
      expect(mockContext.ctx.font).toContain('italic');
      expect(mockContext.ctx.font).toContain('bold');
    });

    it('选中状态应该绘制边框', () => {
      const text = createTestText();
      renderer.drawText(text, true);
      
      expect(mockContext.mockCalls.strokeRect.length).toBe(1);
    });

    it('选中状态应该绘制控制点', () => {
      const text = createTestText();
      renderer.drawText(text, true);
      
      // 文本区域足够大时，会有 8 个控制点（4角 + 4边中点）
      // 宽度 48 >= 24 (HANDLE_RADIUS * 4)，高度 24 >= 24
      expect(mockContext.mockCalls.arc.length).toBeGreaterThanOrEqual(4);
    });
  });

  // ---------------------------------------------------------------------------
  // drawMosaic 方法测试
  // ---------------------------------------------------------------------------

  describe('drawMosaic', () => {
    it('没有 imageCanvas 时应该直接返回', () => {
      const mosaic = createTestMosaic();
      renderer.drawMosaic(mosaic, null, false);
      
      expect(mockContext.mockCalls.fillRect.length).toBe(0);
    });

    it('宽度或高度为 0 时应该直接返回', () => {
      const mosaic = createTestMosaic({ width: 0 });
      const canvas = document.createElement('canvas');
      renderer.drawMosaic(mosaic, canvas, false);
      
      expect(mockContext.mockCalls.fillRect.length).toBe(0);
    });

    it('应该绘制马赛克块', () => {
      const mosaic = createTestMosaic({ blockSize: 20 });
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      
      renderer.drawMosaic(mosaic, canvas, false);
      
      // 应该绘制多个马赛克块
      expect(mockContext.mockCalls.fillRect.length).toBeGreaterThan(0);
    });

    it('选中状态应该绘制高亮边框', () => {
      const mosaic = createTestMosaic();
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      
      renderer.drawMosaic(mosaic, canvas, true);
      
      expect(mockContext.mockCalls.strokeRect.length).toBe(1);
    });

    it('选中状态应该绘制控制点', () => {
      const mosaic = createTestMosaic();
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      
      renderer.drawMosaic(mosaic, canvas, true);
      
      expect(mockContext.mockCalls.arc.length).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // drawCropBox 方法测试
  // ---------------------------------------------------------------------------

  describe('drawCropBox', () => {
    it('应该绘制遮罩层', () => {
      const crop = createTestCropArea();
      renderer.drawCropBox(crop, 800, 600);
      
      // 绘制整个画布的遮罩
      expect(mockContext.mockCalls.fillRect.length).toBeGreaterThan(0);
    });

    it('应该清除裁剪区域的遮罩', () => {
      const crop = createTestCropArea();
      renderer.drawCropBox(crop, 800, 600);
      
      // clearRect 用于清除裁剪区域
      expect(mockContext.mockCalls.clearRect.length).toBe(1);
    });

    it('应该绘制裁剪框边框', () => {
      const crop = createTestCropArea();
      renderer.drawCropBox(crop, 800, 600);
      
      expect(mockContext.mockCalls.strokeRect.length).toBeGreaterThan(0);
    });

    it('应该绘制三分线网格', () => {
      const crop = createTestCropArea();
      renderer.drawCropBox(crop, 800, 600);
      
      // 垂直 2 条 + 水平 2 条 = 4 条线
      expect(mockContext.mockCalls.moveTo.length).toBe(4);
      expect(mockContext.mockCalls.lineTo.length).toBe(4);
    });

    it('应该绘制控制点', () => {
      const crop = createTestCropArea();
      renderer.drawCropBox(crop, 800, 600);
      
      expect(mockContext.mockCalls.arc.length).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // drawMarquee 方法测试
  // ---------------------------------------------------------------------------

  describe('drawMarquee', () => {
    it('应该绘制框选矩形', () => {
      renderer.drawMarquee(0, 0, 100, 100);
      
      expect(mockContext.mockCalls.fillRect.length).toBe(1);
      expect(mockContext.mockCalls.strokeRect.length).toBe(1);
    });

    it('应该正确处理反向拖拽', () => {
      renderer.drawMarquee(100, 100, 0, 0);
      
      // 应该绘制正确的矩形
      expect(mockContext.mockCalls.fillRect[0]).toEqual([0, 0, 100, 100]);
    });

    it('应该使用正确的样式', () => {
      renderer.drawMarquee(0, 0, 100, 100);
      
      expect(mockContext.ctx.fillStyle).toBe('rgba(59, 130, 246, 0.1)');
      expect(mockContext.ctx.strokeStyle).toBe('rgba(59, 130, 246, 0.5)');
    });
  });

  // ---------------------------------------------------------------------------
  // 边界情况测试
  // ---------------------------------------------------------------------------

  describe('边界情况', () => {
    it('箭头负坐标应该正常工作', () => {
      const arrow = createTestArrow({ startX: -50, startY: -50, endX: 50, endY: 50 });
      renderer.drawArrow(arrow, false);
      
      expect(mockContext.mockCalls.stroke.length).toBeGreaterThan(0);
    });

    it('矩形负坐标应该正常工作', () => {
      const rect = createTestRect({ x: -50, y: -50 });
      renderer.drawRect(rect, false);
      
      expect(mockContext.mockCalls.strokeRect.length).toBe(1);
    });

    it('空文字应该正常处理', () => {
      const text = createTestText({ text: '' });
      renderer.drawText(text, false);
      
      expect(mockContext.mockCalls.fillText.length).toBe(1);
    });
  });
});
