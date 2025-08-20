import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useSnackbar } from 'notistack';
// import { useAuth } from './AuthContext'; // 移除循环依赖
import { api } from '../services/api';

// 初始状态
const initialState = {
  settings: null,
  userPreferences: {
    theme: 'light',
    language: 'zh-CN',
    defaultAiProvider: 'openai',
    defaultModel: 'gpt-3.5-turbo',
    messageSettings: {
      temperature: 0.7,
      maxTokens: 2048,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
    },
    uiSettings: {
      sidebarCollapsed: false,
      showTimestamps: true,
      enableAnimations: true,
      enableSounds: false,
      fontSize: 'medium',
    },
  },
  loading: true,
  error: null,
};

// Action 类型
const SETTINGS_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_SETTINGS: 'SET_SETTINGS',
  SET_USER_PREFERENCES: 'SET_USER_PREFERENCES',
  UPDATE_USER_PREFERENCES: 'UPDATE_USER_PREFERENCES',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
const settingsReducer = (state, action) => {
  switch (action.type) {
    case SETTINGS_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    
    case SETTINGS_ACTIONS.SET_SETTINGS:
      return {
        ...state,
        settings: action.payload,
        loading: false,
        error: null,
      };
    
    case SETTINGS_ACTIONS.SET_USER_PREFERENCES:
      return {
        ...state,
        userPreferences: {
          ...state.userPreferences,
          ...action.payload,
        },
      };
    
    case SETTINGS_ACTIONS.UPDATE_USER_PREFERENCES:
      return {
        ...state,
        userPreferences: {
          ...state.userPreferences,
          ...action.payload,
        },
      };
    
    case SETTINGS_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    
    case SETTINGS_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    
    default:
      return state;
  }
};

// 创建上下文
const SettingsContext = createContext();

