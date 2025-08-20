import axios from 'axios';

// 创建 axios 实例
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000, // 30秒超时
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加认证token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 添加请求时间戳（用于调试）
    config.metadata = { startTime: new Date() };
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // 计算请求耗时
    const endTime = new Date();
    const duration = endTime - response.config.metadata.startTime;
    
    // 在开发环境下记录请求信息
    if (process.env.NODE_ENV === 'development') {
      console.log(`API请求: ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
    }
    
    return response;
  },
  (error) => {
    // 处理响应错误
    if (error.response) {
      const { status, data } = error.response;
      
      // 处理不同的HTTP状态码
      switch (status) {
        case 401:
          // 未授权，清除token并跳转到登录页
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // 只有在不是登录页面时才跳转
          if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
            window.location.href = '/login';
          }
          break;
          
        case 403:
          // 禁止访问
          console.error('访问被拒绝:', data.message || '权限不足');
          break;
          
        case 404:
          // 资源不存在
          console.error('资源不存在:', error.config.url);
          break;
          
        case 429:
          // 请求过于频繁
          console.error('请求过于频繁，请稍后再试');
          break;
          
        case 500:
          // 服务器内部错误
          console.error('服务器内部错误:', data.message || '服务器错误');
          break;
          
        default:
          console.error(`请求失败 (${status}):`, data.message || error.message);
      }
      
      // 返回格式化的错误信息
      const errorMessage = data.message || `请求失败 (${status})`;
      return Promise.reject(new Error(errorMessage));
    } else if (error.request) {
      // 网络错误
      console.error('网络错误:', error.message);
      return Promise.reject(new Error('网络连接失败，请检查网络设置'));
    } else {
      // 其他错误
      console.error('请求配置错误:', error.message);
      return Promise.reject(error);
    }
  }
);

// API方法封装
const apiMethods = {
  // GET请求
  get: (url, config = {}) => api.get(url, config),
  
  // POST请求
  post: (url, data = {}, config = {}) => api.post(url, data, config),
  
  // PUT请求
  put: (url, data = {}, config = {}) => api.put(url, data, config),
  
  // PATCH请求
  patch: (url, data = {}, config = {}) => api.patch(url, data, config),
  
  // DELETE请求
  delete: (url, config = {}) => api.delete(url, config),
  
  // 上传文件
  upload: (url, formData, config = {}) => {
    return api.post(url, formData, {
      ...config,
      headers: {
        ...config.headers,
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // 下载文件
  download: (url, config = {}) => {
    return api.get(url, {
      ...config,
      responseType: 'blob',
    });
  },
};

// 认证相关API
export const authAPI = {
  // 用户登录
  login: (credentials) => apiMethods.post('/auth/login', credentials),
  
  // 用户注册
  register: (userData) => apiMethods.post('/auth/register', userData),
  
  // 验证token
  verify: () => apiMethods.get('/auth/verify'),
  
  // 获取用户信息
  getProfile: () => apiMethods.get('/auth/profile'),
  
  // 更新用户信息
  updateProfile: (userData) => apiMethods.put('/auth/profile', userData),
  
  // 修改密码
  changePassword: (passwordData) => apiMethods.put('/auth/change-password', passwordData),
  
  // 获取用户偏好
  getPreferences: () => apiMethods.get('/auth/preferences'),
  
  // 更新用户偏好
  updatePreferences: (preferences) => apiMethods.put('/auth/preferences', preferences),
};

// 聊天相关API
export const chatAPI = {
  // 获取聊天列表
  getChats: (params = {}) => apiMethods.get('/chats', { params }),
  
  // 获取聊天详情
  getChat: (chatId) => apiMethods.get(`/chats/${chatId}`),
  
  // 创建聊天
  createChat: (chatData) => apiMethods.post('/chats', chatData),
  
  // 更新聊天
  updateChat: (chatId, chatData) => apiMethods.put(`/chats/${chatId}`, chatData),
  
  // 删除聊天
  deleteChat: (chatId) => apiMethods.delete(`/chats/${chatId}`),
  
  // 获取聊天消息
  getMessages: (chatId, params = {}) => apiMethods.get(`/chats/${chatId}/messages`, { params }),
  
  // 清空聊天消息
  clearMessages: (chatId) => apiMethods.delete(`/chats/${chatId}/messages`),
  
  // 导出聊天
  exportChat: (chatId, format = 'json') => apiMethods.get(`/chats/${chatId}/export`, {
    params: { format },
    responseType: 'blob',
  }),
  
  // 获取聊天统计
  getChatStats: (chatId) => apiMethods.get(`/chats/${chatId}/stats`),
};

// AI相关API
export const aiAPI = {
  // 发送消息
  sendMessage: (messageData) => apiMethods.post('/ai/chat', messageData),
  
  // 获取可用模型
  getModels: (provider) => apiMethods.get(`/ai/models/${provider}`),
  
  // 获取提供商状态
  getProviderStatus: (provider) => apiMethods.get(`/ai/status/${provider}`),
  
  // 测试连接
  testConnection: (provider, config) => apiMethods.post(`/ai/test/${provider}`, config),
};

// 设置相关API
export const settingsAPI = {
  // 获取公开设置
  getPublicSettings: () => apiMethods.get('/settings/public'),
  
  // 获取系统设置（管理员）
  getSystemSettings: () => apiMethods.get('/admin/settings'),
  
  // 更新系统设置（管理员）
  updateSystemSettings: (settings) => apiMethods.put('/admin/settings', settings),
};

// 管理员相关API
export const adminAPI = {
  // 获取系统概览
  getOverview: () => apiMethods.get('/admin/overview'),
  
  // 用户管理
  getUsers: (params = {}) => apiMethods.get('/admin/users', { params }),
  updateUser: (userId, userData) => apiMethods.put(`/admin/users/${userId}`, userData),
  deleteUser: (userId) => apiMethods.delete(`/admin/users/${userId}`),
  
  // 聊天管理
  getAllChats: (params = {}) => apiMethods.get('/admin/chats', { params }),
  deleteUserChat: (chatId) => apiMethods.delete(`/admin/chats/${chatId}`),
  
  // 系统维护
  setMaintenanceMode: (enabled) => apiMethods.post('/admin/maintenance', { enabled }),
  
  // 获取日志
  getLogs: (params = {}) => apiMethods.get('/admin/logs', { params }),
};

// 工具函数
export const apiUtils = {
  // 设置认证token
  setAuthToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    }
  },
  
  // 清除认证信息
  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
  },
  
  // 检查网络连接
  checkConnection: async () => {
    try {
      await apiMethods.get('/health');
      return true;
    } catch (error) {
      return false;
    }
  },
  
  // 获取错误消息
  getErrorMessage: (error) => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return '未知错误';
  },
};

// 导出默认实例和方法
export default apiMethods;
export { api };