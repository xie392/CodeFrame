import { createSignal, Show } from 'solid-js';
import { Modal, Button } from '~/components/ui';
import { settingsStore } from '~/stores';

export interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * UpgradeModal 升级弹窗组件
 */
export function UpgradeModal(props: UpgradeModalProps) {
  const [licenseKey, setLicenseKey] = createSignal('');
  const [error, setError] = createSignal<string | null>(null);
  
  const handleActivate = async () => {
    if (!licenseKey().trim()) {
      setError('请输入 License Key');
      return;
    }
    
    setError(null);
    const result = await settingsStore.validateLicense(licenseKey().trim());
    
    if (result.success) {
      props.onClose();
    } else {
      setError(result.error ?? '激活失败');
    }
  };
  
  const handlePurchase = () => {
    chrome.tabs.create({ url: 'https://lemonsqueezy.com/checkout/buy/xxx' });
  };
  
  return (
    <Modal open={props.open} onClose={props.onClose} title="升级到 Pro 版" size="md">
      <div class="space-y-5">
        {/* Pro 功能介绍 */}
        <div class="space-y-3">
          <h4 class="text-sm font-medium text-text-primary">Pro 版功能</h4>
          <ul class="space-y-2 text-sm text-text-secondary">
            <li class="flex items-center gap-2">
              <span class="text-accent">✓</span>
              <span>20+ 精选代码主题</span>
            </li>
            <li class="flex items-center gap-2">
              <span class="text-accent">✓</span>
              <span>所有设备边框（iPhone/iPad/iMac）</span>
            </li>
            <li class="flex items-center gap-2">
              <span class="text-accent">✓</span>
              <span>无水印高清导出</span>
            </li>
            <li class="flex items-center gap-2">
              <span class="text-accent">✓</span>
              <span>4K 超高清分辨率</span>
            </li>
            <li class="flex items-center gap-2">
              <span class="text-accent">✓</span>
              <span>自定义背景上传</span>
            </li>
            <li class="flex items-center gap-2">
              <span class="text-accent">✓</span>
              <span>配置预设保存</span>
            </li>
          </ul>
        </div>
        
        {/* 价格 */}
        <div class="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold text-text-primary">$9.99</span>
            <span class="text-sm text-text-secondary">一次性买断</span>
          </div>
          <p class="mt-1 text-xs text-text-tertiary">终身免费更新 · 3 台设备</p>
        </div>
        
        {/* 购买按钮 */}
        <Button variant="primary" block onClick={handlePurchase}>
          立即购买
        </Button>
        
        {/* 分割线 */}
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-primary" />
          </div>
          <div class="relative flex justify-center">
            <span class="px-2 bg-bg-secondary text-xs text-text-tertiary">或</span>
          </div>
        </div>
        
        {/* 激活 License */}
        <div class="space-y-3">
          <h4 class="text-sm font-medium text-text-primary">激活 License</h4>
          <input
            type="text"
            class="w-full px-3 py-2 rounded-lg bg-bg-tertiary text-text-primary text-sm border border-transparent focus:border-accent outline-none"
            placeholder="输入 License Key"
            value={licenseKey()}
            onInput={(e) => {
              setLicenseKey(e.currentTarget.value);
              setError(null);
            }}
          />
          
          <Show when={error()}>
            <p class="text-xs text-red-400">{error()}</p>
          </Show>
          
          <Button
            variant="secondary"
            block
            loading={settingsStore.isValidating()}
            onClick={handleActivate}
          >
            激活
          </Button>
        </div>
      </div>
    </Modal>
  );
}
