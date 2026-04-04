import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Eye,
  Scissors,
  FileText,
  Timer,
  Monitor,
  ImagePlus,
  Code,
  ChevronRight,
  Settings,
  AlertCircle,
} from 'lucide-react'
import { createMessage } from '@shared/messages'
import type { CaptureRequestPayload } from '@shared/messages'
import { useSettingsStore } from '@shared/stores/settings-store'
import { useShortcutListener } from '@shared/hooks/useShortcutListener'
import { DEFAULT_SETTINGS } from '@shared/constants'

/* eslint-disable no-console */

// 受限页面 URL 前缀
const RESTRICTED_URL_PREFIXES = [
  'chrome://',
  'chrome-extension://',
  'about:',
  'devtools://',
  'edge://',
  'brave://',
] as const;

function isRestrictedUrl(url?: string): boolean {
  if (!url) return true;
  return RESTRICTED_URL_PREFIXES.some((prefix) => url.startsWith(prefix));
}

function handleVisibleCapture(): void {
  const message = createMessage<CaptureRequestPayload>('CAPTURE_REQUEST', {
    mode: 'visible',
  });
  chrome.runtime.sendMessage(message, (response) => {
    if (chrome.runtime.lastError) {
      console.error('[CodeFrame] 消息发送失败:', chrome.runtime.lastError.message);
      return;
    }
    console.log('[CodeFrame] 截图响应:', response);
  });
  setTimeout(() => window.close(), 100);
}

function handleRegionCapture(): void {
  const message = createMessage<CaptureRequestPayload>('CAPTURE_REQUEST', {
    mode: 'region',
  });
  chrome.runtime.sendMessage(message, (_response) => {
    if (chrome.runtime.lastError) {
      console.error('[CodeFrame] 消息发送失败:', chrome.runtime.lastError.message);
      return;
    }
    window.close();
  });
}

function handleFullPageCapture(): void {
  const message = createMessage<CaptureRequestPayload>('CAPTURE_REQUEST', {
    mode: 'fullpage',
  });

  const button = document.activeElement as HTMLButtonElement;

  chrome.runtime.sendMessage(message, (response) => {
    if (chrome.runtime.lastError) {
      console.error('[CodeFrame] 消息发送失败:', chrome.runtime.lastError.message);
      alert('截图失败: ' + chrome.runtime.lastError.message);
      window.close();
      return;
    }

    console.log('[CodeFrame] 整页截图响应:', response);

    if (response && response.success) {
      window.close();
    } else {
      const errorMsg = response?.error || '整页截图失败';
      alert('截图失败: ' + errorMsg);
      if (button) {
        button.disabled = false;
      }
    }
  });

  if (button) {
    button.disabled = true;
  }
}

function handleDelayedCapture(delay: number): void {
  const message = createMessage<CaptureRequestPayload>('CAPTURE_REQUEST', {
    mode: 'delayed',
    delay,
  });
  chrome.runtime.sendMessage(message, (response) => {
    if (chrome.runtime.lastError) {
      console.error('[CodeFrame] 消息发送失败:', chrome.runtime.lastError.message);
      return;
    }
    console.log('[CodeFrame] 延时截图响应:', response);
  });
  setTimeout(() => window.close(), 100);
}

function handleOpenEditor(): void {
  chrome.tabs.create({
    url: chrome.runtime.getURL('src/editor/index.html?source=upload'),
  });
  window.close();
}

function handleOpenCodeEditor(): void {
  chrome.tabs.create({
    url: chrome.runtime.getURL('src/codegen/index.html'),
  });
  window.close();
}

function handleOpenSettings(): void {
  chrome.tabs.create({
    url: chrome.runtime.getURL('src/options/index.html'),
  });
  window.close();
}

function handleDesktopCapture(): void {
  const message = createMessage<CaptureRequestPayload>('CAPTURE_REQUEST', {
    mode: 'desktop',
  });
  chrome.runtime.sendMessage(message, (response) => {
    if (chrome.runtime.lastError) {
      console.error('[CodeFrame] 消息发送失败:', chrome.runtime.lastError.message);
      return;
    }
    if (response && response.success) {
      window.close();
    } else {
      const errorMsg = response?.error || '桌面截图失败';
      alert('截图失败: ' + errorMsg);
    }
  });
}

interface ActionBtnProps {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  disabled?: boolean
}

