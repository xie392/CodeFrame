/**
 * LeaferJS 渲染后端实现
 * 实现 IRendererBackend 接口
 * Phase 2：马赛克自定义 Filter + CRUD + 绘制交互
 */

import type {
  IRendererBackend,
  BackendConfig,
  BackendCallbacks,
  ViewportState,
  ShapeType,
  ICoordTransformer,
  ShapeDataMap,
} from '../types';
import type {
  CropArea,
  ToolId,
  MosaicShape,
} from '../../types';
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
import { ToolBridge } from './bridges/tool-bridge';
import type { ToolBridgeBackend } from './bridges/tool-bridge';
import {
  RectAdapter,
  ArrowAdapter,
  TextAdapter,
  MosaicAdapter,
} from './adapters';
import type { IShapeAdapter } from '../types';

import {
  Rect,
  Text,
  Image as LeaferImage,
} from 'leafer-ui';
import { Arrow } from '@leafer-in/arrow';
import {
  PointerEvent,
  DragEvent,
} from 'leafer-ui';
import { EditorEvent } from '@leafer-in/editor';

// 注册马赛克自定义滤镜（副作用导入）
import './custom/mosaic-filter';
import { CropOverlay } from './custom/crop-overlay';

import {
  DRAW_MIN_DISTANCE,
  DEFAULT_ARROW_STYLE,
  DEFAULT_RECT_STYLE,
  DEFAULT_TEXT_STYLE,
  DEFAULT_MOSAIC_STYLE,
  MIN_CROP_SIZE,
} from '../../constants';
import { hexToRgba } from './utils/color';
import type { RectDragType } from '../../utils/shape-helpers';
import { applyDragResize } from '../../utils/drag-resize';

// ---------------------------------------------------------------------------
// 适配器注册表
// ---------------------------------------------------------------------------

const adapters: Record<
  ShapeType,
  IShapeAdapter<ShapeDataMap[ShapeType]>
> = {
  arrow: new ArrowAdapter() as IShapeAdapter<
    ShapeDataMap[ShapeType]
  >,
  rect: new RectAdapter() as IShapeAdapter<
    ShapeDataMap[ShapeType]
  >,
  text: new TextAdapter() as IShapeAdapter<
    ShapeDataMap[ShapeType]
  >,
  mosaic: new MosaicAdapter() as IShapeAdapter<
    ShapeDataMap[ShapeType]
  >,
};

// ---------------------------------------------------------------------------
// 允许设置到 Leafer 元素的属性白名单
// ---------------------------------------------------------------------------

const ALLOWED_PROPS = new Set([
  'x', 'y', 'width', 'height',
  'stroke', 'strokeWidth', 'fill',
  'dashPattern', 'points', 'fontSize',
  'fontWeight', 'italic', 'text',
  'startArrow', 'endArrow', 'opacity',
  'hitStroke', 'cornerRadius',
  'url', 'filter',
]);

// ---------------------------------------------------------------------------
// 绘制状态
// ---------------------------------------------------------------------------

interface DrawingState {
  isDrawing: boolean;
  shapeType: ShapeType | null;
  startCoord: { x: number; y: number };
  tempElement: unknown | null;
}

const INITIAL_DRAWING: DrawingState = {
  isDrawing: false,
  shapeType: null,
  startCoord: { x: 0, y: 0 },
  tempElement: null,
};

// ---------------------------------------------------------------------------
// LeaferBackend
// ---------------------------------------------------------------------------

