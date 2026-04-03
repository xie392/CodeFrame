// 拖拽调整大小工具函数测试

import { describe, it, expect } from 'vitest';
import { applyDragResize, type RectLike, type BoundsConstraint } from '../drag-resize';

describe('applyDragResize', () => {
  const originalRect: RectLike = { x: 100, y: 100, width: 200, height: 150 };

  describe('移动操作', () => {
    it('应该正确移动矩形', () => {
      const result = applyDragResize(originalRect, 'move', 50, 30, originalRect);
      expect(result.x).toBe(150);
      expect(result.y).toBe(130);
      expect(result.width).toBe(200);
      expect(result.height).toBe(150);
    });

    it('应该支持负向移动', () => {
      const result = applyDragResize(originalRect, 'move', -50, -30, originalRect);
      expect(result.x).toBe(50);
      expect(result.y).toBe(70);
    });

    it('应该应用边界约束', () => {
      const bounds: BoundsConstraint = { minX: 0, minY: 0, maxX: 500, maxY: 400 };
      const result = applyDragResize(originalRect, 'move', -200, -200, originalRect, 5, bounds);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });
  });

  describe('调整大小 - 四角', () => {
    it('resize-tl 应该从左上角调整', () => {
      const result = applyDragResize(originalRect, 'resize-tl', 20, 15, originalRect);
      expect(result.x).toBe(120);
      expect(result.y).toBe(115);
      expect(result.width).toBe(180);
      expect(result.height).toBe(135);
    });

    it('resize-tr 应该从右上角调整', () => {
      const result = applyDragResize(originalRect, 'resize-tr', 30, 10, originalRect);
      expect(result.y).toBe(110);
      expect(result.width).toBe(230);
      expect(result.height).toBe(140);
    });

    it('resize-bl 应该从左下角调整', () => {
      const result = applyDragResize(originalRect, 'resize-bl', 25, 20, originalRect);
      expect(result.x).toBe(125);
      expect(result.width).toBe(175);
      expect(result.height).toBe(170);
    });

    it('resize-br 应该从右下角调整', () => {
      const result = applyDragResize(originalRect, 'resize-br', 40, 30, originalRect);
      expect(result.width).toBe(240);
      expect(result.height).toBe(180);
    });
  });

  describe('调整大小 - 四边', () => {
    it('resize-t 应该从顶部调整', () => {
      const result = applyDragResize(originalRect, 'resize-t', 0, 20, originalRect);
      expect(result.y).toBe(120);
      expect(result.height).toBe(130);
    });

    it('resize-b 应该从底部调整', () => {
      const result = applyDragResize(originalRect, 'resize-b', 0, 25, originalRect);
      expect(result.height).toBe(175);
    });

    it('resize-l 应该从左侧调整', () => {
      const result = applyDragResize(originalRect, 'resize-l', 30, 0, originalRect);
      expect(result.x).toBe(130);
      expect(result.width).toBe(170);
    });

    it('resize-r 应该从右侧调整', () => {
      const result = applyDragResize(originalRect, 'resize-r', 35, 0, originalRect);
      expect(result.width).toBe(235);
    });
  });

  describe('最小尺寸约束', () => {
    it('应该限制最小宽度', () => {
      // 200 - 180 = 20，minSize=10，Math.max(10, 20) = 20
      const result = applyDragResize(originalRect, 'resize-r', -180, 0, originalRect, 10);
      expect(result.width).toBe(20);
    });

    it('应该限制最小高度', () => {
      // 150 - 140 = 10，minSize=15，Math.max(15, 10) = 15
      const result = applyDragResize(originalRect, 'resize-b', 0, -140, originalRect, 15);
      expect(result.height).toBe(15);
    });

    it('应该使用默认最小尺寸 5', () => {
      // 200 - 200 = 0，minSize=5（默认），Math.max(5, 0) = 5
      const result = applyDragResize(originalRect, 'resize-r', -200, 0, originalRect);
      expect(result.width).toBe(5);
    });
  });

  describe('边界约束', () => {
    const bounds: BoundsConstraint = { minX: 0, minY: 0, maxX: 500, maxY: 400 };

    it('resize-br 应该遵守 maxX 和 maxY 约束', () => {
      const result = applyDragResize(originalRect, 'resize-br', 300, 300, originalRect, 5, bounds);
      expect(result.width).toBe(400); // maxX - x = 500 - 100
      expect(result.height).toBe(300); // maxY - y = 400 - 100
    });

    it('resize-tr 应该遵守 maxX 和 minY 约束', () => {
      const result = applyDragResize(originalRect, 'resize-tr', 300, -150, originalRect, 5, bounds);
      expect(result.width).toBe(400);
      expect(result.y).toBe(0);
    });

    it('resize-bl 应该遵守 minX 和 maxY 约束', () => {
      const result = applyDragResize(originalRect, 'resize-bl', -150, 300, originalRect, 5, bounds);
      expect(result.x).toBe(0);
      expect(result.height).toBe(300);
    });

    it('resize-tl 应该遵守 minX 和 minY 约束', () => {
      const result = applyDragResize(originalRect, 'resize-tl', -150, -150, originalRect, 5, bounds);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });
  });

  describe('未知拖拽类型', () => {
    it('应该返回原始图形', () => {
      const result = applyDragResize(originalRect, 'unknown' as never, 10, 10, originalRect);
      expect(result).toBe(originalRect);
    });
  });

  describe('保留其他属性', () => {
    it('应该保留原始图形的其他属性', () => {
      interface ExtendedRect extends RectLike {
        id: string;
        color: string;
      }
      const extendedRect: ExtendedRect = {
        ...originalRect,
        id: 'rect-1',
        color: '#FF0000',
      };
      const result = applyDragResize(extendedRect, 'move', 50, 50, extendedRect);
      expect(result.id).toBe('rect-1');
      expect(result.color).toBe('#FF0000');
    });
  });
});
