import { aliceApiRequest } from '@/lib/alice-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const endpoint = `/${params.path.join('/')}`;
    const data = await aliceApiRequest(endpoint, { method: 'GET' });
    return NextResponse.json(data);
  } catch (error) {
    console.error('API 错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const endpoint = `/${params.path.join('/')}`;
    const body = await request.json();
    const data = await aliceApiRequest(endpoint, { method: 'POST', body });
    return NextResponse.json(data);
  } catch (error) {
    console.error('API 错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
