'use client';

import { Instance, Plan, UserInfo } from '@/types/alice';
import { useEffect, useState } from 'react';

export default function Home() {
  const [apiToken, setApiToken] = useState('');
  const [isTokenSet, setIsTokenSet] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [instances, setInstances] = useState<Instance[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'instances' | 'plans' | 'user'>('instances');
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [deployForm, setDeployForm] = useState({
    os_id: '',
    time: '24',
    sshKey: '',
    bootScript: '',
  });
  const [availableOS, setAvailableOS] = useState<{ group_name: string; os_list: { id: number; name: string }[] }[]>([]);
  const [deployResult, setDeployResult] = useState<{ hostname: string; ipv4: string; ipv6: string; password: string } | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showRebuildModal, setShowRebuildModal] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [rebuildForm, setRebuildForm] = useState({
    os_id: '',
    sshKey: '',
    bootScript: '',
  });
  const [sshKeys, setSSHKeys] = useState<{ id: number; name: string; publickey: string }[]>([]);
  const [rebuildOSList, setRebuildOSList] = useState<{ group_name: string; os_list: { id: number; name: string }[] }[]>([]);

  useEffect(() => {
    const savedToken = localStorage.getItem('alice_api_token');
    if (savedToken) {
      setApiToken(savedToken);
      setIsTokenSet(true);
    }
  }, []);

  const handleSetToken = () => {
    if (!tokenInput.trim()) {
      alert('请输入有效的 API Token');
      return;
    }
    localStorage.setItem('alice_api_token', tokenInput);
    setApiToken(tokenInput);
    setIsTokenSet(true);
  };

  const handleLogout = () => {
    if (confirm('确定要退出并清除 Token 吗?')) {
      localStorage.removeItem('alice_api_token');
      setApiToken('');
      setIsTokenSet(false);
      setTokenInput('');
    }
  };

  const apiRequest = async (endpoint: string, options: { method?: string; body?: Record<string, string> } = {}) => {
    const { method = 'GET', body } = options;
    
    const response = await fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint,
        method,
        body,
        token: apiToken,
      }),
    });

    if (!response.ok) {
      throw new Error('API 请求失败');
    }

    return response.json();
  };

  const fetchInstances = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/Evo/Instance');
      setInstances(data.data || []);
    } catch (error) {
      console.error('获取实例失败:', error);
      alert('获取实例失败,请检查 Token 是否正确');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/Evo/Plan');
      setPlans(data.data || []);
    } catch (error) {
      console.error('获取方案失败:', error);
      alert('获取方案失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserInfo = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/User/Info');
      setUserInfo(data.data);
    } catch (error) {
      console.error('获取用户信息失败:', error);
      alert('获取用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePowerAction = async (id: number, action: string) => {
    if (!confirm(`确定要执行 ${action} 操作吗?`)) return;
    
    setLoading(true);
    try {
      const data = await apiRequest('/Evo/Power', {
        method: 'POST',
        body: { id: id.toString(), action },
      });
      alert(data.message || '操作成功');
      fetchInstances();
    } catch (error) {
      alert('操作失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const handleDestroyInstance = async (id: number) => {
    if (!confirm('确定要销毁此实例吗?此操作不可逆!')) return;
    
    setLoading(true);
    try {
      const data = await apiRequest('/Evo/Destroy', {
        method: 'POST',
        body: { id: id.toString() },
      });
      alert(data.message || '销毁成功');
      fetchInstances();
    } catch (error) {
      alert('销毁失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const fetchOSForPlan = async (planId: number) => {
    try {
      const data = await apiRequest('/Evo/getOSByPlan', {
        method: 'POST',
        body: { plan_id: planId.toString() },
      });
      setAvailableOS(data.data || []);
    } catch (error) {
      console.error('获取操作系统失败:', error);
      alert('获取操作系统列表失败');
      setAvailableOS([]);
    }
  };

  const fetchOSForRebuild = async (instanceId: number) => {
    try {
      // 先获取实例详情，找到对应的plan ID
      const instance = instances.find(inst => inst.id === instanceId);
      if (!instance) {
        alert('未找到实例信息');
        return;
      }

      // 从plans列表中查找匹配的plan
      const matchingPlan = plans.find(plan => plan.name === instance.plan);
      if (!matchingPlan) {
        alert('未找到对应的方案信息，请先加载方案列表');
        return;
      }

      const data = await apiRequest('/Evo/getOSByPlan', {
        method: 'POST',
        body: { plan_id: matchingPlan.id.toString() },
      });
      setRebuildOSList(data.data || []);
    } catch (error) {
      console.error('获取操作系统失败:', error);
      alert('获取操作系统列表失败');
      setRebuildOSList([]);
    }
  };

  const fetchSSHKeys = async () => {
    try {
      const data = await apiRequest('/User/SSHKey');
      setSSHKeys(data.data || []);
    } catch (error) {
      console.error('获取SSH密钥失败:', error);
      setSSHKeys([]);
    }
  };

  const handleDeployInstance = async () => {
    if (!deployForm.os_id || !selectedPlan) {
      alert('请选择操作系统');
      return;
    }

    setLoading(true);
    try {
      const bootScriptBase64 = deployForm.bootScript 
        ? btoa(unescape(encodeURIComponent(deployForm.bootScript)))
        : undefined;

      const data = await apiRequest('/Evo/Deploy', {
        method: 'POST',
        body: {
          product_id: selectedPlan.id.toString(),
          os_id: deployForm.os_id,
          time: deployForm.time,
          ...(deployForm.sshKey && { sshKey: deployForm.sshKey }),
          ...(bootScriptBase64 && { bootScript: bootScriptBase64 }),
        },
      });

      setDeployResult({
        hostname: data.data.hostname,
        ipv4: data.data.ipv4,
        ipv6: data.data.ipv6,
        password: data.data.password,
      });
      setShowResultModal(true);
      setShowDeployModal(false);
      setSelectedPlan(null);
      setDeployForm({ os_id: '', time: '24', sshKey: '', bootScript: '' });
      setActiveTab('instances');
      fetchInstances();
    } catch (error) {
      alert('部署失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const handleRebuildInstance = async () => {
    if (!rebuildForm.os_id || !selectedInstance) {
      alert('请选择操作系统');
      return;
    }

    setLoading(true);
    try {
      const bootScriptBase64 = rebuildForm.bootScript 
        ? btoa(unescape(encodeURIComponent(rebuildForm.bootScript)))
        : undefined;

      const data = await apiRequest('/Evo/Rebuild', {
        method: 'POST',
        body: {
          id: selectedInstance.id.toString(),
          os: rebuildForm.os_id,
          ...(rebuildForm.sshKey && { sshKey: rebuildForm.sshKey }),
          ...(bootScriptBase64 && { bootScript: bootScriptBase64 }),
        },
      });

      alert('重建成功！新密码: ' + data.data.password);
      setShowRebuildModal(false);
      setSelectedInstance(null);
      setRebuildForm({ os_id: '', sshKey: '', bootScript: '' });
      fetchInstances();
    } catch (error) {
      alert('重建失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isTokenSet) {
      if (activeTab === 'instances') {
        fetchInstances();
      } else if (activeTab === 'plans') {
        fetchPlans();
      } else if (activeTab === 'user') {
        fetchUserInfo();
      }
    }
  }, [activeTab, isTokenSet]);

  if (!isTokenSet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-gray-900">Alice Eph 管理面板</h1>
          <p className="text-gray-600 mb-4">请输入你的 API Token 以继续</p>
          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="client_id:secret"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="w-full px-4 py-2 pr-12 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && handleSetToken()}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label={showPassword ? "隐藏密码" : "显示密码"}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          <button
            onClick={handleSetToken}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            登录
          </button>
          <p className="text-sm text-gray-500 mt-4">
            Token 将保存在浏览器本地,不会上传到服务器
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Alice Eph 管理面板</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            退出登录
          </button>
        </div>

        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('instances')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'instances'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              实例列表
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'plans'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              可用方案
            </button>
            <button
              onClick={() => setActiveTab('user')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'user'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              用户信息
            </button>
          </nav>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}

        {activeTab === 'instances' && !loading && (
          <div className="space-y-4">
            {instances.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无实例</p>
            ) : (
              instances.map((instance) => (
                <div key={instance.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{instance.hostname}</h3>
                      <p className="text-sm text-gray-500">ID: {instance.id}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      instance.status === 'running' ? 'bg-green-100 text-green-800' :
                      instance.status === 'stopped' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {instance.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">IPv4</p>
                      <p className="font-mono text-sm">{instance.ipv4}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">IPv6</p>
                      <p className="font-mono text-sm">{instance.ipv6}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">配置</p>
                      <p className="text-sm">{instance.cpu} CPU / {instance.memory}MB RAM / {instance.disk}GB {instance.disk_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">系统</p>
                      <p className="text-sm">{instance.os}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">到期时间</p>
                      <p className="text-sm">{new Date(instance.expiration_at + 'Z').toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handlePowerAction(instance.id, 'boot')}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    >
                      启动
                    </button>
                    <button
                      onClick={() => handlePowerAction(instance.id, 'shutdown')}
                      className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                    >
                      关机
                    </button>
                    <button
                      onClick={() => handlePowerAction(instance.id, 'restart')}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      重启
                    </button>
                    <button
                      onClick={async () => {
                        setSelectedInstance(instance);
                        // 确保plans已加载
                        if (plans.length === 0) {
                          await fetchPlans();
                        }
                        await fetchOSForRebuild(instance.id);
                        await fetchSSHKeys();
                        setShowRebuildModal(true);
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                    >
                      重建
                    </button>
                    <button
                      onClick={() => handleDestroyInstance(instance.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm ml-auto"
                    >
                      销毁
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'plans' && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-4">库存: {plan.stock}</p>
                <div className="space-y-2 mb-4">
                  <p className="text-sm"><span className="font-medium">CPU:</span> {plan.cpu} 核心</p>
                  <p className="text-sm"><span className="font-medium">内存:</span> {plan.memory} MB</p>
                  <p className="text-sm"><span className="font-medium">硬盘:</span> {plan.disk} GB</p>
                  <p className="text-sm"><span className="font-medium">网络:</span> {plan.network_speed}</p>
                </div>
                <button
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                  onClick={async () => {
                    setSelectedPlan(plan);
                    await fetchOSForPlan(plan.id);
                    await fetchSSHKeys();
                    setShowDeployModal(true);
                  }}
                  disabled={plan.stock === 0}
                >
                  {plan.stock === 0 ? '暂无库存' : '部署实例'}
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'user' && !loading && userInfo && (
          <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">用户信息</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">用户名</p>
                <p className="text-lg font-medium">{userInfo.username}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">邮箱</p>
                <p className="text-lg">{userInfo.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">余额</p>
                <p className="text-lg font-semibold text-green-600">
                  ${(userInfo.credit / 10000).toFixed(4)} USD
                </p>
                <p className="text-xs text-gray-400">{userInfo.credit} credits</p>
              </div>
            </div>
          </div>
        )}

        {showResultModal && deployResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-green-600">部署成功！</h2>
                  <button
                    onClick={() => {
                      setShowResultModal(false);
                      setDeployResult(null);
                      setActiveTab('instances');
                      fetchInstances();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mb-6">
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                    <p className="text-sm text-yellow-700">
                      ⚠️ 请不要泄露以下信息
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">主机名</label>
                      <div className="flex">
                        <input
                          type="text"
                          value={deployResult.hostname}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50 font-mono text-sm"
                        />
                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(deployResult.hostname);
                              alert('已复制');
                            } catch (err) {
                              alert('复制失败，请手动复制');
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 text-sm"
                        >
                          复制
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">IPv4 地址</label>
                      <div className="flex">
                        <input
                          type="text"
                          value={deployResult.ipv4}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50 font-mono text-sm"
                        />
                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(deployResult.ipv4);
                              alert('已复制');
                            } catch (err) {
                              alert('复制失败，请手动复制');
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 text-sm"
                        >
                          复制
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">IPv6 地址</label>
                      <div className="flex">
                        <input
                          type="text"
                          value={deployResult.ipv6}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50 font-mono text-sm"
                        />
                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(deployResult.ipv6);
                              alert('已复制');
                            } catch (err) {
                              alert('复制失败，请手动复制');
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 text-sm"
                        >
                          复制
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Root 密码</label>
                      <div className="flex">
                        <input
                          type="text"
                          value={deployResult.password}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50 font-mono text-sm"
                        />
                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(deployResult.password);
                              alert('已复制');
                            } catch (err) {
                              alert('复制失败，请手动复制');
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 text-sm"
                        >
                          复制
                        </button>
                      </div>
                    </div>

                    <div>
                      <button
                        onClick={async () => {
                          try {
                            const text = `主机名: ${deployResult.hostname}\nIPv4: ${deployResult.ipv4}\nIPv6: ${deployResult.ipv6}\n密码: ${deployResult.password}`;
                            await navigator.clipboard.writeText(text);
                            alert('已复制全部信息');
                          } catch (err) {
                            alert('复制失败，请手动复制');
                          }
                        }}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        复制全部信息
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowResultModal(false);
                      setDeployResult(null);
                      setActiveTab('instances');
                      fetchInstances();
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    查看实例列表
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showDeployModal && selectedPlan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">部署实例 - {selectedPlan.name}</h2>
                  <button
                    onClick={() => {
                      setShowDeployModal(false);
                      setSelectedPlan(null);
                      setDeployForm({ os_id: '', time: '24', sshKey: '', bootScript: '' });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">方案配置</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><span className="text-gray-600">CPU:</span> {selectedPlan.cpu} 核心</p>
                    <p><span className="text-gray-600">内存:</span> {selectedPlan.memory} MB</p>
                    <p><span className="text-gray-600">硬盘:</span> {selectedPlan.disk} GB</p>
                    <p><span className="text-gray-600">网络:</span> {selectedPlan.network_speed}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      选择操作系统 *
                    </label>
                    {availableOS.length === 0 ? (
                      <p className="text-sm text-gray-500">加载中...</p>
                    ) : (
                      <div className="space-y-4">
                        {availableOS.map((group) => (
                          <div key={group.group_name}>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">{group.group_name}</h4>
                            <div className="space-y-2">
                              {group.os_list.map((os) => (
                                <label key={os.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="os"
                                    value={os.id}
                                    checked={deployForm.os_id === os.id.toString()}
                                    onChange={(e) => setDeployForm({ ...deployForm, os_id: e.target.value })}
                                    className="mr-3"
                                  />
                                  <span className="text-sm">{os.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      租用时长(小时) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={deployForm.time}
                      onChange={(e) => setDeployForm({ ...deployForm, time: e.target.value })}
                      placeholder="请输入租用小时数"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      常用时长参考: 24小时(1天) / 168小时(1周) / 720小时(1个月)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SSH密钥 (可选)
                    </label>
                    {sshKeys.length === 0 ? (
                      <p className="text-sm text-gray-500 py-2">暂无SSH密钥，或留空不使用</p>
                    ) : (
                      <select
                        value={deployForm.sshKey}
                        onChange={(e) => setDeployForm({ ...deployForm, sshKey: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">不使用SSH密钥</option>
                        {sshKeys.map((key) => (
                          <option key={key.id} value={key.id.toString()}>
                            {key.name} (ID: {key.id})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      启动脚本 (可选)
                    </label>
                    <textarea
                      value={deployForm.bootScript}
                      onChange={(e) => setDeployForm({ ...deployForm, bootScript: e.target.value })}
                      placeholder="输入启动脚本代码，将在实例启动时执行"
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    />
                    {deployForm.bootScript && (
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Base64 编码预览
                        </label>
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <pre className="text-xs font-mono text-gray-600 whitespace-pre-wrap break-all">
                            {btoa(unescape(encodeURIComponent(deployForm.bootScript)))}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeployModal(false);
                      setSelectedPlan(null);
                      setDeployForm({ os_id: '', time: '24', sshKey: '', bootScript: '' });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleDeployInstance}
                    disabled={!deployForm.os_id || loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? '部署中...' : '确认部署'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showRebuildModal && selectedInstance && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">重建实例 - {selectedInstance.hostname}</h2>
                  <button
                    onClick={() => {
                      setShowRebuildModal(false);
                      setSelectedInstance(null);
                      setRebuildForm({ os_id: '', sshKey: '', bootScript: '' });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400">
                  <p className="text-sm text-yellow-700">
                    ⚠️ 重建将清除所有数据并重新安装操作系统
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      选择操作系统 *
                    </label>
                    {rebuildOSList.length === 0 ? (
                      <p className="text-sm text-gray-500">加载中...</p>
                    ) : (
                      <div className="space-y-4 max-h-60 overflow-y-auto">
                        {rebuildOSList.map((group) => (
                          <div key={group.group_name}>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">{group.group_name}</h4>
                            <div className="space-y-2">
                              {group.os_list.map((os) => (
                                <label key={os.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="rebuild_os"
                                    value={os.id}
                                    checked={rebuildForm.os_id === os.id.toString()}
                                    onChange={(e) => setRebuildForm({ ...rebuildForm, os_id: e.target.value })}
                                    className="mr-3"
                                  />
                                  <span className="text-sm">{os.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SSH密钥 (可选)
                    </label>
                    {sshKeys.length === 0 ? (
                      <p className="text-sm text-gray-500 py-2">暂无SSH密钥，或留空不使用</p>
                    ) : (
                      <select
                        value={rebuildForm.sshKey}
                        onChange={(e) => setRebuildForm({ ...rebuildForm, sshKey: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">不使用SSH密钥</option>
                        {sshKeys.map((key) => (
                          <option key={key.id} value={key.id.toString()}>
                            {key.name} (ID: {key.id})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      启动脚本 (可选)
                    </label>
                    <textarea
                      value={rebuildForm.bootScript}
                      onChange={(e) => setRebuildForm({ ...rebuildForm, bootScript: e.target.value })}
                      placeholder="输入启动脚本代码，将在实例启动时执行"
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    />
                    {rebuildForm.bootScript && (
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Base64 编码预览
                        </label>
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <pre className="text-xs font-mono text-gray-600 whitespace-pre-wrap break-all">
                            {btoa(unescape(encodeURIComponent(rebuildForm.bootScript)))}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => {
                      setShowRebuildModal(false);
                      setSelectedInstance(null);
                      setRebuildForm({ os_id: '', sshKey: '', bootScript: '' });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleRebuildInstance}
                    disabled={!rebuildForm.os_id || loading}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? '重建中...' : '确认重建'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