const ActionBtn: React.FC<ActionBtnProps> = ({ icon, label, onClick, disabled }) => (
  <button
    onClick={onClick}
    className="action-btn flex-1"
    disabled={disabled}
    style={disabled ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
  >
    {icon}
    <span className="text-[12px] leading-none text-foreground font-body">
      {label}
    </span>
  </button>
)

interface FeatureItemProps {
  icon: React.ReactNode
  label: string
  suffix?: string
  onClick?: () => void
  disabled?: boolean
}

const FeatureItem: React.FC<FeatureItemProps> = ({
  icon,
  label,
  suffix,
  onClick,
  disabled,
}) => (
  <button
    onClick={onClick}
    className="feature-item"
    disabled={disabled}
    style={disabled ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
  >
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-[13px] leading-none text-foreground font-body">
        {label}
      </span>
    </div>
    <div className="flex items-center gap-1">
      {suffix && (
        <span className="text-[12px] leading-none text-foreground/50 font-body">
          {suffix}
        </span>
      )}
      <ChevronRight size={16} className="text-foreground/25" />
    </div>
  </button>
)

const App: React.FC = () => {
  const { t } = useTranslation('popup')
  const [isRestricted, setIsRestricted] = useState(false)
  const { settings, isLoading } = useSettingsStore()

  // 从设置中获取延迟时间，未加载时使用默认值
  const delayTime = isLoading ? DEFAULT_SETTINGS.delayTime : settings.delayTime

  useEffect(() => {
    // 检测当前页面是否为受限页面
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url
      setIsRestricted(isRestrictedUrl(url))
    })
  }, [])

  // 页面快捷键监听
  useShortcutListener({
    captureVisible: handleVisibleCapture,
    captureRegion: handleRegionCapture,
    captureFullpage: handleFullPageCapture,
    captureDesktop: handleDesktopCapture,
  })

  return (
    <div className="popup-container w-[363px] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between h-[47px] px-4 shrink-0">
        <div className="flex items-center gap-[10px]">
          <img
            src="/icons/icon48.png"
            alt="CodeFrame"
            className="w-[28px] h-[28px] rounded-[8px]"
          />
          <span className="text-[16px] font-semibold leading-none text-foreground font-heading">
            {t('header.title')}
          </span>
        </div>
        <div className="flex items-center">
          <button
            aria-label={t('header.settings')}
            className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center cursor-pointer transition-colors duration-200 hover:brightness-125"
            style={{ backgroundColor: 'var(--color-header-btn)' }}
            onClick={handleOpenSettings}
          >
            <Settings
              size={15}
              style={{ color: 'var(--color-icon-muted)' }}
            />
          </button>
        </div>
      </header>

      {/* 受限页面提示 */}
      {isRestricted && (
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
            <AlertCircle size={14} className="text-amber-600" />
            <span className="text-[11px] text-amber-700 font-body">
              {t('hint.restrictedPage')}
            </span>
          </div>
        </div>
      )}

      {/* ActionRow */}
      <div className="flex items-center justify-center gap-2 px-3 py-3">
        <ActionBtn
          icon={<Eye size={26} style={{ color: 'var(--color-accent-orange)' }} />}
          label={t('action.visible')}
          onClick={handleVisibleCapture}
          disabled={isRestricted}
        />
        <ActionBtn
          icon={<Scissors size={26} style={{ color: 'var(--color-accent-teal)' }} />}
          label={t('action.region')}
          onClick={handleRegionCapture}
          disabled={isRestricted}
        />
        <ActionBtn
          icon={<FileText size={26} style={{ color: 'var(--color-accent-orange)' }} />}
          label={t('action.fullpage')}
          onClick={handleFullPageCapture}
          disabled={isRestricted}
        />
      </div>

      {/* FeatureList */}
      <div className="feature-list px-3 py-2 flex flex-col gap-1">
        <FeatureItem
          icon={<Timer size={18} style={{ color: 'var(--color-accent-orange)' }} />}
          label={t('feature.delayed')}
          suffix={`${delayTime}s`}
          onClick={() => handleDelayedCapture(delayTime)}
          disabled={isRestricted}
        />
        <FeatureItem
          icon={<Monitor size={18} style={{ color: 'var(--color-accent-teal)' }} />}
          label={t('feature.desktop')}
          onClick={handleDesktopCapture}
          // 桌面截图功能暂时禁用，见桌面截图实现总结文档
        />
        <FeatureItem
          icon={<ImagePlus size={18} style={{ color: 'var(--color-accent-orange)' }} />}
          label={t('feature.editImage')}
          onClick={handleOpenEditor}
        />
        <FeatureItem
          icon={<Code size={18} style={{ color: 'var(--color-accent-teal)' }} />}
          label={t('feature.codeEditor')}
          onClick={handleOpenCodeEditor}
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer */}
      <footer className="flex items-center justify-center h-[35px] shrink-0">
        <span
          className="text-[10px] leading-none font-body"
          style={{ color: 'var(--color-footer-text)' }}
        >
          {t('footer.shortcuts')}
        </span>
      </footer>
    </div>
  )
}

export default App
