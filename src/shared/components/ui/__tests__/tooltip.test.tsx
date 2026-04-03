// Tooltip 组件测试

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '../tooltip';

describe('Tooltip', () => {
  it('应该渲染 Tooltip 组件', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    expect(screen.getByText('Hover me')).toBeDefined();
  });

  it('TooltipContent 应该支持自定义 className', () => {
    const { container } = render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent className="custom-tooltip">
            Tooltip content
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    expect(container.querySelector('.custom-tooltip')).toBeDefined();
  });

  it('TooltipContent 应该支持 sideOffset 属性', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent sideOffset={8}>Tooltip content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    expect(screen.getByText('Hover me')).toBeDefined();
  });
});
