/**
 * Alice.ws API Client - Cloudflare Workers 版本
 */

const BASE_URL = 'https://app.alice.ws/cli/v1';

/**
 * 创建 API 请求的通用函数
 */
async function makeRequest(endpoint, options = {}) {
  const { method = 'GET', body = null, token, contentType = 'application/json' } = options;
  
  const headers = {
    'Authorization': `Bearer ${token}`,
  };

  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    if (contentType === 'application/json') {
      config.body = JSON.stringify(body);
    } else {
      config.body = body;
    }
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (response.status >= 400) {
      return {
        success: false,
        status: response.status,
        error: `API 错误：状态码 ${response.status}`,
        data: data
      };
    }

    return {
      success: true,
      status: response.status,
      data: data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 创建 multipart/form-data 请求体
 */
function createFormData(params) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') {
      formData.append(key, value);
    }
  }
  return formData;
}

/**
 * API 方法类
 */
class AliceAPIClient {
  constructor(token) {
    this.token = token;
  }

  // 列出所有实例
  async listInstances() {
    return await makeRequest('/Evo/Instance', { token: this.token });
  }

  // 部署新实例
  async deployInstance(productId, osId, time, sshKey = '', bootScript = '') {
    const params = { product_id: productId, os_id: osId, time };
    if (sshKey) params.sshKey = sshKey;
    if (bootScript) params.bootScript = bootScript;
    
    const formData = createFormData(params);
    return await makeRequest('/Evo/Deploy', {
      method: 'POST',
      body: formData,
      token: this.token,
      contentType: null
    });
  }

  // 销毁实例
  async destroyInstance(id) {
    const formData = createFormData({ id });
    return await makeRequest('/Evo/Destroy', {
      method: 'POST',
      body: formData,
      token: this.token,
      contentType: null
    });
  }

  // 电源操作
  async powerInstance(id, action) {
    const formData = createFormData({ id, action });
    return await makeRequest('/Evo/Power', {
      method: 'POST',
      body: formData,
      token: this.token,
      contentType: null
    });
  }

  // 重建实例
  async rebuildInstance(id, os, sshKey = '', bootScript = '') {
    const params = { id, os };
    if (sshKey) params.sshKey = sshKey;
    if (bootScript) params.bootScript = bootScript;
    const formData = createFormData(params);
    return await makeRequest('/Evo/Rebuild', {
      method: 'POST',
      body: formData,
      token: this.token,
      contentType: null
    });
  }

  // 列出所有方案
  async listPlans() {
    return await makeRequest('/Evo/Plan', { token: this.token });
  }

  // 根据方案获取操作系统
  async getOSByPlan(planId) {
    const formData = createFormData({ plan_id: planId });
    return await makeRequest('/Evo/getOSByPlan', {
      method: 'POST',
      body: formData,
      token: this.token,
      contentType: null
    });
  }

  // 续订实例
  async renewInstance(id, time) {
    const formData = createFormData({ id, time });
    return await makeRequest('/Evo/Renewal', {
      method: 'POST',
      body: formData,
      token: this.token,
      contentType: null
    });
  }

  // 获取实例状态
  async getInstanceState(id) {
    const formData = createFormData({ id });
    return await makeRequest('/Evo/State', {
      method: 'POST',
      body: formData,
      token: this.token,
      contentType: null
    });
  }

  // 列出 SSH 密钥
  async listSSHKeys() {
    return await makeRequest('/User/SSHKey', { token: this.token });
  }

  // 获取 EVO 权限
  async getEVOPermissions() {
    return await makeRequest('/User/EVOPermissions', { token: this.token });
  }

  // 获取用户信息
  async getUserInfo() {
    return await makeRequest('/User/Info', { token: this.token });
  }
}

/**
 * 生成交互式 HTML 页面
 */
