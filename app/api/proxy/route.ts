import { NextRequest, NextResponse } from 'next/server';

const ALICE_API_BASE_URL = 'https://app.alice.ws/cli/v1';

export async function POST(request: NextRequest) {
  try {
    const { endpoint, method, body, token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: '缺少 API Token' },
        { status: 401 }
      );
    }

    const url = `${ALICE_API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
    };

    let requestBody: FormData | undefined;
    
    if (method === 'POST' && body) {
      requestBody = new FormData();
      Object.entries(body).forEach(([key, value]) => {
        requestBody!.append(key, value as string);
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30秒超时

    try {
      const response = await fetch(url, {
        method: method || 'GET',
        headers,
        body: requestBody,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API 错误：状态码 ${response.status}, 响应体 ${text}`);
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (fetchError) {
      clearTimeout(timeout);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('请求超时，请检查网络连接');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('API 错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
