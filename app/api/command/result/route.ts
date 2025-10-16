import { createApiHandler } from '@/lib/api-handler';
import type { GetCommandResultParams, GetCommandResultResponse } from '@/types/alice';

/**
 * POST /api/command/result - 获取命令执行结果
 */
export const POST = createApiHandler<GetCommandResultResponse>(
  async ({ client, request }) => {
    const body: GetCommandResultParams = await request.json();
    return await client.getCommandResult(body);
  },
  '获取命令结果失败'
);