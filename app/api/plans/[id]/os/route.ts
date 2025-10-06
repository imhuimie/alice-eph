import { createApiHandlerWithParams } from '@/lib/api-handler';
import type { OSGroup } from '@/types/alice';

/**
 * GET /api/plans/[id]/os - 根据方案获取可用操作系统
 */
export const GET = createApiHandlerWithParams<OSGroup[]>(
  async ({ client, params }) => {
    return await client.getOSByPlan(params!.id);
  },
  '获取操作系统列表失败'
);
