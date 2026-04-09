/**
 * 渲染后端抽象接口定义
 * 所有渲染后端必须实现 IRendererBackend 接口
 */

import type {
  ArrowShape,
  RectShape,
  TextShape,
  MosaicShape,
  CropArea,
} from '../types';

// ---------------------------------------------------------------------------
// 图形类型枚举
// ---------------------------------------------------------------------------

export type ShapeType = 'arrow' | 'rect' | 'text' | 'mosaic';

// ---------------------------------------------------------------------------
// 视口状态
// ---------------------------------------------------------------------------

export interface ViewportState {
  scale: number;
  offset: { x: number; y: number };
}

// ---------------------------------------------------------------------------
// 后端配置
// ---------------------------------------------------------------------------

export interface BackendConfig {
  container: HTMLElement;
  imageDisplaySize: { width: number; height: number };
}

// ---------------------------------------------------------------------------
// 图形适配器接口
// ---------------------------------------------------------------------------

/**
 * Store 数据 ↔ 渲染后端数据双向转换
 * TStoreShape: Store 中的图形类型
 */
export interface IShapeAdapter<TStoreShape> {
  /** Store 数据 → 渲染后端创建参数 */
  toCreateParams(
    shape: TStoreShape
  ): Record<string, unknown>;

  /** Store 数据 → 渲染后端更新参数 */
  toUpdateParams(
    updates: Partial<TStoreShape>
  ): Record<string, unknown>;

  /** 渲染后端属性 → Store 更新 */
  toStoreUpdates(
    leaferElement: unknown
  ): Partial<TStoreShape>;
}

// ---------------------------------------------------------------------------
// 选中状态桥接接口
// ---------------------------------------------------------------------------

export interface IEditorBridge {
  /** 是否正在同步（防循环守卫） */
  isSyncing(): boolean;

  /** Store → Leafer 选中同步 */
  syncSelectionToBackend(
    ids: Record<ShapeType, string[]>
  ): void;

  /** Leafer → Store 选中回调 */
  onSelectionChange(
    callback: (
      ids: Record<ShapeType, string[]>
    ) => void
  ): void;
}

// ---------------------------------------------------------------------------
// 坐标转换接口
// ---------------------------------------------------------------------------

export interface ICoordTransformer {
  /** 屏幕坐标 → 图像坐标 */
  screenToImage(
    clientX: number,
    clientY: number
  ): { x: number; y: number };

  /** 图像坐标 → 屏幕坐标 */
  imageToScreen(
    imgX: number,
    imgY: number
  ): { x: number; y: number };

  /** 钳制坐标到图片范围 */
  clampToImage(
    x: number,
    y: number
  ): { x: number; y: number };
}

// ---------------------------------------------------------------------------
// 后端事件回调
// ---------------------------------------------------------------------------

export interface BackendCallbacks {
  /** 图形属性变化（拖拽/缩放结束） */
  onShapeChange: (
    type: ShapeType,
    id: string,
    updates: Record<string, unknown>
  ) => void;

  /** 选中状态变化 */
  onSelectionChange: (
    ids: Record<ShapeType, string[]>
  ) => void;

  /** 视口状态变化 */
  onViewportChange: (
    state: ViewportState
  ) => void;

  /** 新图形绘制完成 */
  onShapeCreated: (
    type: ShapeType,
    data: Record<string, unknown>
  ) => void;

  /** 裁剪区域变化（绘制/拖拽/调整） */
  onCropAreaChange: (
    area: CropArea | null
  ) => void;
}

// ---------------------------------------------------------------------------
// 渲染后端接口
// ---------------------------------------------------------------------------

export interface IRendererBackend {
  /** 初始化后端 */
  init(config: BackendConfig): void;

  /** 销毁后端，清理资源 */
  destroy(): void;

  /** 窗口/容器 resize */
  resize(
    width: number,
    height: number
  ): void;

  /** 设置图片显示尺寸（Box 容器同步） */
  setImageDisplaySize(
    size: { width: number; height: number }
  ): void;

  // 视口操作
  setViewport(state: ViewportState): void;
  getViewport(): ViewportState;

  // 图形 CRUD
  addShape(
    type: ShapeType,
    id: string,
    data: unknown
  ): void;

  updateShape(
    type: ShapeType,
    id: string,
    updates: Record<string, unknown>
  ): void;

  removeShape(
    type: ShapeType,
    id: string
  ): void;

  // 选中状态
  setSelection(
    ids: Record<ShapeType, string[]>
  ): void;

  clearSelection(): void;

  // 裁剪框
  setCropArea(area: CropArea | null): void;

  // 事件回调注册
  setCallbacks(callbacks: BackendCallbacks): void;

  // 坐标转换器
  getCoordTransformer(): ICoordTransformer;
}

// ---------------------------------------------------------------------------
// 图形 Store 数据联合类型映射
// ---------------------------------------------------------------------------

export type ShapeDataMap = {
  arrow: ArrowShape;
  rect: RectShape;
  text: TextShape;
  mosaic: MosaicShape;
};
