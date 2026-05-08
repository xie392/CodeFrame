import React from 'react';
import { useTranslation } from 'react-i18next';
import { Undo2, Redo2 } from 'lucide-react';
import {
  MousePointer2,
  MoveRight,
  Square,
  Type,
  Scan,
  Crop,
} from 'lucide-react';
import type { ToolId } from '../../types';

// 绘制工具配置（互斥活跃工具）
interface ToolConfig {
  id: ToolId;
  icon: React.ReactNode;
}

const DRAWING_TOOLS: ToolConfig[] = [
  { id: 'select', icon: <MousePointer2 size={18} /> },
  { id: 'arrow', icon: <MoveRight size={18} /> },
  { id: 'rect', icon: <Square size={18} /> },
  { id: 'text', icon: <Type size={18} /> },
  { id: 'mosaic', icon: <Scan size={18} /> },
];

interface ToolbarProps {
  activeTool: ToolId;
  onSelectTool: (tool: ToolId) => void;
  isCropMode: boolean;
  onEnterCropMode: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onSelectTool,
  isCropMode,
  onEnterCropMode,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) => {
  const { t } = useTranslation('editor');

  return (
    <aside className="toolbar w-14 h-full flex flex-col items-center py-3 gap-1 shrink-0">
      {DRAWING_TOOLS.map((tool) => {
        const isActive = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => onSelectTool(tool.id)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-colors duration-200 ${
              isActive
                ? 'tool-btn-active'
                : 'tool-btn'
            }`}
          >
            {tool.icon}
          </button>
        );
      })}

      {/* 分隔线 */}
      <div className="w-[24px] h-[1px] my-1 bg-[var(--color-editor-separator)]" />

      {/* 裁剪按钮（模式入口，非工具切换） */}
      <button
        onClick={onEnterCropMode}
        className={`w-[40px] h-[40px] rounded-[12px] flex items-center justify-center cursor-pointer transition-colors duration-200 ${
          isCropMode
            ? 'tool-btn-active'
            : 'tool-btn'
        }`}
        title={t('tool.crop')}
      >
        <Crop size={18} />
      </button>

      {/* 分隔线 */}
      <div className="w-[24px] h-[1px] my-1 bg-[var(--color-editor-separator)]" />

      {/* 撤销 / 重做 */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`w-[40px] h-[40px] rounded-[12px] flex items-center justify-center transition-colors duration-200 ${
          canUndo
            ? 'tool-btn cursor-pointer'
            : 'tool-btn cursor-not-allowed opacity-40'
        }`}
        title={t('action.undo')}
      >
        <Undo2 size={18} />
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className={`w-[40px] h-[40px] rounded-[12px] flex items-center justify-center transition-colors duration-200 ${
          canRedo
            ? 'tool-btn cursor-pointer'
            : 'tool-btn cursor-not-allowed opacity-40'
        }`}
        title={t('action.redo')}
      >
        <Redo2 size={18} />
      </button>
    </aside>
  );
};

export default Toolbar;
