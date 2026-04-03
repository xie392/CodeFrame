// Switch 组件测试

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from '../switch';

describe('Switch', () => {
  it('应该渲染开关组件', () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('应该显示未选中状态', () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} />);
    const switchEl = screen.getByRole('switch');
    expect(switchEl).toHaveAttribute('aria-checked', 'false');
  });

  it('应该显示选中状态', () => {
    const onChange = vi.fn();
    render(<Switch checked={true} onChange={onChange} />);
    const switchEl = screen.getByRole('switch');
    expect(switchEl).toHaveAttribute('aria-checked', 'true');
  });

  it('应该响应点击事件', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} />);
    
    await user.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('选中状态点击应该切换为未选中', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch checked={true} onChange={onChange} />);
    
    await user.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('应该支持自定义 className', () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} className="custom-switch" />);
    const switchEl = screen.getByRole('switch');
    expect(switchEl).toHaveClass('custom-switch');
  });
});
