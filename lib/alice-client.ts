// Alice API 客户端库
import type {
  APIResponse,
  DeployParams,
  DeployResponse,
  EVOPermissions,
  ExecuteCommandParams,
  ExecuteCommandResponse,
  GetCommandResultParams,
  GetCommandResultResponse,
  Instance,
  OSGroup,
  Plan,
  PowerParams,
  RebuildParams,
  RebuildResponse,
  RenewalParams,
  RenewalResponse,
  SSHKey,
  StateResponse,
  UserInfo,
} from '@/types/alice';

const ALICE_API_BASE_URL = process.env.ALICE_API_BASE_URL || 'https://app.alice.ws/cli/v1';

interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: Record<string, string>;
  token?: string;
}

/**
 * Alice API 请求基础函数
 */
async function aliceApiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<APIResponse<T>> {
  const { method = 'GET', body, token } = options;
  
  const apiToken = token || process.env.ALICE_API_TOKEN || '';
  
  if (!apiToken) {
    throw new Error('API Token 未提供');
  }
  
  const url = `${ALICE_API_BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    'Authorization': `Bearer ${apiToken}`,
  };

  let requestBody: FormData | undefined;
  
  if (method === 'POST' && body) {
    requestBody = new FormData();
    Object.entries(body).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        requestBody!.append(key, value);
      }
    });
  }

  const response = await fetch(url, {
    method,
    headers,
    body: requestBody,
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API 错误：状态码 ${response.status}, 响应体: ${text}`);
  }

  return response.json();
}

/**
 * Alice API 客户端类
 */
export class AliceClient {
  private token: string;

  constructor(token?: string) {
    this.token = token || process.env.ALICE_API_TOKEN || '';
  }

  /**
   * 列出所有实例
   */
  async listInstances(): Promise<Instance[]> {
    const response = await aliceApiRequest<Instance[]>(
      '/Evo/Instance',
      { token: this.token }
    );
    return response.data;
  }

  /**
   * 部署新实例
   */
  async deployInstance(params: DeployParams): Promise<DeployResponse> {
    const response = await aliceApiRequest<DeployResponse>(
      '/Evo/Deploy',
      {
        method: 'POST',
        body: {
          product_id: params.product_id,
          os_id: params.os_id,
          time: params.time,
          ...(params.sshKey && { sshKey: params.sshKey }),
          ...(params.bootScript && { bootScript: params.bootScript }),
        },
        token: this.token,
      }
    );
    return response.data;
  }

  /**
   * 销毁实例
   */
  async destroyInstance(id: string): Promise<string> {
    const response = await aliceApiRequest<unknown>(
      '/Evo/Destroy',
      {
        method: 'POST',
        body: { id },
        token: this.token,
      }
    );
    return response.message;
  }

  /**
   * 执行电源操作
   */
  async powerInstance(params: PowerParams): Promise<string> {
    const response = await aliceApiRequest<unknown>(
      '/Evo/Power',
      {
        method: 'POST',
        body: {
          id: params.id,
          action: params.action,
        },
        token: this.token,
      }
    );
    return response.message;
  }

  /**
   * 重建实例
   */
  async rebuildInstance(params: RebuildParams): Promise<RebuildResponse> {
    const response = await aliceApiRequest<RebuildResponse>(
      '/Evo/Rebuild',
      {
        method: 'POST',
        body: {
          id: params.id,
          os: params.os,
          ...(params.sshKey && { sshKey: params.sshKey }),
          ...(params.bootScript && { bootScript: params.bootScript }),
        },
        token: this.token,
      }
    );
    return response.data;
  }

  /**
   * 列出所有可用方案
   */
  async listPlans(): Promise<Plan[]> {
    const response = await aliceApiRequest<Plan[]>(
      '/Evo/Plan',
      { token: this.token }
    );
    return response.data;
  }

  /**
   * 根据方案获取可用操作系统
   */
  async getOSByPlan(planId: string): Promise<OSGroup[]> {
    const response = await aliceApiRequest<OSGroup[]>(
      '/Evo/getOSByPlan',
      {
        method: 'POST',
        body: { plan_id: planId },
        token: this.token,
      }
    );
    return response.data;
  }

  /**
   * 续订实例
   */
  async renewInstance(params: RenewalParams): Promise<RenewalResponse> {
    const response = await aliceApiRequest<RenewalResponse>(
      '/Evo/Renewal',
      {
        method: 'POST',
        body: {
          id: params.id,
          time: params.time,
        },
        token: this.token,
      }
    );
    return response.data;
  }

  /**
   * 获取实例状态
   */
  async getInstanceState(id: string): Promise<StateResponse> {
    const response = await aliceApiRequest<StateResponse>(
      '/Evo/State',
      {
        method: 'POST',
        body: { id },
        token: this.token,
      }
    );
    return response.data;
  }

  /**
   * 列出用户 SSH 密钥
   */
  async listSSHKeys(): Promise<SSHKey[]> {
    const response = await aliceApiRequest<SSHKey[]>(
      '/User/SSHKey',
      { token: this.token }
    );
    return response.data;
  }

  /**
   * 获取用户 EVO 权限
   */
  async getEVOPermissions(): Promise<EVOPermissions> {
    const response = await aliceApiRequest<EVOPermissions>(
      '/User/EVOPermissions',
      { token: this.token }
    );
    return response.data;
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(): Promise<UserInfo> {
    const response = await aliceApiRequest<UserInfo>(
      '/User/Info',
      { token: this.token }
    );
    return response.data;
  }

  /**
   * 异步执行命令
   */
  async executeCommandAsync(params: ExecuteCommandParams): Promise<ExecuteCommandResponse> {
    const response = await aliceApiRequest<ExecuteCommandResponse>(
      '/Command/executeAsync',
      {
        method: 'POST',
        body: {
          server_id: params.server_id,
          command: params.command,
        },
        token: this.token,
      }
    );
    return response.data;
  }

  /**
   * 获取命令执行结果
   */
  async getCommandResult(params: GetCommandResultParams): Promise<GetCommandResultResponse> {
    const response = await aliceApiRequest<GetCommandResultResponse>(
      '/Command/getResult',
      {
        method: 'POST',
        body: {
          command_uid: params.command_uid,
          ...(params.output_base64 && { output_base64: params.output_base64 }),
        },
        token: this.token,
      }
    );
    return response.data;
  }
}

/**
 * 创建 Alice API 客户端实例
 */
export function createAliceClient(token?: string): AliceClient {
  return new AliceClient(token);
}

/**
 * 导出单个API请求函数供服务端路由使用
 */
export { aliceApiRequest };

