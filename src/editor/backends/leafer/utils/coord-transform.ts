/**
 * 坐标转换器
 * 纯 Leafer 渲染下，annotationBox 在
 * frameGroup 内偏移了 (imageOffsetX,
 * imageOffsetY)，screenToImage 需减去
 * 该偏移才能得到正确的图像空间坐标
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
  private getImageOffset: () => {
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
    },
    getImageOffset: () => {
      x: number;
      y: number;
    }
  ) {
    this.getImageSize = getImageSize;
    this.getZoomState = getZoomState;
    this.getImageOffset = getImageOffset;
  }

  /** 屏幕坐标 → 图像坐标 */
  screenToImage(
    clientX: number,
    clientY: number
  ): { x: number; y: number } {
    const zoom = this.getZoomState();
    const offset = this.getImageOffset();
    const imgX =
      (clientX - zoom.x) / zoom.scale -
      offset.x;
    const imgY =
      (clientY - zoom.y) / zoom.scale -
      offset.y;
    return this.clampToImage(imgX, imgY);
  }

  /** 图像坐标 → 屏幕坐标 */
  imageToScreen(
    imgX: number,
    imgY: number
  ): { x: number; y: number } {
    const zoom = this.getZoomState();
    const offset = this.getImageOffset();
    return {
      x:
        (imgX + offset.x) * zoom.scale +
        zoom.x,
      y:
        (imgY + offset.y) * zoom.scale +
        zoom.y,
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
