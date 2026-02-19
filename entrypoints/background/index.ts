export default defineBackground(() => {
  console.log('Web HTTP Request 后台服务已启动');
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SEND_REQUEST') {
      handleRequest(message.payload)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ error: error.message }));
      return true;
    }
  });

  async function handleRequest(payload: {
    url: string;
    method: 'GET' | 'POST';
    cookies?: Array<{ name: string; value: string }>;
    domain?: string;
    body?: string;
    headers?: Record<string, string>;
  }) {
    const { url, method, cookies, domain, body, headers: customHeaders } = payload;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (cookies?.length) {
      headers['Cookie'] = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    }

    if (domain) headers['X-Source-Domain'] = domain;

    const options: RequestInit = { method, headers };

    if (method === 'POST' && body) {
      try {
        options.body = JSON.stringify(JSON.parse(body));
      } catch {
        options.body = body;
      }
    }

    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type');
    const data = contentType?.includes('application/json') ? await response.json() : await response.text();

    return { status: response.status, data, headers: Object.fromEntries(response.headers.entries()) };
  }
});
