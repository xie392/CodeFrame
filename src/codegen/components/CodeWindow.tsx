/**
 * CodeWindow 组件
 * 代码窗口（包含标题栏、编辑器、水印、调整大小手柄）
 */

import React, { useRef, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView } from '@codemirror/view';
import { useCodegenStore, useCurrentFont } from '../stores/codegen-store';
import { sanitizeFileName } from '../utils/layout';
import type { Padding } from '../utils/layout';
import { THEMES } from '../config/themes';
import { BACKGROUNDS } from '../config/backgrounds';

interface CodeWindowProps {
  winSize: { width: number; height: number };
  isEditing: boolean;
  padding: Padding;
  onEnterEdit: () => void;
  onExitEdit: () => void;
  bindResize: () => Record<string, unknown>;
  exportRef?: React.RefObject<HTMLDivElement>;
  codeWindowRef?: React.RefObject<HTMLDivElement>;
}

export const CodeWindow: React.FC<CodeWindowProps> = ({
  winSize,
  isEditing,
  padding,
  onEnterEdit,
  onExitEdit,
  bindResize,
  exportRef,
  codeWindowRef,
}) => {
  const internalRef = useRef<HTMLDivElement>(null);
  const windowRef = codeWindowRef || internalRef;

  const {
    theme,
    window: windowState,
    editor,
    watermark: watermarkState,
    setEditor,
    setWindow,
  } = useCodegenStore();

  const selectedFontConfig = useCurrentFont();
  const currentTheme = THEMES.find((t) => t.id === theme.selectedTheme) ?? THEMES[0];
  const selectedBgConfig = BACKGROUNDS.find((b) => b.id === theme.selectedBg);

  // 背景样式
  const backgroundCss = useMemo(() => {
    if (theme.selectedBg === 'custom') {
      return theme.customBgColor;
    }
    return selectedBgConfig?.css ?? '#6366F1';
  }, [theme.selectedBg, theme.customBgColor, selectedBgConfig]);

  // 窗口阴影
  const windowShadow = useMemo(() => {
    if (!windowState.shadowEnabled) return 'none';
    const alpha = windowState.shadowIntensity / 100;
    return `0 8px ${20 + windowState.shadowIntensity * 0.3}px rgba(0,0,0,${0.15 * alpha})`;
  }, [windowState.shadowEnabled, windowState.shadowIntensity]);

  // 编辑器样式覆盖
  const editorStyleOverrides = useMemo(
    () =>
      EditorView.theme({
        '&': {
          fontSize: `${editor.fontSize}px`,
          fontFamily: selectedFontConfig.family,
        },
        '.cm-content': {
          padding: '20px 20px 20px 8px',
          lineHeight: `${editor.fontSize + 7}px`,
          fontFamily: selectedFontConfig.family,
        },
        '.cm-lineNumbers': {
          width: '32px',
          minWidth: '32px',
        },
        '.cm-lineNumbers .cm-gutterElement': {
          padding: '0 4px 0 0',
          textAlign: 'right',
          opacity: '0.4',
          fontFamily: selectedFontConfig.family,
        },
        '.cm-focused': {
          outline: 'none',
        },
        '.cm-editor [contenteditable=false] .cm-content': {
          caretColor: 'transparent',
        },
      }),
    [editor.fontSize, selectedFontConfig.family],
  );

  const cmExtensions = useMemo(
    () => [
      javascript(),
      editorStyleOverrides,
      EditorView.contentAttributes.of({ tabindex: '0' }),
    ],
    [editorStyleOverrides],
  );

  // 处理文件名变更
  const handleFileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeFileName(e.target.value);
    setWindow({ fileName: sanitized });
  };

  return (
    <div
      ref={exportRef}
      className="absolute overflow-hidden"
      style={{
        left: `calc(50% - ${winSize.width / 2}px - ${padding.left}px)`,
        top: `calc(50% - ${winSize.height / 2}px - ${padding.top}px)`,
        width: winSize.width + padding.left + padding.right,
        height: winSize.height + padding.top + padding.bottom,
      }}
    >
      {/* 背景 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: backgroundCss,
          borderRadius: `${windowState.borderRadius.outer}px`,
        }}
      />

      {/* 代码窗口 */}
      <div
        ref={windowRef}
        data-code-window
        className="flex flex-col overflow-hidden absolute"
        style={{
          left: padding.left,
          top: padding.top,
          width: winSize.width,
          height: winSize.height,
          backgroundColor: currentTheme.windowBg,
          borderRadius: `${windowState.borderRadius.inner}px`,
          boxShadow: windowShadow,
          userSelect: isEditing ? 'auto' : 'none',
        }}
      >
        {/* 标题栏 */}
        {windowState.showHeader && (
          <div
            className="w-full h-10 flex items-center gap-2 px-4 shrink-0"
            style={{
              backgroundColor: currentTheme.headerBg,
              borderRadius: `${windowState.borderRadius.inner}px ${windowState.borderRadius.inner}px 0 0`,
            }}
          >
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: '#FF5F56' }}
            />
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: '#FFBD2E' }}
            />
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: '#27C93F' }}
            />
            <input
              type="text"
              value={windowState.fileName}
              onChange={handleFileNameChange}
              className="text-[12px] ml-2 bg-transparent border-none outline-none flex-1 min-w-0"
              style={{ color: '#777777', cursor: 'text' }}
              onKeyDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* 编辑器主体 */}
        <div
          className="w-full flex-1 overflow-hidden relative"
          style={{
            borderRadius: windowState.showHeader
              ? `0 0 ${windowState.borderRadius.inner}px ${windowState.borderRadius.inner}px`
              : `${windowState.borderRadius.inner}px`,
          }}
        >
          <CodeMirror
            value={editor.code}
            onChange={(value) => {
              setEditor({ code: value });
            }}
            onFocus={() => {
              onEnterEdit();
            }}
            onBlur={() => {
              if (windowRef.current?.contains(document.activeElement)) return;
              onExitEdit();
            }}
            theme={currentTheme.editorTheme}
            extensions={cmExtensions}
            editable={isEditing}
            readOnly={!isEditing}
            basicSetup={{
              lineNumbers: editor.showLineNumbers,
              bracketMatching: true,
              indentOnInput: true,
              tabSize: 2,
              foldGutter: false,
            }}
            className="w-full h-full"
            style={{
              height: '100%',
              cursor: isEditing ? 'text' : 'default',
            }}
          />
        </div>

        {/* 调整大小手柄 */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
          data-no-export
          style={{
            borderRight: '2px solid rgba(128,128,128,0.3)',
            borderBottom: '2px solid rgba(128,128,128,0.3)',
            borderRadius: `0 0 ${windowState.borderRadius.inner}px 0`,
          }}
          {...bindResize()}
        />

        {/* 水印 */}
        {watermarkState.enabled && watermarkState.text && (
          <div
            className="absolute bottom-3 right-4 pointer-events-none select-none"
            style={{
              opacity: watermarkState.opacity / 100,
              color: currentTheme.isDark
                ? 'rgba(255,255,255,0.6)'
                : 'rgba(0,0,0,0.4)',
              fontFamily: selectedFontConfig.family,
              fontSize: '11px',
              lineHeight: '1',
            }}
          >
            {watermarkState.text}
          </div>
        )}
      </div>
    </div>
  );
};
