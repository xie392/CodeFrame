import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import type { Tag } from '@lezer/highlight';
import type { Extension } from '@codemirror/state';

// 语法高亮颜色定义
export interface SyntaxColors {
  keyword: string;
  string: string;
  comment: string;
  number: string;
  function: string;
  variable: string;
  operator?: string;
  punctuation?: string;
  type?: string;
}

// 主题配置
export interface ThemeConfig {
  id: string;
  label: string;
  color: string;
  isDark: boolean;
  windowBg: string;
  headerBg: string;
  textColor: string;
  syntax?: SyntaxColors;
}

// 通过 HighlightStyle + syntaxHighlighting 创建语法颜色扩展
export function createThemeExtension(
  colors: SyntaxColors,
): Extension {
  const specs: Array<{ tag: Tag; color: string }> = [
    { tag: t.keyword, color: colors.keyword },
    { tag: t.string, color: colors.string },
    { tag: t.comment, color: colors.comment },
    { tag: t.number, color: colors.number },
    { tag: t.function(t.variableName), color: colors.function },
    { tag: t.variableName, color: colors.variable },
  ];
  if (colors.operator) {
    specs.push({ tag: t.operator, color: colors.operator });
  }
  if (colors.punctuation) {
    specs.push(
      { tag: t.punctuation, color: colors.punctuation },
      { tag: t.bracket, color: colors.punctuation },
    );
  }
  if (colors.type) {
    specs.push({ tag: t.typeName, color: colors.type });
  }

  return syntaxHighlighting(
    HighlightStyle.define(specs),
  );
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'vs-dark',
    label: 'VS Code Dark+',
    color: '#1E1E1E',
    isDark: true,
    windowBg: '#1E1E1E',
    headerBg: '#252526',
    textColor: '#D4D4D4',
    syntax: {
      keyword: '#569CD6',
      string: '#CE9178',
      comment: '#6A9955',
      number: '#B5CEA8',
      function: '#DCDCAA',
      variable: '#9CDCFE',
      operator: '#D4D4D4',
      punctuation: '#D4D4D4',
      type: '#4EC9B0',
    },
  },
  {
    id: 'one-dark',
    label: 'One Dark',
    color: '#282C34',
    isDark: true,
    windowBg: '#282C34',
    headerBg: '#21252B',
    textColor: '#ABB2BF',
    syntax: {
      keyword: '#C678DD',
      string: '#98C379',
      comment: '#5C6370',
      number: '#D19A66',
      function: '#61AFEF',
      variable: '#E06C75',
      operator: '#56B6C2',
      punctuation: '#ABB2BF',
      type: '#E5C07B',
    },
  },
  {
    id: 'solarized',
    label: 'Solarized Dark',
    color: '#002B36',
    isDark: true,
    windowBg: '#002B36',
    headerBg: '#073642',
    textColor: '#839496',
    syntax: {
      keyword: '#859900',
      string: '#2AA198',
      comment: '#586E75',
      number: '#D33682',
      function: '#268BD2',
      variable: '#B58900',
      operator: '#859900',
      punctuation: '#839496',
      type: '#B58900',
    },
  },
  {
    id: 'dracula',
    label: 'Dracula',
    color: '#282A36',
    isDark: true,
    windowBg: '#282A36',
    headerBg: '#21222C',
    textColor: '#F8F8F2',
    syntax: {
      keyword: '#FF79C6',
      string: '#F1FA8C',
      comment: '#6272A4',
      number: '#BD93F9',
      function: '#50FA7B',
      variable: '#F8F8F2',
      operator: '#FF79C6',
      punctuation: '#F8F8F2',
      type: '#8BE9FD',
    },
  },
  {
    id: 'nord',
    label: 'Nord',
    color: '#2E3440',
    isDark: true,
    windowBg: '#2E3440',
    headerBg: '#272C36',
    textColor: '#D8DEE9',
    syntax: {
      keyword: '#81A1C1',
      string: '#A3BE8C',
      comment: '#616E88',
      number: '#B48EAD',
      function: '#88C0D0',
      variable: '#D8DEE9',
      operator: '#81A1C1',
      punctuation: '#ECEFF4',
      type: '#8FBCBB',
    },
  },
  {
    id: 'tokyo-night',
    label: 'Tokyo Night',
    color: '#1A1B26',
    isDark: true,
    windowBg: '#1A1B26',
    headerBg: '#16161E',
    textColor: '#A9B1D6',
    syntax: {
      keyword: '#BB9AF7',
      string: '#9ECE6A',
      comment: '#565F89',
      number: '#FF9E64',
      function: '#7AA2F7',
      variable: '#C0CAF5',
      operator: '#89DDFF',
      punctuation: '#A9B1D6',
      type: '#2AC3DE',
    },
  },
  {
    id: 'github-dark',
    label: 'GitHub Dark',
    color: '#0D1117',
    isDark: true,
    windowBg: '#0D1117',
    headerBg: '#161B22',
    textColor: '#C9D1D9',
    syntax: {
      keyword: '#FF7B72',
      string: '#A5D6FF',
      comment: '#8B949E',
      number: '#79C0FF',
      function: '#D2A8FF',
      variable: '#C9D1D9',
      operator: '#FF7B72',
      punctuation: '#C9D1D9',
      type: '#FFA657',
    },
  },
  {
    id: 'catppuccin',
    label: 'Catppuccin',
    color: '#1E1E2E',
    isDark: true,
    windowBg: '#1E1E2E',
    headerBg: '#181825',
    textColor: '#CDD6F4',
    syntax: {
      keyword: '#CBA6F7',
      string: '#A6E3A1',
      comment: '#6C7086',
      number: '#FAB387',
      function: '#89B4FA',
      variable: '#CDD6F4',
      operator: '#89DCEB',
      punctuation: '#BAC2DE',
      type: '#F9E2AF',
    },
  },
  {
    id: 'gruvbox',
    label: 'Gruvbox',
    color: '#282828',
    isDark: true,
    windowBg: '#282828',
    headerBg: '#1D2021',
    textColor: '#EBDBB2',
    syntax: {
      keyword: '#FB4934',
      string: '#B8BB26',
      comment: '#928374',
      number: '#D65D0E',
      function: '#8EC07C',
      variable: '#EBDBB2',
      operator: '#FE8019',
      punctuation: '#A89984',
      type: '#FABD2F',
    },
  },
  {
    id: 'rose-pine',
    label: 'Rose Pine',
    color: '#191724',
    isDark: true,
    windowBg: '#191724',
    headerBg: '#1F1D2E',
    textColor: '#E0DEF4',
    syntax: {
      keyword: '#C4A7E7',
      string: '#F6C177',
      comment: '#6E6A86',
      number: '#EA9A97',
      function: '#EBBCBA',
      variable: '#E0DEF4',
      operator: '#C4A7E7',
      punctuation: '#908CAA',
      type: '#31748F',
    },
  },
  {
    id: 'kanagawa',
    label: 'Kanagawa',
    color: '#1F1F28',
    isDark: true,
    windowBg: '#1F1F28',
    headerBg: '#16161D',
    textColor: '#DCD7BA',
    syntax: {
      keyword: '#C79553',
      string: '#98BB6C',
      comment: '#545464',
      number: '#DCAE96',
      function: '#957FB8',
      variable: '#DCD7BA',
      operator: '#C79553',
      punctuation: '#716E61',
      type: '#7E9CD8',
    },
  },
  {
    id: 'light',
    label: 'GitHub Light',
    color: '#FAFAFA',
    isDark: false,
    windowBg: '#FFFFFF',
    headerBg: '#F0F0F0',
    textColor: '#1E1E1E',
    syntax: {
      keyword: '#D73A49',
      string: '#032F62',
      comment: '#6A737D',
      number: '#005CC5',
      function: '#6F42C1',
      variable: '#24292E',
      operator: '#D73A49',
      punctuation: '#24292E',
      type: '#005CC5',
    },
  },
];
