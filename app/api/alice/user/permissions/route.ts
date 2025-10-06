import { createAliceClient } from '@/lib/alice-client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/alice/user/permissions - 获取用户EVO权限信息
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const client = createAliceClient(token);

    const permissions = await client.getEVOPermissions();

    return NextResponse.json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    console.error('获取EVO权限失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取EVO权限失败',
      },
      { status: 500 }
    );
  }
}
