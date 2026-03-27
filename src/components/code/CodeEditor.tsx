import { createEffect, onMount } from 'solid-js';
import { codeStore } from '~/stores';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import php from 'highlight.js/lib/languages/php';
import ruby from 'highlight.js/lib/languages/ruby';
import swift from 'highlight.js/lib/languages/swift';
import kotlin from 'highlight.js/lib/languages/kotlin';
import css from 'highlight.js/lib/languages/css';
import sql from 'highlight.js/lib/languages/sql';
import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';
import bash from 'highlight.js/lib/languages/bash';
import graphql from 'highlight.js/lib/languages/graphql';
import xml from 'highlight.js/lib/languages/xml';

// 注册语言
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('java', java);
hljs.registerLanguage('go', go);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('c', c);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('php', php);
hljs.registerLanguage('ruby', ruby);
hljs.registerLanguage('swift', swift);
hljs.registerLanguage('kotlin', kotlin);
hljs.registerLanguage('css', css);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('json', json);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('graphql', graphql);
hljs.registerLanguage('html', xml);

// 语言映射
const LANGUAGE_MAP: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  golang: 'go',
  'c++': 'cpp',
  'c#': 'csharp',
  rb: 'ruby',
  kt: 'kotlin',
  sh: 'bash',
  yml: 'yaml',
};

/**
 * 检测代码语言
 */
export function detectLanguage(code: string): string {
  if (!code.trim()) return 'plaintext';
  
  try {
    const result = hljs.highlightAuto(code, [
      'javascript',
      'typescript',
      'python',
      'java',
      'go',
      'rust',
      'c',
      'cpp',
      'csharp',
      'php',
      'ruby',
      'swift',
      'kotlin',
      'css',
      'sql',
      'json',
      'yaml',
      'bash',
      'graphql',
      'html',
    ]);
    
    return result.language ?? 'plaintext';
  } catch {
    return 'plaintext';
  }
}

/**
 * 高亮代码
 */
export function highlightCode(code: string, language: string): string {
  const mappedLang = LANGUAGE_MAP[language.toLowerCase()] ?? language.toLowerCase();
  
  try {
    if (mappedLang === 'plaintext' || !hljs.getLanguage(mappedLang)) {
      return escapeHtml(code);
    }
    
    return hljs.highlight(code, { language: mappedLang }).value;
  } catch {
    return escapeHtml(code);
  }
}

/**
 * HTML 转义
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export interface CodeEditorProps {
  onLanguageDetected?: (language: string) => void;
}

/**
 * CodeEditor 代码编辑器组件
 */
export function CodeEditor(props: CodeEditorProps) {
  let textareaRef: HTMLTextAreaElement | undefined;
  
  const handleInput = (e: Event) => {
    const target = e.target as HTMLTextAreaElement;
    codeStore.updateCode(target.value);
    
    // 自动检测语言
    if (codeStore.language() === 'auto') {
      const detected = detectLanguage(target.value);
      props.onLanguageDetected?.(detected);
    }
  };
  
  // 处理 Tab 键
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const value = target.value;
      
      target.value = value.substring(0, start) + '  ' + value.substring(end);
      target.selectionStart = target.selectionEnd = start + 2;
      
      codeStore.updateCode(target.value);
    }
  };
  
  return (
    <div class="relative h-full">
      <textarea
        ref={textareaRef}
        class={`
          w-full h-full p-4
          bg-bg-tertiary rounded-lg
          text-text-primary font-mono text-sm
          resize-none outline-none
          border border-transparent
          focus:border-accent
          placeholder:text-text-tertiary
        `}
        placeholder="在此粘贴或输入代码..."
        value={codeStore.code()}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        spellcheck={false}
      />
      
      {/* 字符计数 */}
      <div class="absolute bottom-2 right-2 text-xs text-text-tertiary">
        {codeStore.code().length} 字符
      </div>
    </div>
  );
}
