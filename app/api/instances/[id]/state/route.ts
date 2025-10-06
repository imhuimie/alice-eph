import { createApiHandlerWithParams } from '@/lib/api-handler';
import type { StateResponse } from '@/types/alice';

/**
 * GET /api/instances/[id]/state - 获取实例状态
 */
export const GET = createApiHandlerWithParams<StateResponse>(
  async ({ client, params }) => {
    return await client.getInstanceState(params!.id);
  },
  '获取实例状态失败'
);
