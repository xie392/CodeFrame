/**
 * 验证工具函数
 */

/**
 * 验证截图结果格式
 */
export function isValidCaptureResult(data: unknown): data is {
  success: boolean;
  imageData?: string;
  error?: string;
} {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return typeof obj.success === 'boolean';
}

/**
 * 验证图片数据格式
 */
export function isValidImageData(data: unknown): data is string {
  return typeof data === 'string' && data.startsWith('data:image');
}
