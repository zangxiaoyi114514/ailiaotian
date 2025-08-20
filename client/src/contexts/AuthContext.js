import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { api } from '../services/api';
import socketService from '../services/socketService';

// 初始状态
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  error: null,
};

// Action 类型
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_ERROR: 'SET_ERROR',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        loading: false,
        error: null,
      };
    
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null,
      };
    
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload,
        },
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    
    default:
      return state;
  }
};

// 创建上下文
const AuthContext = createContext();

// AuthProvider 组件
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { enqueueSnackbar } = useSnackbar();

  // 设置 API 默认 token
  useEffect(() => {
    if (state.token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [state.token]);

  // 检查认证状态
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      return;
    }

    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      // 验证 token 有效性
      const response = await api.get('/auth/profile');
      
      if (response.data.user) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: response.data.user,
            token,
          },
        });
        
        // 连接 Socket.IO
        socketService.connect(token);
      } else {
        // Token 无效，清除本地存储
        localStorage.removeItem('token');
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    } catch (error) {
      console.error('认证检查失败:', error);
      
      // Token 无效或过期
      localStorage.removeItem('token');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      
      if (error.response?.status !== 401) {
        enqueueSnackbar('认证检查失败，请重新登录', { variant: 'error' });
      }
    }
  }, [enqueueSnackbar]);

  // 初始化认证检查
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 登录
  const login = useCallback(async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      
      const response = await api.post('/auth/login', credentials);
      const { user, token } = response.data;
      
      // 保存 token 到本地存储
      localStorage.setItem('token', token);
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token },
      });
      
      // 连接 Socket.IO
      socketService.connect(token);
      
      enqueueSnackbar(`欢迎回来，${user.username}！`, { variant: 'success' });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || '登录失败，请检查用户名和密码';
      
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      
      enqueueSnackbar(errorMessage, { variant: 'error' });
      
      return { success: false, error: errorMessage };
    }
  }, [enqueueSnackbar]);

  // 注册
  const register = useCallback(async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      
      const response = await api.post('/auth/register', userData);
      const { user, token } = response.data;
      
      // 保存 token 到本地存储
      localStorage.setItem('token', token);
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token },
      });
      
      // 连接 Socket.IO
      socketService.connect(token);
      
      enqueueSnackbar(`注册成功，欢迎 ${user.username}！`, { variant: 'success' });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || '注册失败，请稍后重试';
      
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      
      enqueueSnackbar(errorMessage, { variant: 'error' });
      
      return { success: false, error: errorMessage };
    }
  }, [enqueueSnackbar]);

  // 登出
  const logout = useCallback(async () => {
    try {
      // 断开 Socket.IO 连接
      socketService.disconnect();
      
      // 清除本地存储
      localStorage.removeItem('token');
      
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      
      enqueueSnackbar('已成功登出', { variant: 'info' });
    } catch (error) {
      console.error('登出失败:', error);
      enqueueSnackbar('登出失败', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  // 更新用户信息
  const updateUser = useCallback(async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const response = await api.put('/auth/profile', userData);
      const updatedUser = response.data.user;
      
      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: updatedUser,
      });
      
      enqueueSnackbar('个人信息更新成功', { variant: 'success' });
      
      return { success: true, user: updatedUser };
    } catch (error) {
      const errorMessage = error.response?.data?.message || '更新失败，请稍后重试';
      
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      
      enqueueSnackbar(errorMessage, { variant: 'error' });
      
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  }, [enqueueSnackbar]);

  // 修改密码
  const changePassword = useCallback(async (passwordData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      await api.put('/auth/change-password', passwordData);
      
      enqueueSnackbar('密码修改成功', { variant: 'success' });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || '密码修改失败';
      
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      
      enqueueSnackbar(errorMessage, { variant: 'error' });
      
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  }, [enqueueSnackbar]);

  // 清除错误
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  // 检查用户权限
  const hasPermission = useCallback((permission) => {
    if (!state.user) return false;
    
    switch (permission) {
      case 'admin':
        return state.user.role === 'admin';
      case 'user':
        return state.user.role === 'user' || state.user.role === 'admin';
      default:
        return false;
    }
  }, [state.user]);

  // 获取用户显示名称
  const getDisplayName = useCallback(() => {
    if (!state.user) return '';
    return state.user.username || state.user.email || '用户';
  }, [state.user]);

  // 上下文值
  const contextValue = {
    // 状态
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    
    // 方法
    login,
    register,
    logout,
    updateUser,
    changePassword,
    checkAuth,
    clearError,
    hasPermission,
    getDisplayName,
    
    // 计算属性
    isAuthenticated: !!state.user,
    isAdmin: state.user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 自定义 Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth 必须在 AuthProvider 内部使用');
  }
  
  return context;
};

export default AuthContext;