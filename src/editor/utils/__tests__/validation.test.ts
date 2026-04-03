// 验证工具函数测试

import { describe, it, expect } from 'vitest';
import { isValidCaptureResult, isValidImageData } from '../validation';

describe('isValidCaptureResult', () => {
  it('应该验证有效的截图结果', () => {
    const data = { success: true, imageData: 'data:image/png;base64,test' };
    expect(isValidCaptureResult(data)).toBe(true);
  });

  it('应该验证没有 imageData 的成功结果', () => {
    const data = { success: true };
    expect(isValidCaptureResult(data)).toBe(true);
  });

  it('应该验证失败的截图结果', () => {
    const data = { success: false, error: '截图失败' };
    expect(isValidCaptureResult(data)).toBe(true);
  });

  it('应该拒绝 null', () => {
    expect(isValidCaptureResult(null)).toBe(false);
  });

  it('应该拒绝 undefined', () => {
    expect(isValidCaptureResult(undefined)).toBe(false);
  });

  it('应该拒绝非对象类型', () => {
    expect(isValidCaptureResult('string')).toBe(false);
    expect(isValidCaptureResult(123)).toBe(false);
    expect(isValidCaptureResult(true)).toBe(false);
  });

  it('应该拒绝没有 success 字段的对象', () => {
    expect(isValidCaptureResult({})).toBe(false);
    expect(isValidCaptureResult({ imageData: 'test' })).toBe(false);
  });

  it('应该拒绝 success 不是布尔值的对象', () => {
    expect(isValidCaptureResult({ success: 'true' })).toBe(false);
    expect(isValidCaptureResult({ success: 1 })).toBe(false);
  });
});

describe('isValidImageData', () => {
  it('应该验证有效的图片 Data URL', () => {
    expect(isValidImageData('data:image/png;base64,test')).toBe(true);
    expect(isValidImageData('data:image/jpeg;base64,test')).toBe(true);
    expect(isValidImageData('data:image/webp;base64,test')).toBe(true);
    expect(isValidImageData('data:image/svg+xml,test')).toBe(true);
  });

  it('应该拒绝非字符串类型', () => {
    expect(isValidImageData(null)).toBe(false);
    expect(isValidImageData(undefined)).toBe(false);
    expect(isValidImageData(123)).toBe(false);
    expect(isValidImageData({})).toBe(false);
  });

  it('应该拒绝不以 data:image 开头的字符串', () => {
    expect(isValidImageData('')).toBe(false);
    expect(isValidImageData('test')).toBe(false);
    expect(isValidImageData('http://example.com/image.png')).toBe(false);
    expect(isValidImageData('data:text/plain,test')).toBe(false);
  });
});
