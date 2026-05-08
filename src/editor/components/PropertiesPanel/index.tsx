import React from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Loader2, ClipboardCopy, Check, ChevronUp, ChevronDown } from 'lucide-react';
import type {
  ArrowShape,
  RectShape,
  TextShape,
  MosaicShape,
  ImageFrameSettings,
  ArrowStyle,
  RectBorderStyle,
  ShapeType,
} from '../../types';
import { ColorPicker } from '../ColorPicker';
import { SliderControl } from '../SliderControl';
import { ArrowStyleToggle } from '../ArrowStyleToggle';
import { RectBorderStyleToggle } from '../RectBorderStyleToggle';
import { FontWeightToggle } from '../FontWeightToggle';
import { FontStyleToggle } from '../FontStyleToggle';
import { FrameSettings } from '../FrameSettings';

interface PropertiesPanelProps {
  selectedArrow: ArrowShape | null;
  onUpdateArrow: (updates: Partial<ArrowShape>) => void;
  selectedRect: RectShape | null;
  onUpdateRect: (updates: Partial<RectShape>) => void;
  selectedText: TextShape | null;
  onUpdateText: (updates: Partial<TextShape>) => void;
  selectedMosaic: MosaicShape | null;
  onUpdateMosaic: (updates: Partial<MosaicShape>) => void;
  onMoveLayerUp?: (type: ShapeType, id: string) => void;
  onMoveLayerDown?: (type: ShapeType, id: string) => void;
  frameSettings: ImageFrameSettings;
  onUpdateFrameSettings: (updates: Partial<ImageFrameSettings>) => void;
  collapsedSections?: Record<string, boolean>;
  onCollapsedChange?: (sections: Record<string, boolean>) => void;
  onExportImage: () => void;
  onCopyToClipboard: () => void;
  isExporting: boolean;
  copied: boolean;
  exportError: string | null;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedArrow,
  onUpdateArrow,
  selectedRect,
  onUpdateRect,
  selectedText,
  onUpdateText,
  selectedMosaic,
  onUpdateMosaic,
  onMoveLayerUp,
  onMoveLayerDown,
  frameSettings,
  onUpdateFrameSettings,
  collapsedSections,
  onCollapsedChange,
  onExportImage,
  onCopyToClipboard,
  isExporting,
  copied,
  exportError,
}) => {
  const { t } = useTranslation('editor');

  // 选中类型：arrow, rect, text, mosaic 或 none
  const selectionType: 'arrow' | 'rect' | 'text' | 'mosaic' | 'none' = selectedArrow
    ? 'arrow'
    : selectedRect
      ? 'rect'
      : selectedText
        ? 'text'
        : selectedMosaic
          ? 'mosaic'
          : 'none';

  // 箭头属性处理
  const handleArrowColorChange = (color: string) => {
    if (selectedArrow) onUpdateArrow({ color });
  };
  const handleArrowStrokeWidthChange = (strokeWidth: number) => {
    if (selectedArrow) onUpdateArrow({ strokeWidth });
  };
  const handleHeadSizeChange = (headSize: number) => {
    if (selectedArrow) onUpdateArrow({ headSize });
  };
  const handleStyleChange = (style: ArrowStyle) => {
    if (selectedArrow) onUpdateArrow({ style });
  };

  // 矩形属性处理
  const handleRectColorChange = (color: string) => {
    if (selectedRect) onUpdateRect({ color });
  };
  const handleRectStrokeWidthChange = (strokeWidth: number) => {
    if (selectedRect) onUpdateRect({ strokeWidth });
  };
  const handleFillOpacityChange = (fillOpacity: number) => {
    if (selectedRect) onUpdateRect({ fillOpacity });
  };
  const handleBorderStyleChange = (borderStyle: RectBorderStyle) => {
    if (selectedRect) onUpdateRect({ borderStyle });
  };

  // 文字属性处理
  const handleTextColorChange = (color: string) => {
    if (selectedText) onUpdateText({ color });
  };
  const handleFontSizeChange = (fontSize: number) => {
    if (selectedText) onUpdateText({ fontSize });
  };
  const handleFontWeightChange = (fontWeight: 'normal' | 'bold') => {
    if (selectedText) onUpdateText({ fontWeight });
  };
  const handleFontStyleChange = (fontStyle: 'normal' | 'italic') => {
    if (selectedText) onUpdateText({ fontStyle });
  };

  // 马赛克属性处理
  const handleBlockSizeChange = (blockSize: number) => {
    if (selectedMosaic) onUpdateMosaic({ blockSize });
  };
  const handleMosaicOpacityChange = (opacity: number) => {
    if (selectedMosaic) onUpdateMosaic({ opacity });
  };

  return (
    <aside className="properties-panel w-[400px] h-full flex flex-col shrink-0">
      {/* 可滚动内容区域 */}
      <div className="flex-1 flex flex-col gap-4 p-5 overflow-y-auto overflow-x-hidden">
        {/* [style] 区域 */}
        {selectionType === 'arrow' && selectedArrow ? (
          <div className="flex flex-col gap-[10px]">
            <span
              className="text-[11px] font-body font-semibold"
              style={{ color: 'var(--color-accent-orange)' }}
            >
              {t('label.arrowStyle')}
            </span>
            <ColorPicker
              color={selectedArrow.color}
              onChange={handleArrowColorChange}
            />
            <SliderControl
              label={t('label.strokeWidth')}
              value={selectedArrow.strokeWidth}
              min={1}
              max={10}
              onChange={handleArrowStrokeWidthChange}
            />
            <SliderControl
              label={t('label.arrowSize')}
              value={selectedArrow.headSize}
              min={5}
              max={30}
              onChange={handleHeadSizeChange}
            />
            <ArrowStyleToggle
              style={selectedArrow.style}
              onChange={handleStyleChange}
            />
          </div>
        ) : selectionType === 'rect' && selectedRect ? (
          <div className="flex flex-col gap-[10px]">
            <span
              className="text-[11px] font-body font-semibold"
              style={{ color: 'var(--color-accent-orange)' }}
            >
              {t('label.rectStyle')}
            </span>
            <ColorPicker
              color={selectedRect.color}
              onChange={handleRectColorChange}
            />
            <SliderControl
              label={t('label.strokeWidth')}
              value={selectedRect.strokeWidth}
              min={1}
              max={10}
              onChange={handleRectStrokeWidthChange}
            />
            <SliderControl
              label={t('label.fill')}
              value={selectedRect.fillOpacity}
              min={0}
              max={100}
              unit="%"
              onChange={handleFillOpacityChange}
            />
            <RectBorderStyleToggle
              borderStyle={selectedRect.borderStyle}
              onChange={handleBorderStyleChange}
            />
          </div>
        ) : selectionType === 'text' && selectedText ? (
          <div className="flex flex-col gap-[10px]">
            <span
              className="text-[11px] font-body font-semibold"
              style={{ color: 'var(--color-accent-orange)' }}
            >
              {t('label.textStyle')}
            </span>
            <ColorPicker
              color={selectedText.color}
              onChange={handleTextColorChange}
            />
            <SliderControl
              label={t('label.fontSize')}
              value={selectedText.fontSize}
              min={8}
              max={120}
              onChange={handleFontSizeChange}
            />
            <FontWeightToggle
              fontWeight={selectedText.fontWeight}
              onChange={handleFontWeightChange}
            />
            <FontStyleToggle
              fontStyle={selectedText.fontStyle}
              onChange={handleFontStyleChange}
            />
          </div>
        ) : selectionType === 'mosaic' && selectedMosaic ? (
          <div className="flex flex-col gap-[10px]">
            <span
              className="text-[11px] font-body font-semibold"
              style={{ color: 'var(--color-accent-orange)' }}
            >
              {t('label.mosaicStyle')}
            </span>
            <SliderControl
              label={t('label.blockSize')}
              value={selectedMosaic.blockSize}
              min={5}
              max={50}
              onChange={handleBlockSizeChange}
            />
            <SliderControl
              label={t('label.opacity')}
              value={selectedMosaic.opacity}
              min={0}
              max={100}
              unit="%"
              onChange={handleMosaicOpacityChange}
            />
          </div>
        ) : null}

        {/* 图层操作 - 选中图形时显示 */}
        {selectionType !== 'none' && (
          <div className="flex flex-col gap-[10px]">
            <span
              className="text-[11px] font-body font-semibold"
              style={{ color: 'var(--color-accent-orange)' }}
            >
              {t('label.layer')}
            </span>
            <div className="flex gap-2">
              <button
                className="flex-1 flex items-center justify-center gap-1.5 h-[32px] rounded-lg text-[11px] font-body cursor-pointer"
                style={{
                  color: 'var(--color-editor-hint)',
                  background: 'var(--color-editor-hover)',
                }}
                onClick={() => {
                  const id = selectionType === 'arrow' ? selectedArrow?.id
                    : selectionType === 'rect' ? selectedRect?.id
                    : selectionType === 'text' ? selectedText?.id
                    : selectedMosaic?.id;
                  if (id && onMoveLayerUp) onMoveLayerUp(selectionType, id);
                }}
              >
                <ChevronUp size={14} />
                {t('action.moveUp')}
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-1.5 h-[32px] rounded-lg text-[11px] font-body cursor-pointer"
                style={{
                  color: 'var(--color-editor-hint)',
                  background: 'var(--color-editor-hover)',
                }}
                onClick={() => {
                  const id = selectionType === 'arrow' ? selectedArrow?.id
                    : selectionType === 'rect' ? selectedRect?.id
                    : selectionType === 'text' ? selectedText?.id
                    : selectedMosaic?.id;
                  if (id && onMoveLayerDown) onMoveLayerDown(selectionType, id);
                }}
              >
                <ChevronDown size={14} />
                {t('action.moveDown')}
              </button>
            </div>
          </div>
        )}

        {/* [frame] 区域 - 未选中标注时显示 */}
        {selectionType === 'none' && (
          <FrameSettings
            settings={frameSettings}
            onUpdate={onUpdateFrameSettings}
            collapsedSections={collapsedSections}
            onCollapsedChange={onCollapsedChange}
          />
        )}
      </div>

      {/* 固定底部操作按钮区域 */}
      <div className="shrink-0 p-5 pt-0">
        <div className="flex flex-col gap-2">
          <button
            className="export-btn w-full h-[40px] rounded-[12px] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onExportImage}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2
                size={16}
                className="animate-spin"
                style={{ color: '#FFFFFF' }}
              />
            ) : (
              <Download size={16} style={{ color: '#FFFFFF' }} />
            )}
            <span
              className="text-[12px] font-body font-semibold leading-none"
              style={{ color: '#FFFFFF' }}
            >
              {isExporting ? t('action.exporting') : t('action.export')}
            </span>
          </button>
          <button
            className="copy-btn w-full h-[40px] rounded-[12px] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onCopyToClipboard}
            disabled={isExporting}
          >
            {copied ? (
              <Check
                size={16}
                style={{ color: 'var(--color-field-focus)' }}
              />
            ) : (
              <ClipboardCopy
                size={16}
                className="text-[var(--color-editor-hint)]"
              />
            )}
            <span
              className="text-[12px] font-body font-semibold leading-none"
              style={{
                color: copied
                  ? 'var(--color-field-focus)'
                  : 'var(--color-editor-hint)',
              }}
            >
              {copied ? t('hint.copied') : t('action.copyToClipboard')}
            </span>
          </button>
          {/* 错误提示 */}
          {exportError && (
            <div className="text-[11px] text-red-500 text-center mt-1">
              {exportError}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default PropertiesPanel;
