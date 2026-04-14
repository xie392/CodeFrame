/**
 * TextEditorInput - 文字编辑输入组件
 *
 * 负责渲染文字编辑时的输入框，包括：
 * - 样式同步
 * - 键盘事件处理
 * - 失焦保存
 */

import React, { useEffect } from 'react';
import type { TextShape } from '../../types';

export interface TextEditorInputProps {
  text: TextShape;
  value: string;
  scale: number;
  /** 直接传入预计算的位置（屏幕坐标），优先于 scale+offset 计算 */
  position?: { left: number; top: number };
  offset: { x: number; y: number };
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * 文字编辑输入组件
 */
export function TextEditorInput({
  text,
  value,
  scale,
  position,
  offset,
  inputRef,
  onChange,
  onSave,
  onCancel,
}: TextEditorInputProps): React.ReactElement | null {
  const containerX = position?.left ?? text.x * scale + offset.x;
  const containerY = position?.top ?? text.y * scale + offset.y;

  useEffect(() => {
    // 自动聚焦并选中文字
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [inputRef]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoFocus
      onKeyDown={handleKeyDown}
      onBlur={onSave}
      style={{
        position: 'absolute',
        left: containerX,
        top: containerY,
        fontSize: text.fontSize * scale,
        fontWeight: text.fontWeight,
        fontStyle: text.fontStyle,
        color: text.color,
        background: 'transparent',
        border: 'none',
        outline: 'none',
        minWidth: 50,
        fontFamily: 'sans-serif',
        padding: 0,
        margin: 0,
        zIndex: 1000,
      }}
    />
  );
}

export default TextEditorInput;
