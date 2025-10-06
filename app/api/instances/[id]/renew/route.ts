import { createApiHandlerWithParams } from '@/lib/api-handler';
import type { RenewalParams, RenewalResponse } from '@/types/alice';

/**
 * POST /api/instances/[id]/renew - 续订实例
 */
export const POST = createApiHandlerWithParams<RenewalResponse>(
  async ({ client, request, params }) => {
    const body: Omit<RenewalParams, 'id'> = await request.json();
    return await client.renewInstance({
      id: params!.id,
      time: body.time,
    });
  },
  '续订实例失败'
);
