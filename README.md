# Alice EVO 管理面板

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/imhuimie/alice-eph/blob/main/LICENSE)

这是一个使用 Next.js 构建的 Alice.ws EVO 实例管理 Web 应用，旨在提供一个现代化、功能完整的管理界面，并完整实现了 Alice EVO API 的所有功能。

<!-- 可在此处添加项目截图 -->
<!-- ![Project Screenshot](...) -->

## ✨ 功能特性

-   **实例管理**: 查看、部署、销毁、重建、续订实例，并管理其电源状态。
-   **状态监控**: 查看实例的 CPU、内存、流量等详细状态。
-   **方案与系统**: 查看所有可用方案及其支持的操作系统。
-   **用户中心**: 查看用户信息、SSH 密钥和 EVO 权限。

## 🛠️ 技术栈

-   **框架**: Next.js 15 (App Router)
-   **语言**: TypeScript
-   **样式**: Tailwind CSS
-   **运行时**: Node.js 18+

## 🚀 快速开始

### 1. 安装与运行

```bash
# 克隆项目
git clone <repository-url>
cd alice-eph

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

现在，您可以在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看应用。

### 2. 构建生产版本

```bash
npm run build
npm start
```

## 📖 API 使用

> **获取凭证**: 所有 API 请求都需要认证。您可以从 Alice.ws 控制面板的 API 设置中获取 Client ID 和 Secret 来生成 API Token。

### 服务端 API 路由

所有 API 端点都已封装为 Next.js API 路由，可以直接通过标准的 REST 请求调用。调用时，请在请求头中提供您的 API Token。

```typescript
// 示例: 获取实例列表
const response = await fetch('/api/alice/instances', {
  headers: {
    'Authorization': 'Bearer YOUR_API_TOKEN'
  }
});
const data = await response.json();


// 调用方法
const instances = await client.listInstances();
```

---

<details>
<summary>📂 查看项目结构</summary>

```
alice-eph/
├── app/
│   ├── api/
│   │   └── alice/         # API 路由
│   ├── page.tsx           # 主页面
│   └── layout.tsx         # 布局
├── lib/
│   └── alice-client.ts    # Alice API 客户端
├── types/
│   └── alice.ts           # TypeScript 类型定义
└── API_DOCUMENTATION.md   # 详细 API 文档
```
</details>

<details>
<summary>📋 查看 API 端点总览</summary>

| 方法   | 端点                            | 描述                     |
| ------ | ------------------------------- | ------------------------ |
| **实例管理** |                                 |                          |
| GET    | `/api/alice/instances`          | 获取所有实例             |
| POST   | `/api/alice/instances`          | 部署新实例               |
| DELETE | `/api/alice/instances/{id}`     | 销毁实例                 |
| POST   | `/api/alice/instances/{id}/power` | 电源操作                 |
| POST   | `/api/alice/instances/{id}/rebuild`| 重建实例                 |
| POST   | `/api/alice/instances/{id}/renew` | 续订实例                 |
| GET    | `/api/alice/instances/{id}/state` | 获取实例状态             |
| **方案管理** |                                 |                          |
| GET    | `/api/alice/plans`              | 获取可用方案             |
| GET    | `/api/alice/plans/{id}/os`      | 获取方案的可用操作系统   |
| **用户管理** |                                 |                          |
| GET    | `/api/alice/user/info`          | 获取用户信息             |
| GET    | `/api/alice/user/sshkeys`       | 获取SSH密钥列表          |
| GET    | `/api/alice/user/permissions`   | 获取EVO权限              |

</details>

## 🔒 安全注意事项

-   **HTTPS**: 生产环境中务必使用 HTTPS。
-   **身份验证**: 建议在生产环境中为管理面板添加额外的身份验证层（如 NextAuth.js）。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!

## 📄 许可证

本项目采用 [MIT License](https://opensource.org/licenses/MIT)。

## 🔗 相关链接

-   [Alice.ws 官网](https://alice.ws)
-   [Next.js 文档](https://nextjs.org/docs)
-   [详细 API 文档](./API_DOCUMENTATION.md)
