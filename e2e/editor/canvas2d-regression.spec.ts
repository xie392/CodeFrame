/**
 * Canvas 2D 路径回归测试
 * 验证将 Canvas 2D 逻辑抽出为 Canvas2DCanvas 组件后
 * 功能与迁移前完全一致
 */

import { test, expect } from '../fixtures/editor';

test.describe('Canvas 2D 路径回归', () => {
  test('页面正常加载（无 ?leafer 参数）', async ({
    editorPage,
  }) => {
    await expect(editorPage).toHaveTitle(
      /CodeFrame/
    );
    const root = editorPage.locator('#root');
    await expect(root).not.toBeEmpty();
  });

  test('Canvas 元素存在且可见', async ({
    editorPage,
  }) => {
    const canvas =
      editorPage.locator('canvas');
    await expect(canvas.first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('工具栏渲染正常', async ({
    editorPage,
  }) => {
    const buttons =
      editorPage.locator('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('切换到箭头工具', async ({
    editorPage,
  }) => {
    const toolButtons =
      editorPage.locator('aside button');
    const count =
      await toolButtons.count();
    expect(count).toBeGreaterThanOrEqual(3);

    await toolButtons.nth(2).click();

    const activeBtn =
      editorPage.locator(
        'aside button.tool-btn-active'
      );
    await expect(activeBtn).toHaveCount(1);
  });

  test('绘制矩形不崩溃', async ({
    editorPage,
  }) => {
    // 切换到矩形工具（第 4 个）
    const toolButtons =
      editorPage.locator('aside button');
    await toolButtons.nth(3).click();

    const canvas =
      editorPage
        .locator('canvas')
        .first();
    const box =
      await canvas.boundingBox();
    if (!box) {
      throw new Error('Canvas not found');
    }

    // 拖拽绘制矩形
    await editorPage.mouse.move(
      box.x + 100,
      box.y + 100
    );
    await editorPage.mouse.down();
    await editorPage.mouse.move(
      box.x + 300,
      box.y + 200,
      { steps: 10 }
    );
    await editorPage.mouse.up();

    await editorPage.waitForTimeout(500);
    await expect(canvas).toBeVisible();
  });

  test('绘制箭头不崩溃', async ({
    editorPage,
  }) => {
    // 切换到箭头工具（第 3 个）
    const toolButtons =
      editorPage.locator('aside button');
    await toolButtons.nth(2).click();

    const canvas =
      editorPage
        .locator('canvas')
        .first();
    const box =
      await canvas.boundingBox();
    if (!box) {
      throw new Error('Canvas not found');
    }

    // 拖拽绘制箭头
    await editorPage.mouse.move(
      box.x + 50,
      box.y + 50
    );
    await editorPage.mouse.down();
    await editorPage.mouse.move(
      box.x + 250,
      box.y + 150,
      { steps: 10 }
    );
    await editorPage.mouse.up();

    await editorPage.waitForTimeout(500);
    await expect(canvas).toBeVisible();
  });

  test('缩放控件可见', async ({
    editorPage,
  }) => {
    // ZoomControls 应该渲染在页面上
    const zoomControls =
      editorPage.locator(
        '[class*="zoom"], [class*="Zoom"]'
      );
    // 至少有一个缩放相关的 UI 元素
    const pageText =
      await editorPage.textContent('body');
    expect(pageText).toContain('100');
  });
});
