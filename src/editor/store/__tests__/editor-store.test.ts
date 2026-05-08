/**
 * Editor Store 单元测试
 * 测试所有 Store actions 的 CRUD 操作、函数式更新和批量操作
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../editor-store';
import type { ArrowShape, RectShape, TextShape, MosaicShape, CropArea } from '../../types';

// 辅助函数：创建测试数据
const createTestArrow = (id: string): ArrowShape => ({
  id,
  startX: 0,
  startY: 0,
  endX: 100,
  endY: 100,
  color: '#FF0000',
  strokeWidth: 2,
  headSize: 12,
  style: 'single',
  zIndex: 0,
});

const createTestRect = (id: string): RectShape => ({
  id,
  x: 10,
  y: 10,
  width: 100,
  height: 50,
  color: '#00FF00',
  strokeWidth: 2,
  fillOpacity: 0,
  borderStyle: 'solid',
  zIndex: 0,
});

const createTestText = (id: string): TextShape => ({
  id,
  x: 20,
  y: 20,
  text: 'Test Text',
  color: '#0000FF',
  fontSize: 16,
  fontWeight: 'normal',
  fontStyle: 'normal',
  zIndex: 0,
});

const createTestMosaic = (id: string): MosaicShape => ({
  id,
  x: 30,
  y: 30,
  width: 80,
  height: 60,
  blockSize: 10,
  opacity: 100,
  zIndex: 0,
});

const createTestCropArea = (): CropArea => ({
  x: 0,
  y: 0,
  width: 200,
  height: 150,
});

describe('Editor Store', () => {
  // 每个测试前重置 Store
  beforeEach(() => {
    useEditorStore.getState().reset();
  });

  // ---------------------------------------------------------------------------
  // 初始状态测试
  // ---------------------------------------------------------------------------

  describe('初始状态', () => {
    it('应该有正确的默认初始状态', () => {
      const state = useEditorStore.getState();

      expect(state.source).toBeNull();
      expect(state.imageData).toBeNull();
      expect(state.error).toBeNull();
      expect(state.activeTool).toBe('select');
      expect(state.scale).toBe(1);
      expect(state.offset).toEqual({ x: 0, y: 0 });
      expect(state.arrows).toEqual([]);
      expect(state.rects).toEqual([]);
      expect(state.texts).toEqual([]);
      expect(state.mosaics).toEqual([]);
      expect(state.selectedArrowIds).toEqual([]);
      expect(state.selectedRectIds).toEqual([]);
      expect(state.selectedTextIds).toEqual([]);
      expect(state.selectedMosaicIds).toEqual([]);
      expect(state.cropArea).toBeNull();
      expect(state.isExporting).toBe(false);
      expect(state.copied).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 图片操作测试
  // ---------------------------------------------------------------------------

  describe('图片操作', () => {
    it('setSource 应该正确设置 source', () => {
      const { setSource } = useEditorStore.getState();
      setSource('capture');
      expect(useEditorStore.getState().source).toBe('capture');
    });

    it('setSource 应该支持函数式更新', () => {
      const { setSource } = useEditorStore.getState();
      setSource('capture');
      setSource((prev) => (prev === 'capture' ? 'upload' : prev));
      expect(useEditorStore.getState().source).toBe('upload');
    });

    it('setImageData 应该正确设置 imageData', () => {
      const { setImageData } = useEditorStore.getState();
      setImageData('data:image/png;base64,test');
      expect(useEditorStore.getState().imageData).toBe('data:image/png;base64,test');
    });

    it('setError 应该正确设置错误信息', () => {
      const { setError } = useEditorStore.getState();
      setError('Something went wrong');
      expect(useEditorStore.getState().error).toBe('Something went wrong');
    });

    it('setImageNaturalSize 应该正确设置图片原始尺寸', () => {
      const { setImageNaturalSize } = useEditorStore.getState();
      setImageNaturalSize({ width: 800, height: 600 });
      expect(useEditorStore.getState().imageNaturalSize).toEqual({ width: 800, height: 600 });
    });

    it('setImageDisplaySize 应该正确设置图片显示尺寸', () => {
      const { setImageDisplaySize } = useEditorStore.getState();
      setImageDisplaySize({ width: 400, height: 300 });
      expect(useEditorStore.getState().imageDisplaySize).toEqual({ width: 400, height: 300 });
    });
  });

  // ---------------------------------------------------------------------------
  // 工具操作测试
  // ---------------------------------------------------------------------------

  describe('工具操作', () => {
    it('setActiveTool 应该正确切换工具', () => {
      const { setActiveTool } = useEditorStore.getState();
      
      setActiveTool('arrow');
      expect(useEditorStore.getState().activeTool).toBe('arrow');
      
      setActiveTool('rect');
      expect(useEditorStore.getState().activeTool).toBe('rect');
      
      setActiveTool('text');
      expect(useEditorStore.getState().activeTool).toBe('text');
    });

    it('setActiveTool 应该支持函数式更新', () => {
      const { setActiveTool } = useEditorStore.getState();
      setActiveTool('select');
      setActiveTool((prev) => prev === 'select' ? 'arrow' : prev);
      expect(useEditorStore.getState().activeTool).toBe('arrow');
    });
  });

  // ---------------------------------------------------------------------------
  // 帧设置操作测试
  // ---------------------------------------------------------------------------

  describe('帧设置操作', () => {
    it('setFrameSettings 应该正确设置帧设置', () => {
      const { setFrameSettings } = useEditorStore.getState();
      const newSettings = {
        ...useEditorStore.getState().frameSettings,
        padding: { top: 60, right: 60, bottom: 60, left: 60, linked: true },
      };
      setFrameSettings(newSettings);
      expect(useEditorStore.getState().frameSettings.padding.top).toBe(60);
    });

    it('updateFrameSettings 应该正确合并部分设置', () => {
      const { updateFrameSettings } = useEditorStore.getState();
      updateFrameSettings({ aspectRatio: '16:9' });
      expect(useEditorStore.getState().frameSettings.aspectRatio).toBe('16:9');
    });
  });

  // ---------------------------------------------------------------------------
  // 视图操作测试
  // ---------------------------------------------------------------------------

  describe('视图操作', () => {
    it('setScale 应该正确设置缩放比例', () => {
      const { setScale } = useEditorStore.getState();
      setScale(2);
      expect(useEditorStore.getState().scale).toBe(2);
    });

    it('setScale 应该支持函数式更新', () => {
      const { setScale } = useEditorStore.getState();
      setScale(1);
      setScale((prev) => prev * 2);
      expect(useEditorStore.getState().scale).toBe(2);
    });

    it('setOffset 应该正确设置偏移量', () => {
      const { setOffset } = useEditorStore.getState();
      setOffset({ x: 100, y: 50 });
      expect(useEditorStore.getState().offset).toEqual({ x: 100, y: 50 });
    });
  });

  // ---------------------------------------------------------------------------
  // 箭头操作测试 (CRUD)
  // ---------------------------------------------------------------------------

  describe('箭头操作', () => {
    it('addArrow 应该添加新箭头', () => {
      const { addArrow } = useEditorStore.getState();
      const arrow = createTestArrow('arrow-1');
      addArrow(arrow);
      
      const state = useEditorStore.getState();
      expect(state.arrows).toHaveLength(1);
      expect(state.arrows[0]).toEqual(arrow);
    });

    it('addArrow 应该追加多个箭头', () => {
      const { addArrow } = useEditorStore.getState();
      addArrow(createTestArrow('arrow-1'));
      addArrow(createTestArrow('arrow-2'));
      addArrow(createTestArrow('arrow-3'));
      
      expect(useEditorStore.getState().arrows).toHaveLength(3);
    });

    it('updateArrow 应该更新指定箭头', () => {
      const { addArrow, updateArrow } = useEditorStore.getState();
      addArrow(createTestArrow('arrow-1'));
      
      updateArrow('arrow-1', { color: '#0000FF', strokeWidth: 4 });
      
      const state = useEditorStore.getState();
      expect(state.arrows[0].color).toBe('#0000FF');
      expect(state.arrows[0].strokeWidth).toBe(4);
    });

    it('updateArrow 不应该影响其他箭头', () => {
      const { addArrow, updateArrow } = useEditorStore.getState();
      addArrow(createTestArrow('arrow-1'));
      addArrow(createTestArrow('arrow-2'));
      
      updateArrow('arrow-1', { color: '#0000FF' });
      
      const state = useEditorStore.getState();
      expect(state.arrows[0].color).toBe('#0000FF');
      expect(state.arrows[1].color).toBe('#FF0000');
    });

    it('deleteArrow 应该删除指定箭头并清除选中', () => {
      const { addArrow, setSelectedArrowIds, deleteArrow } = useEditorStore.getState();
      addArrow(createTestArrow('arrow-1'));
      addArrow(createTestArrow('arrow-2'));
      setSelectedArrowIds(['arrow-1']);
      
      deleteArrow('arrow-1');
      
      const state = useEditorStore.getState();
      expect(state.arrows).toHaveLength(1);
      expect(state.arrows[0].id).toBe('arrow-2');
      expect(state.selectedArrowIds).not.toContain('arrow-1');
    });

    it('deleteArrows 应该批量删除多个箭头', () => {
      const { addArrow, deleteArrows } = useEditorStore.getState();
      addArrow(createTestArrow('arrow-1'));
      addArrow(createTestArrow('arrow-2'));
      addArrow(createTestArrow('arrow-3'));
      
      deleteArrows(['arrow-1', 'arrow-3']);
      
      const state = useEditorStore.getState();
      expect(state.arrows).toHaveLength(1);
      expect(state.arrows[0].id).toBe('arrow-2');
    });

    it('setArrows 应该支持函数式更新', () => {
      const { addArrow, setArrows } = useEditorStore.getState();
      addArrow(createTestArrow('arrow-1'));
      
      setArrows((prev) => [...prev, createTestArrow('arrow-2')]);
      
      expect(useEditorStore.getState().arrows).toHaveLength(2);
    });

    it('setSelectedArrowIds 应该正确设置选中状态', () => {
      const { setSelectedArrowIds } = useEditorStore.getState();
      setSelectedArrowIds(['arrow-1', 'arrow-2']);
      
      expect(useEditorStore.getState().selectedArrowIds).toEqual(['arrow-1', 'arrow-2']);
    });
  });

  // ---------------------------------------------------------------------------
  // 矩形操作测试 (CRUD)
  // ---------------------------------------------------------------------------

  describe('矩形操作', () => {
    it('addRect 应该添加新矩形', () => {
      const { addRect } = useEditorStore.getState();
      addRect(createTestRect('rect-1'));
      
      expect(useEditorStore.getState().rects).toHaveLength(1);
    });

    it('updateRect 应该更新指定矩形', () => {
      const { addRect, updateRect } = useEditorStore.getState();
      addRect(createTestRect('rect-1'));
      
      updateRect('rect-1', { width: 200, height: 100 });
      
      const state = useEditorStore.getState();
      expect(state.rects[0].width).toBe(200);
      expect(state.rects[0].height).toBe(100);
    });

    it('deleteRect 应该删除指定矩形并清除选中', () => {
      const { addRect, setSelectedRectIds, deleteRect } = useEditorStore.getState();
      addRect(createTestRect('rect-1'));
      setSelectedRectIds(['rect-1']);
      
      deleteRect('rect-1');
      
      const state = useEditorStore.getState();
      expect(state.rects).toHaveLength(0);
      expect(state.selectedRectIds).toHaveLength(0);
    });

    it('deleteRects 应该批量删除多个矩形', () => {
      const { addRect, deleteRects } = useEditorStore.getState();
      addRect(createTestRect('rect-1'));
      addRect(createTestRect('rect-2'));
      addRect(createTestRect('rect-3'));
      
      deleteRects(['rect-1', 'rect-2']);
      
      expect(useEditorStore.getState().rects).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // 文字操作测试 (CRUD)
  // ---------------------------------------------------------------------------

  describe('文字操作', () => {
    it('addText 应该添加新文字', () => {
      const { addText } = useEditorStore.getState();
      addText(createTestText('text-1'));
      
      expect(useEditorStore.getState().texts).toHaveLength(1);
    });

    it('updateText 应该更新指定文字', () => {
      const { addText, updateText } = useEditorStore.getState();
      addText(createTestText('text-1'));
      
      updateText('text-1', { text: 'Updated Text', fontSize: 24 });
      
      const state = useEditorStore.getState();
      expect(state.texts[0].text).toBe('Updated Text');
      expect(state.texts[0].fontSize).toBe(24);
    });

    it('deleteText 应该删除指定文字并清除选中', () => {
      const { addText, setSelectedTextIds, deleteText } = useEditorStore.getState();
      addText(createTestText('text-1'));
      setSelectedTextIds(['text-1']);
      
      deleteText('text-1');
      
      const state = useEditorStore.getState();
      expect(state.texts).toHaveLength(0);
      expect(state.selectedTextIds).toHaveLength(0);
    });

    it('deleteTexts 应该批量删除多个文字', () => {
      const { addText, deleteTexts } = useEditorStore.getState();
      addText(createTestText('text-1'));
      addText(createTestText('text-2'));
      
      deleteTexts(['text-1']);
      
      expect(useEditorStore.getState().texts).toHaveLength(1);
    });

    it('setEditingTextId 应该设置正在编辑的文字 ID', () => {
      const { setEditingTextId } = useEditorStore.getState();
      setEditingTextId('text-1');
      
      expect(useEditorStore.getState().editingTextId).toBe('text-1');
    });

    it('setEditingTextValue 应该设置正在编辑的文字值', () => {
      const { setEditingTextValue } = useEditorStore.getState();
      setEditingTextValue('New Text Value');
      
      expect(useEditorStore.getState().editingTextValue).toBe('New Text Value');
    });
  });

  // ---------------------------------------------------------------------------
  // 马赛克操作测试 (CRUD)
  // ---------------------------------------------------------------------------

  describe('马赛克操作', () => {
    it('addMosaic 应该添加新马赛克', () => {
      const { addMosaic } = useEditorStore.getState();
      addMosaic(createTestMosaic('mosaic-1'));
      
      expect(useEditorStore.getState().mosaics).toHaveLength(1);
    });

    it('updateMosaic 应该更新指定马赛克', () => {
      const { addMosaic, updateMosaic } = useEditorStore.getState();
      addMosaic(createTestMosaic('mosaic-1'));
      
      updateMosaic('mosaic-1', { blockSize: 20, opacity: 50 });
      
      const state = useEditorStore.getState();
      expect(state.mosaics[0].blockSize).toBe(20);
      expect(state.mosaics[0].opacity).toBe(50);
    });

    it('deleteMosaic 应该删除指定马赛克并清除选中', () => {
      const { addMosaic, setSelectedMosaicIds, deleteMosaic } = useEditorStore.getState();
      addMosaic(createTestMosaic('mosaic-1'));
      setSelectedMosaicIds(['mosaic-1']);
      
      deleteMosaic('mosaic-1');
      
      const state = useEditorStore.getState();
      expect(state.mosaics).toHaveLength(0);
      expect(state.selectedMosaicIds).toHaveLength(0);
    });

    it('deleteMosaics 应该批量删除多个马赛克', () => {
      const { addMosaic, deleteMosaics } = useEditorStore.getState();
      addMosaic(createTestMosaic('mosaic-1'));
      addMosaic(createTestMosaic('mosaic-2'));
      
      deleteMosaics(['mosaic-1']);
      
      expect(useEditorStore.getState().mosaics).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // 裁剪操作测试
  // ---------------------------------------------------------------------------

  describe('裁剪操作', () => {
    it('setCropArea 应该设置裁剪区域', () => {
      const { setCropArea } = useEditorStore.getState();
      const crop = createTestCropArea();
      setCropArea(crop);
      
      expect(useEditorStore.getState().cropArea).toEqual(crop);
    });

    it('setCropArea 应该支持清空裁剪区域', () => {
      const { setCropArea } = useEditorStore.getState();
      setCropArea(createTestCropArea());
      setCropArea(null);
      
      expect(useEditorStore.getState().cropArea).toBeNull();
    });

    it('setCropArea 应该支持函数式更新', () => {
      const { setCropArea } = useEditorStore.getState();
      setCropArea(createTestCropArea());
      setCropArea((prev) => prev ? { ...prev, width: 300 } : null);
      
      expect(useEditorStore.getState().cropArea?.width).toBe(300);
    });
  });

  // ---------------------------------------------------------------------------
  // 导出操作测试
  // ---------------------------------------------------------------------------

  describe('导出操作', () => {
    it('setIsExporting 应该设置导出状态', () => {
      const { setIsExporting } = useEditorStore.getState();
      setIsExporting(true);
      expect(useEditorStore.getState().isExporting).toBe(true);
    });

    it('setCopied 应该设置复制状态', () => {
      const { setCopied } = useEditorStore.getState();
      setCopied(true);
      expect(useEditorStore.getState().copied).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 历史记录操作测试
  // ---------------------------------------------------------------------------

  describe('历史记录操作', () => {
    it('setCanUndo 应该设置撤销状态', () => {
      const { setCanUndo } = useEditorStore.getState();
      setCanUndo(true);
      expect(useEditorStore.getState().canUndo).toBe(true);
    });

    it('setCanRedo 应该设置重做状态', () => {
      const { setCanRedo } = useEditorStore.getState();
      setCanRedo(true);
      expect(useEditorStore.getState().canRedo).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 批量操作测试
  // ---------------------------------------------------------------------------

  describe('批量操作', () => {
    beforeEach(() => {
      const store = useEditorStore.getState();
      store.addArrow(createTestArrow('arrow-1'));
      store.addArrow(createTestArrow('arrow-2'));
      store.addRect(createTestRect('rect-1'));
      store.addText(createTestText('text-1'));
      store.addMosaic(createTestMosaic('mosaic-1'));
    });

    it('clearSelection 应该清除所有选中状态', () => {
      const store = useEditorStore.getState();
      store.setSelectedArrowIds(['arrow-1']);
      store.setSelectedRectIds(['rect-1']);
      store.setSelectedTextIds(['text-1']);
      store.setSelectedMosaicIds(['mosaic-1']);
      
      store.clearSelection();
      
      const state = useEditorStore.getState();
      expect(state.selectedArrowIds).toHaveLength(0);
      expect(state.selectedRectIds).toHaveLength(0);
      expect(state.selectedTextIds).toHaveLength(0);
      expect(state.selectedMosaicIds).toHaveLength(0);
    });

    it('selectAll 应该选中所有图形', () => {
      const { selectAll } = useEditorStore.getState();
      selectAll();
      
      const state = useEditorStore.getState();
      expect(state.selectedArrowIds).toEqual(['arrow-1', 'arrow-2']);
      expect(state.selectedRectIds).toEqual(['rect-1']);
      expect(state.selectedTextIds).toEqual(['text-1']);
      expect(state.selectedMosaicIds).toEqual(['mosaic-1']);
    });

    it('deleteSelected 应该删除所有选中的图形', () => {
      const store = useEditorStore.getState();
      store.setSelectedArrowIds(['arrow-1']);
      store.setSelectedRectIds(['rect-1']);
      store.setSelectedTextIds(['text-1']);
      store.setSelectedMosaicIds(['mosaic-1']);
      
      store.deleteSelected();
      
      const state = useEditorStore.getState();
      expect(state.arrows).toHaveLength(1);
      expect(state.arrows[0].id).toBe('arrow-2');
      expect(state.rects).toHaveLength(0);
      expect(state.texts).toHaveLength(0);
      expect(state.mosaics).toHaveLength(0);
      // 选中状态应该被清空
      expect(state.selectedArrowIds).toHaveLength(0);
      expect(state.selectedRectIds).toHaveLength(0);
      expect(state.selectedTextIds).toHaveLength(0);
      expect(state.selectedMosaicIds).toHaveLength(0);
    });

    it('deleteSelected 不应该删除未选中的图形', () => {
      const { setSelectedArrowIds, deleteSelected } = useEditorStore.getState();
      setSelectedArrowIds(['arrow-1']);
      deleteSelected();
      
      const state = useEditorStore.getState();
      expect(state.arrows).toHaveLength(1);
      expect(state.arrows[0].id).toBe('arrow-2');
    });
  });

  // ---------------------------------------------------------------------------
  // 状态管理测试
  // ---------------------------------------------------------------------------

  describe('状态管理', () => {
    it('getEditorState 应该返回当前完整状态', () => {
      const { addArrow, getEditorState } = useEditorStore.getState();
      addArrow(createTestArrow('arrow-1'));
      
      const state = getEditorState();
      expect(state.arrows).toHaveLength(1);
    });

    it('setEditorState 应该设置部分状态', () => {
      const { setEditorState } = useEditorStore.getState();
      setEditorState({ scale: 2, offset: { x: 50, y: 25 } });
      
      const state = useEditorStore.getState();
      expect(state.scale).toBe(2);
      expect(state.offset).toEqual({ x: 50, y: 25 });
    });

    it('reset 应该重置到初始状态', () => {
      const store = useEditorStore.getState();
      store.addArrow(createTestArrow('arrow-1'));
      store.setActiveTool('text');
      store.setScale(2);
      store.setError('Some error');
      
      store.reset();
      
      const state = useEditorStore.getState();
      expect(state.arrows).toHaveLength(0);
      expect(state.activeTool).toBe('select');
      expect(state.scale).toBe(1);
      expect(state.error).toBeNull();
    });
  });
});
