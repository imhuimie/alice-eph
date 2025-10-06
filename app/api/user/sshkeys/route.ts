import { createApiHandler } from '@/lib/api-handler';
import type { SSHKey } from '@/types/alice';

/**
 * GET /api/user/sshkeys - 获取用户SSH密钥列表
 */
export const GET = createApiHandler<SSHKey[]>(
  async ({ client }) => {
    return await client.listSSHKeys();
  },
  '获取SSH密钥列表失败'
);
