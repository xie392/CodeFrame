// 背景类型
export type BackdropType =
  | 'solid'
  | 'linear-gradient'
  | 'conic-gradient'
  | 'radial-gradient';

// 背景配置
export interface BackdropConfig {
  id: string;
  type: BackdropType;
  label: string;
  // CSS background 值
  css: string;
  // 预览用的 CSS（可能简化版）
  preview: string;
}

// 纯色背景
export const SOLID_BACKGROUNDS: BackdropConfig[] = [
  {
    id: 'indigo',
    type: 'solid',
    label: 'Indigo',
    css: '#6366F1',
    preview: '#6366F1',
  },
  {
    id: 'violet',
    type: 'solid',
    label: 'Violet',
    css: '#8B5CF6',
    preview: '#8B5CF6',
  },
  {
    id: 'pink',
    type: 'solid',
    label: 'Pink',
    css: '#EC4899',
    preview: '#EC4899',
  },
  {
    id: 'sky',
    type: 'solid',
    label: 'Sky',
    css: '#0EA5E9',
    preview: '#0EA5E9',
  },
  {
    id: 'emerald',
    type: 'solid',
    label: 'Emerald',
    css: '#10B981',
    preview: '#10B981',
  },
];

// 渐变背景
export const GRADIENT_BACKGROUNDS: BackdropConfig[] = [
  {
    id: 'sunset',
    type: 'linear-gradient',
    label: 'Sunset',
    css: 'linear-gradient(140deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)',
    preview: 'linear-gradient(90deg, #f97316, #ec4899, #8b5cf6)',
  },
  {
    id: 'ocean',
    type: 'linear-gradient',
    label: 'Ocean',
    css: 'linear-gradient(140deg, #0ea5e9 0%, #6366f1 50%, #8b5cf6 100%)',
    preview: 'linear-gradient(90deg, #0ea5e9, #6366f1, #8b5cf6)',
  },
  {
    id: 'aurora',
    type: 'linear-gradient',
    label: 'Aurora',
    css: 'linear-gradient(140deg, #10b981 0%, #06b6d4 50%, #8b5cf6 100%)',
    preview: 'linear-gradient(90deg, #10b981, #06b6d4, #8b5cf6)',
  },
  {
    id: 'candy',
    type: 'linear-gradient',
    label: 'Candy',
    css: 'linear-gradient(140deg, #f472b6 0%, #a78bfa 50%, #60a5fa 100%)',
    preview: 'linear-gradient(90deg, #f472b6, #a78bfa, #60a5fa)',
  },
  {
    id: 'peach',
    type: 'linear-gradient',
    label: 'Peach',
    css: 'linear-gradient(140deg, #fbbf24 0%, #f97316 50%, #ef4444 100%)',
    preview: 'linear-gradient(90deg, #fbbf24, #f97316, #ef4444)',
  },
  {
    id: 'forest',
    type: 'linear-gradient',
    label: 'Forest',
    css: 'linear-gradient(140deg, #059669 0%, #10b981 50%, #34d399 100%)',
    preview: 'linear-gradient(90deg, #059669, #10b981, #34d399)',
  },
  {
    id: 'midnight',
    type: 'linear-gradient',
    label: 'Midnight',
    css: 'linear-gradient(140deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
    preview: 'linear-gradient(90deg, #1e1b4b, #312e81, #4338ca)',
  },
  {
    id: 'dawn',
    type: 'linear-gradient',
    label: 'Dawn',
    css: 'linear-gradient(140deg, #fde68a 0%, #fbbf24 30%, #f97316 60%, #ef4444 100%)',
    preview: 'linear-gradient(90deg, #fde68a, #f97316, #ef4444)',
  },
  {
    id: 'lavender',
    type: 'conic-gradient',
    label: 'Lavender',
    css: 'conic-gradient(from 45deg, #c084fc, #818cf8, #60a5fa, #a78bfa, #c084fc)',
    preview: 'linear-gradient(90deg, #c084fc, #818cf8, #60a5fa)',
  },
  {
    id: 'rainbow',
    type: 'conic-gradient',
    label: 'Rainbow',
    css: 'conic-gradient(from 0deg, #f87171, #fbbf24, #34d399, #60a5fa, #a78bfa, #f87171)',
    preview: 'linear-gradient(90deg, #f87171, #fbbf24, #34d399, #60a5fa, #a78bfa)',
  },
  {
    id: 'cosmic',
    type: 'radial-gradient',
    label: 'Cosmic',
    css: 'radial-gradient(ellipse at top, #1e1b4b 0%, #312e81 40%, #0f172a 100%)',
    preview: 'radial-gradient(ellipse at top, #312e81, #0f172a)',
  },
];

// 所有背景
export const BACKGROUNDS: BackdropConfig[] = [
  ...SOLID_BACKGROUNDS,
  ...GRADIENT_BACKGROUNDS,
];
