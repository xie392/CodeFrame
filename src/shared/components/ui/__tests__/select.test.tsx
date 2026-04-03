// Select 组件测试

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Select } from '../select';

describe('Select', () => {
  it('应该渲染选择框', () => {
    render(
      <Select>
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
      </Select>
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('应该渲染子元素', () => {
    render(
      <Select>
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
      </Select>
    );
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('应该支持默认尺寸', () => {
    render(
      <Select selectSize="default">
        <option value="test">Test</option>
      </Select>
    );
    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('h-8');
  });

  it('应该支持小尺寸', () => {
    render(
      <Select selectSize="sm">
        <option value="test">Test</option>
      </Select>
    );
    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('h-7');
  });

  it('应该支持 disabled 状态', () => {
    render(
      <Select disabled>
        <option value="test">Test</option>
      </Select>
    );
    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });

  it('应该支持 value 属性', () => {
    render(
      <Select value="option2" onChange={() => {}}>
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
      </Select>
    );
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('option2');
  });

  it('应该支持 ref 转发', () => {
    const ref = { current: null as HTMLSelectElement | null };
    render(
      <Select ref={ref}>
        <option value="test">Test</option>
      </Select>
    );
    expect(ref.current).toBeInstanceOf(HTMLSelectElement);
  });
});
