// Tabs 组件测试

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../tabs';

describe('Tabs', () => {
  it('应该渲染 Tabs 组件', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    expect(screen.getByText('Tab 1')).toBeDefined();
    expect(screen.getByText('Tab 2')).toBeDefined();
    expect(screen.getByText('Content 1')).toBeDefined();
  });

  it('TabsList 应该支持自定义 className', () => {
    const { container } = render(
      <Tabs defaultValue="tab1">
        <TabsList className="custom-list">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
      </Tabs>
    );

    expect(container.querySelector('.custom-list')).toBeDefined();
  });

  it('TabsTrigger 应该支持自定义 className', () => {
    const { container } = render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1" className="custom-trigger">
            Tab 1
          </TabsTrigger>
        </TabsList>
      </Tabs>
    );

    expect(container.querySelector('.custom-trigger')).toBeDefined();
  });

  it('TabsContent 应该支持自定义 className', () => {
    const { container } = render(
      <Tabs defaultValue="tab1">
        <TabsContent value="tab1" className="custom-content">
          Content
        </TabsContent>
      </Tabs>
    );

    expect(container.querySelector('.custom-content')).toBeDefined();
  });
});
