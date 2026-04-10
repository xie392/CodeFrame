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
  
  // 快捷键配置
  shortcuts: ShortcutConfig;
}

// 操作历史记录（用于恢复用户设置）
export interface OperationHistory {
  // 编辑器标注设置（不包含 scale/offset，它们是视图运行时状态）
  editor?: {
    activeTool?: string;
    // 折叠面板状态
    collapsedSections?: {
      background?: boolean;
      padding?: boolean;
      borderRadius?: boolean;
      imageRadius?: boolean;
      shadow?: boolean;
      imageShadow?: boolean;
      aspectRatio?: boolean;
      windowControl?: boolean;
      watermark?: boolean;
    };
    frameSettings?: {
      background?: {
        type: 'solid' | 'linear' | 'radial';
        color: string;
        gradientColors: [string, string];
        gradientAngle: number;
      };
      padding?: {
        top: number;
        right: number;
        bottom: number;
        left: number;
        linked: boolean;
      };
      borderRadius?: {
        unit: 'px' | '%';
        topLeft: number;
        topRight: number;
        bottomRight: number;
        bottomLeft: number;
        linked: boolean;
      };
      imageRadius?: {
        unit: 'px' | '%';
        topLeft: number;
        topRight: number;
        bottomRight: number;
        bottomLeft: number;
        linked: boolean;
      };
      shadow?: {
        enabled: boolean;
        color: string;
        blur: number;
        offsetX: number;
        offsetY: number;
      };
      imageShadow?: {
        enabled: boolean;
        color: string;
        blur: number;
        offsetX: number;
        offsetY: number;
      };
      aspectRatio?: string;
      customAspectRatio?: { width: number; height: number };
      windowControl?: {
        enabled: boolean;
        style: 'macos' | 'windows';
      };
      watermark?: {
        enabled: boolean;
        text: string;
        position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
        opacity: number;
        fontSize: number;
        imageUrl: string | null;
        imageSize: number;
      };
    };
    // 工具属性记忆
    lastUsedStyles?: {
      arrow?: {
        color?: string;
        strokeWidth?: number;
        headSize?: number;
        style?: 'single' | 'double';
      };
      rect?: {
        color?: string;
        strokeWidth?: number;
        fillOpacity?: number;
        borderStyle?: 'solid' | 'dashed';
      };
      text?: {
        color?: string;
        fontSize?: number;
        fontWeight?: 'normal' | 'bold';
        fontStyle?: 'normal' | 'italic';
      };
      mosaic?: {
        blockSize?: number;
        opacity?: number;
      };
    };
  };
  // 代码生成设置
  codegen?: {
    selectedTheme?: string;
    selectedBg?: string;
    selectedFont?: string;
    fontSize?: number;
    showLineNumbers?: boolean;
    padding?: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    borderRadius?: {
      outer: number;
      inner: number;
    };
    shadowEnabled?: boolean;
    shadowIntensity?: number;
    showHeader?: boolean;
    fileName?: string;
    watermarkEnabled?: boolean;
    watermarkText?: string;
    watermarkOpacity?: number;
  };
}

// 快捷键命令类型
export type ShortcutCommand =
  | 'captureVisible'
  | 'captureRegion'
  | 'captureFullpage'
  | 'captureDesktop';

// 快捷键配置
export interface ShortcutConfig {
  // 原生命令快捷键（只读，展示用）
  native: Record<ShortcutCommand, string>;
  // 自定义快捷键（可配置）
  custom: Record<ShortcutCommand, string>;
  // 是否启用自定义快捷键
  enabled: boolean;
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
