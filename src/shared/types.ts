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

// 整页截图进度
export interface FullPageCaptureProgress {
  status: 'capturing' | 'stitching' | 'complete' | 'error';
  totalSegments: number;
  currentSegment: number;
  error?: string;
}

// 整页截图片段
export interface FullPageCaptureSlice {
  imageData: string; // base64
  y: number; // 在完整页面中的 Y 坐标
  height: number; // 片段高度
}

// 整页截图结果
export interface FullPageCaptureResult {
  success: boolean;
  slices?: FullPageCaptureSlice[];
  fullWidth?: number;
  fullHeight?: number;
  viewportHeight?: number;
  error?: string;
}

// 页面尺寸信息
export interface PageDimensions {
  scrollWidth: number;
  scrollHeight: number;
  clientWidth: number;
  clientHeight: number;
  viewportWidth: number;
  viewportHeight: number;
}

// 截图片段（用于整页截图）
export interface CaptureFragment {
  imageData: string; // base64
  scrollY: number;
}

// 截图结果
export interface CaptureResult {
  success: boolean;
  imageData?: string; // base64
  error?: string;
  region?: RegionRect;
}

// 区域选区坐标（CSS 像素 + 设备像素比）
export interface RegionRect {
  x: number;
  y: number;
  width: number;
  height: number;
  dpr: number;
}

// 用户设置
export interface UserSettings {
  // 通用设置
  defaultFormat: ExportFormat;
  quality: '1x' | '2x' | '3x';
  language: 'zh-CN' | 'en-US';
  
  // 操作历史
  saveOperationHistory: boolean;
  
  // 截图设置
  delayTime: 3 | 5 | 10;
  historyRetention: 7 | 30 | 90 | -1;
  
  // 水印设置
  watermarkEnabled: boolean;
  watermarkText: string;
  watermarkOpacity: number;
  
  // 代码美化设置
  codeTheme: string;
  codeFontSize: number;
  codeShowLineNumbers: boolean;
  
  // 快捷键配置
  shortcuts: ShortcutConfig;
}

// 操作历史记录（用于恢复用户设置）
export interface OperationHistory {
  // 编辑器标注设置
  editor?: {
    lastTool?: string;
    lastColor?: string;
    lastStrokeWidth?: number;
  };
  // 代码生成设置
  codegen?: {
    lastTheme?: string;
    lastFontSize?: number;
    lastBackground?: string;
    showLineNumbers?: boolean;
  };
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
  borderRadius: {
    outer: number;
    inner: number;
  };
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
