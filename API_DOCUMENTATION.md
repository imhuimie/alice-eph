# Alice EVO API 文档

本文档描述了 Alice EVO 服务的所有可用API 端点

## 认证

所有API 请求需要在请求头中包含 Bearer Token:

```
Authorization: Bearer YOUR_API_TOKEN
```

API Token 格式: `ClientID:Secret`

## 基础 URL

```
https://your-domain.com/api/alice
```

---

## 代理端点 (Proxy)

### 1. 通用 API 代理

**端点:** `POST /api/proxy`

**描述:** 通用代理端点，用于转发请求到 Alice API。支持所有 Alice API 操作。

**请求示例:**
```json
{
  "endpoint": "/Evo/Instance",
  "method": "GET",
  "token": "YOUR_API_TOKEN",
  "body": {} // 可选，仅用于 POST 请求
}
```

**响应示例:**
```json
{
  "success": true,
  "data": [...]
}
```

**特性:**
- 30秒请求超时
- 自动处理 FormData 格式
- 统一错误处理
- 支持所有 HTTP 方法

---

## 实例管理 (Instances)

### 1. 获取所有实例

**端点:** `GET /api/instances`

**描述:** 获取用户的所有实例列表

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "hostname": "server01",
      "ipv4": "192.168.1.1",
      "status": "running",
      "cpu": 2,
      "memory": 2048,
      "disk": "20",
      "os": "Ubuntu 22.04"
    }
  ]
}
```

### 2. 部署新实例

**端点:** `POST /api/instances`

**请求示例**
```json
{
  "product_id": "1",
  "os_id": "10",
  "time": "168",
  "sshKey": "1", // 可选
  "bootScript": "#!/bin/bash\necho 'Hello World'" // 可选，启动脚本
}
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "id": "12345",
    "hostname": "server01.example.com",
    "ipv4": "192.168.1.1",
    "ipv6": "2001:db8::1",
    "password": "randomPassword123"
  }
}
```

### 3. 销毁实例

**端点:** `DELETE /api/instances/{id}`

**响应示例:**
```json
{
  "success": true,
  "message": "实例已成功销毁
}
```

### 4. 执行电源操作

**端点:** `POST /api/instances/{id}/power`

**请求示例**
```json
{
  "action": "restart" // boot, shutdown, restart, poweroff
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "电源操作已执行
}
```

### 5. 重建实例

**端点:** `POST /api/instances/{id}/rebuild`

**请求示例**
```json
{
  "os": "10",
  "sshKey": "1", // 可选
  "bootScript": "#!/bin/bash\necho 'Hello World'" // 可选，启动脚本
}
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "hostname": "server01.example.com",
    "ipv4": "192.168.1.1",
    "ipv6": "2001:db8::1",
    "password": "newPassword123"
  }
}
```

### 6. 续订实例

**端点:** `POST /api/instances/{id}/renew`

**请求示例**
```json
{
  "time": "24" // 续订时长(小时)
}
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "expiration_at": "2025-01-15 12:00:00",
    "added_hours": "24",
    "total_service_hours": 336
  }
}
```

### 7. 获取实例状�?

**端点:** `GET /api/instances/{id}/state`

**响应示例:**
```json
{
  "success": true,
  "data": {
    "name": "server01",
    "status": "running",
    "state": {
      "memory": {
        "memtotal": "2097152",
        "memfree": "1048576",
        "memavailable": "1572864"
      },
      "cpu": 45,
      "state": "running",
      "traffic": {
        "in": 1048576,
        "out": 2097152,
        "total": 3145728
      }
    },
    "system": {
      "name": "Ubuntu 22.04 LTS",
      "group_name": "Linux"
    }
  }
}
```

---

## 方案管理 (Plans)

### 8. 获取所有可用方案

**端点:** `GET /api/plans`

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "基础方案",
      "stock": 10,
      "cpu": 2,
      "memory": 2048,
      "disk": 20,
      "network_speed": "1000Mbps",
      "os": [
        {
          "group_name": "Linux",
          "os_list": [
            {
              "id": 10,
              "name": "Ubuntu 22.04 LTS"
            }
          ]
        }
      ]
    }
  ]
}
```

### 9. 根据方案获取可用操作系统

**端点:** `GET /api/plans/{id}/os`

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "group_name": "Linux",
      "os_list": [
        {
          "id": 10,
          "name": "Ubuntu 22.04 LTS"
        },
        {
          "id": 11,
          "name": "Debian 12"
        }
      ]
    }
  ]
}
```

---

## 用户管理 (User)

### 10. 获取用户SSH密钥列表

**端点:** `GET /api/user/sshkeys`

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "my-ssh-key",
      "publickey": "ssh-rsa AAAAB3NzaC1yc2E...",
      "created_at": "2025-01-01 12:00:00"
    }
  ]
}
```

### 11. 获取用户EVO权限

**端点:** `GET /api/user/permissions`

**响应示例:**
```json
{
  "success": true,
  "data": {
    "user_id": 123,
    "plan": "premium",
    "max_time": 720,
    "allow_packages": "1,2,3,4"
  }
}
```

### 12. 获取用户信息

**端点:** `GET /api/user/info`

