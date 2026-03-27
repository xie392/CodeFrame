import { createSignal } from 'solid-js';

/**
 * CodeFrame 设置页面组件
 * 提供 License 激活和用户偏好设置
 */
export default function App() {
  const [licenseKey, setLicenseKey] = createSignal('');
  const [isPro, setIsPro] = createSignal(false);

  const handleActivate = async () => {
    // TODO: 实现 License 激活逻辑
    console.log('Activating license:', licenseKey());
  };

  return (
    <div class="min-h-screen bg-bg-primary text-text-primary p-8">
      <div class="max-w-2xl mx-auto">
        {/* Header */}
        <header class="flex items-center gap-3 mb-8">
          <img src="/icon/48.png" alt="CodeFrame" class="w-10 h-10" />
          <div>
            <h1 class="text-xl font-semibold">CodeFrame 设置</h1>
            <p class="text-text-tertiary text-sm">管理您的偏好设置和 License</p>
          </div>
        </header>

        {/* License Section */}
        <section class="bg-bg-secondary rounded-xl p-6 mb-6">
          <h2 class="text-base font-medium mb-4">License 激活</h2>
          
          {isPro() ? (
            <div class="flex items-center gap-3 p-4 bg-bg-tertiary rounded-lg">
              <div class="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p class="font-medium">Pro 版本已激活</p>
                <p class="text-text-tertiary text-sm">感谢您支持 CodeFrame！</p>
              </div>
            </div>
          ) : (
            <div class="space-y-4">
              <div>
                <label class="block text-sm text-text-secondary mb-2">License Key</label>
                <input
                  type="text"
                  class="input"
                  placeholder="输入您的 License Key"
                  value={licenseKey()}
                  onInput={(e) => setLicenseKey(e.currentTarget.value)}
                />
              </div>
              <button
                class="btn btn-primary"
                onClick={handleActivate}
                disabled={!licenseKey().trim()}
              >
                激活
              </button>
            </div>
          )}
        </section>

        {/* Settings Section */}
        <section class="bg-bg-secondary rounded-xl p-6">
          <h2 class="text-base font-medium mb-4">偏好设置</h2>
          
          <div class="space-y-4">
            <div class="flex items-center justify-between py-2">
              <div>
                <p class="font-medium">显示行号</p>
                <p class="text-text-tertiary text-sm">默认在代码中显示行号</p>
              </div>
              <button class="toggle active">
                <span class="toggle-thumb" />
              </button>
            </div>

            <div class="flex items-center justify-between py-2">
              <div>
                <p class="font-medium">默认语言</p>
                <p class="text-text-tertiary text-sm">新建代码时的默认语言</p>
              </div>
              <select class="select">
                <option>JavaScript</option>
                <option>TypeScript</option>
                <option>Python</option>
              </select>
            </div>

            <div class="flex items-center justify-between py-2">
              <div>
                <p class="font-medium">默认主题</p>
                <p class="text-text-tertiary text-sm">代码高亮的默认主题</p>
              </div>
              <select class="select">
                <option>One Dark Pro</option>
                <option>GitHub Dark</option>
                <option>Dracula</option>
              </select>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer class="mt-8 text-center text-text-muted text-sm">
          <p>CodeFrame v1.0.0</p>
          <p class="mt-1">
            <a href="#" class="text-accent hover:underline">隐私政策</a>
            {' • '}
            <a href="#" class="text-accent hover:underline">使用条款</a>
          </p>
        </footer>
      </div>
    </div>
  );
}
