import React from 'react';
import { useTranslation } from 'react-i18next';
import { Undo2, Redo2 } from 'lucide-react';
import {
  MousePointer2,
  Move,
  MoveRight,
  Square,
  Type,
  Scan,
  Crop,
} from 'lucide-react';
import type { ToolId } from '../../types';

// 工具配置（内部定义，因为 icon 是 ReactNode 类型）
interface ToolConfig {
  id: ToolId;
  icon: React.ReactNode;
}

const TOOLS: ToolConfig[] = [
  { id: 'select', icon: <MousePointer2 size={18} /> },
  { id: 'move', icon: <Move size={18} /> },
  { id: 'arrow', icon: <MoveRight size={18} /> },
  { id: 'rect', icon: <Square size={18} /> },
  { id: 'text', icon: <Type size={18} /> },
  { id: 'mosaic', icon: <Scan size={18} /> },
  { id: 'crop', icon: <Crop size={18} /> },
];

interface ToolbarProps {
  activeTool: ToolId;
  onSelectTool: (tool: ToolId) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onSelectTool,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) => {
  const { t } = useTranslation('editor');

  return (
    <aside className="toolbar w-[56px] h-full flex flex-col items-center py-3 gap-1 shrink-0">
      {TOOLS.map((tool) => {
        const isActive = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => onSelectTool(tool.id)}
            className={`w-[40px] h-[40px] rounded-[12px] flex items-center justify-center cursor-pointer transition-colors duration-200 ${
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
