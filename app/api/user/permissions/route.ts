import { createApiHandler } from '@/lib/api-handler';
import type { EVOPermissions } from '@/types/alice';

/**
 * GET /api/user/permissions - 获取用户EVO权限信息
 */
export const GET = createApiHandler<EVOPermissions>(
  async ({ client }) => {
    return await client.getEVOPermissions();
  },
  '获取EVO权限失败'
);
