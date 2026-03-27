import { defineConfig } from 'wxt';

// https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-solid'],
  srcDir: 'src',
  
  manifest: {
    name: 'CodeFrame - Code & Screenshot Beautifier',
    description: 'Frame your code beautifully. Transform code into stunning screenshots and beautify any screenshot with device frames.',
    version: '1.0.0',
    
    permissions: [
      'activeTab',
      'storage',
      'clipboardWrite',
      'tabs',
    ],
    
    host_permissions: [
      'https://api.lemonsqueezy.com/*',
    ],
    
    action: {
      default_title: 'CodeFrame',
    },
  },
  
  // options 页面在新标签页打开
  entrypointsDir: 'entrypoints',
  
  dev: {
    server: {
      port: 3000,
    },
  },
  
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
