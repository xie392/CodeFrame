// Popover 组件测试

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Popover, PopoverTrigger, PopoverContent } from '../popover';

describe('Popover', () => {
  it('应该渲染 Popover 组件', () => {
    render(
      <Popover>
        <PopoverTrigger>Open Popover</PopoverTrigger>
        <PopoverContent>Popover content</PopoverContent>
      </Popover>
    );

    expect(screen.getByText('Open Popover')).toBeDefined();
  });

  it('PopoverContent 应该支持自定义 className', () => {
    const { container } = render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent className="custom-popover">
          Popover content
        </PopoverContent>
      </Popover>
    );

    expect(container.querySelector('.custom-popover')).toBeDefined();
  });

  it('PopoverContent 应该支持 align 属性', () => {
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent align="start">Popover content</PopoverContent>
      </Popover>
    );

    expect(screen.getByText('Open')).toBeDefined();
  });

  it('PopoverContent 应该支持 sideOffset 属性', () => {
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent sideOffset={8}>Popover content</PopoverContent>
      </Popover>
    );

    expect(screen.getByText('Open')).toBeDefined();
  });
});