function getHTMLPage() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/x-icon" href="https://raw.githubusercontent.com/imhuimie/alice-eph/main/app/favicon.ico">
  <title>Alice Eph 管理面板</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #f9fafb;
      min-height: 100vh;
      padding: 0;
    }
    
    /* 导航栏样式 */
    nav {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      padding: 15px 0;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    
    nav .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    nav .logo {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
      cursor: default;
    }
    
    nav .nav-links {
      display: flex;
      gap: 20px;
      align-items: center;
    }
    
    nav .nav-links a {
      color: #555;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.3s;
    }
    
    nav .nav-links a:hover {
      color: #667eea;
    }
    
    nav .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #f0f0f0;
      border-radius: 20px;
      font-size: 14px;
    }
    
    nav .status-indicator.connected {
      background: #d4edda;
      color: #155724;
    }
    
    nav .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ccc;
    }
    
    nav .status-indicator.connected .status-dot {
      background: #28a745;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .header {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      margin-bottom: 20px;
    }
    
    .header h1 {
      color: #333;
      margin-bottom: 10px;
    }
    
    .header p {
      color: #666;
    }
    
    .token-section {
      background: white;
      padding: 25px;
      border-radius: 10px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      margin-bottom: 20px;
    }
    
    .password-input-wrapper {
      position: relative;
      margin-top: 10px;
    }
    
    .token-section input {
      width: 100%;
      padding: 12px;
      padding-right: 45px;
      border: 2px solid #ddd;
      border-radius: 5px;
      font-size: 14px;
    }
    
    .token-section input:focus {
      outline: none;
      border-color: #667eea;
    }
    
    .toggle-password {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      padding: 5px;
      color: #666;
      font-size: 20px;
      width: auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .toggle-password:hover {
      color: #333;
      transform: translateY(-50%) scale(1.1);
    }
    
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    
    .action-card {
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .action-card h3 {
      color: #333;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #f0f0f0;
    }
    
    .form-group {
      margin-bottom: 15px;
    }
    
    .form-group label {
      display: block;
      color: #555;
      margin-bottom: 5px;
      font-weight: 500;
    }
    
    .form-group input,
    .form-group select {
      width: 100%;
      padding: 10px;
      border: 2px solid #ddd;
      border-radius: 5px;
      font-size: 14px;
    }
    
    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: #667eea;
    }
    
    button {
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 5px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
    }
    
    button:hover {
      transform: translateY(-2px);
    }
    
    button:active {
      transform: translateY(0);
    }
    
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .result-section {
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      margin-top: 20px;
    }
    
    .result-section h3 {
      color: #333;
      margin-bottom: 15px;
    }
    
    #result {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      white-space: pre-wrap;
      word-wrap: break-word;
      max-height: 500px;
      overflow-y: auto;
    }
    
    .loading {
      text-align: center;
      padding: 20px;
      color: #667eea;
      font-weight: 600;
    }
    
    .error {
      color: #e74c3c;
    }
    
    .success {
      color: #27ae60;
    }
    
    /* Tab 导航样式 */
    .tabs {
      border-bottom: 2px solid #f0f0f0;
      margin-bottom: 20px;
      display: flex;
      gap: 0;
    }
    
    .tab-button {
      padding: 12px 24px;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      color: #666;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s;
      margin-bottom: -2px;
    }
    
    .tab-button:hover {
      color: #667eea;
    }
    
    .tab-button.active {
      color: #667eea;
      border-bottom-color: #667eea;
    }
    
    .tab-content {
      display: none;
    }
    
    .tab-content.active {
      display: block;
    }
    
    /* 实例卡片样式 */
    .instance-card {
      background: white;
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 15px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .instance-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
    }
    
    .instance-title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }
    
    .instance-id {
      font-size: 13px;
      color: #999;
      margin-top: 4px;
    }
    
    .status-badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
    }
    
    .status-running {
      background: #d4edda;
      color: #155724;
    }
    
    .status-stopped {
      background: #f8d7da;
      color: #721c24;
    }
    
    .status-other {
      background: #fff3cd;
      color: #856404;
    }
    
    .instance-details {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 15px;
    }
    
    .detail-item label {
      display: block;
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }
    
    .detail-item value {
      display: block;
      font-size: 14px;
      color: #333;
      font-family: 'Courier New', monospace;
    }
    
    .instance-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    
    .instance-actions button {
      flex: 0 0 auto;
      width: auto;
      padding: 8px 16px;
      font-size: 13px;
    }
    
    .btn-destroy {
      background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
      margin-left: auto;
    }
    
    /* Plan 卡片样式 */
    .plans-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }
    
    .plan-card {
      background: white;
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .plan-card h3 {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
    }
    
    .plan-stock {
      font-size: 13px;
      color: #666;
      margin-bottom: 15px;
    }
    
    .plan-details {
      margin-bottom: 15px;
    }
    
    .plan-details p {
      font-size: 14px;
      color: #555;
      margin-bottom: 8px;
    }
    
    .plan-details strong {
      color: #333;
    }
    
    /* Modal 样式 */
    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9999;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .modal.show {
      display: flex;
    }
    
    .modal-content {
      background: white;
      border-radius: 10px;
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .modal-header h2 {
      font-size: 20px;
      font-weight: 600;
      color: #333;
      margin: 0;
    }
    
    .modal-close {
      background: none;
      border: none;
      font-size: 24px;
      color: #999;
      cursor: pointer;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .modal-close:hover {
      color: #666;
    }
    
    .modal-body {
      padding: 20px;
    }
    
    .modal-footer {
      display: flex;
      gap: 10px;
      padding: 20px;
      border-top: 1px solid #f0f0f0;
    }
    
    .modal-footer button {
      flex: 1;
    }
    
    .btn-secondary {
      background: #f0f0f0;
      color: #333;
    }
    
    .btn-secondary:hover {
      background: #e0e0e0;
    }
    
    .os-group {
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .os-group:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    
    .os-group h4 {
      font-size: 15px;
      font-weight: 600;
      color: #333;
      margin-bottom: 12px;
      padding-left: 4px;
      letter-spacing: 0.3px;
    }
    
    .os-option {
      display: flex;
      align-items: center;
      padding: 14px 16px;
      border: 2px solid #e8e8e8;
      border-radius: 8px;
      margin-bottom: 10px;
      cursor: pointer;
      transition: all 0.25s ease;
      background: white;
    }
    
    .os-option:last-child {
      margin-bottom: 0;
    }
    
    .os-option:hover {
      border-color: #667eea;
      background: #f8f9ff;
      transform: translateX(2px);
      box-shadow: 0 2px 4px rgba(102, 126, 234, 0.1);
    }
    
    .os-option input[type="radio"] {
      margin-right: 14px;
      cursor: pointer;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }
    
    .os-option input[type="radio"]:checked + label {
      color: #667eea;
      font-weight: 600;
    }
    
    .os-option:has(input[type="radio"]:checked) {
      border-color: #667eea;
      background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
    }
    
    .os-option label {
      flex: 1;
      cursor: pointer;
      font-size: 14px;
      margin: 0;
      line-height: 1.5;
      color: #555;
      transition: all 0.2s;
    }
    
    .info-card {
      background: white;
      border-radius: 10px;
      padding: 30px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      max-width: 600px;
    }
    
    .info-card h2 {
      font-size: 24px;
      font-weight: 600;
      color: #333;
      margin-bottom: 20px;
    }
    
    .info-item {
      margin-bottom: 20px;
    }
    
    .info-item label {
      display: block;
      font-size: 13px;
      color: #666;
      margin-bottom: 6px;
    }
    
    .info-item value {
      display: block;
      font-size: 18px;
      font-weight: 500;
      color: #333;
    }
    
    .credit-amount {
      color: #27ae60;
      font-size: 20px;
      font-weight: 600;
    }
    
    .credit-raw {
      font-size: 12px;
      color: #999;
      margin-top: 4px;
    }
    
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #999;
    }
    
    .empty-state-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    
    .alert {
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 20px;
      border-left: 4px solid;
    }
    
    .alert-warning {
      background: #fff3cd;
      border-color: #ffc107;
      color: #856404;
    }
    
    .copy-field {
      display: flex;
      gap: 0;
      margin-bottom: 15px;
    }
    
    .copy-field input {
      flex: 1;
      padding: 10px 12px;
      border: 2px solid #e0e0e0;
      border-radius: 8px 0 0 8px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      background: #f8f9fa;
    }
    
    .copy-field button {
      width: auto;
      padding: 10px 20px;
      border-radius: 0 8px 8px 0;
      font-size: 14px;
    }
    
    .plan-info {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    
    .plan-info h3 {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin-bottom: 10px;
    }
    
    .plan-info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      font-size: 14px;
    }
    
    .plan-info-grid span {
      color: #666;
    }
    
    .loading-spinner {
      text-align: center;
      padding: 40px;
    }
    
    .spinner {
      display: inline-block;
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <!-- 导航栏 -->
  <nav>
    <div class="nav-container">
      <div class="logo">🚀 Alice.ws</div>
      <div class="nav-links">
        <div class="status-indicator" id="status-indicator">
          <span class="status-dot"></span>
          <span id="status-text">未连接</span>
        </div>
        <a href="#" onclick="clearToken()" id="logout-link" style="display: none; color: #e74c3c;">退出登录</a>
      </div>
    </div>
  </nav>
  
  <div class="container">
    <div class="header">
      <h1>Alice Eph 管理面板</h1>
      <p>通过网页界面管理您的 Alice.ws 实例</p>
    </div>
    
    <div class="token-section" id="token-section">
      <label for="api-token"><strong>API Token (Client ID:Secret)</strong></label>
      <div class="password-input-wrapper">
        <input type="password" id="api-token" placeholder="client_id:secret">
        <button class="toggle-password" onclick="togglePasswordVisibility()" type="button" title="显示密码">
          ○
        </button>
      </div>
      <button onclick="saveToken()" style="margin-top: 10px; width: auto; padding: 10px 20px;">登录</button>
    </div>
    
    <div id="main-content" style="display: none;">
      <!-- Tab 导航 -->
      <div class="tabs">
        <button class="tab-button active" onclick="switchTab('instances')">实例列表</button>
        <button class="tab-button" onclick="switchTab('plans')">可用方案</button>
        <button class="tab-button" onclick="switchTab('user')">用户信息</button>
      </div>
      
      <!-- 实例列表 Tab -->
      <div id="tab-instances" class="tab-content active">
        <div id="instances-list"></div>
      </div>
      
      <!-- 可用方案 Tab -->
      <div id="tab-plans" class="tab-content">
        <div id="plans-list" class="plans-grid"></div>
      </div>
      
      <!-- 用户信息 Tab -->
      <div id="tab-user" class="tab-content">
        <div id="user-info"></div>
      </div>
    </div>
    
    <!-- 部署实例 Modal -->
    <div id="deploy-modal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>部署实例</h2>
          <button class="modal-close" onclick="closeDeployModal()">×</button>
        </div>
        <div class="modal-body">
          <div class="plan-info" id="deploy-plan-info"></div>
          
          <div class="form-group">
            <label>选择操作系统 *</label>
            <div id="os-list"></div>
          </div>
          
          <div class="form-group">
            <label>租用时长(小时) *</label>
            <input type="number" id="deploy-time" value="24" min="1" placeholder="请输入租用小时数">
            <p style="font-size: 12px; color: #666; margin-top: 4px;">
              常用时长参考: 24小时(1天) / 168小时(1周) / 720小时(1个月)
            </p>
          </div>
          
          <div class="form-group">
            <label>SSH密钥 (可选)</label>
            <select id="deploy-sshkey" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px;">
              <option value="">不使用SSH密钥</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>启动脚本 (可选)</label>
            <textarea id="deploy-bootscript" placeholder="输入启动脚本代码，将自动编码为Base64" rows="6" style="resize: vertical; font-family: 'Courier New', monospace; font-size: 13px; width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px;"></textarea>
            <p style="font-size: 12px; color: #666; margin-top: 4px;">
              脚本将在实例首次启动时执行
            </p>
          </div>
          
          <div class="form-group" id="deploy-bootscript-preview-container" style="display: none;">
            <label>Base64 预览</label>
            <textarea id="deploy-bootscript-preview" readonly rows="4" style="resize: vertical; font-family: 'Courier New', monospace; font-size: 11px; background: #f8f9fa; color: #666; width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px;"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" onclick="closeDeployModal()">取消</button>
          <button onclick="confirmDeploy()">确认部署</button>
        </div>
      </div>
    </div>
    
    <!-- 重建实例 Modal -->
    <div id="rebuild-modal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>重建实例</h2>
          <button class="modal-close" onclick="closeRebuildModal()">×</button>
        </div>
        <div class="modal-body">
          <div class="alert alert-warning">
            ⚠️ 重建实例将清除所有数据，请谨慎操作！
          </div>
          
          <div class="form-group">
            <label>实例 ID</label>
            <input type="text" id="rebuild-instance-id" readonly style="background: #f8f9fa;">
          </div>
          
          <div class="form-group">
            <label>当前系统</label>
            <input type="text" id="rebuild-current-os" readonly style="background: #f8f9fa;">
          </div>
          
          <div class="form-group">
            <label>选择新操作系统 *</label>
            <div id="rebuild-os-list"></div>
          </div>
          
          <div class="form-group">
            <label>SSH密钥 (可选)</label>
            <select id="rebuild-sshkey" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px;">
              <option value="">不使用SSH密钥</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>启动脚本 (可选)</label>
            <textarea id="rebuild-bootscript" placeholder="输入启动脚本代码" rows="6" style="resize: vertical; font-family: 'Courier New', monospace; font-size: 13px; width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px;"></textarea>
            <p style="font-size: 12px; color: #666; margin-top: 4px;">
              脚本将在实例重建后首次启动时执行
            </p>
          </div>
          
          <div class="form-group" id="rebuild-bootscript-preview-container" style="display: none;">
            <label>Base64 预览</label>
            <textarea id="rebuild-bootscript-preview" readonly rows="4" style="resize: vertical; font-family: 'Courier New', monospace; font-size: 11px; background: #f8f9fa; color: #666; width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px;"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" onclick="closeRebuildModal()">取消</button>
          <button onclick="confirmRebuild()" style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">确认重建</button>
        </div>
      </div>
    </div>
    
    <!-- 部署结果 Modal -->
    <div id="result-modal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2 style="color: #27ae60;">🎉 部署成功！</h2>
          <button class="modal-close" onclick="closeResultModal()">×</button>
        </div>
        <div class="modal-body">
          <div class="alert alert-warning">
            ⚠️ 请妥善保管以下信息，不要泄露给他人
          </div>
          
          <div class="copy-field">
            <input type="text" id="result-hostname" readonly>
            <button onclick="copyText('result-hostname')">复制</button>
          </div>
          
          <div class="copy-field">
            <input type="text" id="result-ipv4" readonly>
            <button onclick="copyText('result-ipv4')">复制</button>
          </div>
          
          <div class="copy-field">
            <input type="text" id="result-ipv6" readonly>
            <button onclick="copyText('result-ipv6')">复制</button>
          </div>
          
          <div class="copy-field">
            <input type="text" id="result-password" readonly>
            <button onclick="copyText('result-password')">复制</button>
          </div>
          
          <button onclick="copyAllInfo()" style="background: linear-gradient(135deg, #27ae60 0%, #229954 100%); margin-top: 10px;">
            复制全部信息
          </button>
        </div>
        <div class="modal-footer">
          <button onclick="closeResultModal(); switchTab('instances');">查看实例列表</button>
        </div>
      </div>
    </div>
    
    <!-- 旧的操作面板（保留但隐藏） -->
    <div id="operations" style="display: none;">
    <div class="actions-grid">
      <!-- 查询类操作 -->
      <div class="action-card">
        <h3>📋 查询操作</h3>
        <button onclick="listInstances()">列出所有实例</button>
        <button onclick="listPlans()" style="margin-top: 10px;">列出所有方案</button>
        <button onclick="listSSHKeys()" style="margin-top: 10px;">列出 SSH 密钥</button>
        <button onclick="getUserInfo()" style="margin-top: 10px;">获取用户信息</button>
        <button onclick="getEVOPermissions()" style="margin-top: 10px;">获取 EVO 权限</button>
      </div>
      
      <!-- 实例管理 -->
      <div class="action-card">
        <h3>�️ 实例管理</h3>
        <div class="form-group">
          <label>实例 ID</label>
          <input type="text" id="instance-id" placeholder="输入实例 ID">
        </div>
        <button onclick="getInstanceState()">获取实例状态</button>
        <button onclick="destroyInstance()" style="margin-top: 10px; background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">销毁实例</button>
      </div>
      
      <!-- 电源操作 -->
      <div class="action-card">
        <h3>⚡ 电源操作</h3>
        <div class="form-group">
          <label>实例 ID</label>
          <input type="text" id="power-instance-id" placeholder="输入实例 ID">
        </div>
        <div class="form-group">
          <label>操作</label>
          <select id="power-action">
            <option value="boot">启动 (boot)</option>
            <option value="shutdown">关机 (shutdown)</option>
            <option value="restart">重启 (restart)</option>
            <option value="poweroff">强制关闭 (poweroff)</option>
          </select>
        </div>
        <button onclick="powerInstance()">执行电源操作</button>
      </div>
      
      <!-- 部署实例 -->
      <div class="action-card">
        <h3>🚀 部署新实例</h3>
        <div class="form-group">
          <label>产品 ID</label>
          <input type="text" id="deploy-product-id" placeholder="输入产品 ID">
        </div>
        <div class="form-group">
          <label>操作系统 ID</label>
          <input type="text" id="deploy-os-id" placeholder="输入 OS ID">
        </div>
        <div class="form-group">
          <label>时长 (小时)</label>
          <input type="number" id="deploy-time" placeholder="输入时长">
        </div>
        <div class="form-group">
          <label>SSH 密钥 ID (可选)</label>
          <input type="text" id="deploy-ssh-key" placeholder="输入 SSH 密钥 ID">
        </div>
        <button onclick="deployInstance()">部署实例</button>
      </div>
      
      <!-- 重建实例 -->
      <div class="action-card">
        <h3>🔄 重建实例</h3>
        <div class="form-group">
          <label>实例 ID</label>
          <input type="text" id="rebuild-id" placeholder="输入实例 ID">
        </div>
        <div class="form-group">
          <label>新操作系统 ID</label>
          <input type="text" id="rebuild-os" placeholder="输入新 OS ID">
        </div>
        <div class="form-group">
          <label>SSH 密钥 ID</label>
          <input type="text" id="rebuild-ssh-key" placeholder="输入 SSH 密钥 ID">
        </div>
        <button onclick="rebuildInstance()">重建实例</button>
      </div>
      
      <!-- 续订实例 -->
      <div class="action-card">
        <h3>💰 续订实例</h3>
        <div class="form-group">
          <label>实例 ID</label>
          <input type="text" id="renew-id" placeholder="输入实例 ID">
        </div>
        <div class="form-group">
          <label>续订时长 (小时)</label>
          <input type="number" id="renew-time" placeholder="输入续订时长">
        </div>
        <button onclick="renewInstance()">续订实例</button>
      </div>
      
      <!-- 根据方案获取 OS -->
      <div class="action-card">
        <h3>💿 查询操作系统</h3>
        <div class="form-group">
          <label>方案 ID</label>
          <input type="text" id="plan-id" placeholder="输入方案 ID">
        </div>
        <button onclick="getOSByPlan()">获取可用操作系统</button>
      </div>
    </div>
    
    <div class="result-section" style="display: none;">
      <h3>📊 结果输出</h3>
      <div id="result">等待操作...</div>
    </div>
  </div>
  
  <script>
    const resultDiv = document.getElementById('result');
    const STORAGE_KEY = 'alice_api_token';
    let currentToken = '';
    let currentTab = 'instances';
    let selectedPlan = null;
    let deployResult = null;
    let allPlans = []; // 存储所有方案数据
    
    // 页面加载时从 localStorage 读取 token
    window.addEventListener('DOMContentLoaded', function() {
      loadToken();
      updateStatusIndicator();
      if (currentToken) {
        showMainContent();
        loadTabContent('instances');
      }
    });
    
    // 从 localStorage 读取 token
    function loadToken() {
      const savedToken = localStorage.getItem(STORAGE_KEY);
      if (savedToken) {
        document.getElementById('api-token').value = savedToken;
        currentToken = savedToken;
        updateStatusIndicator(true);
      }
    }
    
    // 保存 token 到 localStorage
    function saveToken() {
      const token = document.getElementById('api-token').value.trim();
      if (!token) {
        alert('请先输入 API Token');
        return;
      }
      localStorage.setItem(STORAGE_KEY, token);
      currentToken = token;
      updateStatusIndicator(true);
      showMainContent();
      loadTabContent('instances');
    }
    
    // 显示主内容区域
    function showMainContent() {
      document.getElementById('token-section').style.display = 'none';
      document.getElementById('main-content').style.display = 'block';
    }
    
    // 隐藏主内容区域
    function hideMainContent() {
      document.getElementById('token-section').style.display = 'block';
      document.getElementById('main-content').style.display = 'none';
    }
    
    // 清除 localStorage 中的 token
    function clearToken() {
      if (confirm('确定要退出并清除 Token 吗？')) {
        localStorage.removeItem(STORAGE_KEY);
        document.getElementById('api-token').value = '';
        currentToken = '';
        updateStatusIndicator(false);
        hideMainContent();
      }
    }
    
    // 更新状态指示器
    function updateStatusIndicator(connected) {
      const indicator = document.getElementById('status-indicator');
      const statusText = document.getElementById('status-text');
      const logoutLink = document.getElementById('logout-link');
      
      if (connected === undefined) {
        const token = localStorage.getItem(STORAGE_KEY);
        connected = !!token;
      }
      
      if (connected) {
        indicator.classList.add('connected');
        statusText.textContent = '已连接';
        logoutLink.style.display = 'block';
      } else {
        indicator.classList.remove('connected');
        statusText.textContent = '未连接';
        logoutLink.style.display = 'none';
      }
    }
    
    // 切换密码显示/隐藏
    function togglePasswordVisibility() {
      const input = document.getElementById('api-token');
      const button = document.querySelector('.toggle-password');
      
      if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '●';
        button.style.fontSize = '12px';
        button.style.letterSpacing = '2px';
        button.title = '隐藏密码';
      } else {
        input.type = 'password';
        button.textContent = '○';
        button.style.fontSize = '16px';
        button.style.letterSpacing = '0';
        button.title = '显示密码';
      }
    }
    
    // 滚动到指定区域
    function scrollToSection(sectionId) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return false;
    }
    
    // Tab 切换
    function switchTab(tabName) {
      currentTab = tabName;
      
      // 更新 tab 按钮状态
      document.querySelectorAll('.tab-button').forEach((btn, index) => {
        btn.classList.remove('active');
        const tabs = ['instances', 'plans', 'user'];
        if (tabs[index] === tabName) {
          btn.classList.add('active');
        }
      });
      
      // 更新 tab 内容显示
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(\`tab-\${tabName}\`).classList.add('active');
      
      // 加载对应的数据
      loadTabContent(tabName);
    }
    
    // 加载 Tab 内容
    async function loadTabContent(tabName) {
      if (!currentToken) return;
      
      if (tabName === 'instances') {
        await fetchInstances();
      } else if (tabName === 'plans') {
        await fetchPlans();
      } else if (tabName === 'user') {
        await fetchUserInfo();
      }
    }
    
    function showResult(message, type = 'info') {
      resultDiv.className = type;
      if (typeof message === 'object') {
        resultDiv.textContent = JSON.stringify(message, null, 2);
      } else {
        resultDiv.textContent = message;
      }
    }
    
    function showLoading() {
      resultDiv.className = 'loading';
      resultDiv.textContent = '正在处理请求...';
    }
    
    // API 调用函数
    async function apiCall(endpoint, method = 'GET', body = null) {
      if (!currentToken) {
        alert('请先登录');
        return null;
      }
      
      try {
        const formData = new FormData();
        if (body) {
          for (const [key, value] of Object.entries(body)) {
            if (value !== null && value !== undefined && value !== '') {
              formData.append(key, value);
            }
          }
        }
        
        const options = {
          method,
          headers: {
            'Authorization': \`Bearer \${currentToken}\`
          }
        };
        
        if (method !== 'GET' && body) {
          options.body = formData;
        }
        
        // 使用相对路径调用 Workers API，由 Workers 代理转发
        const url = \`/api\${endpoint}\`;
        const response = await fetch(url, options);
        const data = await response.json();
        
        if (response.status >= 400) {
          throw new Error(data.error || \`API 错误：状态码 \${response.status}\`);
        }
        
        return data;
      } catch (error) {
        console.error('API 调用失败:', error);
        alert('请求失败: ' + error.message);
        return null;
      }
    }
    
    // 获取实例列表
    async function fetchInstances() {
      const container = document.getElementById('instances-list');
      container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>加载中...</p></div>';
      
      const data = await apiCall('/Evo/Instance');
      if (!data || !data.data) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>暂无实例</p></div>';
        return;
      }
      
      const instances = data.data;
      if (instances.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>暂无实例</p></div>';
        return;
      }
      
      container.innerHTML = instances.map(instance => \`
        <div class="instance-card">
          <div class="instance-header">
            <div>
              <div class="instance-title">\${instance.hostname}</div>
              <div class="instance-id">ID: \${instance.id}</div>
            </div>
            <span class="status-badge status-\${instance.status === 'running' ? 'running' : instance.status === 'stopped' ? 'stopped' : 'other'}">
              \${instance.status}
            </span>
          </div>
          
          <div class="instance-details">
            <div class="detail-item">
              <label>IPv4</label>
              <value>\${instance.ipv4}</value>
            </div>
            <div class="detail-item">
              <label>IPv6</label>
              <value>\${instance.ipv6}</value>
            </div>
            <div class="detail-item">
              <label>配置</label>
              <value>\${instance.cpu} CPU / \${instance.memory}MB RAM / \${instance.disk}GB \${instance.disk_type}</value>
            </div>
            <div class="detail-item">
              <label>系统</label>
              <value>\${instance.os}</value>
            </div>
            <div class="detail-item">
              <label>到期时间</label>
              <value>\${new Date(instance.expiration_at + 'Z').toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</value>
            </div>
          </div>
          
          <div class="instance-actions">
            <button onclick="powerAction(\${instance.id}, 'boot')" style="background: linear-gradient(135deg, #27ae60 0%, #229954 100%);">启动</button>
            <button onclick="powerAction(\${instance.id}, 'shutdown')" style="background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);">关机</button>
            <button onclick="powerAction(\${instance.id}, 'restart')">重启</button>
            <button onclick="openRebuildModal(\${instance.id}, '\${instance.os}')" style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);">重建</button>
            <button class="btn-destroy" onclick="destroyInstance(\${instance.id})">销毁</button>
          </div>
        </div>
      \`).join('');
    }
    
    // 获取方案列表
    async function fetchPlans() {
      const container = document.getElementById('plans-list');
      container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>加载中...</p></div>';
      
      const data = await apiCall('/Evo/Plan');
      if (!data || !data.data) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📦</div><p>暂无可用方案</p></div>';
        return;
      }
      
      allPlans = data.data;
      
      // 清空容器
      container.innerHTML = '';
      
      // 逐个创建方案卡片并添加事件监听器
      allPlans.forEach((plan, index) => {
        const card = document.createElement('div');
        card.className = 'plan-card';
        
        const title = document.createElement('h3');
        title.textContent = plan.name;
        card.appendChild(title);
        
        const stock = document.createElement('p');
        stock.className = 'plan-stock';
        stock.textContent = '库存: ' + plan.stock;
        card.appendChild(stock);
        
        const details = document.createElement('div');
        details.className = 'plan-details';
        details.innerHTML = '<p><strong>CPU:</strong> ' + plan.cpu + ' 核心</p>' +
                           '<p><strong>内存:</strong> ' + plan.memory + ' MB</p>' +
                           '<p><strong>硬盘:</strong> ' + plan.disk + ' GB</p>' +
                           '<p><strong>网络:</strong> ' + plan.network_speed + '</p>';
        card.appendChild(details);
        
        const button = document.createElement('button');
        button.textContent = plan.stock === 0 ? '暂无库存' : '部署实例';
        button.disabled = plan.stock === 0;
        button.style.cursor = plan.stock === 0 ? 'not-allowed' : 'pointer';
        
        if (plan.stock > 0) {
          button.addEventListener('click', function() {
            openDeployModal(plan);
          });
        }
        
        card.appendChild(button);
        container.appendChild(card);
      });
    }
    
    // 获取用户信息
    async function fetchUserInfo() {
      const container = document.getElementById('user-info');
      container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>加载中...</p></div>';
      
      const data = await apiCall('/User/Info');
      if (!data || !data.data) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">❌</div><p>获取用户信息失败</p></div>';
        return;
      }
      
      const user = data.data;
      container.innerHTML = \`
        <div class="info-card">
          <h2>用户信息</h2>
          <div class="info-item">
            <label>用户名</label>
            <value>\${user.username}</value>
          </div>
          <div class="info-item">
            <label>邮箱</label>
            <value>\${user.email}</value>
          </div>
          <div class="info-item">
            <label>余额</label>
            <value class="credit-amount">$\${(user.credit / 10000).toFixed(4)} USD</value>
            <div class="credit-raw">\${user.credit} credits</div>
          </div>
        </div>
      \`;
    }
    
    // 电源操作
    async function powerAction(id, action) {
      if (!confirm(\`确定要执行 \${action} 操作吗？\`)) return;
      
      const data = await apiCall('/Evo/Power', 'POST', { id: id.toString(), action });
      if (data) {
        alert(data.message || '操作成功');
        fetchInstances();
      }
    }
    
    // 销毁实例
    async function destroyInstance(id) {
      if (!confirm('确定要销毁此实例吗？此操作不可逆！')) return;
      
      const data = await apiCall('/Evo/Destroy', 'POST', { id: id.toString() });
      if (data) {
        alert(data.message || '销毁成功');
        fetchInstances();
      }
    }
    
    // 打开部署 Modal
    async function openDeployModal(plan) {
      selectedPlan = plan;
      
      const modal = document.getElementById('deploy-modal');
      if (!modal) {
        alert('Modal 元素未找到，请检查页面结构');
        return;
      }
      
      const planInfo = document.getElementById('deploy-plan-info');
      
      if (planInfo) {
        planInfo.innerHTML = \`
          <h3>方案配置 - \${plan.name}</h3>
          <div class="plan-info-grid">
            <span>CPU: \${plan.cpu} 核心</span>
            <span>内存: \${plan.memory} MB</span>
            <span>硬盘: \${plan.disk} GB</span>
            <span>网络: \${plan.network_speed}</span>
          </div>
        \`;
      }
      
      const osList = document.getElementById('os-list');
      if (osList) {
        osList.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
      }
      
      modal.classList.add('show');
      
      // 异步加载操作系统列表
      try {
        const data = await apiCall('/Evo/getOSByPlan', 'POST', { plan_id: plan.id.toString() });
        
        if (osList) {
          if (data && data.data) {
            const osHTML = data.data.map(group => \`
              <div class="os-group">
                <h4>\${group.group_name}</h4>
                \${group.os_list.map(os => \`
                  <div class="os-option">
                    <input type="radio" name="os" value="\${os.id}" id="os-\${os.id}">
                    <label for="os-\${os.id}">\${os.name}</label>
                  </div>
                \`).join('')}
              </div>
            \`).join('');
            
            osList.innerHTML = osHTML;
          } else {
            osList.innerHTML = '<p style="color: #999;">获取操作系统列表失败</p>';
          }
        }
      } catch (error) {
        console.error('获取操作系统列表时出错:', error);
        if (osList) {
          osList.innerHTML = '<p style="color: #999;">获取操作系统列表失败: ' + error.message + '</p>';
        }
      }
      
      // 重置表单
      const timeInput = document.getElementById('deploy-time');
      const sshkeySelect = document.getElementById('deploy-sshkey');
      const bootScriptInput = document.getElementById('deploy-bootscript');
      const previewContainer = document.getElementById('deploy-bootscript-preview-container');
      const previewTextarea = document.getElementById('deploy-bootscript-preview');
      
      if (timeInput) timeInput.value = '24';
      if (sshkeySelect) {
        // 加载SSH密钥列表
        sshkeySelect.innerHTML = '<option value="">不使用SSH密钥</option>';
        const sshKeysData = await apiCall('/User/SSHKey');
        if (sshKeysData && sshKeysData.data) {
          sshKeysData.data.forEach(key => {
            const option = document.createElement('option');
            option.value = key.id;
            option.textContent = key.name + ' (ID: ' + key.id + ')';
            sshkeySelect.appendChild(option);
          });
        }
      }
      if (bootScriptInput) {
        bootScriptInput.value = '';
        // 添加输入事件监听
        bootScriptInput.addEventListener('input', function() {
          const script = this.value.trim();
          if (script) {
            const base64 = btoa(unescape(encodeURIComponent(script)));
            previewTextarea.value = base64;
            previewContainer.style.display = 'block';
          } else {
            previewContainer.style.display = 'none';
          }
        });
      }
      if (previewContainer) previewContainer.style.display = 'none';
    }
    
    // 关闭部署 Modal
    function closeDeployModal() {
      document.getElementById('deploy-modal').classList.remove('show');
      selectedPlan = null;
    }
    
    // 确认部署
    async function confirmDeploy() {
      const osRadio = document.querySelector('input[name="os"]:checked');
      const time = document.getElementById('deploy-time').value;
      const sshKey = document.getElementById('deploy-sshkey').value;
      
      if (!osRadio) {
        alert('请选择操作系统');
        return;
      }
      
      if (!time || time < 1) {
        alert('请输入有效的租用时长');
        return;
      }
      
      const body = {
        product_id: selectedPlan.id.toString(),
        os_id: osRadio.value,
        time: time
      };
      
      if (sshKey) {
        body.sshKey = sshKey;
      }
      
      // 获取启动脚本并转换为Base64
      const bootScript = document.getElementById('deploy-bootscript').value.trim();
      if (bootScript) {
        body.bootScript = btoa(unescape(encodeURIComponent(bootScript)));
      }
      
      const data = await apiCall('/Evo/Deploy', 'POST', body);
      if (data && data.data) {
        deployResult = {
          hostname: data.data.hostname,
          ipv4: data.data.ipv4,
          ipv6: data.data.ipv6,
          password: data.data.password
        };
        
        closeDeployModal();
        showResultModal();
      }
    }
    
    // 显示部署结果 Modal
    function showResultModal() {
      document.getElementById('result-hostname').value = '主机名：' + deployResult.hostname;
      document.getElementById('result-ipv4').value = 'IPv4地址：' + deployResult.ipv4;
      document.getElementById('result-ipv6').value = 'IPv6地址：' + deployResult.ipv6;
      document.getElementById('result-password').value = '登录密码：' + deployResult.password;
      
      document.getElementById('result-modal').classList.add('show');
    }
    
    // 关闭结果 Modal
    function closeResultModal() {
      document.getElementById('result-modal').classList.remove('show');
      deployResult = null;
    }
    
    // 复制文本
    function copyText(inputId) {
      const input = document.getElementById(inputId);
      input.select();
      document.execCommand('copy');
      alert('已复制到剪贴板');
    }
    
    // 复制全部信息
    function copyAllInfo() {
      const text = \`主机名：\${deployResult.hostname}
IPv4地址：\${deployResult.ipv4}
IPv6地址：\${deployResult.ipv6}
登录密码：\${deployResult.password}\`;
      
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('已复制全部信息到剪贴板');
    }
    
    // 打开重建 Modal
    async function openRebuildModal(instanceId, currentOs) {
      const modal = document.getElementById('rebuild-modal');
      const instanceIdInput = document.getElementById('rebuild-instance-id');
      const currentOsInput = document.getElementById('rebuild-current-os');
      const rebuildOsList = document.getElementById('rebuild-os-list');
      const sshKeyInput = document.getElementById('rebuild-sshkey');
      const bootScriptInput = document.getElementById('rebuild-bootscript');
      const previewContainer = document.getElementById('rebuild-bootscript-preview-container');
      const previewTextarea = document.getElementById('rebuild-bootscript-preview');
      
      // 设置实例信息
      if (instanceIdInput) instanceIdInput.value = instanceId;
      if (currentOsInput) currentOsInput.value = currentOs;
      if (sshKeyInput) {
        // 加载SSH密钥列表
        sshKeyInput.innerHTML = '<option value="">不使用SSH密钥</option>';
        const sshKeysData = await apiCall('/User/SSHKey');
        if (sshKeysData && sshKeysData.data) {
          sshKeysData.data.forEach(key => {
            const option = document.createElement('option');
            option.value = key.id;
            option.textContent = key.name + ' (ID: ' + key.id + ')';
            sshKeyInput.appendChild(option);
          });
        }
      }
      if (bootScriptInput) {
        bootScriptInput.value = '';
        // 添加输入事件监听
        bootScriptInput.addEventListener('input', function() {
          const script = this.value.trim();
          if (script) {
            const base64 = btoa(unescape(encodeURIComponent(script)));
            previewTextarea.value = base64;
            previewContainer.style.display = 'block';
          } else {
            previewContainer.style.display = 'none';
          }
        });
      }
      if (previewContainer) previewContainer.style.display = 'none';
      
      // 显示加载状态
      if (rebuildOsList) {
        rebuildOsList.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
      }
      
      modal.classList.add('show');
      
      // 从实例中找到对应的plan_id并加载操作系统列表
      try {
        // 获取所有实例来找到对应的plan_id
        const instancesData = await apiCall('/Evo/Instance');
        if (instancesData && instancesData.data) {
          const instance = instancesData.data.find(inst => inst.id === instanceId);
          if (instance && instance.plan_id) {
            // 使用plan_id获取操作系统列表
            const osData = await apiCall('/Evo/getOSByPlan', 'POST', { plan_id: instance.plan_id.toString() });
            
            if (rebuildOsList) {
              if (osData && osData.data) {
                const osHTML = osData.data.map(group => \`
                  <div class="os-group">
                    <h4>\${group.group_name}</h4>
                    \${group.os_list.map(os => \`
                      <div class="os-option">
                        <input type="radio" name="rebuild-os" value="\${os.id}" id="rebuild-os-\${os.id}">
                        <label for="rebuild-os-\${os.id}">\${os.name}</label>
                      </div>
                    \`).join('')}
                  </div>
                \`).join('');
                
                rebuildOsList.innerHTML = osHTML;
              } else {
                rebuildOsList.innerHTML = '<p style="color: #999;">获取操作系统列表失败</p>';
              }
            }
          } else {
            if (rebuildOsList) {
              rebuildOsList.innerHTML = '<p style="color: #999;">无法获取实例的方案信息</p>';
            }
          }
        }
      } catch (error) {
        console.error('加载操作系统列表时出错:', error);
        if (rebuildOsList) {
          rebuildOsList.innerHTML = '<p style="color: #999;">加载失败: ' + error.message + '</p>';
        }
      }
    }
    
    // 关闭重建 Modal
    function closeRebuildModal() {
      document.getElementById('rebuild-modal').classList.remove('show');
    }
    
    // 确认重建
    async function confirmRebuild() {
      const instanceId = document.getElementById('rebuild-instance-id').value;
      const osRadio = document.querySelector('input[name="rebuild-os"]:checked');
      const sshKey = document.getElementById('rebuild-sshkey').value;
      
      if (!osRadio) {
        alert('请选择新的操作系统');
        return;
      }
      
      if (!confirm('确定要重建此实例吗？此操作将清除所有数据！')) {
        return;
      }
      
      const body = {
        id: instanceId,
        os: osRadio.value
      };
      
      if (sshKey) {
        body.sshKey = sshKey;
      }
      
      // 获取启动脚本并转换为Base64
      const bootScript = document.getElementById('rebuild-bootscript').value.trim();
      if (bootScript) {
        body.bootScript = btoa(unescape(encodeURIComponent(bootScript)));
      }
      
      const data = await apiCall('/Evo/Rebuild', 'POST', body);
      if (data && data.data) {
        // 保存重建结果
        deployResult = {
          hostname: data.data.hostname || '未提供',
          ipv4: data.data.ipv4 || '未提供',
          ipv6: data.data.ipv6 || '未提供',
          password: data.data.password || '未提供'
        };
        
        closeRebuildModal();
        showResultModal();
      } else if (data) {
        alert(data.message || '重建成功');
        closeRebuildModal();
        fetchInstances();
      }
    }
  </script>
</body>
</html>`;
}

/**
 * Cloudflare Workers 请求处理器
 */
export default {
  async fetch(request, env, ctx) {
    // 处理 CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // 对于不需要认证的路径，直接返回
    if (path === '/') {
      return new Response(getHTMLPage(), {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }

    if (path === '/api') {
      return new Response(JSON.stringify({
        message: 'Alice.ws API Proxy - Cloudflare Workers',
        endpoints: {
          'GET /instances': '列出所有实例',
          'POST /deploy': '部署新实例 (需要: product_id, os_id, time, sshKey?)',
          'POST /destroy': '销毁实例 (需要: id)',
          'POST /power': '电源操作 (需要: id, action)',
          'POST /rebuild': '重建实例 (需要: id, os, sshKey)',
          'GET /plans': '列出所有方案',
          'POST /os': '根据方案获取 OS (需要: plan_id)',
          'POST /renew': '续订实例 (需要: id, time)',
          'POST /state': '获取实例状态 (需要: id)',
          'GET /sshkeys': '列出 SSH 密钥',
          'GET /permissions': '获取 EVO 权限',
          'GET /user': '获取用户信息'
        },
        authentication: '在 Authorization 头中提供 Bearer Token 或使用 ?token= 查询参数'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // 处理通用的 API 代理请求 (/api/Evo/*, /api/User/*)
    if (path.startsWith('/api/')) {
      const authHeader = request.headers.get('Authorization');
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        return new Response(JSON.stringify({ error: '缺少 API Token' }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      try {
        // 提取实际的 API 路径（去掉 /api 前缀）
        const apiPath = path.replace('/api', '');
        
        // 处理请求体
        let body = null;
        if (request.method === 'POST') {
          const contentType = request.headers.get('Content-Type');
          if (contentType && contentType.includes('application/json')) {
            body = await request.json();
          } else if (contentType && contentType.includes('multipart/form-data')) {
            body = await request.formData();
          } else {
            body = await request.formData();
          }
        }

        // 构建转发请求
        const headers = {
          'Authorization': `Bearer ${token}`,
        };

        const config = {
          method: request.method,
          headers,
        };

        if (body) {
          if (body instanceof FormData) {
            config.body = body;
            delete headers['Content-Type']; // 让浏览器自动设置
          } else {
            config.body = JSON.stringify(body);
            headers['Content-Type'] = 'application/json';
          }
        }

        // 转发请求到 Alice API
        const response = await fetch(`${BASE_URL}${apiPath}`, config);
        const data = await response.json();

        return new Response(JSON.stringify(data), {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }

    // 从请求头或查询参数获取 token
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') || url.searchParams.get('token');

    if (!token) {
      return new Response(JSON.stringify({ error: '缺少 API Token' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const client = new AliceAPIClient(token);
    let result;

    try {
      // 路由处理（保留旧的路由以兼容性）
      switch (path) {
        case '/instances':
          result = await client.listInstances();
          break;

        case '/deploy':
          if (request.method === 'POST') {
            const body = await request.json();
            result = await client.deployInstance(
              body.product_id,
              body.os_id,
              body.time,
              body.sshKey
            );
          } else {
            return new Response(JSON.stringify({ error: '方法不允许' }), { status: 405 });
          }
          break;

        case '/destroy':
          if (request.method === 'POST') {
            const body = await request.json();
            result = await client.destroyInstance(body.id);
          } else {
            return new Response(JSON.stringify({ error: '方法不允许' }), { status: 405 });
          }
          break;

        case '/power':
          if (request.method === 'POST') {
            const body = await request.json();
            result = await client.powerInstance(body.id, body.action);
          } else {
            return new Response(JSON.stringify({ error: '方法不允许' }), { status: 405 });
          }
          break;

        case '/rebuild':
          if (request.method === 'POST') {
            const body = await request.json();
            result = await client.rebuildInstance(body.id, body.os, body.sshKey);
          } else {
            return new Response(JSON.stringify({ error: '方法不允许' }), { status: 405 });
          }
          break;

        case '/plans':
          result = await client.listPlans();
          break;

        case '/os':
          if (request.method === 'POST') {
            const body = await request.json();
            result = await client.getOSByPlan(body.plan_id);
          } else {
            return new Response(JSON.stringify({ error: '方法不允许' }), { status: 405 });
          }
          break;

        case '/renew':
          if (request.method === 'POST') {
            const body = await request.json();
            result = await client.renewInstance(body.id, body.time);
          } else {
            return new Response(JSON.stringify({ error: '方法不允许' }), { status: 405 });
          }
          break;

        case '/state':
          if (request.method === 'POST') {
            const body = await request.json();
            result = await client.getInstanceState(body.id);
          } else {
            return new Response(JSON.stringify({ error: '方法不允许' }), { status: 405 });
          }
          break;

        case '/sshkeys':
          result = await client.listSSHKeys();
          break;

        case '/permissions':
          result = await client.getEVOPermissions();
          break;

        case '/user':
          result = await client.getUserInfo();
          break;

        default:
          return new Response(JSON.stringify({ error: '未找到端点' }), {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          });
      }

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : (result.status || 500),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });

    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
