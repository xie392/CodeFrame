// Slider 组件测试

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Slider } from '../slider';

describe('Slider', () => {
  it('应该渲染滑块组件', () => {
    const onChange = vi.fn();
    render(<Slider value={50} onChange={onChange} />);
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('应该显示当前值', () => {
    const onChange = vi.fn();
    render(<Slider value={50} onChange={onChange} />);
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('应该显示带单位的值', () => {
    const onChange = vi.fn();
    render(<Slider value={50} onChange={onChange} unit="px" />);
    expect(screen.getByText('50px')).toBeInTheDocument();
  });

  it('应该显示标签', () => {
    const onChange = vi.fn();
    render(<Slider value={50} onChange={onChange} label="Opacity" />);
    expect(screen.getByText('Opacity:')).toBeInTheDocument();
  });

  it('应该支持自定义 min 和 max', () => {
    const onChange = vi.fn();
    render(<Slider value={5} onChange={onChange} min={0} max={10} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('min', '0');
    expect(slider).toHaveAttribute('max', '10');
  });

  it('应该支持自定义 step', () => {
    const onChange = vi.fn();
    render(<Slider value={0.5} onChange={onChange} min={0} max={1} step={0.1} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('step', '0.1');
  });

  it('应该显示小数值', () => {
    const onChange = vi.fn();
    render(<Slider value={50.5} onChange={onChange} step={0.1} />);
    expect(screen.getByText('50.5')).toBeInTheDocument();
  });

  it('应该支持自定义 className', () => {
    const onChange = vi.fn();
    render(<Slider value={50} onChange={onChange} className="custom-slider" />);
    const container = screen.getByRole('slider').parentElement;
    expect(container).toHaveClass('custom-slider');
  });
});
