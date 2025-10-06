import { createAliceClient } from '@/lib/alice-client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/alice/plans/[id]/os - 根据方案获取可用操作系统
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const client = createAliceClient(token);

    const osGroups = await client.getOSByPlan(params.id);

    return NextResponse.json({
      success: true,
      data: osGroups,
    });
  } catch (error) {
    console.error('获取操作系统列表失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取操作系统列表失败',
      },
      { status: 500 }
    );
  }
}
