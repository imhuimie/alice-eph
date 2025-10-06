// Alice API 客户端库

const ALICE_API_BASE_URL = process.env.ALICE_API_BASE_URL || 'https://app.alice.ws/cli/v1';
const ALICE_API_TOKEN = process.env.ALICE_API_TOKEN || '';

interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: Record<string, string>;
}

export async function aliceApiRequest(endpoint: string, options: RequestOptions = {}) {
  const { method = 'GET', body } = options;
  
  const url = `${ALICE_API_BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    'Authorization': `Bearer ${ALICE_API_TOKEN}`,
  };

  let requestBody: FormData | undefined;
  
  if (method === 'POST' && body) {
    requestBody = new FormData();
    Object.entries(body).forEach(([key, value]) => {
      requestBody!.append(key, value);
    });
  }

  const response = await fetch(url, {
    method,
    headers,
    body: requestBody,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API 错误：状态码 ${response.status}, 响应体: ${text}`);
  }

  return response.json();
}
