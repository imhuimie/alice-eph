import { NextRequest, NextResponse } from 'next/server';
import { AliceClient, createAliceClient } from './alice-client';

/**
 * API 响应类型
 */
interface ApiSuccessResponse<T = unknown> {
  success: true;
  data?: T;
  message?: string;
}

interface ApiErrorResponse {
  success: false;
  error: string;
}

type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * API 处理器上下文
 */
interface ApiContext {
  client: AliceClient;
  request: NextRequest;
  params?: Record<string, string>;
}

/**
 * API 处理器返回类型
 */
interface ApiHandlerResult<T = unknown> {
  data?: T;
  message?: string;
}

/**
 * API 处理器函数类型
 */
type ApiHandler<T = unknown> = (
  context: ApiContext
) => Promise<T | ApiHandlerResult<T>>;

/**
 * 从请求头中提取 token
 */
function extractToken(request: NextRequest): string | undefined {
  const authHeader = request.headers.get('authorization');
  return authHeader?.replace('Bearer ', '');
}

/**
 * 创建统一的 API 处理器
 * 
 * @param handler - API 业务逻辑处理函数
 * @param errorMessage - 自定义错误消息前缀
 * @returns Next.js 路由处理函数
 */
export function createApiHandler<T = unknown>(
  handler: ApiHandler<T>,
  errorMessage: string
) {
  return async (
    request: NextRequest,
    context?: { params: Record<string, string> }
  ): Promise<NextResponse<ApiResponse<T>>> => {
    try {
      // 提取 token 并创建客户端
      const token = extractToken(request);
      const client = createAliceClient(token);

      // 执行业务逻辑
      const result = await handler({
        client,
        request,
        params: context?.params,
      });

      // 处理返回结果
      if (result && typeof result === 'object' && ('data' in result || 'message' in result)) {
        const handlerResult = result as ApiHandlerResult<T>;
        return NextResponse.json({
          success: true,
          data: handlerResult.data,
          message: handlerResult.message,
        } as ApiSuccessResponse<T>);
      }

      return NextResponse.json({
        success: true,
        data: result as T,
      } as ApiSuccessResponse<T>);
    } catch (error) {
      console.error(`${errorMessage}:`, error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : errorMessage,
        },
        { status: 500 }
      );
    }
  };
}

/**
 * 创建需要 params 的 API 处理器
 */
export function createApiHandlerWithParams<T = unknown>(
  handler: ApiHandler<T>,
  errorMessage: string
) {
  return async (
    request: NextRequest,
    { params }: { params: Record<string, string> }
  ): Promise<NextResponse<ApiResponse<T>>> => {
    try {
      const token = extractToken(request);
      const client = createAliceClient(token);

      const result = await handler({
        client,
        request,
        params,
      });

      if (result && typeof result === 'object' && ('data' in result || 'message' in result)) {
        const handlerResult = result as ApiHandlerResult<T>;
        return NextResponse.json({
          success: true,
          data: handlerResult.data,
          message: handlerResult.message,
        } as ApiSuccessResponse<T>);
      }

      return NextResponse.json({
        success: true,
        data: result as T,
      } as ApiSuccessResponse<T>);
    } catch (error) {
      console.error(`${errorMessage}:`, error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : errorMessage,
        },
        { status: 500 }
      );
    }
  };
}
