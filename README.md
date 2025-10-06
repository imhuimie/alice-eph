# Alice EVO 管理面板

这是一个使用 Next.js 构建的 Alice.ws EVO 实例管理 Web 应用。

## 功能特性

- 查看所有实例列表
- 管理实例电源状态(启动/关机/重启)
- 销毁实例
- 查看可用方案
- 查看用户信息

## 安装和配置

### 1. 安装依赖

```bash
npm install
```

### 2. 运行开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 项目结构

```
alice-web/
├── app/
│   ├── api/
│   │   └── alice/
│   │       └── [...path]/
│   │           └── route.ts          # API 代理路由
│   ├── page.tsx                       # 主页面
│   ├── layout.tsx                     # 布局
│   └── globals.css                    # 全局样式
├── lib/
│   └── alice-client.ts                # Alice API 客户端
├── types/
│   └── alice.ts                       # TypeScript 类型定义
├── .env.local                         # 环境变量配置
└── package.json
```

## Token 管理

- **用户输入**: 用户首次访问时需要输入 API Token
- **本地存储**: Token 保存在浏览器的 localStorage 中
- **不上传服务器**: Token 仅在前端发送请求时使用,不会保存到服务器
- **安全退出**: 可以随时退出登录并清除本地 Token

## API 路由设计

所有 API 请求都通过 Next.js API 代理路由:

- 前端请求: `POST http://localhost:3000/api/alice/proxy`
- 请求体包含: `{ endpoint, method, body, token }`
- 代理转发到: `https://app.alice.ws/cli/v1/{endpoint}`

这样设计可以:
1. 避免浏览器 CORS 限制
2. Token 由用户管理,保存在浏览器本地
3. 统一错误处理

## 可用的 API 端点

### 实例管理
- `GET /api/alice/Evo/Instance` - 获取实例列表
- `POST /api/alice/Evo/Deploy` - 部署新实例
- `POST /api/alice/Evo/Destroy` - 销毁实例
- `POST /api/alice/Evo/Power` - 电源操作
- `POST /api/alice/Evo/Rebuild` - 重建实例
- `POST /api/alice/Evo/Renewal` - 续订实例
- `POST /api/alice/Evo/State` - 获取实例状态

### 方案和系统
- `GET /api/alice/Evo/Plan` - 获取可用方案
- `POST /api/alice/Evo/getOSByPlan` - 根据方案获取操作系统

### 用户管理
- `GET /api/alice/User/Info` - 获取用户信息
- `GET /api/alice/User/SSHKey` - 获取 SSH 密钥
- `GET /api/alice/User/EVOPermissions` - 获取 EVO 权限

## 构建生产版本

```bash
npm run build
npm start
```

## 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **API**: REST API with Next.js Route Handlers

## 注意事项

1. **Token 安全**: API Token 保存在浏览器 localStorage,请注意保护你的设备安全
2. **首次登录**: 第一次访问时需要输入 Token,格式为 `client_id:secret`
3. **Token 管理**: Token 仅存储在本地浏览器,不会上传到任何服务器
4. **退出登录**: 点击"退出登录"按钮可清除本地存储的 Token
