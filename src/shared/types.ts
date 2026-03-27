// CodeFrame - TypeScript 类型定义

// 截图模式类型
export type CaptureMode = (typeof CAPTURE_MODES)[keyof typeof CAPTURE_MODES];

// 导出格式类型
export type ExportFormat = (typeof EXPORT_FORMATS)[keyof typeof EXPORT_FORMATS];

// 截图选项
export interface CaptureOptions {
  mode: CaptureMode;
  delay?: number;
  quality?: number;
  format?: ExportFormat;
}

// 截图结果
export interface CaptureResult {
  success: boolean;
  imageData?: string; // base64
  error?: string;
}

// 用户设置
export interface UserSettings {
  defaultFormat: ExportFormat;
  defaultQuality: number;
  language: 'zh-CN' | 'en';
  shortcuts: ShortcutConfig;
}

// 快捷键配置
export interface ShortcutConfig {
  screenshot: string;
  codegen: string;
}

// 标注类型
export type AnnotationType =
  | 'arrow'
  | 'rectangle'
  | 'circle'
  | 'text'
  | 'blur'
  | 'pen'
  | 'watermark';

// 标注基础接口
export interface BaseAnnotation {
  id: string;
  type: AnnotationType;
  x: number;
  y: number;
  opacity: number;
  rotation: number;
}

// 箭头标注
export interface ArrowAnnotation extends BaseAnnotation {
  type: 'arrow';
  endX: number;
  endY: number;
  color: string;
  strokeWidth: number;
  arrowStyle: 'simple' | 'double' | 'rounded';
}

// 矩形标注
export interface RectangleAnnotation extends BaseAnnotation {
  type: 'rectangle';
  width: number;
  height: number;
  fill?: string;
  stroke: string;
  strokeWidth: number;
}

// 文字标注
export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
}

// 马赛克标注
export interface BlurAnnotation extends BaseAnnotation {
  type: 'blur';
  width: number;
  height: number;
  blurLevel: number; // 1-10
}

// 标注联合类型
export type Annotation =
  | ArrowAnnotation
  | RectangleAnnotation
  | TextAnnotation
  | BlurAnnotation;

// 代码美化选项
export interface BeautifyOptions {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  showLineNumbers: boolean;
  windowStyle: 'macos' | 'windows' | 'none';
  windowTitle: string;
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  borderRadius: number;
  shadowEnabled: boolean;
  highlightLines: number[];
}

// 代码主题
export interface CodeTheme {
  id: string;
  name: string;
  type: 'light' | 'dark';
  colors: {
    background: string;
    text: string;
    keyword: string;
    string: string;
    number: string;
    comment: string;
    function: string;
    variable: string;
  };
}

// 背景样式
export interface BackgroundStyle {
  type: 'solid' | 'gradient' | 'image';
  value: string | GradientDefinition;
}

// 渐变定义
export interface GradientDefinition {
  type: 'linear' | 'radial';
  colors: Array<{ color: string; position: number }>;
  angle?: number;
}

// 导入常量类型
import { CAPTURE_MODES, EXPORT_FORMATS } from './constants';
