import { test as base, expect, type Page } from '@playwright/test';

/**
 * 完整的 Chrome API Mock
 * 覆盖 editor 页面所有用到的 Chrome API
 * 预置合法的截图数据，使编辑器正常渲染
 */
async function injectChromeMock(page: Page) {
  await page.addInitScript(() => {
    // 1x1 红色 PNG data URL（合法的截图数据）
    const testImageData =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgA' +
      'AAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAH' +
      'ggJ/PchI7wAAAABJRU5ErkJggg==';

    const mockStorage: Record<string, unknown> = {
      codeframe_capture_result: {
        success: true,
        imageData: testImageData,
      },
    };

    function createEventEmitter() {
      const fns: Array<(...args: unknown[]) => void> = [];
      return {
        addListener: (fn: (...args: unknown[]) => void) => {
          fns.push(fn);
        },
        removeListener: (fn: (...args: unknown[]) => void) => {
          const idx = fns.indexOf(fn);
          if (idx >= 0) fns.splice(idx, 1);
        },
        _emit: (...args: unknown[]) => {
          fns.forEach((fn) => fn(...args));
        },
      };
    }

    const storageOnChanged = createEventEmitter();

    window.chrome = {
      storage: {
        local: {
          get: (
            keys: string | string[] | Record<string, unknown>,
            callback?: (result: Record<string, unknown>) => void
          ) => {
            const result: Record<string, unknown> = {};
            const keyList = Array.isArray(keys)
              ? keys
              : typeof keys === 'string'
                ? [keys]
                : Object.keys(keys);
            keyList.forEach((k) => {
              if (k in mockStorage) result[k] = mockStorage[k];
            });
            if (callback) callback(result);
            return Promise.resolve(result);
          },
          set: (
            items: Record<string, unknown>,
            callback?: () => void
          ) => {
            Object.entries(items).forEach(([k, v]) => {
              mockStorage[k] = v;
            });
            if (callback) callback();
            return Promise.resolve();
          },
          remove: (
            keys: string | string[],
            callback?: () => void
          ) => {
            const arr = Array.isArray(keys) ? keys : [keys];
            arr.forEach((k) => delete mockStorage[k]);
            if (callback) callback();
            return Promise.resolve();
          },
        },
        onChanged: storageOnChanged,
      },
      runtime: {
        id: 'test-extension-id',
        getURL: (p: string) => `chrome-extension://test-id/${p}`,
        sendMessage: (
          _message: unknown,
          callback?: (response: unknown) => void
        ) => {
          if (callback) callback(undefined);
          return Promise.resolve(undefined);
        },
        onMessage: createEventEmitter(),
        onInstalled: createEventEmitter(),
      },
      tabs: {
        create: (
          _props: Record<string, unknown>,
          callback?: () => void
        ) => {
          if (callback) callback();
          return Promise.resolve();
        },
        query: (
          _queryInfo: Record<string, unknown>,
          callback?: (tabs: unknown[]) => void
        ) => {
          if (callback) callback([]);
          return Promise.resolve([]);
        },
        sendMessage: () => Promise.resolve(),
      },
      contextMenus: {
        create: () => {},
        onClicked: createEventEmitter(),
      },
      commands: {
        onCommand: createEventEmitter(),
      },
    } as unknown as typeof window.chrome;
  });
}

type EditorFixture = {
  editorPage: Page;
};

const test = base.extend<EditorFixture>({
  editorPage: async ({ page }, use) => {
    await injectChromeMock(page);
    // 带上 source=capture 参数，触发编辑器加载截图数据
    await page.goto(
      '/src/editor/index.html?source=capture',
      { waitUntil: 'networkidle' }
    );
    // 等待图片加载和 Canvas 渲染
    await page.waitForTimeout(2000);
    await use(page);
  },
});

export { test, expect, injectChromeMock };
