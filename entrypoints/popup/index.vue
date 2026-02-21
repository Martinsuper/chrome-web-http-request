<template>
  <div class="popup-container">
    <h1><font-awesome-icon :icon="['fas', 'globe']" /> Web HTTP Request</h1>

    <!-- 当前页面信息 -->
    <div class="section">
      <h2><font-awesome-icon :icon="['fas', 'info-circle']" /> 当前页面信息</h2>
      <div class="info-item">
        <label>域名:</label>
        <span class="value">{{ tabInfo.domain }}</span>
      </div>
      <div class="info-item">
        <label>URL:</label>
        <span class="value">{{ tabInfo.url }}</span>
      </div>
    </div>

    <!-- 请求配置 -->
    <div class="section">
      <h2><font-awesome-icon :icon="['fas', 'paper-plane']" /> 发起请求</h2>
      <div class="import-curl-wrapper">
        <button @click="showImportDialog = true" class="btn btn-secondary btn-import">
          导入 curl
        </button>
      </div>

      <div class="form-group">
        <label>请求方法:</label>
        <div class="radio-group">
          <label class="radio-label">
            <input type="radio" v-model="requestMethod" value="GET" />
            GET
          </label>
          <label class="radio-label">
            <input type="radio" v-model="requestMethod" value="POST" />
            POST
          </label>
        </div>
      </div>

      <div class="form-group">
        <label for="request-url">请求 URL:</label>
        <input
          id="request-url"
          v-model="requestUrl"
          type="text"
          placeholder="请输入请求地址"
          class="input"
        />
      </div>

      <div class="form-group" v-if="requestMethod === 'POST'">
        <label for="request-body">请求体 (JSON):</label>
        <textarea
          id="request-body"
          v-model="requestBody"
          placeholder='{"key": "value"}'
          class="textarea"
          rows="4"
        ></textarea>
      </div>

      <div class="form-group">
        <label for="custom-headers">自定义请求头 (JSON):</label>
        <textarea
          id="custom-headers"
          v-model="customHeaders"
          placeholder='{"Authorization": "Bearer token", "User-Agent": "MyApp"}'
          class="textarea"
          rows="3"
        ></textarea>
      </div>

      <div class="form-group">
        <label>
          <input type="checkbox" v-model="includeCookies" />
          携带 Cookies
        </label>
      </div>

      <div class="form-group">
        <label>
          <input type="checkbox" v-model="includeDomain" />
          包含域名信息
        </label>
      </div>

      <button @click="sendRequest" class="btn btn-primary" :disabled="loading">
        {{ loading ? '发送中...' : '发送请求' }}
      </button>
    </div>

    <!-- 响应结果 -->
    <div v-if="response" class="section response-section">
      <h2><font-awesome-icon :icon="['fas', 'server']" /> 响应结果</h2>
      <div class="response-status">
        状态码：<span :class="statusClass">{{ response.status }}</span>
      </div>
      <pre class="response-body">{{ response.body }}</pre>
    </div>

    <!-- 错误信息 -->
    <div v-if="error" class="section error-section">
      <h2><font-awesome-icon :icon="['fas', 'triangle-exclamation']" /> 错误信息</h2>
      <div class="error-message">{{ error }}</div>
    </div>

    <!-- 导入 curl 对话框 -->
    <div v-if="showImportDialog" class="modal-overlay" @click="showImportDialog = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>导入 curl 命令</h3>
          <button @click="showImportDialog = false" class="btn-close">×</button>
        </div>
        <div class="modal-body">
          <textarea
            v-model="importCurlText"
            placeholder="请粘贴 curl 命令，例如：&#10;curl -X POST 'https://api.example.com/data' &#10;  -H 'Authorization: Bearer token' &#10;  -d '{&quot;key&quot;:&quot;value&quot;}'"
            class="textarea curl-input"
            rows="6"
          ></textarea>
        </div>
        <div class="modal-footer">
          <button @click="showImportDialog = false" class="btn btn-secondary"><font-awesome-icon :icon="['fas', 'xmark']" /> 取消</button>
          <button @click="parseAndImport" class="btn btn-primary"><font-awesome-icon :icon="['fas', 'check']" /> 导入</button>
        </div>
      </div>
    </div>

    <!-- Cookies 信息 -->
    <div class="section">
      <h2><font-awesome-icon :icon="['fas', 'cookie']" /> Cookies (<span class="cookie-count">{{ cookies.length }}</span>)</h2>
      <div class="button-group">
        <button @click="refreshCookies" class="btn btn-secondary"><font-awesome-icon :icon="['fas', 'rotate']" /> 刷新</button>
        <button @click="copyCookies" class="btn btn-secondary" :disabled="cookies.length === 0">
          复制 Cookies
        </button>
        <button @click="copyAsCurl" class="btn btn-secondary" :disabled="cookies.length === 0 || !requestUrl">
          复制为 curl
        </button>
      </div>
      <div class="cookie-list">
        <div v-if="cookies.length === 0" class="empty-tip">暂无 Cookies</div>
        <div v-for="cookie in cookies" :key="cookie.name" class="cookie-item">
          <div class="cookie-name">{{ cookie.name }}</div>
          <div class="cookie-value">{{ cookie.value }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';

interface Cookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
}

