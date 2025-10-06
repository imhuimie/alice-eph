import { createApiHandler } from '@/lib/api-handler';
import type { DeployParams, DeployResponse, Instance } from '@/types/alice';

/**
 * GET /api/instances - 获取所有实例列表
 */
export const GET = createApiHandler<Instance[]>(
  async ({ client }) => {
    return await client.listInstances();
  },
  '获取实例列表失败'
);

/**
 * POST /api/instances - 部署新实例
 */
export const POST = createApiHandler<DeployResponse>(
  async ({ client, request }) => {
    const body: DeployParams = await request.json();
    return await client.deployInstance(body);
  },
  '部署实例失败'
);
