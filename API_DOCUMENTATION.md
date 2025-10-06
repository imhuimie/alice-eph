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
  "sshKey": "1" // 可选
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
  "sshKey": "1"
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
// 使用 fetch API
async function listInstances(token: string) {
  const response = await fetch('/api/instances', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  return data;
}

// 部署新实例
async function deployInstance(token: string, params: DeployParams) {
  const response = await fetch('/api/instances', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });
  
  const data = await response.json();
  return data;
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
```

---

## 注意事项

1. 所有时间相关的参数单位都是小时
2. API Token 需要妥善保管不要暴露在客户端代码内
3. 建议使用环境变量存储 API Token
4. 部署和重建操作会返回新的随机密码,请及时保存
5. 实例 ID 在销毁后不可恢复
