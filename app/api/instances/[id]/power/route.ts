import { createApiHandlerWithParams } from '@/lib/api-handler';
import type { PowerParams } from '@/types/alice';

/**
 * POST /api/instances/[id]/power - 执行电源操作
 */
export const POST = createApiHandlerWithParams<string>(
  async ({ client, request, params }) => {
    const body: { action: PowerParams['action'] } = await request.json();
    const message = await client.powerInstance({
      id: params!.id,
      action: body.action,
    });
    return { message };
  },
  '电源操作失败'
);
