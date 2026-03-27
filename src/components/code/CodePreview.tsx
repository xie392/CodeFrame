import { createMemo, For } from 'solid-js';
import { codeStore } from '~/stores/codeStore';
import { highlightCode } from './CodeEditor';
import themes from '~/assets/themes.json';

export interface CodePreviewProps {
  scale?: number;
}

/**
 * CodePreview 实时预览组件
 */
export function CodePreview(props: CodePreviewProps) {
  const settings = () => codeStore.settings();
  
  // 获取当前主题
  const currentTheme = createMemo(() => {
    return themes.themes.find((t) => t.id === settings().theme) ?? themes.themes[0];
  });
  
  // 获取代码行
  const codeLines = createMemo(() => {
    return codeStore.code().split('\n');
  });
  
  // 高亮后的代码行
  const highlightedLines = createMemo(() => {
    const code = codeStore.code();
    if (!code.trim()) return [];
    
    const lang = codeStore.language() === 'auto' ? 'plaintext' : codeStore.language();
    const highlighted = highlightCode(code, lang);
    return highlighted.split('\n');
  });
  
  // 行号列表
  const lineNumbers = createMemo(() => {
    return codeLines().map((_, index) => index + 1);
  });
  
  // 窗口控制按钮
  const renderWindowControls = () => {
    if (settings().windowStyle === 'none') return null;
    
    return (
      <div class="flex items-center gap-2 px-4 py-3 border-b border-white/10">
        <div class="w-3 h-3 rounded-full bg-red-500" />
        <div class="w-3 h-3 rounded-full bg-yellow-500" />
        <div class="w-3 h-3 rounded-full bg-green-500" />
      </div>
    );
  };
  
  // 转义 HTML
  const escapeHtml = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  return (
    <div
      class="relative overflow-hidden"
      style={{
        'background-color': currentTheme().colors.background,
        'border-radius': `${settings().windowStyle === 'none' ? 8 : 12}px`,
        'font-family': `${settings().fontFamily}, monospace`,
        'font-size': `${settings().fontSize}px`,
        'line-height': '1.6',
        'transform': `scale(${props.scale ?? 1})`,
        'transform-origin': 'top left',
      }}
    >
      {/* 窗口控制 */}
      {renderWindowControls()}
      
      {/* 代码内容 */}
      <div
        class="code-content overflow-x-auto"
        style={{ padding: `${settings().padding}px` }}
      >
        <table class="border-collapse">
          <tbody>
            <For each={codeLines()}>
              {(line, index) => (
                <tr>
                  {/* 行号 */}
                  {settings().showLineNumbers && (
                    <td
                      class="select-none text-right pr-4"
                      style={{
                        color: currentTheme().colors.comment,
                        'min-width': `${String(lineNumbers().length).length + 1}ch`,
                      }}
                    >
                      {index() + 1}
                    </td>
                  )}
                  {/* 代码 */}
                  <td>
                    <pre class="m-0" style={{ color: currentTheme().colors.text }}>
                      <code
                        innerHTML={
                          highlightedLines()[index()] ??
                          (line ? `<span style="color:${currentTheme().colors.text}">${escapeHtml(line)}</span>` : '')
                        }
                      />
                    </pre>
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
    </div>
  );
}
