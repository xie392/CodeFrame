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

  let transformer: CoordTransformer;

  beforeEach(() => {
    transformer = new CoordTransformer(
      () => ({ ...imageSize }),
      () => ({ ...zoomState })
    );
  });

  describe('screenToImage', () => {
    it('应正确转换屏幕坐标到图像坐标', () => {
      const result =
        transformer.screenToImage(300, 250);
      // (300 - 100) / 2 = 100
      // (250 - 50) / 2 = 100
      expect(result.x).toBe(100);
      expect(result.y).toBe(100);
    });

    it('应钳制超出图片左边界的坐标', () => {
      const result =
        transformer.screenToImage(50, 100);
      // (50 - 100) / 2 = -25 → 钳制到 0
      expect(result.x).toBe(0);
    });

    it('应钳制超出图片右边界的坐标', () => {
      const result =
        transformer.screenToImage(
          100 + 800 * 2 + 50,
          100
        );
      // x = (1700 - 100) / 2 = 800 → 钳制到 800
      expect(result.x).toBe(800);
    });

    it('应钳制超出图片上边界的坐标', () => {
      const result =
        transformer.screenToImage(200, 30);
      // (30 - 50) / 2 = -10 → 钳制到 0
      expect(result.y).toBe(0);
    });

    it('应钳制超出图片下边界的坐标', () => {
      const result =
        transformer.screenToImage(
          200,
          50 + 600 * 2 + 10
        );
      // y = (1260 - 50) / 2 = 605 → 钳制到 600
      expect(result.y).toBe(600);
    });

    it('scale=1 时应正确转换', () => {
      const t = new CoordTransformer(
        () => ({ ...imageSize }),
        () => ({ scale: 1, x: 0, y: 0 })
      );
      const result =
        t.screenToImage(400, 300);
      expect(result.x).toBe(400);
      expect(result.y).toBe(300);
    });
  });

  describe('imageToScreen', () => {
    it('应正确转换图像坐标到屏幕坐标', () => {
      const result =
        transformer.imageToScreen(100, 100);
      // 100 * 2 + 100 = 300
      // 100 * 2 + 50 = 250
      expect(result.x).toBe(300);
      expect(result.y).toBe(250);
    });

    it('原点应映射到 zoom offset', () => {
      const result =
        transformer.imageToScreen(0, 0);
      expect(result.x).toBe(100);
      expect(result.y).toBe(50);
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

    it('边界值应不变', () => {
      const r1 =
        transformer.clampToImage(0, 0);
      expect(r1.x).toBe(0);
      expect(r1.y).toBe(0);

      const r2 =
        transformer.clampToImage(800, 600);
      expect(r2.x).toBe(800);
      expect(r2.y).toBe(600);
    });
  });
});
