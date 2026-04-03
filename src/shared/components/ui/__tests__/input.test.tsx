// Input 组件测试

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../input';

describe('Input', () => {
  it('应该渲染输入框', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('应该支持 type 属性', () => {
    render(<Input type="number" />);
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });

  it('应该支持默认尺寸', () => {
    render(<Input inputSize="default" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('h-8');
  });

  it('应该支持小尺寸', () => {
    render(<Input inputSize="sm" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('h-7');
  });

  it('应该支持自定义 className', () => {
    render(<Input className="custom-input" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-input');
  });

  it('应该支持 placeholder', () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'Enter text');
  });

  it('应该支持 value 和 onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input value="test" onChange={onChange} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('test');
    
    await user.type(input, 'a');
    expect(onChange).toHaveBeenCalled();
  });

  it('应该支持 disabled 状态', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('应该支持 ref 转发', () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
