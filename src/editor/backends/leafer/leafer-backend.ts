/**
 * LeaferJS 渲染后端实现
 * 实现 IRendererBackend 接口
 * Phase 0：生命周期 + 视口方法完整，图形 CRUD 暂用 stub
 */

import type {
  IRendererBackend,
  BackendConfig,
  BackendCallbacks,
  ViewportState,
  ShapeType,
  ICoordTransformer,
} from '../types';
import type { CropArea } from '../../types';
import {
  createLeaferApp,
  destroyLeaferApp,
  resizeLeaferApp,
  updateBoxSize,
} from './leafer-app';
import type { LeaferAppResult } from './leafer-app';
import { CoordTransformer } from './utils/coord-transform';
import { SelectionBridge } from './bridges/selection-bridge';
import { ViewportBridge } from './bridges/viewport-bridge';

export class LeaferBackend
  implements IRendererBackend
{
  private appResult: LeaferAppResult | null =
    null;
  private selectionBridge =
    new SelectionBridge();
  private viewportBridge = new ViewportBridge();
  private coordTransformer: CoordTransformer | null =
    null;
  private imageSize = {
    width: 0,
    height: 0,
  };

  // ---- 生命周期 ----

  init(config: BackendConfig): void {
    const { container, imageDisplaySize } =
      config;
    this.imageSize = { ...imageDisplaySize };

    this.appResult = createLeaferApp(
      container,
      imageDisplaySize.width,
      imageDisplaySize.height
    );

    // 初始化坐标转换器
    this.coordTransformer = new CoordTransformer(
      () => this.imageSize,
      () => this.getZoomState()
    );

    // 注册 Leafer 事件 → Backend 回调
    this.setupEventListeners();
  }

  destroy(): void {
    if (this.appResult) {
      destroyLeaferApp(this.appResult.app);
      this.appResult = null;
    }
    this.coordTransformer = null;
  }

  resize(width: number, height: number): void {
    if (this.appResult) {
      resizeLeaferApp(
        this.appResult.app,
        width,
        height
      );
    }
  }

  setImageDisplaySize(
    size: { width: number; height: number }
  ): void {
    this.imageSize = { ...size };
    if (this.appResult) {
      updateBoxSize(
        this.appResult.annotationBox,
        size.width,
        size.height
      );
    }
  }

  // ---- 视口 ----

  setViewport(state: ViewportState): void {
    if (!this.appResult) return;
    const zoomLayer =
      this.appResult.app.tree?.zoomLayer;
    if (!zoomLayer) return;

    this.viewportBridge.syncViewportToBackend(
      state,
      zoomLayer as unknown as {
        x: number;
        y: number;
        scale: number;
      }
    );
  }

  getViewport(): ViewportState {
    const zoom = this.getZoomState();
    return {
      scale: zoom.scale,
      offset: { x: zoom.x, y: zoom.y },
    };
  }

  // ---- 图形 CRUD（stub，Phase 1 实现）----

  addShape(
    _type: ShapeType,
    _id: string,
    _data: unknown
  ): void {
    // Phase 1：根据 type 选 adapter，
    // 调用 toCreateParams，创建 Leafer 元素
  }

  updateShape(
    _type: ShapeType,
    _id: string,
    _updates: Record<string, unknown>
  ): void {
    // Phase 1
  }

  removeShape(
    _type: ShapeType,
    _id: string
  ): void {
    // Phase 1
  }

  // ---- 选中状态 ----

  setSelection(
    ids: Record<ShapeType, string[]>
  ): void {
    this.selectionBridge.syncSelectionToBackend(
      ids
    );
  }

  clearSelection(): void {
    this.selectionBridge.syncSelectionToBackend(
      SelectionBridge.emptySelection()
    );
  }

  // ---- 裁剪框（Phase 3 实现）----

  setCropArea(_area: CropArea | null): void {
    // Phase 3
  }

  // ---- 回调注册 ----

  setCallbacks(callbacks: BackendCallbacks): void {
    void callbacks;

    // 桥接回调
    this.selectionBridge.onSelectionChange(
      (ids) =>
        callbacks.onSelectionChange(ids)
    );
    this.viewportBridge.onViewportChangeCallback(
      (state) =>
        callbacks.onViewportChange(state)
    );
  }

  // ---- 坐标转换 ----

  getCoordTransformer(): ICoordTransformer {
    if (!this.coordTransformer) {
      throw new Error(
        'LeaferBackend not initialized'
      );
    }
    return this.coordTransformer;
  }

  // ---- 内部方法 ----

  private getZoomState(): {
    scale: number;
    x: number;
    y: number;
  } {
    const zoomLayer =
      this.appResult?.app.tree?.zoomLayer;
    if (!zoomLayer) {
      return { scale: 1, x: 0, y: 0 };
    }
    return {
      scale:
        typeof zoomLayer.scale === 'number'
          ? zoomLayer.scale
          : 1,
      x: zoomLayer.x ?? 0,
      y: zoomLayer.y ?? 0,
    };
  }

  private setupEventListeners(): void {
    // Phase 1 中注册 Leafer 事件监听
    // - Editor select 事件 → selectionBridge
    // - Viewport zoom/pan 事件 → viewportBridge
    // - 元素 DragEnd/ResizeEnd → onShapeChange
  }
}
