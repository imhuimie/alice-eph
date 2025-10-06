import { createApiHandler } from '@/lib/api-handler';
import type { UserInfo } from '@/types/alice';

/**
 * GET /api/user/info - 获取用户信息
 */
export const GET = createApiHandler<UserInfo>(
  async ({ client }) => {
    return await client.getUserInfo();
  },
  '获取用户信息失败'
);
