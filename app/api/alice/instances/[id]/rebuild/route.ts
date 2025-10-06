import { createAliceClient } from '@/lib/alice-client';
import type { RebuildParams } from '@/types/alice';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/alice/instances/[id]/rebuild - 重建实例
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const client = createAliceClient(token);

    const body: Omit<RebuildParams, 'id'> = await request.json();

    const result = await client.rebuildInstance({
      id: params.id,
      os: body.os,
      sshKey: body.sshKey,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('重建实例失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '重建实例失败',
      },
      { status: 500 }
    );
  }
}
