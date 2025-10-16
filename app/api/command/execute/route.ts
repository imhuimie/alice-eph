import { createApiHandler } from '@/lib/api-handler';
import type { ExecuteCommandParams, ExecuteCommandResponse } from '@/types/alice';

/**
 * POST /api/command/execute - 异步执行命令
 */
export const POST = createApiHandler<ExecuteCommandResponse>(
  async ({ client, request }) => {
    const body: ExecuteCommandParams = await request.json();
    return await client.executeCommandAsync(body);
  },
  '执行命令失败'
);