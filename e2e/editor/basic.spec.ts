import { test, expect } from '../fixtures/editor';

test.describe('Editor 页面基础', () => {
  test('页面能正常加载', async ({ editorPage }) => {
    await expect(editorPage).toHaveTitle(/CodeFrame/);
    const root = editorPage.locator('#root');
    await expect(root).not.toBeEmpty();
  });

  test('Canvas 元素存在', async ({ editorPage }) => {
    // 截图数据加载后应渲染 Canvas
    const canvas = editorPage.locator('canvas');
    await expect(canvas.first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('工具栏渲染', async ({ editorPage }) => {
    const buttons = editorPage.locator('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Canvas 绘制交互', () => {
  test('切换到箭头工具', async ({ editorPage }) => {
    // 点击第 3 个工具按钮（箭头）
    const toolButtons = editorPage.locator(
      'aside button'
    );
    const count = await toolButtons.count();
    expect(count).toBeGreaterThanOrEqual(3);

    await toolButtons.nth(2).click();

    // 验证按钮被激活
    const activeBtn = editorPage.locator(
      'aside button.tool-btn-active'
    );
    await expect(activeBtn).toHaveCount(1);
  });

  test('在 Canvas 上绘制矩形', async ({ editorPage }) => {
    // 先切换到矩形工具（第 4 个）
    const toolButtons = editorPage.locator(
      'aside button'
    );
    await toolButtons.nth(3).click();

    // 获取 Canvas 位置
    const canvas = editorPage.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (!box) {
      throw new Error('Canvas not found');
    }

    // 在 Canvas 上拖拽绘制矩形
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

    // 等待渲染
    await editorPage.waitForTimeout(500);

    // Canvas 应该仍然可见（没崩溃）
    await expect(canvas).toBeVisible();
  });
});

test.describe('截图对比', () => {
  test('Canvas 2D 基线截图', async ({ editorPage }) => {
    await editorPage.waitForTimeout(1000);
    await expect(editorPage).toHaveScreenshot(
      'editor-canvas2d-baseline.png',
      { maxDiffPixelRatio: 0.05 }
    );
  });
});
