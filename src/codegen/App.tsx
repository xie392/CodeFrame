import React from 'react';
import { ChevronDown, Check, Image } from 'lucide-react';

const SAMPLE_CODE = [
  { text: 'const greet = (name) => {', color: '#C586C0' },
  { text: "  return `Hello, ${name}!`;", color: '#CE9178' },
  { text: '};', color: '#C586C0' },
  { text: '', color: '#FFFFFF' },
  { text: 'export default greet;', color: '#569CD6' },
];

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

const App: React.FC = () => {
  const [selectedTheme, setSelectedTheme] = React.useState('vs-dark');
  const [selectedBg, setSelectedBg] = React.useState('indigo');
  const selectedBgColor =
    BACKGROUNDS.find((b) => b.id === selectedBg)?.color ?? '#6366F1';

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
        <div
          className="w-full h-[300px] rounded-xl overflow-auto"
          style={{ backgroundColor: '#1A1A1A' }}
        >
          <div className="flex flex-col gap-1 p-4">
            {SAMPLE_CODE.map((line, i) => (
              <span
                key={i}
                className="text-[12px] leading-[18px] whitespace-pre"
                style={{ color: line.color }}
              >
                {line.text}
              </span>
            ))}
          </div>
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

          {/* Window Body */}
          <div className="w-full flex-1 flex flex-col gap-1 p-5 overflow-auto">
            {SAMPLE_CODE.map((line, i) => (
              <span
                key={i}
                className="text-[13px] leading-[20px] whitespace-pre"
                style={{ color: line.color }}
              >
                {line.text}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
