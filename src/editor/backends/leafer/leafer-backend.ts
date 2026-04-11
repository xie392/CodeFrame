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
  updateFrameLayout,
  updateImageUrl,
  calculateCenterOffset,
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
  MIN_CROP_SIZE,
} from '../../constants';
import { useEditorStore } from '../../store/editor-store';
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

  // 帧设置缓存
  private frameSettings:
    | import('../../types').ImageFrameSettings
    | null = null;

  // 马赛克：ID → MosaicShape 缓存
  // （用于移动/缩放后重新生成 data URL）
  private mosaicDataMap = new Map<
    string,
    MosaicShape
  >();

  // 马赛克拖拽占位：拖拽中用灰色
  // Rect 替换 Image，避免重复生成 data URL
  private mosaicPlaceholderMap = new Map<
    string,
    { placeholder: Rect; element: unknown }
  >();

  // 同步守卫：阻止 Store→Backend 同步期间
  // Backend→Store 回调造成循环。
  // 使用计数器 + 微任务延迟释放，
  // 确保 async Leafer 事件也守卫住
  private _syncDepth = 0;

  // 裁剪框覆盖层
  private cropOverlay: CropOverlay | null =
    null;

  // 框选状态
  private marquee = {
    isDrawing: false,
    startCoord: { x: 0, y: 0 },
    rect: null as unknown | null,
  };

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

  // 文字双击编辑回调
  private textDoubleClickCallback: ((id: string) => void) | null = null;

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
    const {
      container,
      imageDisplaySize,
      frameSettings,
      imageUrl,
    } = config;
    this.imageSize = { ...imageDisplaySize };
    this.frameSettings = { ...frameSettings };

    this.appResult = createLeaferApp(
      container,
      imageDisplaySize.width,
      imageDisplaySize.height,
      frameSettings,
      imageUrl
    );

    this.coordTransformer = new CoordTransformer(
      () => this.imageSize,
      () => this.getZoomState(),
      () => this.getAnnotationBoxOffset()
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
    // 清理马赛克占位符
    for (const [, entry] of this
      .mosaicPlaceholderMap) {
      (entry.placeholder as {
        remove: () => void;
      }).remove();
    }
    this.mosaicPlaceholderMap.clear();
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
    this.startSync();
    try {
      this.imageSize = { ...size };
      if (this.appResult && this.frameSettings) {
        updateFrameLayout(
          this.appResult,
          size.width,
          size.height,
          this.frameSettings
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
      queueMicrotask(() => this.endSync());
    }
  }

  /** 更新帧设置（供 useBackendSync 调用） */
  setFrameSettings(
    settings: import('../../types').ImageFrameSettings
  ): void {
    this.startSync();
    try {
      this.frameSettings = { ...settings };
      if (this.appResult) {
        updateFrameLayout(
          this.appResult,
          this.imageSize.width,
          this.imageSize.height,
          settings
        );
      }
    } finally {
      queueMicrotask(() => this.endSync());
    }
  }

  /** 更新图片 URL（供 useBackendSync 调用） */
  setImageUrl(url: string): void {
    if (!this.appResult) return;
    updateImageUrl(
      this.appResult.imageElement,
      url
    );
  }

  /** 居中视口（帧在容器中居中显示） */
  centerViewport(): void {
    if (!this.appResult) return;
    const app = this.appResult.app;
    const container = app.view as HTMLElement;
    if (!container) return;

    const containerW = container.clientWidth;
    const containerH = container.clientHeight;
    const frameW =
      this.appResult.frameGroup.width ?? 0;
    const frameH =
      this.appResult.frameGroup.height ?? 0;

    const offset = calculateCenterOffset(
      containerW,
      containerH,
      frameW,
      frameH
    );

    // 通过 ViewportBridge 同步到 Leafer
    const zoomLayer = app.tree?.zoomLayer;
    if (!zoomLayer) return;

    this.viewportBridge.startSync();
    try {
      (
        zoomLayer as unknown as {
          x: number;
          y: number;
          scale: number;
        }
      ).x = offset.x;
      (
        zoomLayer as unknown as {
          x: number;
          y: number;
          scale: number;
        }
      ).y = offset.y;
      (
        zoomLayer as unknown as {
          x: number;
          y: number;
          scale: number;
        }
      ).scale = 1;
    } finally {
      this.viewportBridge.endSync();
    }

    // 同步到 Store
    if (this.callbacks) {
      this.callbacks.onViewportChange({
        scale: 1,
        offset,
      });
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

  /** 从 Leafer PointerEvent 获取图片坐标系坐标 */
  private getImageCoordFromEvent(
    e: unknown
  ): { x: number; y: number } {
    if (!this.appResult) return { x: 0, y: 0 };

    const evt = e as {
      getInnerPoint: (
        relative?: unknown
      ) => { x: number; y: number };
    };

    try {
      const point =
        evt.getInnerPoint(
          this.appResult.annotationBox
        );
      return this.clampCoord(point);
    } catch {
      // getInnerPoint 不可用时回退
      const fallback = e as {
        x: number;
        y: number;
      };
      return (
        this.coordTransformer?.screenToImage(
          fallback.x,
          fallback.y
        ) ?? { x: 0, y: 0 }
      );
    }
  }

  /** 钳制坐标到图片范围 */
  private clampCoord(coord: {
    x: number;
    y: number;
  }): { x: number; y: number } {
    return (
      this.coordTransformer?.clampToImage(
        coord.x,
        coord.y
      ) ?? coord
    );
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

  /** 设置文字双击编辑回调 */
  setTextDoubleClickCallback(
    callback: ((id: string) => void) | null
  ): void {
    this.textDoubleClickCallback = callback;
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

  /** 获取 annotationBox 在 frameGroup 内的偏移 */
  private getAnnotationBoxOffset(): {
    x: number;
    y: number;
  } {
    if (!this.appResult) return { x: 0, y: 0 };
    return {
      x: this.appResult.annotationBox.x ?? 0,
      y: this.appResult.annotationBox.y ?? 0,
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

  /** 监听元素拖拽事件（带清理）*/
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

    // 马赛克拖拽优化：开始时替换为占位
    if (type === 'mosaic') {
      const onDragStart = () => {
        this.replaceMosaicWithPlaceholder(
          id
        );
      };
      el.on(DragEvent.START, onDragStart);
      this.elementCleanupMap.set(
        id + '_dragstart',
        () => {
          el.off(DragEvent.START, onDragStart);
        }
      );
    }

    const handler = () => {
      // 同步期间跳过，防止
      // Store→Backend→Store 循环
      if (this.isSyncing()) return;
      if (!this.callbacks) return;

      // 马赛克拖拽结束：恢复真实像素
      if (type === 'mosaic') {
        this.restoreMosaicFromPlaceholder(
          id
        );
      }

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

  /** 马赛克拖拽开始：用灰色 Rect 占位 */
  private replaceMosaicWithPlaceholder(
    id: string
  ): void {
    if (!this.appResult) return;
    const element = this.elementMap.get(id);
    if (!element) return;
    if (this.mosaicPlaceholderMap.has(id))
      return;

    const el = element as {
      x: number;
      y: number;
      width: number;
      height: number;
      opacity: number;
      remove: () => void;
    };

    const placeholder = new Rect({
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height,
      fill: 'rgba(128,128,128,0.4)',
      stroke: 'rgba(128,128,128,0.8)',
      strokeWidth: 1,
      opacity: el.opacity,
      editable: true,
      dragBounds: 'parent',
    });

    // 隐藏原始元素，添加占位
    (element as { visible: boolean }).visible =
      false;
    this.appResult.annotationBox.add(
      placeholder as { remove: () => void }
    );

    this.mosaicPlaceholderMap.set(id, {
      placeholder,
      element,
    });
  }

  /** 马赛克拖拽结束：恢复真实像素 */
  private restoreMosaicFromPlaceholder(
    id: string
  ): void {
    const entry =
      this.mosaicPlaceholderMap.get(id);
    if (!entry) return;

    const { placeholder, element } = entry;
    const el = element as {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    const ph = placeholder as {
      x: number;
      y: number;
      remove: () => void;
    };

    // 从占位读取最终位置
    el.x = ph.x;
    el.y = ph.y;

    // 恢复原始元素可见性
    (element as { visible: boolean }).visible =
      true;

    // 移除占位
    ph.remove();

    this.mosaicPlaceholderMap.delete(id);

    // 重新生成马赛克 data URL
    const cached = this.mosaicDataMap.get(id);
    if (cached) {
      cached.x = el.x;
      cached.y = el.y;
      this.setMosaicImageUrl(element, cached);
    }
  }

  // ---- 全局事件监听 ----

  private setupEventListeners(): void {
    if (!this.appResult) return;

    this.setupEditorSelectListener();
    this.setupDrawingListeners();
    this.setupViewportListeners();
    this.setupToolBridge();
    this.setupTextDoubleClickListener();
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
    const annotationBox =
      this.appResult?.annotationBox;
    const app = this.appResult?.app;
    if (!annotationBox || !app) return;

    const box = annotationBox as {
      on: (
        event: unknown,
        handler: (e: unknown) => void
      ) => void;
      off: (
        event: unknown,
        handler: (e: unknown) => void
      ) => void;
    };

    // MOVE/UP 注册在 app.tree 上，
    // 确保拖拽过程中持续收到事件
    const tree = app.tree as {
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

    // DOWN 注册在 annotationBox 上，
    // 只在图片区域内才开始绘制
    box.on(PointerEvent.DOWN, onDown);
    // MOVE/UP 注册在 app.tree 上，
    // 拖拽超出 annotationBox 也能持续
    tree.on(PointerEvent.MOVE, onMove);
    tree.on(PointerEvent.UP, onUp);

    this.globalCleanupFns.push(() => {
      box.off(PointerEvent.DOWN, onDown);
      tree.off(PointerEvent.MOVE, onMove);
      tree.off(PointerEvent.UP, onUp);
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

  /** 双击文字元素进入编辑 */
  private setupTextDoubleClickListener(): void {
    if (!this.appResult) return;

    const app = this.appResult.app;
    const view = app.view as HTMLElement | null;
    if (!view) return;

    const handler = (e: MouseEvent) => {
      // 仅在 select 工具下触发
      if (this.toolBridge.getTool() !== 'select') return;
      if (!this.textDoubleClickCallback) return;

      // 查找双击位置下的文字元素
      const target = this.findTextAtScreenPoint(e.clientX, e.clientY);
      if (target) {
        e.preventDefault();
        e.stopPropagation();
        this.textDoubleClickCallback(target.id);
      }
    };

    view.addEventListener('dblclick', handler);
    this.globalCleanupFns.push(() => {
      view.removeEventListener('dblclick', handler);
    });
  }

  /** 在屏幕坐标处查找文字元素 */
  private findTextAtScreenPoint(
    clientX: number,
    clientY: number
  ): { id: string } | null {
    if (!this.appResult) return null;

    const app = this.appResult.app;
    const view = app.view as HTMLElement | null;
    if (!view) return null;

    const zoom = this.getZoomState();
    const annotationOffset = this.getAnnotationBoxOffset();

    // 客户端坐标 → Leafer 容器内坐标
    const rect = view.getBoundingClientRect();
    const viewX = clientX - rect.left;
    const viewY = clientY - rect.top;

    // Leafer 容器内坐标 → annotationBox 内坐标
    const boxX = (viewX - zoom.x) / zoom.scale - annotationOffset.x;
    const boxY = (viewY - zoom.y) / zoom.scale - annotationOffset.y;

    // 遍历文字元素，检查点击位置是否在文字边界内
    for (const [id, type] of this.typeMap) {
      if (type !== 'text') continue;
      const element = this.elementMap.get(id);
      if (!element) continue;

      const el = element as {
        x: number;
        y: number;
        width?: number;
        height?: number;
        fontSize?: number;
        text?: string;
      };

      // 估算文字边界
      const textWidth = el.width ?? (el.text?.length ?? 1) * (el.fontSize ?? 16) * 0.6;
      const textHeight = el.height ?? (el.fontSize ?? 16) * 1.4;

      if (
        boxX >= el.x &&
        boxX <= el.x + textWidth &&
        boxY >= el.y &&
        boxY <= el.y + textHeight
      ) {
        return { id };
      }
    }

    return null;
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

    // select 工具：启动框选
    if (tool === 'select') {
      this.handleMarqueeDown(e);
      return;
    }

    if (
      tool !== 'arrow' &&
      tool !== 'rect' &&
      tool !== 'text' &&
      tool !== 'mosaic'
    )
      return;

    const coord =
      this.getImageCoordFromEvent(e);

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

    // select 框选拖拽
    if (this.marquee.isDrawing) {
      this.handleMarqueeMove(e);
      return;
    }

    if (!this.drawing.isDrawing) return;

    const coord =
      this.getImageCoordFromEvent(e);

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

    // 框选结束
    if (this.marquee.isDrawing) {
      this.handleMarqueeUp();
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

    const styles =
      useEditorStore.getState().lastUsedStyles;
    let element: unknown;

    if (tool === 'rect') {
      const s = styles.rect;
      element = new Rect({
        x: coord.x,
        y: coord.y,
        width: 0,
        height: 0,
        stroke: s.color,
        strokeWidth: s.strokeWidth,
        dashPattern:
          s.borderStyle === 'dashed'
            ? [8, 4]
            : undefined,
        fill:
          s.fillOpacity > 0
            ? hexToRgba(
                s.color,
                s.fillOpacity / 100
              )
            : undefined,
        opacity: 0.6,
      });
    } else if (tool === 'arrow') {
      const s = styles.arrow;
      const scale = s.headSize / 12;
      element = new Arrow({
        points: [
          coord.x,
          coord.y,
          coord.x,
          coord.y,
        ],
        stroke: s.color,
        strokeWidth: s.strokeWidth,
        endArrow: { type: 'angle', scale },
        startArrow:
          s.style === 'double'
            ? { type: 'angle', scale }
            : undefined,
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
      set: (props: Record<string, unknown>) => void;
    } | null;
    if (!el) return;

    if (tool === 'rect' || tool === 'mosaic') {
      el.set({
        x: Math.min(start.x, current.x),
        y: Math.min(start.y, current.y),
        width: Math.abs(
          current.x - start.x
        ),
        height: Math.abs(
          current.y - start.y
        ),
      });
    } else if (tool === 'arrow') {
      el.set({
        points: [
          start.x,
          start.y,
          current.x,
          current.y,
        ],
      });
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

    const s =
      useEditorStore.getState().lastUsedStyles
        .text;
    this.callbacks.onShapeCreated('text', {
      x: coord.x,
      y: coord.y,
      text: 'Text',
      color: s.color,
      fontSize: s.fontSize,
      fontWeight: s.fontWeight,
      fontStyle: s.fontStyle,
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
    const styles =
      useEditorStore.getState().lastUsedStyles;

    if (type === 'rect') {
      const s = styles.rect;
      return {
        x: temp.x,
        y: temp.y,
        width: temp.width,
        height: temp.height,
        color: s.color,
        strokeWidth: s.strokeWidth,
        fillOpacity: s.fillOpacity,
        borderStyle: s.borderStyle,
      };
    }

    if (type === 'arrow') {
      const s = styles.arrow;
      return {
        startX: temp.points?.[0] ?? 0,
        startY: temp.points?.[1] ?? 0,
        endX: temp.points?.[2] ?? 0,
        endY: temp.points?.[3] ?? 0,
        color: s.color,
        strokeWidth: s.strokeWidth,
        headSize: s.headSize,
        style: s.style,
      };
    }

    if (type === 'mosaic') {
      const s = styles.mosaic;
      return {
        x: temp.x,
        y: temp.y,
        width: temp.width,
        height: temp.height,
        blockSize: s.blockSize,
        opacity: s.opacity,
      };
    }

    return {};
  }

  // ---- 裁剪交互 ----

  private handleCropPointerDown(
    e: unknown,
  ): void {
    // 钳制到图片范围
    const clamped =
      this.getImageCoordFromEvent(e);

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
    const clamped =
      this.getImageCoordFromEvent(e);

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

  // ---- 框选交互 ----

  /** 框选开始 */
  private handleMarqueeDown(
    e: unknown
  ): void {
    const coord =
      this.getImageCoordFromEvent(e);

    this.marquee = {
      isDrawing: true,
      startCoord: coord,
      rect: null,
    };

    // 创建蓝色虚线选取框
    if (this.appResult) {
      const rect = new Rect({
        x: coord.x,
        y: coord.y,
        width: 0,
        height: 0,
        stroke: '#3B82F6',
        strokeWidth: 1,
        dashPattern: [6, 3],
        fill: 'rgba(59,130,246,0.08)',
        editable: false,
        hittable: false,
      });
      this.appResult.annotationBox.add(
        rect as { remove: () => void }
      );
      this.marquee.rect = rect;
    }
  }

  /** 框选拖拽更新 */
  private handleMarqueeMove(
    e: unknown
  ): void {
    if (!this.marquee.isDrawing) return;
    const coord =
      this.getImageCoordFromEvent(e);

    const rect = this.marquee.rect as {
      set: (p: Record<string, unknown>) => void;
    } | null;
    if (!rect) return;

    const { startCoord } = this.marquee;
    rect.set({
      x: Math.min(startCoord.x, coord.x),
      y: Math.min(startCoord.y, coord.y),
      width: Math.abs(coord.x - startCoord.x),
      height: Math.abs(
        coord.y - startCoord.y
      ),
    });
  }

  /** 框选结束：命中检测 */
  private handleMarqueeUp(): void {
    const rect = this.marquee.rect as {
      x: number;
      y: number;
      width: number;
      height: number;
      remove: () => void;
    } | null;

    if (rect && rect.width > 2 && rect.height > 2) {
      // 执行命中检测
      const marqueeBounds = {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      };
      const hitIds =
        this.findElementsInBounds(
          marqueeBounds
        );

      if (
        hitIds &&
        this.callbacks &&
        !this.isSyncing()
      ) {
        this.callbacks.onSelectionChange(
          hitIds
        );
      }
    }

    // 移除选取框
    if (rect) {
      rect.remove();
    }

    this.marquee = {
      isDrawing: false,
      startCoord: { x: 0, y: 0 },
      rect: null,
    };
  }

  /** 查找在指定区域内的所有图形 ID */
  private findElementsInBounds(bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): Record<ShapeType, string[]> | null {
    const result: Record<
      ShapeType,
      string[]
    > = {
      arrow: [],
      rect: [],
      text: [],
      mosaic: [],
    };

    const bx1 = bounds.x;
    const by1 = bounds.y;
    const bx2 = bounds.x + bounds.width;
    const by2 = bounds.y + bounds.height;

    for (const [
      id,
      element,
    ] of this.elementMap) {
      const el = element as {
        x: number;
        y: number;
        width: number;
        height: number;
        points?: number[];
      };

      const type = this.typeMap.get(id);
      if (!type) continue;

      let ex1: number;
      let ey1: number;
      let ex2: number;
      let ey2: number;

      if (type === 'arrow' && el.points) {
        const pts = el.points;
        const ox = el.x ?? 0;
        const oy = el.y ?? 0;
        ex1 = Math.min(
          (pts[0] ?? 0) + ox,
          (pts[2] ?? 0) + ox
        );
        ey1 = Math.min(
          (pts[1] ?? 0) + oy,
          (pts[3] ?? 0) + oy
        );
        ex2 = Math.max(
          (pts[0] ?? 0) + ox,
          (pts[2] ?? 0) + ox
        );
        ey2 = Math.max(
          (pts[1] ?? 0) + oy,
          (pts[3] ?? 0) + oy
        );
      } else {
        ex1 = el.x ?? 0;
        ey1 = el.y ?? 0;
        ex2 = (el.x ?? 0) + (el.width ?? 0);
        ey2 = (el.y ?? 0) + (el.height ?? 0);
      }

      // 检测交集
      if (ex1 < bx2 && ex2 > bx1 && ey1 < by2 && ey2 > by1) {
        result[type].push(id);
      }
    }

    return result;
  }
}
