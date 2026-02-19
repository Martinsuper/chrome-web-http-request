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
    },
  },
});
