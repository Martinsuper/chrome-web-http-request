import { defineConfig } from 'wxt';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  vite: () => ({
    plugins: [vue()],
  }),
  outDir: 'dist',
  manifest: {
    name: 'Web HTTP Request',
    description: 'Cookie 管理和 HTTP 请求工具',
    version: '1.1.0',
    permissions: [
      'cookies',
      'activeTab',
      'tabs',
      'storage',
    ],
    host_permissions: [
      '<all_urls>',
    ],
    action: {
      default_title: 'Web HTTP Request',
      default_icon: {
        '16': 'icon-16.png',
        '48': 'icon-48.png',
        '128': 'icon-128.png',
      },
    },
    icons: {
      '16': 'icon-16.png',
      '48': 'icon-48.png',
      '128': 'icon-128.png',
    },
  },
});
