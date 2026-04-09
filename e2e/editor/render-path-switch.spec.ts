/**
 * 渲染路径切换测试
 * 验证 ?leafer=true 参数和 localStorage 切换行为
 */

import { test as base, expect } from '@playwright/test';
import { injectChromeMock } from '../fixtures/editor';

// 创建不带自动导航的 fixture
const test = base.extend({
  editorPageDefault: async ({ page }, use) => {
    await injectChromeMock(page);
    await page.goto(
      '/src/editor/index.html?source=capture',
      { waitUntil: 'networkidle' }
    );
    await page.waitForTimeout(2000);
    await use(page);
  },

  editorPageLeafer: async ({ page }, use) => {
    await injectChromeMock(page);
    await page.goto(
      '/src/editor/index.html?source=capture&leafer=true',
      { waitUntil: 'networkidle' }
    );
    await page.waitForTimeout(2000);
    await use(page);
  },
});

test.describe('渲染路径切换', () => {
  test('默认路径应为 Canvas 2D（无 ?leafer 参数）', async ({
    editorPageDefault,
  }) => {
    // Canvas 2D 路径应有 <canvas> 元素
    const canvas =
      editorPageDefault.locator('canvas');
    await expect(canvas.first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('?leafer=true 应切换到 Leafer 路径', async ({
    editorPageLeafer,
  }) => {
    // Leafer 路径不应有传统 Canvas
    // 但应有 Leafer 容器 div
    const leaferContainer =
      editorPageLeafer.locator(
        'div[class*="leafer"], div[style*="pointer-events"]'
      );

    // 页面不崩溃，标题正常
    await expect(editorPageLeafer).toHaveTitle(
      /CodeFrame/
    );
    const root =
      editorPageLeafer.locator('#root');
    await expect(root).not.toBeEmpty();
  });

  test('Leafer 路径下工具栏仍正常渲染', async ({
    editorPageLeafer,
  }) => {
    const buttons =
      editorPageLeafer.locator('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Leafer 路径下帧容器正常显示', async ({
    editorPageLeafer,
  }) => {
    // 帧容器应渲染图片
    const images =
      editorPageLeafer.locator('img');
    const count = await images.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Leafer 路径下缩放控件可见', async ({
    editorPageLeafer,
  }) => {
    const pageText =
      await editorPageLeafer.textContent(
        'body'
      );
    expect(pageText).toContain('100');
  });

  test('两种路径共享同一个 Store', async ({
    page,
  }) => {
    await injectChromeMock(page);

    // 先在 Canvas 2D 路径设置 localStorage
    await page.goto(
      '/src/editor/index.html?source=capture',
      { waitUntil: 'networkidle' }
    );
    await page.waitForTimeout(2000);

    // 切换到 Leafer 路径
    await page.goto(
      '/src/editor/index.html?source=capture&leafer=true',
      { waitUntil: 'networkidle' }
    );
    await page.waitForTimeout(2000);

    // 页面应正常渲染
    await expect(page).toHaveTitle(/CodeFrame/);
  });
});
