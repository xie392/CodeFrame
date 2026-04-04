/**
 * 测试类型工具
 * 提供测试专用的类型定义，避免使用 any 类型
 */

/**
 * 深度部分类型
 * 支持嵌套对象的部分属性 mock
 */
export type PartialDeep<T> = T extends object
  ? {
      [P in keyof T]?: PartialDeep<T[P]>;
    }
  : T;

/**
 * MutableRefObject Mock 类型
 * 用于创建 React.MutableRefObject 的 mock 对象
 */
export interface MutableRefObjectMock<T> {
  current: T;
}

/**
 * 创建 Ref Mock 工厂函数
 */
export function createRefMock<T>(initialValue: T): MutableRefObjectMock<T> {
  return { current: initialValue };
}

/**
 * Canvas 2D 上下文 Mock 类型
 * 包含测试所需的必要属性和方法
 */
export interface MockCanvasRenderingContext2D {
  fillStyle: string;
  strokeStyle: string;
  lineWidth: number;
  lineCap: CanvasLineCap;
  globalAlpha: number;
  font: string;
  textBaseline: CanvasTextBaseline;

  save(): void;
  restore(): void;
  clearRect(x: number, y: number, w: number, h: number): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  strokeRect(x: number, y: number, w: number, h: number): void;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  closePath(): void;
  fill(): void;
  stroke(): void;
  arc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number
  ): void;
  setLineDash(segments: number[]): void;
  getLineDash(): number[];
  getImageData(
    x: number,
    y: number,
    w: number,
    h: number
  ): ImageData;
  measureText(text: string): TextMetrics;
  fillText(text: string, x: number, y: number): void;
  drawImage(
    image: CanvasImageSource,
    dx: number,
    dy: number
  ): void;
  drawImage(
    image: CanvasImageSource,
    dx: number,
    dy: number,
    dw: number,
    dh: number
  ): void;
  drawImage(
    image: CanvasImageSource,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number
  ): void;
}
