/**
 * 绘制策略类型定义
 * 每种绘制工具实现 IDrawingStrategy 接口，
 * 由 DrawingController 统一调度
 */

import type { ShapeType } from '../../types';

/** 图片坐标系下的点 */
export interface ImageCoord {
  x: number;
  y: number;
}

/** 绘制策略上下文 —— 策略需要的外部依赖 */
export interface DrawingContext {
  /** 获取图片坐标（从 Leafer PointerEvent） */
  getImageCoord: (e: unknown) => ImageCoord;
  /** 将临时元素添加到 annotationBox */
  addTempElement: (element: unknown) => void;
  /** 获取当前样式（来自 Zustand store） */
  getStyles: () => Record<string, unknown>;
  /** 绘制完成回调 */
  onCreated: (type: ShapeType, data: Record<string, unknown>) => void;
}

/** 绘制策略接口 */
export interface IDrawingStrategy {
  /** 当前工具类型 */
  readonly shapeType: ShapeType;

  /** pointer down —— 创建临时元素 */
  onStart(ctx: DrawingContext, coord: ImageCoord): void;

  /** pointer move —— 更新临时元素 */
  onMove(ctx: DrawingContext, coord: ImageCoord): void;

  /** pointer up —— 完成绘制，生成 Store 数据 */
  onEnd(ctx: DrawingContext): void;

  /** 是否正在绘制中 */
  isActive(): boolean;

  /** 取消当前绘制（如切换工具时） */
  cancel(): void;
}
