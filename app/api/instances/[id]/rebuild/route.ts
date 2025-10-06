import { createApiHandlerWithParams } from '@/lib/api-handler';
import type { RebuildParams, RebuildResponse } from '@/types/alice';

/**
 * POST /api/instances/[id]/rebuild - 重建实例
 */
export const POST = createApiHandlerWithParams<RebuildResponse>(
  async ({ client, request, params }) => {
    const body: Omit<RebuildParams, 'id'> = await request.json();
    return await client.rebuildInstance({
      id: params!.id,
      os: body.os,
      sshKey: body.sshKey,
    });
  },
  '重建实例失败'
);