interface TabInfo {
  url: string;
  domain: string;
  tabId?: number;
}

const cookies = ref<Cookie[]>([]);
const tabInfo = ref<TabInfo>({ url: '', domain: '' });
const requestMethod = ref<'GET' | 'POST'>('GET');
const requestUrl = ref('');
const requestBody = ref('');
const customHeaders = ref('');
const includeCookies = ref(true);
const includeDomain = ref(true);
const loading = ref(false);
const response = ref<{ status: number; body: string } | null>(null);
const error = ref('');
const showImportDialog = ref(false);
const importCurlText = ref('');

// 保存数据到 storage
async function saveData() {
  await chrome.storage.local.set({
    requestMethod: requestMethod.value,
    requestUrl: requestUrl.value,
    requestBody: requestBody.value,
    customHeaders: customHeaders.value,
    includeCookies: includeCookies.value,
    includeDomain: includeDomain.value,
  });
}

// 从 storage 加载数据
async function loadData() {
  const result = await chrome.storage.local.get([
    'requestMethod',
    'requestUrl',
    'requestBody',
    'customHeaders',
    'includeCookies',
    'includeDomain',
  ]);
  if (result.requestMethod) requestMethod.value = result.requestMethod;
  if (result.requestUrl) requestUrl.value = result.requestUrl;
  if (result.requestBody) requestBody.value = result.requestBody;
  if (result.customHeaders) customHeaders.value = result.customHeaders;
  if (result.includeCookies !== undefined) includeCookies.value = result.includeCookies;
  if (result.includeDomain !== undefined) includeDomain.value = result.includeDomain;
}

// 获取当前标签页信息
async function getTabInfo() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url) {
    const url = new URL(tab.url);
    tabInfo.value = {
      url: tab.url,
      domain: url.hostname,
      tabId: tab.id,
    };
  }
}

// 获取当前页面的 Cookies
async function refreshCookies() {
  if (!tabInfo.value.domain) await getTabInfo();

  const allCookies = await chrome.cookies.getAll({});
  const domain = tabInfo.value.domain;

  const filteredCookies = allCookies.filter(cookie => {
    if (cookie.domain) {
      const cookieDomain = cookie.domain.startsWith('.')
        ? cookie.domain.slice(1)
        : cookie.domain;
      return domain.includes(cookieDomain) || cookieDomain.includes(domain);
    }
    return false;
  });

  cookies.value = filteredCookies.map(cookie => ({
    name: cookie.name,
    value: cookie.value,
    domain: cookie.domain,
    path: cookie.path,
  }));
}

