/**
 * Leafer App 生命周期管理
 * 封装 App 实例的创建、销毁、resize
 */

import { App, Box } from 'leafer-ui';
import '@leafer-in/editor';
import '@leafer-in/viewport';

export interface LeaferAppResult {
  app: App;
  annotationBox: Box;
}

/** 创建 Leafer App 实例 */
export function createLeaferApp(
  container: HTMLElement,
  imageWidth: number,
  imageHeight: number
): LeaferAppResult {
  const app = new App({
    view: container,
    type: 'design',
  });

  // 创建标注容器 Box — 与图片同尺寸
  const annotationBox = new Box({
    width: imageWidth,
    height: imageHeight,
    overflow: 'hide',
  });

  // 将 Box 添加到 tree 层
  app.tree.add(annotationBox);

  return { app, annotationBox };
}

/** 销毁 Leafer App 实例 */
export function destroyLeaferApp(
  app: App
): void {
  app.destroy();
}

/** 处理容器 resize */
export function resizeLeaferApp(
  app: App,
  width: number,
  height: number
): void {
  app.resize({ width, height });
}

/** 更新标注容器尺寸 */
export function updateBoxSize(
  annotationBox: Box,
  width: number,
  height: number
): void {
  annotationBox.width = width;
  annotationBox.height = height;
}
