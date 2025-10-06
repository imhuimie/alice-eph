import { createAliceClient } from '@/lib/alice-client';
import type { DeployParams } from '@/types/alice';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/alice/instances - 获取所有实例列表
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const client = createAliceClient(token);
    
    const instances = await client.listInstances();
    
    return NextResponse.json({
      success: true,
      data: instances,
    });
  } catch (error) {
    console.error('获取实例列表失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取实例列表失败',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/alice/instances - 部署新实例
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const client = createAliceClient(token);
    
    const body: DeployParams = await request.json();
    
    const result = await client.deployInstance(body);
    
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('部署实例失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '部署实例失败',
      },
      { status: 500 }
    );
  }
}