// 发送请求
async function sendRequest() {
  if (!requestUrl.value) {
    error.value = '请输入请求 URL';
    return;
  }

  loading.value = true;
  error.value = '';
  response.value = null;

  let headers = {};
  if (customHeaders.value) {
    try {
      headers = JSON.parse(customHeaders.value);
    } catch (err) {
      error.value = '自定义请求头格式错误：' + (err as Error).message;
      loading.value = false;
      return;
    }
  }

  try {
    const result = await chrome.runtime.sendMessage({
      type: 'SEND_REQUEST',
      payload: {
        url: requestUrl.value,
        method: requestMethod.value,
        cookies: includeCookies.value ? cookies.value : [],
        domain: includeDomain.value ? tabInfo.value.domain : '',
        body: requestMethod.value === 'POST' ? requestBody.value : undefined,
        headers,
      },
    });

    response.value = {
      status: result.status,
      body: typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2),
    };
  } catch (err) {
    error.value = '请求失败：' + (err as Error).message;
  } finally {
    loading.value = false;
  }
}

// 监听数据变化并自动保存
watch([requestMethod, requestUrl, requestBody, customHeaders, includeCookies, includeDomain], saveData, { deep: true });

// 复制 Cookies 为字符串格式
async function copyCookies() {
  if (cookies.value.length === 0) return;
  await navigator.clipboard.writeText(cookies.value.map(c => `${c.name}=${c.value}`).join('; '));
  showToast('Cookies 已复制');
}

// 复制为 curl 命令
async function copyAsCurl() {
  if (!requestUrl.value) return;

  const cookieString = cookies.value.length > 0 ? cookies.value.map(c => `${c.name}=${c.value}`).join('; ') : '';
  let headers = {};
  if (customHeaders.value) {
    try { headers = JSON.parse(customHeaders.value); } catch (e) {}
  }

  let curl = `curl -X ${requestMethod.value} "${requestUrl.value}"`;
  if (cookieString) curl += ` -H "Cookie: ${cookieString}"`;
  for (const [key, value] of Object.entries(headers)) {
    curl += ` -H "${key}: ${value}"`;
  }
  if (!headers['Content-Type'] && !headers['content-type']) {
    curl += ' -H "Content-Type: application/json"';
  }
  if (requestMethod.value === 'POST' && requestBody.value) {
    curl += ` -d '${requestBody.value}'`;
  }

  await navigator.clipboard.writeText(curl);
  showToast('curl 命令已复制');
}

