import { createApiHandlerWithParams } from '@/lib/api-handler';

/**
 * DELETE /api/instances/[id] - 销毁实例
 */
export const DELETE = createApiHandlerWithParams<string>(
  async ({ client, params }) => {
    const message = await client.destroyInstance(params!.id);
    return { message };
  },
  '销毁实例失败'
);
