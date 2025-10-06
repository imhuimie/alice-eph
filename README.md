# Alice EVO 管理面板

这是一个使用 Next.js 构建的 Alice.ws EVO 实例管理 Web 应用,完整实现了 Alice EVO API 的所有功能。

## 功能特性

### 实例管理
- ✅ 查看所有实例列表
- ✅ 部署新实例
- ✅ 销毁实例
- ✅ 管理实例电源状态(启动/关机/重启/强制关机)
- ✅ 重建实例(重装系统)
- ✅ 续订实例
- ✅ 查看实例状态详情(CPU、内存、流量等)

### 方案和系统
- ✅ 查看所有可用方案
- ✅ 根据方案查询可用操作系统

### 用户管理
- ✅ 查看用户信息
- ✅ 查看 SSH 密钥列表
- ✅ 查看 EVO 权限信息

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd alice-eph
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env.local`:

```bash
cp .env.example .env.local
```

编辑 `.env.local` 并填入你的 API Token:

```env
ALICE_API_BASE_URL=https://app.alice.ws/cli/v1
ALICE_API_TOKEN=your_client_id:your_secret
```

> **注意**: API Token 格式为 `ClientID:Secret`

### 4. 运行开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

### 5. 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
alice-eph/
├── app/
│   ├── api/
│   │   └── alice/
│   │       ├── instances/           # 实例管理 API
│   │       │   ├── route.ts         # GET: 列表, POST: 部署
│   │       │   └── [id]/
│   │       │       ├── route.ts     # DELETE: 销毁
│   │       │       ├── power/       # POST: 电源操作
│   │       │       ├── rebuild/     # POST: 重建
│   │       │       ├── renew/       # POST: 续订
│   │       │       └── state/       # GET: 状态
│   │       ├── plans/               # 方案 API
│   │       │   ├── route.ts         # GET: 方案列表
│   │       │   └── [id]/os/         # GET: 可用操作系统
│   │       └── user/                # 用户 API
│   │           ├── info/            # GET: 用户信息
│   │           ├── sshkeys/         # GET: SSH密钥
│   │           └── permissions/     # GET: EVO权限
│   ├── page.tsx                     # 主页面
│   ├── layout.tsx                   # 布局
│   └── globals.css                  # 全局样式
├── lib/
│   └── alice-client.ts              # Alice API 客户端类
├── types/
│   └── alice.ts                     # TypeScript 类型定义
├── .env.example                     # 环境变量示例
├── .env.local                       # 环境变量配置(需自行创建)
├── API_DOCUMENTATION.md             # 完整 API 文档
└── package.json
```

## API 使用方法

### 方式一: 使用服务端 API 路由(推荐)

所有 API 端点都已实现为 Next.js API 路由,支持标准的 REST 请求:

```typescript
// 示例: 获取实例列表
const response = await fetch('/api/alice/instances', {
  headers: {
    'Authorization': 'Bearer YOUR_API_TOKEN'
  }
});
const data = await response.json();
```

详细的 API 端点文档请参见 [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### 方式二: 使用客户端类

```typescript
import { createAliceClient } from '@/lib/alice-client';

// 创建客户端实例
const client = createAliceClient('your_api_token');

// 使用客户端方法
const instances = await client.listInstances();
const plans = await client.listPlans();
```

## API 端点总览

### 实例管理 (Instances)

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/alice/instances` | 获取所有实例 |
| POST | `/api/alice/instances` | 部署新实例 |
| DELETE | `/api/alice/instances/{id}` | 销毁实例 |
| POST | `/api/alice/instances/{id}/power` | 电源操作 |
| POST | `/api/alice/instances/{id}/rebuild` | 重建实例 |
| POST | `/api/alice/instances/{id}/renew` | 续订实例 |
| GET | `/api/alice/instances/{id}/state` | 获取实例状态 |

### 方案管理 (Plans)

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/alice/plans` | 获取可用方案 |
| GET | `/api/alice/plans/{id}/os` | 获取方案的可用操作系统 |

### 用户管理 (User)

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/alice/user/info` | 获取用户信息 |
| GET | `/api/alice/user/sshkeys` | 获取SSH密钥列表 |
| GET | `/api/alice/user/permissions` | 获取EVO权限 |

详细的请求/响应格式请查看 [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **运行时**: Node.js 18+
- **API**: RESTful API with Next.js Route Handlers

## 与原 Go 客户端的对比

本项目完整实现了 `api_client.go` 中的所有功能:

| Go 函数 | TypeScript 实现 | API 端点 |
|---------|----------------|----------|
| `ListInstances()` | `client.listInstances()` | `GET /api/alice/instances` |
| `DeployInstance()` | `client.deployInstance()` | `POST /api/alice/instances` |
| `DestroyInstance()` | `client.destroyInstance()` | `DELETE /api/alice/instances/{id}` |
| `PowerInstance()` | `client.powerInstance()` | `POST /api/alice/instances/{id}/power` |
| `RebuildInstance()` | `client.rebuildInstance()` | `POST /api/alice/instances/{id}/rebuild` |
| `ListPlans()` | `client.listPlans()` | `GET /api/alice/plans` |
| `GetOSByPlan()` | `client.getOSByPlan()` | `GET /api/alice/plans/{id}/os` |
| `RenewInstance()` | `client.renewInstance()` | `POST /api/alice/instances/{id}/renew` |
| `GetInstanceState()` | `client.getInstanceState()` | `GET /api/alice/instances/{id}/state` |
| `ListSSHKeys()` | `client.listSSHKeys()` | `GET /api/alice/user/sshkeys` |
| `GetEVOPermissions()` | `client.getEVOPermissions()` | `GET /api/alice/user/permissions` |
| `GetUserInfo()` | `client.getUserInfo()` | `GET /api/alice/user/info` |

## 安全注意事项

1. **API Token 保护**: 
   - 永远不要将 `.env.local` 提交到版本控制
   - 在生产环境中使用环境变量管理 Token
   - Token 格式: `ClientID:Secret`

2. **HTTPS**: 
   - 生产环境中确保使用 HTTPS
   - API 通信已通过 HTTPS 加密

3. **权限控制**:
   - 确保只有授权用户可以访问管理面板
   - 建议在生产环境中添加身份验证层

## 开发指南

### 添加新的 API 端点

1. 在 `lib/alice-client.ts` 中添加客户端方法
2. 在 `app/api/alice/` 下创建对应的路由文件
3. 在 `types/alice.ts` 中定义相关类型
4. 更新 `API_DOCUMENTATION.md`

### 代码风格

项目使用 ESLint 和 TypeScript 进行代码检查:

```bash
npm run lint
```

## 常见问题

### Q: API Token 在哪里获取?
A: 登录 Alice.ws 控制面板,在 API 设置中生成 Client ID 和 Secret。

### Q: 支持哪些 Node.js 版本?
A: 推荐使用 Node.js 18 或更高版本。

### Q: 如何部署到生产环境?
A: 使用 `npm run build` 构建后,可以部署到 Vercel、Netlify 或任何支持 Next.js 的平台。

### Q: API 请求失败怎么办?
A: 检查以下几点:
- API Token 是否正确
- 网络连接是否正常
- Alice API 服务是否可用
- 查看浏览器控制台的错误信息

## 贡献

欢迎提交 Issue 和 Pull Request!

## 许可证

MIT License

## 相关链接

- [Alice.ws 官网](https://alice.ws)
- [Next.js 文档](https://nextjs.org/docs)
- [API 文档](./API_DOCUMENTATION.md)