// SettingsProvider 组件
export const SettingsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(settingsReducer, initialState);
  // const { user, isAuthenticated } = useAuth(); // 移除循环依赖
  const { enqueueSnackbar } = useSnackbar();

  // 从本地存储加载用户偏好
  useEffect(() => {
    const loadUserPreferences = () => {
      try {
        const savedPreferences = localStorage.getItem('userPreferences');
        if (savedPreferences) {
          const preferences = JSON.parse(savedPreferences);
          dispatch({
            type: SETTINGS_ACTIONS.SET_USER_PREFERENCES,
            payload: preferences,
          });
        }
      } catch (error) {
        console.error('加载用户偏好失败:', error);
      }
    };

    loadUserPreferences();
  }, []);

  // 保存用户偏好到本地存储
  const saveUserPreferencesToLocal = useCallback((preferences) => {
    try {
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('保存用户偏好失败:', error);
    }
  }, []);

  // 获取系统设置
  const fetchSettings = useCallback(async () => {
    try {
      dispatch({ type: SETTINGS_ACTIONS.SET_LOADING, payload: true });
      
      // 获取公开设置（不需要认证）
      const response = await api.get('/settings/public');
      
      dispatch({
        type: SETTINGS_ACTIONS.SET_SETTINGS,
        payload: response.data.settings,
      });
    } catch (error) {
      console.error('获取系统设置失败:', error);
      // 设置默认值，不显示错误消息
      dispatch({
        type: SETTINGS_ACTIONS.SET_SETTINGS,
        payload: {
          system: {
            siteName: 'AI Chat',
            allowRegistration: true,
            maintenanceMode: false,
          },
          aiProviders: {
            openai: { enabled: true },
            gemini: { enabled: true },
            custom: { enabled: true },
          },
          features: {
            fileUpload: false,
            voiceInput: false,
            streamResponse: true,
          },
          ui: {
            themes: ['light', 'dark'],
            defaultTheme: 'light',
          },
        },
      });
    }
  }, []);

  // 获取用户偏好（从服务器）
  const fetchUserPreferences = useCallback(async () => {
    // if (!isAuthenticated) return; // 暂时移除认证检查

    try {
      const response = await api.get('/auth/preferences');
      const serverPreferences = response.data.preferences;
      
      // 合并服务器偏好和本地偏好
      const mergedPreferences = {
        ...state.userPreferences,
        ...serverPreferences,
      };
      
      dispatch({
        type: SETTINGS_ACTIONS.SET_USER_PREFERENCES,
        payload: mergedPreferences,
      });
      
      saveUserPreferencesToLocal(mergedPreferences);
    } catch (error) {
      console.error('获取用户偏好失败:', error);
      // 不显示错误消息，使用本地偏好
    }
  }, [state.userPreferences, saveUserPreferencesToLocal]);

  // 更新用户偏好
  const updateUserPreferences = useCallback(async (updates) => {
    const newPreferences = {
      ...state.userPreferences,
      ...updates,
    };
    
    dispatch({
      type: SETTINGS_ACTIONS.UPDATE_USER_PREFERENCES,
      payload: updates,
    });
    
    // 保存到本地存储
    saveUserPreferencesToLocal(newPreferences);
    
    // 如果用户已登录，同步到服务器
    // if (isAuthenticated) { // 暂时移除认证检查
    //   try {
    //     await api.put('/auth/preferences', { preferences: newPreferences });
    //   } catch (error) {
    //     console.error('同步用户偏好到服务器失败:', error);
    //     // 不显示错误消息，本地偏好已保存
    //   }
    // }
  }, [state.userPreferences, saveUserPreferencesToLocal]);

  // 切换主题
  const toggleTheme = useCallback(() => {
    const newTheme = state.userPreferences.theme === 'light' ? 'dark' : 'light';
    updateUserPreferences({ theme: newTheme });
  }, [state.userPreferences.theme, updateUserPreferences]);

  // 设置语言
  const setLanguage = useCallback((language) => {
    updateUserPreferences({ language });
  }, [updateUserPreferences]);

  // 设置默认AI提供商
  const setDefaultAiProvider = useCallback((provider) => {
    updateUserPreferences({ defaultAiProvider: provider });
  }, [updateUserPreferences]);

  // 设置默认模型
  const setDefaultModel = useCallback((model) => {
    updateUserPreferences({ defaultModel: model });
  }, [updateUserPreferences]);

  // 更新消息设置
  const updateMessageSettings = useCallback((settings) => {
    updateUserPreferences({
      messageSettings: {
        ...state.userPreferences.messageSettings,
        ...settings,
      },
    });
  }, [state.userPreferences.messageSettings, updateUserPreferences]);

  // 更新UI设置
  const updateUiSettings = useCallback((settings) => {
    updateUserPreferences({
      uiSettings: {
        ...state.userPreferences.uiSettings,
        ...settings,
      },
    });
  }, [state.userPreferences.uiSettings, updateUserPreferences]);

  // 重置用户偏好
  const resetUserPreferences = useCallback(() => {
    const defaultPreferences = initialState.userPreferences;
    
    dispatch({
      type: SETTINGS_ACTIONS.SET_USER_PREFERENCES,
      payload: defaultPreferences,
    });
    
    saveUserPreferencesToLocal(defaultPreferences);
    
    // if (isAuthenticated) { // 暂时移除认证检查
    //   api.put('/auth/preferences', { preferences: defaultPreferences })
    //     .catch(error => {
    //       console.error('重置服务器偏好失败:', error);
    //     });
    // }
    
    enqueueSnackbar('偏好设置已重置', { variant: 'success' });
  }, [saveUserPreferencesToLocal, enqueueSnackbar]);

  // 获取可用的AI提供商
  const getAvailableProviders = useCallback(() => {
    if (!state.settings?.aiProviders) return [];
    
    return Object.entries(state.settings.aiProviders)
      .filter(([, config]) => config.enabled)
      .map(([provider]) => provider);
  }, [state.settings]);

  // 获取提供商的可用模型
  const getProviderModels = useCallback((provider) => {
    if (!state.settings?.aiProviders?.[provider]) return [];
    
    return state.settings.aiProviders[provider].models || [];
  }, [state.settings]);

  // 检查功能是否启用
  const isFeatureEnabled = useCallback((feature) => {
    return state.settings?.features?.[feature] || false;
  }, [state.settings]);

  // 获取主题配置
  const getThemeConfig = useCallback(() => {
    const isDark = state.userPreferences.theme === 'dark';
    
    return {
      mode: state.userPreferences.theme,
      palette: {
        mode: state.userPreferences.theme,
        primary: {
          main: isDark ? '#90caf9' : '#1976d2',
        },
        background: {
          default: isDark ? '#121212' : '#f5f5f5',
          paper: isDark ? '#1e1e1e' : '#ffffff',
        },
        text: {
          primary: isDark ? '#ffffff' : '#333333',
          secondary: isDark ? '#aaaaaa' : '#666666',
        },
      },
    };
  }, [state.userPreferences.theme]);

  // 清除错误
  const clearError = useCallback(() => {
    dispatch({ type: SETTINGS_ACTIONS.CLEAR_ERROR });
  }, []);

  // 上下文值
  const contextValue = {
    // 状态
    settings: state.settings,
    userPreferences: state.userPreferences,
    loading: state.loading,
    error: state.error,
    
    // 方法
    fetchSettings,
    fetchUserPreferences,
    updateUserPreferences,
    toggleTheme,
    setLanguage,
    setDefaultAiProvider,
    setDefaultModel,
    updateMessageSettings,
    updateUiSettings,
    resetUserPreferences,
    clearError,
    
    // 工具方法
    getAvailableProviders,
    getProviderModels,
    isFeatureEnabled,
    getThemeConfig,
    
    // 计算属性
    isDarkMode: state.userPreferences.theme === 'dark',
    currentLanguage: state.userPreferences.language,
    siteName: state.settings?.system?.siteName || 'AI Chat',
    allowRegistration: state.settings?.system?.allowRegistration !== false,
    maintenanceMode: state.settings?.system?.maintenanceMode || false,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

// 自定义 Hook
export const useSettings = () => {
  const context = useContext(SettingsContext);
  
  if (!context) {
    throw new Error('useSettings 必须在 SettingsProvider 内部使用');
  }
  
  return context;
};

export default SettingsContext;