export class LeaferBackend
  implements IRendererBackend, ToolBridgeBackend
{
  private appResult: LeaferAppResult | null =
    null;
  private selectionBridge =
    new SelectionBridge();
  private viewportBridge = new ViewportBridge();
  private toolBridge = new ToolBridge();
  private coordTransformer: CoordTransformer | null =
    null;
  private imageSize = {
    width: 0,
    height: 0,
  };

  // ID → Leafer 元素映射
  private elementMap = new Map<string, unknown>();

  // ID → 图形类型映射
  private typeMap = new Map<string, ShapeType>();

  // ID → 元素事件清理函数
  private elementCleanupMap = new Map<
    string,
    () => void
  >();

  // 回调
  private callbacks: BackendCallbacks | null =
    null;

  // 绘制状态
  private drawing: DrawingState = {
    ...INITIAL_DRAWING,
  };

  // 全局事件清理函数
  private globalCleanupFns: (() => void)[] = [];

  // 马赛克：原始图片数据
  private imageDataUrl: string | null = null;
  private imageCanvas: HTMLCanvasElement | null =
    null;

  // 马赛克：ID → MosaicShape 缓存
  // （用于移动/缩放后重新生成 data URL）
  private mosaicDataMap = new Map<
    string,
    MosaicShape
  >();

  // 同步守卫：阻止 Store→Backend 同步期间
  // Backend→Store 回调造成循环。
  // 使用计数器 + 微任务延迟释放，
  // 确保 async Leafer 事件也守卫住
  private _syncDepth = 0;

  // 裁剪框覆盖层
  private cropOverlay: CropOverlay | null =
    null;

  // 裁剪交互状态
  private cropDrawing = {
    isDrawing: false,
    startX: 0,
    startY: 0,
  };
  private cropDragging: {
    type: RectDragType;
    startX: number;
    startY: number;
    orig: CropArea;
  } | null = null;

  startSync(): void {
    this._syncDepth++;
  }

  endSync(): void {
    this._syncDepth--;
  }

  /** 当前是否处于同步中 */
  private isSyncing(): boolean {
    return this._syncDepth > 0;
  }

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

    this.coordTransformer = new CoordTransformer(
      () => this.imageSize,
      () => this.getZoomState()
    );

    this.setupEventListeners();
  }

  destroy(): void {
    // 清理全局事件
    this.cleanupGlobalEvents();
    // 清理元素级事件
    for (const [, cleanup] of this
      .elementCleanupMap) {
      cleanup();
    }
    this.elementCleanupMap.clear();
    this.elementMap.clear();
    this.typeMap.clear();
    this.mosaicDataMap.clear();
    this.drawing = { ...INITIAL_DRAWING };

    // 清理裁剪覆盖层
    if (this.cropOverlay) {
      this.cropOverlay.destroy();
      this.cropOverlay = null;
    }
    this.cropDrawing = {
      isDrawing: false,
      startX: 0,
      startY: 0,
    };
    this.cropDragging = null;

    if (this.appResult) {
      destroyLeaferApp(this.appResult.app);
      this.appResult = null;
    }
    this.coordTransformer = null;
    this.imageCanvas = null;
    this.imageDataUrl = null;
  }

  resize(width: number, height: number): void {
    if (this.appResult) {
      // 守卫：防止 resize 触发 Leafer
      // 事件导致回调循环
      this.startSync();
      try {
        resizeLeaferApp(
          this.appResult.app,
          width,
          height
        );
      } finally {
        // 微任务延迟释放，
        // 覆盖 Leafer 异步事件窗口
        queueMicrotask(() => this.endSync());
      }
    }
  }

  setImageDisplaySize(
    size: { width: number; height: number }
  ): void {
    // 守卫：防止 updateBoxSize 触发
    // Leafer 事件导致回调循环
    this.startSync();
    try {
      this.imageSize = { ...size };
      if (this.appResult) {
        updateBoxSize(
          this.appResult.annotationBox,
          size.width,
          size.height
        );
      }
      // 同步裁剪覆盖层尺寸
      if (this.cropOverlay) {
        this.cropOverlay.setImageSize(size);
      }
      // 图片显示尺寸变化时标记
      // imageCanvas 需要重建
      if (
        this.imageDataUrl &&
        this.imageCanvas &&
        (this.imageCanvas.width !== size.width ||
          this.imageCanvas.height !== size.height)
      ) {
        this.imageCanvas = null;
      }
    } finally {
      // 微任务延迟释放，
      // 覆盖 Leafer 异步事件窗口
      queueMicrotask(() => this.endSync());
    }
  }

  // ---- 视口 ----

  setViewport(state: ViewportState): void {
    if (!this.appResult) return;
    const zoomLayer =
      this.appResult.app.tree?.zoomLayer;
    if (!zoomLayer) return;

    // 扩大守卫范围，
    // 覆盖异步 Leafer 事件回调窗口
    this.viewportBridge.startSync();
    try {
      this.viewportBridge.syncViewportToBackend(
        state,
        zoomLayer as unknown as {
          x: number;
          y: number;
          scale: number;
        }
      );
    } finally {
      this.viewportBridge.endSync();
    }
  }

  getViewport(): ViewportState {
    const zoom = this.getZoomState();
    return {
      scale: zoom.scale,
      offset: { x: zoom.x, y: zoom.y },
    };
  }

  // ---- 图形 CRUD ----

  addShape(
    type: ShapeType,
    id: string,
    data: unknown
  ): void {
    if (this.elementMap.has(id)) {
      this.updateShape(
        type,
        id,
        data as Record<string, unknown>
      );
      return;
    }

    const adapter = adapters[type];
    if (!adapter) return;

    const params = adapter.toCreateParams(
      data as ShapeDataMap[ShapeType]
    );

    let element: unknown;
    switch (type) {
      case 'rect':
        element = new Rect(params);
        break;
      case 'arrow':
        element = new Arrow(params);
        break;
      case 'text':
        element = new Text(params);
        break;
      case 'mosaic':
        element = new LeaferImage(params);
        // 设置马赛克区域的图片 data URL
        this.setMosaicImageUrl(
          element,
          data as MosaicShape,
        );
        this.mosaicDataMap.set(
          id,
          data as MosaicShape,
        );
        break;
      default:
        return;
    }

    // 存储 shapeType 到元素 data
    const el = element as {
      data?: Record<string, unknown>;
    };
    el.data = { shapeType: type };

    this.elementMap.set(id, element);
    this.typeMap.set(id, type);

    this.appResult?.annotationBox.add(
      element as { remove: () => void }
    );

    this.listenElementDragEnd(element, type, id);
  }

  updateShape(
    type: ShapeType,
    id: string,
    updates: Record<string, unknown>
  ): void {
    const element = this.elementMap.get(id);
    if (!element) return;

    const adapter = adapters[type];
    if (!adapter) return;

    // Arrow 坐标更新需重建 points
    if (
      type === 'arrow' &&
      this.arrowNeedsCoordRebuild(updates)
    ) {
      this.rebuildArrowCoords(
        element,
        updates
      );
      return;
    }

    // 马赛克：位置/尺寸变化需重新生成 data URL
    if (type === 'mosaic') {
      this.updateMosaicElement(
        element,
        id,
        updates,
      );
      return;
    }

    const params = adapter.toUpdateParams(
      updates as Partial<ShapeDataMap[ShapeType]>
    );
    this.applyElementProps(element, params);
  }

  removeShape(
    _type: ShapeType,
    id: string
  ): void {
    // 清理元素事件监听
    const cleanup =
      this.elementCleanupMap.get(id);
    if (cleanup) {
      cleanup();
      this.elementCleanupMap.delete(id);
    }

    const element = this.elementMap.get(id);
    if (!element) return;

    (element as { remove: () => void }).remove();
    this.elementMap.delete(id);
    this.typeMap.delete(id);
    this.mosaicDataMap.delete(id);
  }

  // ---- 选中状态 ----

  setSelection(
    ids: Record<ShapeType, string[]>
  ): void {
    // syncing 守卫覆盖整个同步流程
    this.selectionBridge.startSync();
    try {
      if (!this.appResult) return;
      const editor = this.getEditor();
      if (!editor) return;

      const elements: unknown[] = [];
      for (const type of [
        'arrow',
        'rect',
        'text',
        'mosaic',
      ] as ShapeType[]) {
        for (const id of ids[type]) {
          const el = this.elementMap.get(id);
          if (el) elements.push(el);
        }
      }

      if (elements.length > 0) {
        (
          editor as {
            select: (v: unknown) => void;
          }
        ).select(elements);
      } else {
        (
          editor as { cancel: () => void }
        ).cancel();
      }
    } finally {
      this.selectionBridge.endSync();
    }
  }

  clearSelection(): void {
    this.selectionBridge.startSync();
    try {
      const editor = this.getEditor();
      if (editor) {
        (
          editor as { cancel: () => void }
        ).cancel();
      }
    } finally {
      this.selectionBridge.endSync();
    }
  }

  // ---- 裁剪框 ----

  setCropArea(area: CropArea | null): void {
    if (!this.appResult) return;

    // 延迟创建覆盖层
    if (!this.cropOverlay) {
      this.cropOverlay = new CropOverlay(
        this.appResult.annotationBox,
        this.imageSize,
      );
    }

    // syncing 守卫：Store→Backend 同步期间
    // 不触发 Backend→Store 回调
    if (this.isSyncing()) {
      this.cropOverlay.setCropArea(area);
      return;
    }

    this.cropOverlay.setCropArea(area);
  }

  // ---- 回调注册 ----

  setCallbacks(callbacks: BackendCallbacks): void {
    this.callbacks = callbacks;

    // 统一 syncing 守卫：
    // syncing 期间跳过所有
    // Backend→Store 回调，
    // 防止 Store→Backend→Store 循环
    this.selectionBridge.onSelectionChange(
      (ids) => {
        if (this.isSyncing()) return;
        callbacks.onSelectionChange(ids);
      }
    );
    this.viewportBridge.onViewportChangeCallback(
      (state) => {
        if (this.isSyncing()) return;
        callbacks.onViewportChange(state);
      }
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

  // ---- 工具桥接 ----

  getToolBridge(): ToolBridge {
    return this.toolBridge;
  }

  /** 切换工具模式（供 useBackendSync 调用）*/
  setToolMode(tool: string): void {
    const validTools: ToolId[] = [
      'select',
      'move',
      'arrow',
      'rect',
      'text',
      'mosaic',
      'crop',
    ];
    if (!validTools.includes(tool as ToolId))
      return;
    this.toolBridge.setTool(tool as ToolId);
  }

  // ================================================================
  // 内部方法
  // ================================================================

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

  /** 获取 Leafer Editor 实例 */
  getEditor(): unknown | null {
    const app = this.appResult?.app;
    if (!app) return null;
    const editor = (
      app as unknown as Record<string, unknown>
    ).editor;
    return editor ?? null;
  }

  /** 获取 App 结果（供导出 Hook 使用）*/
  getAppResult(): LeaferAppResult | null {
    return this.appResult;
  }

  // ---- 马赛克图片管理 ----

  /** 设置原始图片数据（供 useBackendSync 调用）*/
  setImageData(url: string): void {
    if (this.imageDataUrl === url) return;
    this.imageDataUrl = url;
    this.loadImageCanvas();
  }

  /** 加载原始图片到离屏 canvas */
  private loadImageCanvas(): void {
    if (!this.imageDataUrl) return;
    const img = new window.Image();
    img.onload = () => {
      const canvas =
        document.createElement('canvas');
      canvas.width = this.imageSize.width;
      canvas.height = this.imageSize.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(
          img,
          0,
          0,
          this.imageSize.width,
          this.imageSize.height,
        );
        this.imageCanvas = canvas;
        this.updateAllMosaicUrls();
      }
    };
    img.src = this.imageDataUrl;
  }

  /** 为所有已有马赛克更新 data URL */
  private updateAllMosaicUrls(): void {
    if (!this.imageCanvas) return;
    for (const [id, shape] of this.mosaicDataMap) {
      const element = this.elementMap.get(id);
      if (!element) continue;
      const url =
        this.generateMosaicRegionUrl(shape);
      if (url) {
        (element as { url: string }).url = url;
      }
    }
  }

  /** 从原始图片生成马赛克区域的 data URL */
  private generateMosaicRegionUrl(
    shape: MosaicShape,
  ): string | null {
    if (!this.imageCanvas) return null;

    const w = Math.max(
      1,
      Math.round(shape.width),
    );
    const h = Math.max(
      1,
      Math.round(shape.height),
    );
    const sx = Math.max(
      0,
      Math.round(shape.x),
    );
    const sy = Math.max(
      0,
      Math.round(shape.y),
    );
    const sw = Math.min(
      w,
      this.imageCanvas.width - sx,
    );
    const sh = Math.min(
      h,
      this.imageCanvas.height - sy,
    );

    if (sw <= 0 || sh <= 0) return null;

    const offscreen =
      document.createElement('canvas');
    offscreen.width = sw;
    offscreen.height = sh;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(
      this.imageCanvas,
      sx,
      sy,
      sw,
      sh,
      0,
      0,
      sw,
      sh,
    );

    return offscreen.toDataURL();
  }

  /** 设置马赛克 Image 元素的 data URL */
  private setMosaicImageUrl(
    element: unknown,
    shape: MosaicShape,
  ): void {
    const url =
      this.generateMosaicRegionUrl(shape);
    if (url) {
      (element as { url: string }).url = url;
    }
  }

  /** 更新马赛克元素属性 */
  private updateMosaicElement(
    element: unknown,
    id: string,
    updates: Record<string, unknown>,
  ): void {
    const el = element as Record<
      string,
      unknown
    >;

    // 先比较是否实际变化，再更新缓存
    const cached = this.mosaicDataMap.get(id);
    let needsUrlUpdate = false;

    if (cached) {
      needsUrlUpdate =
        ('x' in updates &&
          updates.x !== cached.x) ||
        ('y' in updates &&
          updates.y !== cached.y) ||
        ('width' in updates &&
          updates.width !== cached.width) ||
        ('height' in updates &&
          updates.height !== cached.height);
      Object.assign(cached, updates);
    }

    // 位置/尺寸变化 → 重新生成 data URL
    if (needsUrlUpdate && cached) {
      const url =
        this.generateMosaicRegionUrl(cached);
      if (url) {
        el.url = url;
      }
    }

    // 仅在值实际变化时设置属性
    if (
      'x' in updates &&
      el.x !== updates.x
    ) {
      el.x = updates.x;
    }
    if (
      'y' in updates &&
      el.y !== updates.y
    ) {
      el.y = updates.y;
    }
    if (
      'width' in updates &&
      el.width !== updates.width
    ) {
      el.width = updates.width;
    }
    if (
      'height' in updates &&
      el.height !== updates.height
    ) {
      el.height = updates.height;
    }

    // blockSize 变化 → 更新 filter
    if ('blockSize' in updates) {
      el.filter = {
        type: 'mosaic',
        blockSize: updates.blockSize,
      };
    }

    // opacity 变化 → 映射 0-100 → 0-1
    if ('opacity' in updates) {
      const newOpacity =
        (updates.opacity as number) / 100;
      if (el.opacity !== newOpacity) {
        el.opacity = newOpacity;
      }
    }
  }

  /** 安全应用属性到 Leafer 元素（白名单过滤）*/
  private applyElementProps(
    element: unknown,
    props: Record<string, unknown>
  ): void {
    const el = element as Record<string, unknown>;
    for (const [key, value] of Object.entries(
      props
    )) {
      if (
        value !== undefined &&
        ALLOWED_PROPS.has(key)
      ) {
        el[key] = value;
      }
    }
  }

  /** 判断 Arrow 是否需要坐标重建 */
  private arrowNeedsCoordRebuild(
    updates: Record<string, unknown>
  ): boolean {
    return (
      'startX' in updates ||
      'startY' in updates ||
      'endX' in updates ||
      'endY' in updates
    );
  }

  /** 重建 Arrow 坐标 */
  private rebuildArrowCoords(
    element: unknown,
    updates: Record<string, unknown>
  ): void {
    const el = element as {
      x: number;
      y: number;
      points: number[];
    };
    const ox = el.x ?? 0;
    const oy = el.y ?? 0;
    const pts = el.points ?? [0, 0, 0, 0];

    const startX =
      'startX' in updates
        ? (updates.startX as number)
        : (pts[0] ?? 0) + ox;
    const startY =
      'startY' in updates
        ? (updates.startY as number)
        : (pts[1] ?? 0) + oy;
    const endX =
      'endX' in updates
        ? (updates.endX as number)
        : (pts[2] ?? 0) + ox;
    const endY =
      'endY' in updates
        ? (updates.endY as number)
        : (pts[3] ?? 0) + oy;

    el.points = [startX, startY, endX, endY];
    el.x = 0;
    el.y = 0;
  }

  /** 监听元素拖拽结束事件（带清理）*/
  private listenElementDragEnd(
    element: unknown,
    type: ShapeType,
    id: string
  ): void {
    const el = element as {
      on: (
        event: unknown,
        handler: (e: unknown) => void
      ) => void;
      off: (
        event: unknown,
        handler: (e: unknown) => void
      ) => void;
    };

    const handler = () => {
      // 同步期间跳过，防止
      // Store→Backend→Store 循环
      if (this.isSyncing()) return;
      if (!this.callbacks) return;
      const adapter = adapters[type];
      if (!adapter) return;
      const storeUpdates =
        adapter.toStoreUpdates(element);
      this.callbacks.onShapeChange(
        type,
        id,
        storeUpdates as Record<string, unknown>
      );
    };

    el.on(DragEvent.END, handler);

    // 注册清理函数
    this.elementCleanupMap.set(id, () => {
      el.off(DragEvent.END, handler);
    });
  }

  // ---- 全局事件监听 ----

  private setupEventListeners(): void {
    if (!this.appResult) return;

    this.setupEditorSelectListener();
    this.setupDrawingListeners();
    this.setupViewportListeners();
    this.setupToolBridge();
  }

  private cleanupGlobalEvents(): void {
    for (const fn of this.globalCleanupFns) {
      fn();
    }
    this.globalCleanupFns = [];
  }

  /** Editor 选中事件 → Store */
  private setupEditorSelectListener(): void {
    const editor = this.getEditor();
    if (!editor) return;

    const ed = editor as {
      on: (
        event: unknown,
        handler: (e: unknown) => void
      ) => void;
      off: (
        event: unknown,
        handler: (e: unknown) => void
      ) => void;
      list: unknown[];
    };

    const handler = () => {
      if (this.selectionBridge.isSyncing())
        return;
      console.count(
        '[LOOP_DEBUG] SELECT-event'
      );
      const selectedIds =
        SelectionBridge.emptySelection();
      const list = ed.list ?? [];

      for (const item of list) {
        const el = item as {
          id?: string;
          data?: { shapeType?: ShapeType };
        };
        const type =
          el.data?.shapeType ??
          this.typeMap.get(el.id ?? '') ??
          null;
        if (type && el.id) {
          selectedIds[type].push(el.id);
        }
      }

      this.selectionBridge.handleLeaferSelect(
        selectedIds
      );
    };

    ed.on(EditorEvent.SELECT, handler);
    this.globalCleanupFns.push(() => {
      ed.off(EditorEvent.SELECT, handler);
    });
  }

  /** 绘制交互 Pointer 事件 */
  private setupDrawingListeners(): void {
    const app = this.appResult?.app;
    if (!app) return;

    const a = app as {
      on: (
        event: unknown,
        handler: (e: unknown) => void
      ) => void;
      off: (
        event: unknown,
        handler: (e: unknown) => void
      ) => void;
    };

    const onDown = (e: unknown) => {
      this.handleDrawPointerDown(e);
    };
    const onMove = (e: unknown) => {
      this.handleDrawPointerMove(e);
    };
    const onUp = () => {
      this.handleDrawPointerUp();
    };

    a.on(PointerEvent.DOWN, onDown);
    a.on(PointerEvent.MOVE, onMove);
    a.on(PointerEvent.UP, onUp);

    this.globalCleanupFns.push(() => {
      a.off(PointerEvent.DOWN, onDown);
      a.off(PointerEvent.MOVE, onMove);
      a.off(PointerEvent.UP, onUp);
    });
  }

  /** 视口变化事件 → Store */
  private setupViewportListeners(): void {
    const app = this.appResult?.app;
    if (!app) return;

    const zoomLayer = app.tree?.zoomLayer;
    if (!zoomLayer) return;

    const zl = zoomLayer as {
      on: (
        event: unknown,
        handler: () => void
      ) => void;
      off: (
        event: unknown,
        handler: () => void
      ) => void;
    };

    const handler = () => {
      if (this.viewportBridge.isSyncing()) return;
      console.count(
        '[LOOP_DEBUG] viewport-event'
      );
      this.viewportBridge
        .handleLeaferViewportChange(
          this.getViewport()
        );
    };

    zl.on(DragEvent.END, handler);
    this.globalCleanupFns.push(() => {
      zl.off(DragEvent.END, handler);
    });
  }

  /** 工具桥接配置 */
  private setupToolBridge(): void {
    this.toolBridge.setBackend(this);
  }

  // ---- 绘制交互 ----

  private handleDrawPointerDown(
    e: unknown
  ): void {
    const tool = this.toolBridge.getTool();

    // 裁剪工具单独处理
    if (tool === 'crop') {
      this.handleCropPointerDown(e);
      return;
    }

    if (
      tool !== 'arrow' &&
      tool !== 'rect' &&
      tool !== 'text' &&
      tool !== 'mosaic'
    )
      return;

    const evt = e as { x: number; y: number };
    const coord =
      this.coordTransformer?.screenToImage(
        evt.x,
        evt.y
      ) ?? { x: 0, y: 0 };

    if (tool === 'text') {
      this.createTextAtCoord(coord);
      return;
    }

    this.drawing = {
      isDrawing: true,
      shapeType: tool,
      startCoord: coord,
      tempElement: null,
    };

    this.createTempElement(tool, coord);
  }

  private handleDrawPointerMove(
    e: unknown
  ): void {
    // 裁剪拖拽/绘制
    if (this.toolBridge.getTool() === 'crop') {
      this.handleCropPointerMove(e);
      return;
    }

    if (!this.drawing.isDrawing) return;

    const evt = e as { x: number; y: number };
    const coord =
      this.coordTransformer?.screenToImage(
        evt.x,
        evt.y
      ) ?? { x: 0, y: 0 };

    this.updateTempElement(
      this.drawing.shapeType!,
      this.drawing.startCoord,
      coord
    );
  }

  private handleDrawPointerUp(): void {
    // 裁剪结束
    if (this.toolBridge.getTool() === 'crop') {
      this.handleCropPointerUp();
      return;
    }

    if (!this.drawing.isDrawing) return;
    this.finalizeDrawing();
  }

  /** 创建临时绘制图形 */
  private createTempElement(
    tool: ShapeType,
    coord: { x: number; y: number }
  ): void {
    if (!this.appResult) return;

    let element: unknown;

    if (tool === 'rect') {
      element = new Rect({
        x: coord.x,
        y: coord.y,
        width: 0,
        height: 0,
        stroke: DEFAULT_RECT_STYLE.color,
        strokeWidth:
          DEFAULT_RECT_STYLE.strokeWidth,
        dashPattern:
          DEFAULT_RECT_STYLE.borderStyle ===
          'dashed'
            ? [8, 4]
            : undefined,
        fill:
          DEFAULT_RECT_STYLE.fillOpacity > 0
            ? hexToRgba(
                DEFAULT_RECT_STYLE.color,
                DEFAULT_RECT_STYLE.fillOpacity /
                  100
              )
            : undefined,
        opacity: 0.6,
      });
    } else if (tool === 'arrow') {
      element = new Arrow({
        points: [
          coord.x,
          coord.y,
          coord.x,
          coord.y,
        ],
        stroke: DEFAULT_ARROW_STYLE.color,
        strokeWidth:
          DEFAULT_ARROW_STYLE.strokeWidth,
        endArrow: 'mark',
        hitStroke: 'all',
        opacity: 0.6,
      });
    } else if (tool === 'mosaic') {
      // 马赛克绘制预览用半透明 Rect
      element = new Rect({
        x: coord.x,
        y: coord.y,
        width: 0,
        height: 0,
        fill: 'rgba(128,128,128,0.4)',
        stroke: 'rgba(128,128,128,0.8)',
        strokeWidth: 1,
        opacity: 0.6,
      });
    } else {
      return;
    }

    this.drawing.tempElement = element;
    this.appResult.annotationBox.add(
      element as { remove: () => void }
    );
  }

  /** 更新临时绘制图形 */
  private updateTempElement(
    tool: ShapeType,
    start: { x: number; y: number },
    current: { x: number; y: number }
  ): void {
    const el = this.drawing.tempElement as {
      x: number;
      y: number;
      width: number;
      height: number;
      points: number[];
    } | null;
    if (!el) return;

    if (tool === 'rect' || tool === 'mosaic') {
      el.x = Math.min(start.x, current.x);
      el.y = Math.min(start.y, current.y);
      el.width = Math.abs(
        current.x - start.x
      );
      el.height = Math.abs(
        current.y - start.y
      );
    } else if (tool === 'arrow') {
      el.points = [
        start.x,
        start.y,
        current.x,
        current.y,
      ];
    }
  }

  /** 完成绘制，创建 Store 数据 */
  private finalizeDrawing(): void {
    const { shapeType, startCoord, tempElement } =
      this.drawing;

    // 先读取坐标再移除（防竞态）
    const temp = tempElement as {
      x: number;
      y: number;
      width: number;
      height: number;
      points: number[];
    } | null;

    // 移除临时元素
    if (tempElement) {
      (
        tempElement as { remove: () => void }
      ).remove();
    }

    if (!shapeType || !this.callbacks || !temp) {
      this.drawing = { ...INITIAL_DRAWING };
      return;
    }

    // 验证最小距离
    if (!this.isDrawingSizeValid(shapeType, temp)) {
      this.drawing = { ...INITIAL_DRAWING };
      return;
    }

    const data = this.buildShapeData(
      shapeType,
      startCoord,
      temp
    );

    this.callbacks.onShapeCreated(shapeType, data);
    this.drawing = { ...INITIAL_DRAWING };
  }

  /** 验证绘制尺寸是否满足最小距离 */
  private isDrawingSizeValid(
    type: ShapeType,
    temp: {
      width: number;
      height: number;
      points: number[];
    }
  ): boolean {
    if (type === 'rect' || type === 'mosaic') {
      return (
        temp.width >= DRAW_MIN_DISTANCE &&
        temp.height >= DRAW_MIN_DISTANCE
      );
    }
    if (type === 'arrow') {
      const dx =
        (temp.points?.[2] ?? 0) -
        (temp.points?.[0] ?? 0);
      const dy =
        (temp.points?.[3] ?? 0) -
        (temp.points?.[1] ?? 0);
      return (
        Math.sqrt(dx * dx + dy * dy) >=
        DRAW_MIN_DISTANCE
      );
    }
    return true;
  }

  /** 单击创建文字 */
  private createTextAtCoord(
    coord: { x: number; y: number }
  ): void {
    if (!this.callbacks) return;

    this.callbacks.onShapeCreated('text', {
      x: coord.x,
      y: coord.y,
      text: 'Text',
      color: DEFAULT_TEXT_STYLE.color,
      fontSize: DEFAULT_TEXT_STYLE.fontSize,
      fontWeight: DEFAULT_TEXT_STYLE.fontWeight,
      fontStyle: DEFAULT_TEXT_STYLE.fontStyle,
    });
  }

  /** 从绘制结果构建 Store 数据 */
  private buildShapeData(
    type: ShapeType,
    _start: { x: number; y: number },
    temp: {
      x: number;
      y: number;
      width: number;
      height: number;
      points: number[];
    }
  ): Record<string, unknown> {
    if (type === 'rect') {
      return {
        x: temp.x,
        y: temp.y,
        width: temp.width,
        height: temp.height,
        color: DEFAULT_RECT_STYLE.color,
        strokeWidth:
          DEFAULT_RECT_STYLE.strokeWidth,
        fillOpacity:
          DEFAULT_RECT_STYLE.fillOpacity,
        borderStyle:
          DEFAULT_RECT_STYLE.borderStyle,
      };
    }

    if (type === 'arrow') {
      return {
        startX: temp.points?.[0] ?? 0,
        startY: temp.points?.[1] ?? 0,
        endX: temp.points?.[2] ?? 0,
        endY: temp.points?.[3] ?? 0,
        color: DEFAULT_ARROW_STYLE.color,
        strokeWidth:
          DEFAULT_ARROW_STYLE.strokeWidth,
        headSize: DEFAULT_ARROW_STYLE.headSize,
        style: DEFAULT_ARROW_STYLE.style,
      };
    }

    if (type === 'mosaic') {
      return {
        x: temp.x,
        y: temp.y,
        width: temp.width,
        height: temp.height,
        blockSize:
          DEFAULT_MOSAIC_STYLE.blockSize,
        opacity: DEFAULT_MOSAIC_STYLE.opacity,
      };
    }

    return {};
  }

  // ---- 裁剪交互 ----

  private handleCropPointerDown(
    e: unknown,
  ): void {
    const evt = e as { x: number; y: number };
    const coord =
      this.coordTransformer?.screenToImage(
        evt.x,
        evt.y,
      ) ?? { x: 0, y: 0 };

    // 钳制到图片范围
    const clamped = this.clampCoord(coord);

    const currentCrop =
      this.cropOverlay?.getCropArea() ?? null;

    if (currentCrop) {
      // 已有裁剪框 → 检测拖拽类型
      const dragType =
        this.cropOverlay!.getDragTypeAtPoint(
          clamped.x,
          clamped.y,
        );
      if (dragType !== 'none') {
        this.cropDragging = {
          type: dragType,
          startX: clamped.x,
          startY: clamped.y,
          orig: { ...currentCrop },
        };
        return;
      }
    }

    // 无裁剪框或点击在框外 → 开始新的绘制
    this.cropDrawing = {
      isDrawing: true,
      startX: clamped.x,
      startY: clamped.y,
    };

    // 清除旧裁剪框
    this.setCropArea(null);
    this.notifyCropChange(null);
  }

  private handleCropPointerMove(
    e: unknown,
  ): void {
    const evt = e as { x: number; y: number };
    const coord =
      this.coordTransformer?.screenToImage(
        evt.x,
        evt.y,
      ) ?? { x: 0, y: 0 };

    const clamped = this.clampCoord(coord);

    if (this.cropDragging) {
      // 拖拽调整裁剪框
      const dx =
        clamped.x - this.cropDragging.startX;
      const dy =
        clamped.y - this.cropDragging.startY;
      const bounds = {
        minX: 0,
        minY: 0,
        maxX: this.imageSize.width,
        maxY: this.imageSize.height,
      };
      const newCrop = applyDragResize(
        {
          x: this.cropDragging.orig.x,
          y: this.cropDragging.orig.y,
          width: this.cropDragging.orig.width,
          height: this.cropDragging.orig.height,
        },
        this.cropDragging.type,
        dx,
        dy,
        this.cropDragging.orig,
        MIN_CROP_SIZE,
        bounds,
      );
      this.setCropArea(newCrop);
      this.notifyCropChange(newCrop);
      return;
    }

    if (this.cropDrawing.isDrawing) {
      // 绘制中 → 实时更新裁剪区域
      const { startX, startY } =
        this.cropDrawing;
      const area: CropArea = {
        x: Math.min(startX, clamped.x),
        y: Math.min(startY, clamped.y),
        width: Math.abs(clamped.x - startX),
        height: Math.abs(clamped.y - startY),
      };
      this.setCropArea(area);
      this.notifyCropChange(area);
    }
  }

  private handleCropPointerUp(): void {
    if (this.cropDragging) {
      // 拖拽结束 → 通知回调
      const area =
        this.cropOverlay?.getCropArea() ?? null;
      if (area) {
        this.notifyCropChange(area);
      }
      this.cropDragging = null;
      return;
    }

    if (this.cropDrawing.isDrawing) {
      const area =
        this.cropOverlay?.getCropArea();
      // 尺寸太小的裁剪框无效
      if (
        area &&
        area.width >= MIN_CROP_SIZE &&
        area.height >= MIN_CROP_SIZE
      ) {
        this.notifyCropChange(area);
      } else {
        this.setCropArea(null);
        this.notifyCropChange(null);
      }
      this.cropDrawing = {
        isDrawing: false,
        startX: 0,
        startY: 0,
      };
    }
  }

  /** 通知裁剪区域变化 */
  private notifyCropChange(
    area: CropArea | null,
  ): void {
    if (!this.callbacks || this.isSyncing())
      return;
    this.callbacks.onCropAreaChange(area);
  }

  /** 坐标钳制到图片范围 */
  private clampCoord(coord: {
    x: number;
    y: number;
  }): { x: number; y: number } {
    return {
      x: Math.max(
        0,
        Math.min(this.imageSize.width, coord.x),
      ),
      y: Math.max(
        0,
        Math.min(this.imageSize.height, coord.y),
      ),
    };
  }
}
