// CodeGen 布局工具函数测试

import { describe, it, expect } from 'vitest';
import {
  calcAutoHeight,
  isUniformPadding,
  sanitizeFileName,
  sanitizeWatermarkText,
  isValidColor,
  safeColor,
  type Padding,
} from '../utils/layout';

describe('calcAutoHeight', () => {
  it('应该计算基本高度', () => {
    const code = 'console.log("Hello");';
    const height = calcAutoHeight(code, true, 14);
    expect(height).toBeGreaterThan(0);
  });

  it('应该正确处理多行代码', () => {
    const code = 'line1\nline2\nline3\nline4\nline5';
    const height = calcAutoHeight(code, true, 14);
    expect(height).toBeGreaterThan(calcAutoHeight('line1', true, 14));
  });

  it('应该在没有头部时减少高度', () => {
    const code = 'test';
    const withHeader = calcAutoHeight(code, true, 14);
    const withoutHeader = calcAutoHeight(code, false, 14);
    expect(withHeader).toBeGreaterThan(withoutHeader);
  });

  it('应该根据字体大小调整高度', () => {
    const code = 'test';
    const smallFont = calcAutoHeight(code, true, 12);
    const largeFont = calcAutoHeight(code, true, 18);
    expect(largeFont).toBeGreaterThan(smallFont);
  });

  it('应该限制最大高度', () => {
    const code = Array(1000).fill('line').join('\n');
    const height = calcAutoHeight(code, true, 14);
    // 应该不超过 MAX_WIN_H
    expect(height).toBeLessThanOrEqual(8000);
  });
});

describe('isUniformPadding', () => {
  it('应该识别统一边距', () => {
    const padding: Padding = { top: 32, right: 32, bottom: 32, left: 32 };
    expect(isUniformPadding(padding)).toBe(true);
  });

  it('应该识别非统一边距', () => {
    const padding: Padding = { top: 32, right: 16, bottom: 32, left: 16 };
    expect(isUniformPadding(padding)).toBe(false);
  });

  it('应该识别零边距', () => {
    const padding: Padding = { top: 0, right: 0, bottom: 0, left: 0 };
    expect(isUniformPadding(padding)).toBe(true);
  });
});

describe('sanitizeFileName', () => {
  it('应该保留有效文件名', () => {
    expect(sanitizeFileName('index.js')).toBe('index.js');
    expect(sanitizeFileName('my-component.tsx')).toBe('my-component.tsx');
  });

  it('应该移除无效字符', () => {
    expect(sanitizeFileName('file<>:"/\\|?.js')).toBe('file.js');
    expect(sanitizeFileName('test<script>.js')).toBe('testscript.js');
  });

  it('应该限制文件名长度', () => {
    const longName = 'a'.repeat(300);
    const result = sanitizeFileName(longName);
    expect(result.length).toBeLessThanOrEqual(100);
  });

  it('应该处理空字符串', () => {
    expect(sanitizeFileName('')).toBe('');
  });
});

describe('sanitizeWatermarkText', () => {
  it('应该保留有效文本', () => {
    expect(sanitizeWatermarkText('My Brand')).toBe('My Brand');
    expect(sanitizeWatermarkText('CodeFrame 2024')).toBe('CodeFrame 2024');
  });

  it('应该移除换行符', () => {
    expect(sanitizeWatermarkText('text\nwith\nnewlines')).toBe('textwithnewlines');
    expect(sanitizeWatermarkText('text\r\nwith\r\nCRLF')).toBe('textwithCRLF');
  });

  it('应该限制文本长度', () => {
    const longText = 'a'.repeat(100);
    const result = sanitizeWatermarkText(longText);
    expect(result.length).toBeLessThanOrEqual(50);
  });

  it('应该处理空字符串', () => {
    expect(sanitizeWatermarkText('')).toBe('');
  });
});

describe('isValidColor', () => {
  it('应该验证有效的十六进制颜色', () => {
    expect(isValidColor('#FF5733')).toBe(true);
    expect(isValidColor('#10B981')).toBe(true);
    expect(isValidColor('#000000')).toBe(true);
    expect(isValidColor('#FFFFFF')).toBe(true);
  });

  it('应该验证有效的 rgba 颜色', () => {
    expect(isValidColor('rgba(255, 87, 51, 0.5)')).toBe(true);
    expect(isValidColor('rgba(0, 0, 0, 1)')).toBe(true);
    expect(isValidColor('rgb(255, 255, 255)')).toBe(true);
  });

  it('应该拒绝无效的颜色格式', () => {
    expect(isValidColor('red')).toBe(false);
    expect(isValidColor('#FFF')).toBe(false); // 短格式不支持
    expect(isValidColor('hsl(0, 100%, 50%)')).toBe(false);
    expect(isValidColor('invalid')).toBe(false);
  });
});

describe('safeColor', () => {
  it('应该返回有效颜色', () => {
    expect(safeColor('#FF5733', '#000000')).toBe('#FF5733');
  });

  it('应该返回备用颜色当输入无效', () => {
    expect(safeColor('invalid', '#000000')).toBe('#000000');
    expect(safeColor('', '#FFFFFF')).toBe('#FFFFFF');
  });
});
