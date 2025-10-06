import { createAliceClient } from '@/lib/alice-client';
import type { PowerParams } from '@/types/alice';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/alice/instances/[id]/power - 执行电源操作
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const client = createAliceClient(token);

    const body: { action: PowerParams['action'] } = await request.json();

    const message = await client.powerInstance({
      id: params.id,
      action: body.action,
    });

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error('电源操作失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '电源操作失败',
      },
      { status: 500 }
    );
  }
}
