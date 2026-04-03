import React from 'react';
import ReactDOM from 'react-dom/client';
import { initI18n, setupLanguageListener } from '@shared/i18n';
import App from './App';
import '../styles/globals.css';

// 初始化 i18n 并渲染应用
async function bootstrap() {
  await initI18n();
  setupLanguageListener();
  
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap();
