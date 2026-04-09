/**
 * 运行时 Feature Flag
 * 控制 LeaferJS 渲染路径的启用/禁用
 * 优先级：URL 参数 > localStorage > 默认值(false)
 */

const STORAGE_KEY = 'codeframe_use_leafer';
const URL_PARAM = 'leafer';

/** 判断是否启用 LeaferJS 渲染路径 */
export function isLeaferEnabled(): boolean {
  // URL 参数优先
  const urlParams = new URLSearchParams(
    window.location.search
  );
  const urlValue = urlParams.get(URL_PARAM);
  if (urlValue !== null) {
    return urlValue === 'true';
  }

  // 其次读 localStorage
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored !== null) {
    return stored === 'true';
  }

  // 默认关闭
  return false;
}

/** 设置 LeaferJS 渲染路径开关（持久化到 localStorage） */
export function setLeaferEnabled(enabled: boolean): void {
  localStorage.setItem(
    STORAGE_KEY,
    enabled ? 'true' : 'false'
  );
}
