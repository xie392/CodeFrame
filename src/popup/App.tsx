import React from 'react'
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
} from 'lucide-react'
import { createMessage } from '@shared/messages'
import type { CaptureRequestPayload } from '@shared/messages'

/* eslint-disable no-console */

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
  // 延迟关闭确保消息已派发到 Service Worker
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
    // 等待 Background 确认后再关闭 Popup
    window.close();
  });
}

function handleFullPageCapture(): void {
  const message = createMessage<CaptureRequestPayload>('CAPTURE_REQUEST', {
    mode: 'fullpage',
  });

  // 显示加载状态，不立即关闭 popup
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
      // 成功后再关闭 popup
      window.close();
    } else {
      // 失败时显示错误，不关闭 popup
      const errorMsg = response?.error || '整页截图失败';
      alert('截图失败: ' + errorMsg);
      // 恢复按钮状态
      if (button) {
        button.disabled = false;
      }
    }
  });

  // 禁用按钮防止重复点击
  if (button) {
    button.disabled = true;
  }
}

interface ActionBtnProps {
  icon: React.ReactNode
  label: string
  onClick?: () => void
}

const ActionBtn: React.FC<ActionBtnProps> = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="action-btn flex-1">
    {icon}
    <span className="text-[12px] leading-none text-foreground font-body">
      {label}
    </span>
  </button>
)

interface FeatureItemProps {
  icon: React.ReactNode
  label: string
  onClick?: () => void
}

const FeatureItem: React.FC<FeatureItemProps> = ({
  icon,
  label,
  onClick,
}) => (
  <button onClick={onClick} className="feature-item">
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-[13px] leading-none text-foreground font-body">
        {label}
      </span>
    </div>
    <ChevronRight
      size={16}
      className="text-foreground/25"
    />
  </button>
)

const App: React.FC = () => {
  return (
    <div className="popup-container w-[363px] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between h-[47px] px-4 shrink-0">
        <div className="flex items-center gap-[10px]">
          <div
            className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-accent-orange)' }}
          >
            <span
              className="text-[13px] font-bold leading-none"
              style={{ color: 'var(--color-logo-text)' }}
            >
              CF
            </span>
          </div>
          <span className="text-[16px] font-semibold leading-none text-foreground font-heading">
            CodeFrame
          </span>
        </div>
        <div className="flex items-center">
          <button
            aria-label="设置"
            className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center cursor-pointer transition-colors duration-200 hover:brightness-125"
            style={{ backgroundColor: 'var(--color-header-btn)' }}
          >
            <Settings
              size={15}
              style={{ color: 'var(--color-icon-muted)' }}
            />
          </button>
        </div>
      </header>

      {/* ActionRow */}
      <div className="flex items-center justify-center gap-2 px-3 py-3">
        <ActionBtn
          icon={<Eye size={26} style={{ color: 'var(--color-accent-orange)' }} />}
          label="可视截图"
          onClick={handleVisibleCapture}
        />
        <ActionBtn
          icon={<Scissors size={26} style={{ color: 'var(--color-accent-teal)' }} />}
          label="选择区域"
          onClick={handleRegionCapture}
        />
        <ActionBtn
          icon={<FileText size={26} style={{ color: 'var(--color-accent-orange)' }} />}
          label="整页截图"
          onClick={handleFullPageCapture}
        />
      </div>

      {/* FeatureList */}
      <div className="feature-list px-3 py-2 flex flex-col gap-1">
        <FeatureItem
          icon={<Timer size={18} style={{ color: 'var(--color-accent-orange)' }} />}
          label="延时截取可视区域"
          onClick={() => console.log('delayed capture')}
        />
        <FeatureItem
          icon={<Monitor size={18} style={{ color: 'var(--color-accent-teal)' }} />}
          label="全屏截图"
          onClick={() => console.log('desktop capture')}
        />
        <FeatureItem
          icon={<ImagePlus size={18} style={{ color: 'var(--color-accent-orange)' }} />}
          label="编辑本地或粘贴图片"
          onClick={() => console.log('local image')}
        />
        <FeatureItem
          icon={<Code size={18} style={{ color: 'var(--color-accent-teal)' }} />}
          label="代码编辑器"
          onClick={() => console.log('code editor')}
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
          快捷键: Alt+Shift+S 可视截图, R 选择区域, C 代码编辑器
          {/* // alt+shift+s visible . alt+shift+r region . alt+shift+c code */}
        </span>
      </footer>
    </div>
  )
}

export default App
