import { createAliceClient } from '@/lib/alice-client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/alice/instances/[id]/state - 获取实例状态
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const client = createAliceClient(token);

    const result = await client.getInstanceState(params.id);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('获取实例状态失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取实例状态失败',
      },
      { status: 500 }
    );
  }
}
