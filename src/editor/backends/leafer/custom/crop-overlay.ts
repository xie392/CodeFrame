/**
 * 裁剪框覆盖层
 * 半透明遮罩 + 裁剪区域透明 + 三分线
 * + 8 个控制点 + 拖拽调整
 */

import {
  Rect,
  Line,
  Ellipse,
  Group,
} from 'leafer-ui';
import type { IUI } from 'leafer-ui';
import type { CropArea } from '../../../types';
import {
  HANDLE_RADIUS,
} from '../../../constants';
import type { RectDragType } from '../../../utils/shape-helpers';

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

const MASK_COLOR = 'rgba(0, 0, 0, 0.5)';
const BORDER_COLOR = '#FFFFFF';
const GRID_COLOR = 'rgba(255, 255, 255, 0.5)';
const HANDLE_FILL = '#FFFFFF';
const HANDLE_STROKE =
  'rgba(59, 130, 246, 1)';

// ---------------------------------------------------------------------------
// CropOverlay
// ---------------------------------------------------------------------------

export class CropOverlay {
  private group: Group;
  private masks: [
    Rect,
    Rect,
    Rect,
    Rect,
  ] = [
      new Rect(), new Rect(),
      new Rect(), new Rect(),
    ];
  private border: Rect;
  private gridLines: Line[] = [];
  private handles: Ellipse[] = [];
  private cropArea: CropArea | null = null;
  private imgSize = {
    width: 0,
    height: 0,
  };

  constructor(
    private parent: IUI,
    imageSize: { width: number; height: number },
  ) {
    this.imgSize = { ...imageSize };

    // 创建遮罩层（4 个半透明 Rect）
    for (const mask of this.masks) {
      mask.fill = MASK_COLOR;
      mask.editable = false;
      mask.hittable = false;
    }

    // 裁剪区域边框（白色虚线）
    this.border = new Rect({
      stroke: BORDER_COLOR,
      strokeWidth: 2,
      dashPattern: [8, 4],
      fill: undefined,
      editable: false,
      hittable: false,
    });

    // 三分线（2 竖 + 2 横）
    for (let i = 0; i < 4; i++) {
      const line = new Line({
        stroke: GRID_COLOR,
        strokeWidth: 1,
        editable: false,
        hittable: false,
      });
      this.gridLines.push(line);
    }

    // 8 个控制点（4 角 + 4 边中点）
    for (let i = 0; i < 8; i++) {
      const handle = new Ellipse({
        width: HANDLE_RADIUS * 2,
        height: HANDLE_RADIUS * 2,
        fill: HANDLE_FILL,
        stroke: HANDLE_STROKE,
        strokeWidth: 2,
        editable: false,
        hittable: true,
        cursor: this.getHandleCursor(i),
      });
      this.handles.push(handle);
    }

    // 创建 Group 容器
    this.group = new Group({
      editable: false,
    });

    // 按层级添加
    for (const mask of this.masks) {
      this.group.add(mask);
    }
    this.group.add(this.border);
    for (const line of this.gridLines) {
      this.group.add(line);
    }
    for (const handle of this.handles) {
      this.group.add(handle);
    }

    // 默认隐藏
    this.group.visible = false;
    this.parent.add(this.group);
  }

  /** 设置裁剪区域，更新所有视觉元素 */
  setCropArea(area: CropArea | null): void {
    this.cropArea = area;

    if (!area) {
      this.group.visible = false;
      return;
    }

    this.group.visible = true;
    this.updateVisuals(area);
  }

  /** 获取当前裁剪区域 */
  getCropArea(): CropArea | null {
    return this.cropArea;
  }

  /** 更新图片尺寸（resize 时） */
  setImageSize(
    size: { width: number; height: number },
  ): void {
    this.imgSize = { ...size };
    if (this.cropArea) {
      this.updateVisuals(this.cropArea);
    }
  }