// 显示提示消息
function showToast(message: string) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('toast-show'), 10);
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// 解析 curl 命令
function parseCurl(cmd: string) {
  cmd = cmd.trim().replace(/^curl\s+/, '').replace(/\\\n/g, ' ').replace(/\\ /g, ' ');

  const result: { url?: string; method: 'GET' | 'POST'; headers: Record<string, string>; body?: string } = {
    method: 'GET',
    headers: {},
  };

  const urlMatch = cmd.match(/(['"])(https?:\/\/[^'"]+)\1/);
  if (urlMatch) result.url = urlMatch[2];

  const methodMatch = cmd.match(/-X\s+(['"]?)(GET|POST|PUT|DELETE|PATCH)\1/i);
  if (methodMatch) result.method = methodMatch[2].toUpperCase() as 'GET' | 'POST';

  for (const match of cmd.matchAll(/-H\s+(['"])([^'"]+)\1/g)) {
    const [key, ...valueParts] = match[2].split(':');
    if (key && valueParts.length > 0) result.headers[key.trim()] = valueParts.join(':').trim();
  }

  const dataMatch = cmd.match(/-d\s+(['"])([\s\S]*?)\1/);
  if (dataMatch) result.body = dataMatch[2];

  return result;
}

// 解析并导入 curl
async function parseAndImport() {
  if (!importCurlText.value.trim()) {
    showToast('请输入 curl 命令');
    return;
  }

  const parsed = parseCurl(importCurlText.value);
  if (parsed.url) requestUrl.value = parsed.url;
  requestMethod.value = parsed.method;

  const customHeadersObj: Record<string, string> = {};
  let cookieHeader = '';

  for (const [key, value] of Object.entries(parsed.headers)) {
    if (key.toLowerCase() === 'cookie') cookieHeader = value;
    else if (key.toLowerCase() !== 'content-type') customHeadersObj[key] = value;
  }

  if (Object.keys(customHeadersObj).length > 0) customHeaders.value = JSON.stringify(customHeadersObj, null, 2);
  if (parsed.body) requestBody.value = parsed.body;

  if (cookieHeader) {
    const newCookies: Cookie[] = [];
    for (const pair of cookieHeader.split(';').map(c => c.trim()).filter(c => c)) {
      const [name, ...valueParts] = pair.split('=');
      if (name && valueParts.length > 0) newCookies.push({ name: name.trim(), value: valueParts.join('=').trim() });
    }
    if (newCookies.length > 0) cookies.value = newCookies;
  }

  showImportDialog.value = false;
  importCurlText.value = '';
  showToast('curl 命令导入成功');
  saveData();
}

onMounted(() => {
  loadData();
  getTabInfo();
  refreshCookies();
});
</script>

<style scoped>
.popup-container {
  width: 400px;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  color: #333;
}

h1 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
  text-align: center;
  color: #1a73e8;
}

h2 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #555;
}

.section {
  margin-bottom: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.info-item {
  display: flex;
  margin-bottom: 8px;
}

.info-item label {
  font-weight: 600;
  width: 60px;
  color: #666;
}

.info-item .value {
  flex: 1;
  word-break: break-all;
  color: #333;
}

.cookie-count {
  color: #1a73e8;
}

.cookie-list {
  max-height: 150px;
  overflow-y: auto;
  background: #fff;
  border-radius: 4px;
  padding: 8px;
}

.empty-tip {
  text-align: center;
  color: #999;
  padding: 20px;
}

.cookie-item {
  padding: 8px;
  border-bottom: 1px solid #eee;
}

.cookie-item:last-child {
  border-bottom: none;
}

.cookie-name {
  font-weight: 600;
  color: #1a73e8;
  margin-bottom: 4px;
}

.cookie-value {
  font-size: 12px;
  color: #666;
  word-break: break-all;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #555;
}

.radio-group {
  display: flex;
  gap: 16px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.input,
.textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.input:focus,
.textarea:focus {
  outline: none;
  border-color: #1a73e8;
  box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.1);
}

.textarea {
  resize: vertical;
  font-family: monospace;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  width: 100%;
  background: #1a73e8;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #1557b0;
}

.btn-secondary {
  background: #e8eaed;
  color: #333;
  font-size: 12px;
  padding: 6px 12px;
}

.btn-secondary:hover {
  background: #dadce0;
}

.response-section {
  background: #e8f5e9;
}

.error-section {
  background: #ffebee;
}

.response-status {
  margin-bottom: 8px;
}

.response-status span {
  font-weight: 600;
}

.status-success {
  color: #2e7d32;
}

.status-redirect {
  color: #f57c00;
}

.status-client-error {
  color: #d32f2f;
}

.status-server-error {
  color: #c62828;
}

.response-body {
  background: #fff;
  padding: 12px;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  font-size: 12px;
  margin: 0;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
}

.error-message {
  color: #c62828;
  padding: 8px;
  background: #ffcdd2;
  border-radius: 4px;
}

.button-group {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.button-group .btn {
  flex: 1;
}

.import-curl-wrapper {
  margin-bottom: 12px;
}

.btn-import {
  width: 100%;
}

/* 导入对话框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  border-radius: 8px;
  width: 360px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.btn-close:hover {
  background: #f5f5f5;
}

.modal-body {
  padding: 16px;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 12px 16px;
  border-top: 1px solid #eee;
}

.modal-footer .btn {
  min-width: 80px;
}

.curl-input {
  width: 100%;
  box-sizing: border-box;
  font-family: monospace;
  font-size: 12px;
  line-height: 1.5;
}

.toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%) translateY(100px);
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 13px;
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 1000;
  white-space: nowrap;
}

.toast.toast-show {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}
</style>
