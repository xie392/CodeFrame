/**
 * Store → Backend 单向监听 Hook
 * Phase 0：实现 Store 图形数组/选中/视口/工具 → Backend 同步
 * Phase 1：增加 Backend → Store 回调
 */

import { useEffect, useRef } from 'react';
import { useEditorStore } from '../../store/editor-store';
import type {
  IRendererBackend,
  ShapeType,
} from '../types';

const SHAPE_TYPES: ShapeType[] = [
  'arrow',
  'rect',
  'text',
  'mosaic',
];

/** 获取 Store 中对应图形类型的数组和选中 ID */
function getShapeCollections() {
  const state = useEditorStore.getState();
  return {
    arrow: {
      items: state.arrows,
      selectedIds: state.selectedArrowIds,
    },
    rect: {
      items: state.rects,
      selectedIds: state.selectedRectIds,
    },
    text: {
      items: state.texts,
      selectedIds: state.selectedTextIds,
    },
    mosaic: {
      items: state.mosaics,
      selectedIds: state.selectedMosaicIds,
    },
  };
}

export function useBackendSync(
  backend: IRendererBackend | null
): void {
  const backendRef = useRef(backend);

  // 在 useEffect 中同步 ref（避免 render 阶段读写 ref）
  useEffect(() => {
    backendRef.current = backend;
  }, [backend]);

  // 注册 Backend → Store 回调
  useEffect(() => {
    if (!backend) return;

    backend.setCallbacks({
      onShapeChange: (
        type,
        id,
        updates
      ) => {
        // Phase 1 实现：
        // 根据 type 调用 Store 的 updateXxx
        void type;
        void id;
        void updates;
      },
      onSelectionChange: (ids) => {
        const store =
          useEditorStore.getState();
        store.setSelectedArrowIds(ids.arrow);
        store.setSelectedRectIds(ids.rect);
        store.setSelectedTextIds(ids.text);
        store.setSelectedMosaicIds(
          ids.mosaic
        );
      },
      onViewportChange: (state) => {
        const store =
          useEditorStore.getState();
        store.setScale(state.scale);
        store.setOffset(state.offset);
      },
      onShapeCreated: (
        type,
        data
      ) => {
        // Phase 1 实现：
        // 根据 type 和 data 创建 Store 图形
        void type;
        void data;
      },
    });

    return () => {
      backend.setCallbacks({
        onShapeChange: () => {},
        onSelectionChange: () => {},
        onViewportChange: () => {},
        onShapeCreated: () => {},
      });
    };
  }, [backend]);

  // 同步 Store 图形数据 → Backend
  const shapeCount = useEditorStore(
    (s) =>
      s.arrows.length +
      s.rects.length +
      s.texts.length +
      s.mosaics.length
  );

  useEffect(() => {
    if (!backendRef.current) return;
    const b = backendRef.current;
    const collections = getShapeCollections();

    for (const type of SHAPE_TYPES) {
      const { items } = collections[type];
      for (const item of items) {
        b.addShape(type, item.id, item);
      }
    }
  }, [shapeCount]);

  // 同步选中状态 → Backend
  const selectionKey = useEditorStore(
    (s) =>
      [
        s.selectedArrowIds,
        s.selectedRectIds,
        s.selectedTextIds,
        s.selectedMosaicIds,
      ].join(',')
  );

  useEffect(() => {
    if (!backendRef.current) return;
    const collections = getShapeCollections();
    const ids = {} as Record<
      ShapeType,
      string[]
    >;
    for (const type of SHAPE_TYPES) {
      ids[type] = collections[type].selectedIds;
    }
    backendRef.current.setSelection(ids);
  }, [selectionKey]);

  // 同步视口状态 → Backend
  const viewportKey = useEditorStore(
    (s) =>
      `${s.scale},${s.offset.x},${s.offset.y}`
  );

  useEffect(() => {
    if (!backendRef.current) return;
    const { scale, offset } =
      useEditorStore.getState();
    backendRef.current.setViewport({
      scale,
      offset,
    });
  }, [viewportKey]);

  // 同步工具状态 → Backend (via toolBridge)
  const activeTool = useEditorStore(
    (s) => s.activeTool
  );

  useEffect(() => {
    if (!backendRef.current) return;
    // toolBridge 暂通过 Backend 内部访问
    void activeTool;
  }, [activeTool]);
}