  /** 命中检测：判断坐标对应的拖拽类型 */
  getDragTypeAtPoint(
    x: number,
    y: number,
  ): RectDragType {
    if (!this.cropArea) return 'none';

    const { x: cx, y: cy, width, height } =
      this.cropArea;

    // 检测四角
    const corners: {
      type: RectDragType;
      x: number;
      y: number;
    }[] = [
        {
          type: 'resize-tl',
          x: cx,
          y: cy,
        },
        {
          type: 'resize-tr',
          x: cx + width,
          y: cy,
        },
        {
          type: 'resize-bl',
          x: cx,
          y: cy + height,
        },
        {
          type: 'resize-br',
          x: cx + width,
          y: cy + height,
        },
      ];

    for (const corner of corners) {
      const dist = Math.sqrt(
        (x - corner.x) ** 2 +
        (y - corner.y) ** 2,
      );
      if (dist <= HANDLE_RADIUS * 1.5)
        return corner.type;
    }

    // 检测四边中点
    if (width >= HANDLE_RADIUS * 4) {
      const topMid = {
        x: cx + width / 2,
        y: cy,
      };
      const bottomMid = {
        x: cx + width / 2,
        y: cy + height,
      };
      if (
        Math.sqrt(
          (x - topMid.x) ** 2 +
          (y - topMid.y) ** 2,
        ) <=
        HANDLE_RADIUS * 1.5
      )
        return 'resize-t';
      if (
        Math.sqrt(
          (x - bottomMid.x) ** 2 +
          (y - bottomMid.y) ** 2,
        ) <=
        HANDLE_RADIUS * 1.5
      )
        return 'resize-b';
    }

    if (height >= HANDLE_RADIUS * 4) {
      const leftMid = {
        x: cx,
        y: cy + height / 2,
      };
      const rightMid = {
        x: cx + width,
        y: cy + height / 2,
      };
      if (
        Math.sqrt(
          (x - leftMid.x) ** 2 +
          (y - leftMid.y) ** 2,
        ) <=
        HANDLE_RADIUS * 1.5
      )
        return 'resize-l';
      if (
        Math.sqrt(
          (x - rightMid.x) ** 2 +
          (y - rightMid.y) ** 2,
        ) <=
        HANDLE_RADIUS * 1.5
      )
        return 'resize-r';
    }

    // 检测是否在裁剪框内（移动）
    if (
      x >= cx &&
      x <= cx + width &&
      y >= cy &&
      y <= cy + height
    )
      return 'move';

    return 'none';
  }

  /** 销毁覆盖层，释放资源 */
  destroy(): void {
    this.group.remove();
  }

  // ================================================================
  // 内部方法
  // ================================================================

  /** 更新所有视觉元素位置 */
  private updateVisuals(area: CropArea): void {
    const { x, y, width, height } = area;
    const { width: iw, height: ih } =
      this.imgSize;

    // 4 个遮罩
    // 上
    this.masks[0].set({
      x: 0,
      y: 0,
      width: iw,
      height: y,
    });
    // 下
    this.masks[1].set({
      x: 0,
      y: y + height,
      width: iw,
      height: ih - y - height,
    });
    // 左
    this.masks[2].set({
      x: 0,
      y: y,
      width: x,
      height: height,
    });
    // 右
    this.masks[3].set({
      x: x + width,
      y: y,
      width: iw - x - width,
      height: height,
    });

    // 边框
    this.border.set({ x, y, width, height });

    // 三分线
    // 竖线 1
    this.gridLines[0].set({
      points: [
        x + width / 3,
        y,
        x + width / 3,
        y + height,
      ],
    });
    // 竖线 2
    this.gridLines[1].set({
      points: [
        x + (width * 2) / 3,
        y,
        x + (width * 2) / 3,
        y + height,
      ],
    });
    // 横线 1
    this.gridLines[2].set({
      points: [
        x,
        y + height / 3,
        x + width,
        y + height / 3,
      ],
    });
    // 横线 2
    this.gridLines[3].set({
      points: [
        x,
        y + (height * 2) / 3,
        x + width,
        y + (height * 2) / 3,
      ],
    });

    // 控制点位置
    const handlePositions = [
      { hx: x, hy: y }, // tl
      { hx: x + width, hy: y }, // tr
      { hx: x, hy: y + height }, // bl
      { hx: x + width, hy: y + height }, // br
      { hx: x + width / 2, hy: y }, // t
      { hx: x + width / 2, hy: y + height }, // b
      { hx: x, hy: y + height / 2 }, // l
      { hx: x + width, hy: y + height / 2 }, // r
    ];

    for (let i = 0; i < 8; i++) {
      const { hx, hy } = handlePositions[i];
      // 中点控制点仅在尺寸足够时显示
      const show =
        i < 4 ||
        (i < 6 && width >= HANDLE_RADIUS * 4) ||
        (i >= 6 && height >= HANDLE_RADIUS * 4);

      this.handles[i].set({
        x: hx - HANDLE_RADIUS,
        y: hy - HANDLE_RADIUS,
        visible: show,
      });
    }
  }

  /** 控制点序号 → 光标样式 */
  private getHandleCursor(
    index: number,
  ): string {
    const cursors = [
      'nwse-resize',
      'nesize-resize',
      'nesize-resize',
      'nwse-resize',
      'ns-resize',
      'ns-resize',
      'ew-resize',
      'ew-resize',
    ];
    return cursors[index] ?? 'default';
  }
}
