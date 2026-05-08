/**
 * 框选绘制策略
 * select 工具：单击选中/取消选中，拖拽启动框选
 */

import { Rect } from 'leafer-ui';
import type { ShapeType } from '../../types';
import type { IDrawingStrategy, DrawingContext, ImageCoord } from './types';
import type { HitResult } from '../../../utils/hit-test';
import { SELECT_MIN_SIZE } from '../../../constants';

interface MarqueeState {
  isActive: boolean;
  startCoord: ImageCoord | null;
  rect: Rect | null;
}

const INITIAL_MARQUEE: MarqueeState = {
  isActive: false,
  startCoord: null,
  rect: null,
};

export interface SelectDrawingCallbacks {
  /** 点击空白区域时清除选中 */
  onClearSelection: () => void;
  /** 框选完成时，返回框内元素 ID */
  onMarqueeSelect: (ids: Record<ShapeType, string[]>) => void;
  /** 查找框选区域内的元素 */
  findElementsInBounds: (bounds: { x: number; y: number; width: number; height: number }) => Record<ShapeType, string[]> | null;
  /** 检查编辑器是否正在拖拽元素 */
  isEditorDragging: () => boolean;
  /** 检查编辑器是否正在编辑元素 */
  isEditorEditing: () => boolean;
  /** 命中检测：检测指定坐标是否命中已有图形 */
  hitTest: (x: number, y: number) => HitResult | null;
}

export class SelectDrawingStrategy implements IDrawingStrategy {
  readonly shapeType: ShapeType = 'rect'; // 不直接使用，仅满足接口

  private marquee: MarqueeState = { ...INITIAL_MARQUEE };
  private callbacks: SelectDrawingCallbacks | null = null;
  private hadMove = false;

  setCallbacks(callbacks: SelectDrawingCallbacks): void {
    this.callbacks = callbacks;
  }

  onStart(_ctx: DrawingContext, coord: ImageCoord): void {
    this.marquee.startCoord = coord;
    this.hadMove = false;
  }

  onMove(ctx: DrawingContext, coord: ImageCoord): void {
    if (!this.marquee.startCoord || !this.callbacks) return;

    // Editor 正在拖拽元素时，不启动框选
    if (this.callbacks.isEditorDragging()) {
      this.reset();
      return;
    }

    if (!this.marquee.isActive) {
      // 检测拖拽距离是否超过阈值
      const dx = coord.x - this.marquee.startCoord.x;
      const dy = coord.y - this.marquee.startCoord.y;
      if (dx * dx + dy * dy < 16) return;

      this.marquee.isActive = true;
      this.hadMove = true;

      // 创建框选矩形
      const rect = new Rect({
        x: Math.min(this.marquee.startCoord.x, coord.x),
        y: Math.min(this.marquee.startCoord.y, coord.y),
        width: Math.abs(dx),
        height: Math.abs(dy),
        stroke: '#3B82F6',
        strokeWidth: 1,
        dashPattern: [6, 3],
        fill: 'rgba(59,130,246,0.08)',
        editable: false,
        hittable: false,
      });
      ctx.addTempElement(rect);
      this.marquee.rect = rect;
      return;
    }

    // 更新框选矩形
    this.updateMarqueeRect(coord);
  }

  onEnd(): void {
    if (!this.callbacks) return;

    if (this.marquee.isActive) {
      // 框选结束 —— 查找框内元素
      const rect = this.marquee.rect;
      if (rect && (rect.width ?? 0) >= SELECT_MIN_SIZE && (rect.height ?? 0) >= SELECT_MIN_SIZE) {
        const bounds = {
          x: rect.x ?? 0,
          y: rect.y ?? 0,
          width: rect.width ?? 0,
          height: rect.height ?? 0,
        };
        const hitIds = this.callbacks.findElementsInBounds(bounds);
        if (hitIds) {
          this.callbacks.onMarqueeSelect(hitIds);
        }
      }
      this.reset();
      return;
    }

    // 单击（未启动框选）
    if (this.marquee.startCoord) {
      if (!this.hadMove) {
        // 使用命中检测判断点击是否在图形上
        // isEditorEditing() 不可靠（Editor 状态异步更新），
        // 因此改用 hitTest 同步检测点击位置是否有图形
        const hit = this.callbacks.hitTest(
          this.marquee.startCoord.x,
          this.marquee.startCoord.y,
        );
        if (!hit) {
          this.callbacks.onClearSelection();
        }
      }
    }

    this.reset();
  }

  isActive(): boolean {
    return this.marquee.startCoord !== null;
  }

  cancel(): void {
    this.reset();
  }

  private updateMarqueeRect(coord: ImageCoord): void {
    if (!this.marquee.startCoord || !this.marquee.rect) return;
    this.marquee.rect.set({
      x: Math.min(this.marquee.startCoord.x, coord.x),
      y: Math.min(this.marquee.startCoord.y, coord.y),
      width: Math.abs(coord.x - this.marquee.startCoord.x),
      height: Math.abs(coord.y - this.marquee.startCoord.y),
    });
  }

  private reset(): void {
    if (this.marquee.rect) {
      this.marquee.rect.remove();
    }
    this.marquee = { ...INITIAL_MARQUEE };
    this.hadMove = false;
  }
}
