/**
 * 日志工具
 * 开发环境启用调试日志，生产环境禁用
 */

const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => isDev && console.log('[CodeFrame]', ...args),
  error: (...args: unknown[]) => console.error('[CodeFrame]', ...args),
  warn: (...args: unknown[]) => console.warn('[CodeFrame]', ...args),
};
