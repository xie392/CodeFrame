// CoordTransformer 单元测试

import {
  describe,
  it,
  expect,
  beforeEach,
} from 'vitest';
import { CoordTransformer } from '../leafer/utils/coord-transform';

describe('CoordTransformer', () => {
  const imageSize = { width: 800, height: 600 };
  const zoomState = {
    scale: 2,
    x: 100,
    y: 50,
  };
  const imageOffset = { x: 40, y: 40 };

  let transformer: CoordTransformer;

  beforeEach(() => {
    transformer = new CoordTransformer(
      () => ({ ...imageSize }),
      () => ({ ...zoomState }),
      () => ({ ...imageOffset })
    );
  });

  describe('screenToImage', () => {
    it('应正确转换屏幕坐标到图像坐标（含偏移）', () => {
      const result =
        transformer.screenToImage(300, 250);
      // (300 - 100) / 2 - 40 = 60
      // (250 - 50) / 2 - 40 = 60
      expect(result.x).toBe(60);
      expect(result.y).toBe(60);
    });

    it('偏移为零时应退化为原始公式', () => {
      const t = new CoordTransformer(
        () => ({ ...imageSize }),
        () => ({ ...zoomState }),
        () => ({ x: 0, y: 0 })
      );
      const result =
        t.screenToImage(300, 250);
      // (300 - 100) / 2 = 100
      // (250 - 50) / 2 = 100
      expect(result.x).toBe(100);
      expect(result.y).toBe(100);
    });

    it('应钳制超出图片左边界的坐标', () => {
      const result =
        transformer.screenToImage(50, 100);
      // (50 - 100) / 2 - 40 = -65 → 钳制到 0
      expect(result.x).toBe(0);
    });

    it('应钳制超出图片右边界的坐标', () => {
      const result =
        transformer.screenToImage(
          100 + (800 + 40) * 2 + 50,
          100
        );
      expect(result.x).toBe(800);
    });

    it('scale=1 且 offset=0 时应正确转换', () => {
      const t = new CoordTransformer(
        () => ({ ...imageSize }),
        () => ({ scale: 1, x: 0, y: 0 }),
        () => ({ x: 0, y: 0 })
      );
      const result =
        t.screenToImage(400, 300);
      expect(result.x).toBe(400);
      expect(result.y).toBe(300);
    });
  });

  describe('imageToScreen', () => {
    it('应正确转换图像坐标到屏幕坐标（含偏移）', () => {
      const result =
        transformer.imageToScreen(60, 60);
      // (60 + 40) * 2 + 100 = 300
      // (60 + 40) * 2 + 50 = 250
      expect(result.x).toBe(300);
      expect(result.y).toBe(250);
    });

    it('偏移为零时应退化为原始公式', () => {
      const t = new CoordTransformer(
        () => ({ ...imageSize }),
        () => ({ ...zoomState }),
        () => ({ x: 0, y: 0 })
      );
      const result =
        t.imageToScreen(100, 100);
      // 100 * 2 + 100 = 300
      // 100 * 2 + 50 = 250
      expect(result.x).toBe(300);
      expect(result.y).toBe(250);
    });
  });

  describe('clampToImage', () => {
    it('正常坐标应不变', () => {
      const result =
        transformer.clampToImage(400, 300);
      expect(result.x).toBe(400);
      expect(result.y).toBe(300);
    });

    it('负坐标应钳制到 0', () => {
      const result =
        transformer.clampToImage(-10, -20);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('超出边界的坐标应钳制', () => {
      const result =
        transformer.clampToImage(900, 700);
      expect(result.x).toBe(800);
      expect(result.y).toBe(600);
    });
  });
});
