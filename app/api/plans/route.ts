import { createApiHandler } from '@/lib/api-handler';
import type { Plan } from '@/types/alice';

/**
 * GET /api/plans - 获取所有可用方案
 */
export const GET = createApiHandler<Plan[]>(
  async ({ client }) => {
    return await client.listPlans();
  },
  '获取方案列表失败'
);
