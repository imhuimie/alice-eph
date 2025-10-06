import { createAliceClient } from '@/lib/alice-client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/alice/user/info - 获取用户信息
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const client = createAliceClient(token);

    const userInfo = await client.getUserInfo();

    return NextResponse.json({
      success: true,
      data: userInfo,
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取用户信息失败',
      },
      { status: 500 }
    );
  }
}
