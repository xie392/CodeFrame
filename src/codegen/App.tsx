import React from 'react';
import { ChevronDown, Check, Image } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import {
  createHighlighterCore,
  type HighlighterCore,
} from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

const DEFAULT_CODE = `const greet = (name) => {
  return \`Hello, \${name}!\`;
};

export default greet;`;

const THEMES = [
  { id: 'vs-dark', color: '#1E1E1E', label: 'VS Code Dark+' },
  { id: 'one-dark', color: '#282C34', label: 'One Dark' },
  { id: 'solarized', color: '#002B36', label: 'Solarized Dark' },
  { id: 'light', color: '#FAFAFA', label: 'Light' },
];

const BACKGROUNDS = [
  { id: 'indigo', color: '#6366F1' },
  { id: 'violet', color: '#8B5CF6' },
  { id: 'pink', color: '#EC4899' },
  { id: 'sky', color: '#0EA5E9' },
  { id: 'emerald', color: '#10B981' },
];

let shikiHighlighter: HighlighterCore | null = null;

async function getHighlighter(): Promise<HighlighterCore> {
  if (shikiHighlighter) return shikiHighlighter;
  shikiHighlighter = await createHighlighterCore({
    themes: [
      import('shiki/themes/dark-plus.mjs'),
    ],
    langs: [
      import('shiki/langs/javascript.mjs'),
    ],
    engine: createJavaScriptRegexEngine(),
  });
  return shikiHighlighter;
}

const App: React.FC = () => {
  const [code, setCode] = React.useState(DEFAULT_CODE);
  const [selectedTheme, setSelectedTheme] = React.useState('vs-dark');
  const [selectedBg, setSelectedBg] = React.useState('indigo');
  const [highlightedHtml, setHighlightedHtml] = React.useState('');
  const selectedBgColor =
    BACKGROUNDS.find((b) => b.id === selectedBg)?.color ?? '#6366F1';

  React.useEffect(() => {
    let cancelled = false;
    async function highlight() {
      const shiki = await getHighlighter();
      if (cancelled) return;
      const html = shiki.codeToHtml(code, {
        lang: 'javascript',
        theme: 'dark-plus',
      });
      if (!cancelled) setHighlightedHtml(html);
    }
    highlight();
    return () => { cancelled = true; };
  }, [code]);

  return (
    <div
      className="w-screen h-screen flex font-body"
      style={{
        background:
          'linear-gradient(180deg, #F0F0F8 0%, #EAEAF2 50%, #E0E0EA 100%)',
      }}
    >
      {/* LeftPanel */}
      <aside
        className="w-[360px] h-full shrink-0 flex flex-col gap-4 p-5"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.52) 0%, rgba(255,255,255,0.33) 100%)',
          border: '1px solid rgba(255,255,255,0.44)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        }}
      >
        {/* Panel Header */}
        <div className="flex items-center gap-2">
          <span
            className="text-[16px] font-bold leading-none"
            style={{ color: '#00D4AA' }}
          >
            &gt;
          </span>
          <span
            className="text-[14px] leading-none"
            style={{ color: '#1A1A1A' }}
          >
            code_input
          </span>
        </div>

        {/* Code Area */}
        <div className="w-full rounded-xl overflow-auto">
          <CodeMirror
            value={code}
            onChange={(value) => setCode(value)}
            height="300px"
            theme={vscodeDark}
            extensions={[javascript()]}
            basicSetup={{
              lineNumbers: true,
              bracketMatching: true,
              indentOnInput: true,
            }}
            style={{
              fontSize: '12px',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          />
        </div>

        {/* Language Selector */}
        <div className="flex flex-col gap-2">
          <span
            className="text-[11px] leading-none"
            style={{ color: '#BBBBBB' }}
          >
            language
          </span>
          <div
            className="w-full h-9 rounded-lg flex items-center justify-between px-3"
            style={{
              background: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(255,255,255,0.38)',
            }}
          >
            <span className="text-[12px]" style={{ color: '#1A1A1A' }}>
              javascript
            </span>
            <ChevronDown size={14} style={{ color: '#999999' }} />
          </div>
        </div>

        {/* Theme Selector */}
        <div className="flex flex-col gap-2">
          <span
            className="text-[11px] leading-none"
            style={{ color: '#BBBBBB' }}
          >
            theme
          </span>
          <div className="w-full flex gap-2 justify-center">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                className="w-10 h-10 rounded-lg shrink-0"
                style={{
                  backgroundColor: theme.color,
                  border:
                    selectedTheme === theme.id
                      ? '2px solid #FF6B35'
                      : '2px solid transparent',
                }}
                onClick={() => setSelectedTheme(theme.id)}
                title={theme.label}
              />
            ))}
          </div>
        </div>

        {/* Background Selector */}
        <div className="flex flex-col gap-2">
          <span
            className="text-[11px] leading-none"
            style={{ color: '#BBBBBB' }}
          >
            background
          </span>
          <div className="w-full flex gap-2 justify-center">
            {BACKGROUNDS.map((bg) => (
              <button
                key={bg.id}
                className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center"
                style={{ backgroundColor: bg.color }}
                onClick={() => setSelectedBg(bg.id)}
                title={bg.id}
              >
                {selectedBg === bg.id && (
                  <Check size={16} style={{ color: '#FFFFFF' }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Export Button */}
        <button
          className="w-full h-11 rounded-xl flex items-center justify-center gap-2"
          style={{ backgroundColor: '#00D4AA' }}
        >
          <Image size={16} style={{ color: '#0D0D0D' }} />
          <span
            className="text-[13px] font-semibold leading-none"
            style={{ color: '#0D0D0D' }}
          >
            $ export_image
          </span>
        </button>
      </aside>

      {/* Preview Area */}
      <main
        className="flex-1 h-full flex items-center justify-center"
        style={{ backgroundColor: selectedBgColor }}
      >
        {/* Code Window */}
        <div
          className="w-[520px] h-[380px] rounded-xl flex flex-col"
          style={{
            backgroundColor: '#1E1E1E',
            boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
          }}
        >
          {/* Window Header */}
          <div
            className="w-full h-10 flex items-center gap-2 px-4 shrink-0"
            style={{
              backgroundColor: '#252526',
              borderRadius: '12px 12px 0 0',
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
            <span
              className="text-[12px] ml-2"
              style={{ color: '#777777' }}
            >
              greet.js
            </span>
          </div>

          {/* Window Body — Shiki 高亮渲染 */}
          <div
            className="w-full flex-1 p-5 overflow-auto"
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '13px',
              lineHeight: '20px',
            }}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
