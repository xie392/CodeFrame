// ColorPicker 组件测试

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColorPicker } from '../color-picker';

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Palette: () => <svg data-testid="palette-icon" />,
}));

describe('ColorPicker', () => {
  const mockColors = ['#EF4444', '#22C55E', '#3B82F6'];
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该渲染所有颜色按钮', () => {
    render(
      <ColorPicker
        colors={mockColors}
        value="#EF4444"
        onChange={mockOnChange}
      />
    );

    const buttons = screen.getAllByRole('button');
    // 3 个颜色按钮 + 1 个自定义按钮
    expect(buttons).toHaveLength(4);
  });

  it('应该在点击颜色按钮时调用 onChange', () => {
    render(
      <ColorPicker
        colors={mockColors}
        value="#EF4444"
        onChange={mockOnChange}
      />
    );

    const greenButton = screen.getAllByRole('button')[1];
    fireEvent.click(greenButton);

    expect(mockOnChange).toHaveBeenCalledWith('#22C55E');
  });

  it('应该高亮选中的颜色', () => {
    render(
      <ColorPicker
        colors={mockColors}
        value="#22C55E"
        onChange={mockOnChange}
      />
    );

    const buttons = screen.getAllByRole('button');
    const greenButton = buttons[1];

    expect(greenButton).toHaveStyle({ backgroundColor: '#22C55E' });
  });

  it('应该显示自定义颜色按钮', () => {
    render(
      <ColorPicker
        colors={mockColors}
        value="#EF4444"
        onChange={mockOnChange}
        showCustom={true}
      />
    );

    // 自定义按钮应该有调色板图标
    expect(screen.getByTestId('palette-icon')).toBeDefined();
  });

  it('应该隐藏自定义颜色按钮当 showCustom=false', () => {
    render(
      <ColorPicker
        colors={mockColors}
        value="#EF4444"
        onChange={mockOnChange}
        showCustom={false}
      />
    );

    const buttons = screen.getAllByRole('button');
    // 只有 3 个颜色按钮
    expect(buttons).toHaveLength(3);
  });

  it('应该支持自定义 className', () => {
    const { container } = render(
      <ColorPicker
        colors={mockColors}
        value="#EF4444"
        onChange={mockOnChange}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('自定义颜色输入应该触发 onChange', () => {
    render(
      <ColorPicker
        colors={mockColors}
        value="#EF4444"
        onChange={mockOnChange}
        showCustom={true}
      />
    );

    // 找到隐藏的颜色输入
    const colorInput = document.querySelector('input[type="color"]');
    expect(colorInput).not.toBeNull();

    if (colorInput) {
      fireEvent.change(colorInput, { target: { value: '#FF00FF' } });
      // 浏览器会将颜色值转换为小写
      expect(mockOnChange).toHaveBeenCalledWith('#ff00ff');
    }
  });
});
