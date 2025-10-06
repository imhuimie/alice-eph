import { createAliceClient } from '@/lib/alice-client';
import type { RenewalParams } from '@/types/alice';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/alice/instances/[id]/renew - 续订实例
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const client = createAliceClient(token);

    const body: Omit<RenewalParams, 'id'> = await request.json();

    const result = await client.renewInstance({
      id: params.id,
      time: body.time,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('续订实例失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '续订实例失败',
      },
      { status: 500 }
    );
  }
}
