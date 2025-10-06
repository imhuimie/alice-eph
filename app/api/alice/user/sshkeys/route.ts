import { createAliceClient } from '@/lib/alice-client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/alice/user/sshkeys - 获取用户SSH密钥列表
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const client = createAliceClient(token);

    const keys = await client.listSSHKeys();

    return NextResponse.json({
      success: true,
      data: keys,
    });
  } catch (error) {
    console.error('获取SSH密钥列表失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取SSH密钥列表失败',
      },
      { status: 500 }
    );
  }
}
