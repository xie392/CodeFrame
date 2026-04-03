// Button 组件测试

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button', () => {
  it('应该渲染按钮', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('应该应用默认变体样式', () => {
    render(<Button>Default</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary');
  });

  it('应该应用 destructive 变体样式', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-destructive');
  });

  it('应该应用 outline 变体样式', () => {
    render(<Button variant="outline">Outline</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('border');
  });

  it('应该应用 ghost 变体样式', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('hover:bg-accent');
  });

  it('应该应用 link 变体样式', () => {
    render(<Button variant="link">Link</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('underline-offset-4');
  });

  it('应该应用 size 样式', () => {
    render(<Button size="sm">Small</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-8');
  });

  it('应该应用 large size 样式', () => {
    render(<Button size="lg">Large</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-10');
  });

  it('应该应用 icon size 样式', () => {
    render(<Button size="icon">Icon</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-9', 'w-9');
  });

  it('应该支持自定义 className', () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('应该支持 disabled 状态', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('应该支持点击事件', async () => {
    const user = userEvent.setup();
    let clicked = false;
    render(<Button onClick={() => { clicked = true; }}>Click</Button>);
    
    await user.click(screen.getByRole('button'));
    expect(clicked).toBe(true);
  });

  it('应该渲染子元素', () => {
    render(
      <Button>
        <span>Child</span>
      </Button>
    );
    expect(screen.getByText('Child')).toBeInTheDocument();
  });
});
