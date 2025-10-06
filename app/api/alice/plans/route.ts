import { createAliceClient } from '@/lib/alice-client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/alice/plans - 获取所有可用方案
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const client = createAliceClient(token);

    const plans = await client.listPlans();

    return NextResponse.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error('获取方案列表失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取方案列表失败',
      },
      { status: 500 }
    );
  }
}
