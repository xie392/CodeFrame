/**
 * 坐标转换器
 * 使用 Leafer zoomLayer 的 scale/x/y 进行坐标转换
 */

import type { ICoordTransformer } from '../../types';

export class CoordTransformer
  implements ICoordTransformer
{
  private getImageSize: () => {
    width: number;
    height: number;
  };
  private getZoomState: () => {
    scale: number;
    x: number;
    y: number;
  };

  constructor(
    getImageSize: () => {
      width: number;
      height: number;
    },
    getZoomState: () => {
      scale: number;
      x: number;
      y: number;
    }
  ) {
    this.getImageSize = getImageSize;
    this.getZoomState = getZoomState;
  }

  /** 屏幕坐标 → 图像坐标 */
  screenToImage(
    clientX: number,
    clientY: number
  ): { x: number; y: number } {
    const zoom = this.getZoomState();
    const imgX =
      (clientX - zoom.x) / zoom.scale;
    const imgY =
      (clientY - zoom.y) / zoom.scale;
    return this.clampToImage(imgX, imgY);
  }

  /** 图像坐标 → 屏幕坐标 */
  imageToScreen(
    imgX: number,
    imgY: number
  ): { x: number; y: number } {
    const zoom = this.getZoomState();
    return {
      x: imgX * zoom.scale + zoom.x,
      y: imgY * zoom.scale + zoom.y,
    };
  }

  /** 钳制坐标到图片范围 [0, imgW] × [0, imgH] */
  clampToImage(
    x: number,
    y: number
  ): { x: number; y: number } {
    const size = this.getImageSize();
    return {
      x: Math.max(
        0,
        Math.min(size.width, x)
      ),
      y: Math.max(
        0,
        Math.min(size.height, y)
      ),
    };
  }
}
