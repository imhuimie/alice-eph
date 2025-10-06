import { createAliceClient } from '@/lib/alice-client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * DELETE /api/alice/instances/[id] - 销毁实例
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const client = createAliceClient(token);

    const message = await client.destroyInstance(params.id);

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error('销毁实例失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '销毁实例失败',
      },
      { status: 500 }
    );
  }
}