**响应示例:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "username": "user123",
    "email": "user@example.com",
    "credit": 1000
  }
}
```

---

## 命令执行 (Command)

### 13. 异步执行命令

**端点:** `POST /api/command/execute`

**描述:** 在指定实例上异步执行命令，立即返回 Command UID，不等待命令执行完成。

**请求示例:**
```json
{
  "server_id": "123",
  "command": "bHMgLWxhCg==" // Base64 编码的命令
}
```

**请求参数说明:**
- `server_id` (必需): 实例 ID
- `command` (必需): Base64 编码的命令字符串

**响应示例:**
```json
{
  "success": true,
  "data": {
    "command_uid": "cmd_0884e32faeaa35c134dc555d39f9f5f3_1760601725"
  }
}
```

**注意事项:**
1. 命令必须使用 Base64 编码
2. 返回的 `command_uid` 用于后续查询命令执行结果
3. 命令会在后台异步执行，不会阻塞 API 响应
4. 支持多行命令和复杂脚本

### 14. 获取命令执行结果

**端点:** `POST /api/command/result`

**描述:** 根据 Command UID 查询命令的执行结果。

**请求示例:**
```json
{
  "command_uid": "cmd_0884e32faeaa35c134dc555d39f9f5f3_1760601725",
  "output_base64": "true" // 可选，默认为 "false"
}
```

**请求参数说明:**
- `command_uid` (必需): 执行命令时返回的 UID
- `output_base64` (可选): 是否以 Base64 编码返回结果
  - `"true"`: API 返回 Base64 编码的结果
  - `"false"`: API 返回纯文本结果（默认）

**响应示例 (output_base64 = "false"):**
```json
{
  "success": true,
  "data": {
    "output": "total 48\ndrwxr-xr-x 12 root root 4096 Jan 15 10:00 .\ndrwxr-xr-x 18 root root 4096 Jan 15 09:30 ..\n..."
  }
}
```

**响应示例 (output_base64 = "true"):**
```json
{
  "success": true,
  "data": {
    "output": "dG90YWwgNDgKZHJ3eHIteHIteCAxMiByb290IHJvb3QgNDA5NiBKYW4gMTUgMTA6MDA..."
  }
}
```

**注意事项:**
1. 命令执行完成前查询可能返回空结果或部分结果
2. 建议在提交命令后等待适当时间再查询结果
3. Base64 编码的结果需要客户端自行解码
4. 长时间运行的命令可能需要多次查询

---

## 错误响应

所有错误响应都遵循以下格式:

```json
{
  "success": false,
  "error": "错误描述信息"
}
```

常见 HTTP 状态码:
- `200` - 请求成功
- `400` - 请求参数错误
- `401` - 未授权Token 无效或缺失
- `404` - 资源未找到
- `500` - 服务器内部错误

---

## 使用示例

### JavaScript/TypeScript 示例

```typescript
// 使用代理端点
async function makeAliceAPIRequest(endpoint: string, method: string, token: string, body?: any) {
  const response = await fetch('/api/proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      endpoint,
      method,
      token,
      body
    })
  });
  
  const data = await response.json();
  return data;
}

// 使用直接端点
async function listInstances(token: string) {
  const response = await fetch('/api/instances', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  return data;
}

// 部署新实例（支持 bootScript）
async function deployInstance(token: string, params: DeployParams) {
  const response = await fetch('/api/instances', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...params,
      bootScript: params.bootScript // 可选的启动脚本
    })
  });
  
  const data = await response.json();
  return data;
}

// 异步执行命令
async function executeCommand(token: string, serverId: string, command: string) {
  // 将命令编码为 Base64
  const commandBase64 = btoa(unescape(encodeURIComponent(command)));
  
  const response = await fetch('/api/command/execute', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      server_id: serverId,
      command: commandBase64
    })
  });
  
  const data = await response.json();
  return data.data.command_uid;
}

// 获取命令执行结果
async function getCommandResult(token: string, commandUid: string, useBase64 = false) {
  const response = await fetch('/api/command/result', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      command_uid: commandUid,
      output_base64: useBase64 ? 'true' : 'false'
    })
  });
  
  const data = await response.json();
  return data.data.output;
}

// 完整的命令执行工作流
async function runCommandAndGetResult(token: string, serverId: string, command: string) {
  // 1. 执行命令
  const commandUid = await executeCommand(token, serverId, command);
  console.log('Command UID:', commandUid);
  
  // 2. 等待命令执行（根据命令复杂度调整等待时间）
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 3. 获取结果
  const output = await getCommandResult(token, commandUid, false);
  console.log('Output:', output);
  
  return output;
}
```

### cURL 示例

```bash
# 获取实例列表
curl -X GET https://your-domain.com/api/instances \
  -H "Authorization: Bearer YOUR_API_TOKEN"

# 部署新实例
curl -X POST https://your-domain.com/api/instances \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "1",
    "os_id": "10",
    "time": "168"
  }'

# 执行命令（命令需要 Base64 编码）
curl -X POST https://your-domain.com/api/command/execute \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "server_id": "123",
    "command": "bHMgLWxh"
  }'

# 获取命令执行结果
curl -X POST https://your-domain.com/api/command/result \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "command_uid": "cmd_0884e32faeaa35c134dc555d39f9f5f3_1760601725",
    "output_base64": "false"
  }'
```

---

## 注意事项

1. 所有时间相关的参数单位都是小时
2. API Token 需要妥善保管，不要暴露在客户端代码内
3. 建议使用环境变量存储 API Token
4. 部署和重建操作会返回新的随机密码，请及时保存
5. 实例 ID 在销毁后不可恢复
6. **bootScript** 参数可用于自动化实例配置，在部署和重建时执行
7. 代理端点提供统一的 API 访问方式，简化客户端实现
8. 所有代理请求都有 30 秒超时限制
9. **命令执行**：
   - 命令必须使用 Base64 编码传输
   - 命令异步执行，需要通过 Command UID 查询结果
   - 建议在命令提交后等待适当时间再查询结果
   - `output_base64` 参数控制返回格式，默认为纯文本
   - Base64 编码的结果不会自动解码，需客户端处理
