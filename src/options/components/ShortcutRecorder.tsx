import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ShortcutDisplay } from './ShortcutDisplay';
import { Eraser, RotateCcw } from 'lucide-react';

interface ShortcutRecorderProps {
  value: string;
  onChange: (shortcut: string) => void;
  onClear?: () => void;
  onReset?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * 快捷键录制组件
 * 允许用户通过按键录制新的快捷键组合
 */
export const ShortcutRecorder: React.FC<ShortcutRecorderProps> = ({
  value,
  onChange,
  onClear,
  onReset,
  placeholder = '点击录制',
  disabled = false,
  className = '',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);

  // 解析快捷键字符串为数组
  const parseShortcut = useCallback((shortcut: string): string[] => {
    if (!shortcut) return [];
    return shortcut.split('+');
  }, []);

  // 将按键事件转换为快捷键字符串
  const formatShortcut = useCallback((event: KeyboardEvent): string => {
    const parts: string[] = [];

    // 修饰键顺序: Ctrl/Cmd, Alt, Shift
    if (event.ctrlKey || event.metaKey) {
      parts.push('Ctrl');
    }
    if (event.altKey) {
      parts.push('Alt');
    }
    if (event.shiftKey) {
      parts.push('Shift');
    }

    // 主键
    const key = event.key.toUpperCase();
    // 过滤修饰键本身
    if (!['CONTROL', 'ALT', 'SHIFT', 'META'].includes(key)) {
      parts.push(key);
    }

    return parts.join('+');
  }, []);

  // 验证快捷键是否有效
  const isValidShortcut = useCallback((shortcut: string): boolean => {
    const parts = shortcut.split('+');
    // 必须至少有一个修饰键 + 一个普通键
    const hasModifier = parts.some((p) =>
      ['Ctrl', 'Alt', 'Shift'].includes(p)
    );
    const hasMainKey = parts.some(
      (p) => !['Ctrl', 'Alt', 'Shift'].includes(p)
    );
    return hasModifier && hasMainKey;
  }, []);

  // 处理键盘事件
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isRecording || disabled) return;

      event.preventDefault();
      event.stopPropagation();

      // Escape 取消录制
      if (event.key === 'Escape') {
        setIsRecording(false);
        return;
      }

      const shortcut = formatShortcut(event);

      // 只有有效的快捷键才更新
      if (isValidShortcut(shortcut)) {
        onChange(shortcut);
        setIsRecording(false);
      }
    },
    [isRecording, disabled, formatShortcut, isValidShortcut, onChange]
  );

  // 开始录制
  const startRecording = useCallback(() => {
    if (disabled) return;
    setIsRecording(true);
    inputRef.current?.focus();
  }, [disabled]);

  // 取消录制
  const cancelRecording = useCallback(() => {
    setIsRecording(false);
  }, []);

  // 监听键盘事件
  useEffect(() => {
    if (isRecording) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isRecording, handleKeyDown]);

  // 失焦时取消录制
  const handleBlur = useCallback(() => {
    if (isRecording) {
      cancelRecording();
    }
  }, [isRecording, cancelRecording]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        ref={inputRef}
        tabIndex={disabled ? -1 : 0}
        onClick={startRecording}
        onBlur={handleBlur}
        className={`
          flex items-center gap-1 px-2 py-1 min-w-[80px] h-[28px]
          rounded-md cursor-pointer transition-all
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${
            isRecording
              ? 'ring-2 ring-[#FF6B35] bg-[#FFF5F0]'
              : 'hover:bg-[#F0F0F0]'
          }
        `}
        style={{
          border: isRecording ? '1px solid #FF6B35' : '1px solid #E5E5E5',
        }}
      >
        {isRecording ? (
          <span className="text-[11px] text-[#FF6B35] font-body animate-pulse">
            按下快捷键...
          </span>
        ) : value ? (
          <ShortcutDisplay keys={parseShortcut(value)} />
        ) : (
          <span className="text-[11px] text-[#999999] font-body">
            {placeholder}
          </span>
        )}
      </div>

      {/* 清除按钮 */}
      {onClear && value && !disabled && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="p-1 text-[#999999] hover:text-[#666666] transition-colors"
          title="清除快捷键"
        >
          <Eraser className="w-3.5 h-3.5" />
        </button>
      )}

      {/* 重置按钮 */}
      {onReset && !disabled && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReset();
          }}
          className="p-1 text-[#999999] hover:text-[#666666] transition-colors"
          title="恢复默认"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
