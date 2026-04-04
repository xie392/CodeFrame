// Editor 工具函数测试

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseSource,
  readFileAsDataUrl,
  parseAspectRatio,
  calculateAspectRatioSize,
  generateArrowId,
  generateRectId,
  generateTextId,
  generateMosaicId,
  getBackgroundStyle,
  getWatermarkColor,
} from '../editor';

describe('parseSource', () => {
  beforeEach(() => {
    // 保存原始 location
    vi.stubGlobal('window', {
      location: {
        search: '',
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('应该返回 capture 当 source=capture', () => {
    vi.stubGlobal('window', {
      location: { search: '?source=capture' },
    });
    expect(parseSource()).toBe('capture');
  });

  it('应该返回 upload 当 source=upload', () => {
    vi.stubGlobal('window', {
      location: { search: '?source=upload' },
    });
    expect(parseSource()).toBe('upload');
  });

  it('应该默认返回 upload', () => {
    vi.stubGlobal('window', {
      location: { search: '' },
    });
    expect(parseSource()).toBe('upload');
  });
});

describe('readFileAsDataUrl', () => {
  it('应该读取文件并返回 Data URL', async () => {
    const file = new File(['test content'], 'test.png', { type: 'image/png' });
    const result = await readFileAsDataUrl(file);

    expect(result).toMatch(/^data:image\/png;base64,/);
  });
});

describe('parseAspectRatio', () => {
  it('应该对 auto 返回 null', () => {
    expect(parseAspectRatio('auto')).toBeNull();
  });

  it('应该对 original 返回 null', () => {
    expect(parseAspectRatio('original')).toBeNull();
  });

  it('应该解析 W:H 格式的比例', () => {
    expect(parseAspectRatio('16:9')).toBeCloseTo(16 / 9);
    expect(parseAspectRatio('4:3')).toBeCloseTo(4 / 3);
    expect(parseAspectRatio('1:1')).toBeCloseTo(1);
  });

  it('应该解析带小数的比例', () => {
    expect(parseAspectRatio('1.91:1')).toBeCloseTo(1.91);
  });

  it('应该解析 device: 前缀的比例', () => {
    expect(parseAspectRatio('device:16:9')).toBeCloseTo(16 / 9);
  });

  it('应该处理自定义比例', () => {
    expect(parseAspectRatio('custom', { width: 21, height: 9 })).toBeCloseTo(21 / 9);
  });

  it('应该对无效自定义比例返回 null', () => {
    expect(parseAspectRatio('custom', { width: 0, height: 100 })).toBeNull();
    expect(parseAspectRatio('custom')).toBeNull();
  });

  it('应该对无效格式返回 null', () => {
    expect(parseAspectRatio('invalid')).toBeNull();
    expect(parseAspectRatio('0:0')).toBeNull();
  });
});

describe('calculateAspectRatioSize', () => {
  it('应该对 auto 返回原始尺寸', () => {
    const result = calculateAspectRatioSize('auto', 800, 600);
    expect(result).toEqual({ width: 800, height: 600 });
  });

  it('应该对 original 返回原始尺寸', () => {
    const result = calculateAspectRatioSize('original', 800, 600);
    expect(result).toEqual({ width: 800, height: 600 });
  });

  it('应该根据比例计算容器尺寸（图片更宽）', () => {
    // 图片 1200x600 (比例 2:1)，目标 16:9 ≈ 1.778
    // imageRatio = 2 > ratio = 1.778，图片更宽
    const result = calculateAspectRatioSize('16:9', 1200, 600);
    // 图片更宽，以宽度为基准
    expect(result.width).toBe(1200);
    expect(result.height).toBeCloseTo(1200 / (16 / 9));
  });

  it('应该根据比例计算容器尺寸（图片更高）', () => {
    // 图片 600x800 (比例 0.75)，目标 16:9 ≈ 1.778
    // imageRatio = 0.75 < ratio = 1.778，图片更高
    const result = calculateAspectRatioSize('16:9', 600, 800);
    // 图片更高，以高度为基准
    expect(result.width).toBeCloseTo(800 * (16 / 9));
    expect(result.height).toBe(800);
  });
});

describe('ID 生成函数', () => {
  it('generateArrowId 应该返回正确格式的 ID', () => {
    const id = generateArrowId();
    expect(id).toMatch(/^arrow_\d+_\d+$/);
  });

  it('generateRectId 应该返回正确格式的 ID', () => {
    const id = generateRectId();
    expect(id).toMatch(/^rect_\d+_\d+$/);
  });

  it('generateTextId 应该返回正确格式的 ID', () => {
    const id = generateTextId();
    expect(id).toMatch(/^text_\d+_\d+$/);
  });

  it('generateMosaicId 应该返回正确格式的 ID', () => {
    const id = generateMosaicId();
    expect(id).toMatch(/^mosaic_\d+_\d+$/);
  });

  it('连续生成的 ID 应该不同', () => {
    const id1 = generateArrowId();
    const id2 = generateArrowId();
    expect(id1).not.toBe(id2);
  });
});

describe('getBackgroundStyle', () => {
  it('应该返回纯色背景样式', () => {
    const bg = {
      type: 'solid' as const,
      color: '#FF5733',
      gradientColors: ['#000000', '#FFFFFF'] as [string, string],
      gradientAngle: 45,
    };
    const style = getBackgroundStyle(bg);

    expect(style.backgroundColor).toBe('#FF5733');
  });

  it('应该返回透明背景样式（棋盘格）', () => {
    const bg = {
      type: 'solid' as const,
      color: 'transparent',
      gradientColors: ['#000000', '#FFFFFF'] as [string, string],
      gradientAngle: 45,
    };
    const style = getBackgroundStyle(bg);

    expect(style.background).toContain('linear-gradient');
    expect(style.backgroundSize).toBe('16px 16px');
  });

  it('应该返回线性渐变背景样式', () => {
    const bg = {
      type: 'linear' as const,
      color: '#FFFFFF',
      gradientColors: ['#FF5733', '#33FF57'] as [string, string],
      gradientAngle: 90,
    };
    const style = getBackgroundStyle(bg);

    expect(style.background).toBe('linear-gradient(90deg, #FF5733, #33FF57)');
  });

  it('应该返回径向渐变背景样式', () => {
    const bg = {
      type: 'radial' as const,
      color: '#FFFFFF',
      gradientColors: ['#FF5733', '#33FF57'] as [string, string],
      gradientAngle: 0,
    };
    const style = getBackgroundStyle(bg);

    expect(style.background).toBe('radial-gradient(circle, #FF5733, #33FF57)');
  });
});

describe('getWatermarkColor', () => {
  it('深色背景应该返回白色水印', () => {
    const bg = {
      type: 'solid' as const,
      color: '#000000',
      gradientColors: ['#000000', '#000000'] as [string, string],
    };
    const color = getWatermarkColor(bg);

    expect(color).toBe('rgba(255, 255, 255, 0.9)');
  });

  it('浅色背景应该返回黑色水印', () => {
    const bg = {
      type: 'solid' as const,
      color: '#FFFFFF',
      gradientColors: ['#FFFFFF', '#FFFFFF'] as [string, string],
    };
    const color = getWatermarkColor(bg);

    expect(color).toBe('rgba(0, 0, 0, 0.7)');
  });

  it('渐变背景应该计算平均亮度', () => {
    const bg = {
      type: 'linear' as const,
      color: '#FFFFFF',
      gradientColors: ['#000000', '#FFFFFF'] as [string, string],
    };
    const color = getWatermarkColor(bg);

    // 平均亮度约为 127.5，小于 128 阈值，应该返回白色水印
    expect(color).toBe('rgba(255, 255, 255, 0.9)');
  });
});
