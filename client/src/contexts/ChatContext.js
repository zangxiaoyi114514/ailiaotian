import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { useAuth } from './AuthContext';
import { api } from '../services/api';
import socketService from '../services/socketService';

// 初始状态
const initialState = {
  chats: [],
  currentChat: null,
  messages: [],
  loading: false,
  sending: false,
  streaming: false,
  aiTyping: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
};

// Action 类型
const CHAT_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_SENDING: 'SET_SENDING',
  SET_STREAMING: 'SET_STREAMING',
  SET_AI_TYPING: 'SET_AI_TYPING',
  SET_ERROR: 'SET_ERROR',
  SET_CHATS: 'SET_CHATS',
  SET_CURRENT_CHAT: 'SET_CURRENT_CHAT',
  SET_MESSAGES: 'SET_MESSAGES',
  ADD_MESSAGE: 'ADD_MESSAGE',
  UPDATE_MESSAGE: 'UPDATE_MESSAGE',
  DELETE_MESSAGE: 'DELETE_MESSAGE',
  ADD_CHAT: 'ADD_CHAT',
  UPDATE_CHAT: 'UPDATE_CHAT',
  DELETE_CHAT: 'DELETE_CHAT',
  CLEAR_MESSAGES: 'CLEAR_MESSAGES',
  SET_PAGINATION: 'SET_PAGINATION',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
const chatReducer = (state, action) => {
  switch (action.type) {
    case CHAT_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    
    case CHAT_ACTIONS.SET_SENDING:
      return {
        ...state,
        sending: action.payload,
      };
    
    case CHAT_ACTIONS.SET_STREAMING:
      return {
        ...state,
        streaming: action.payload,
      };
    
    case CHAT_ACTIONS.SET_AI_TYPING:
      return {
        ...state,
        aiTyping: action.payload,
      };
    
    case CHAT_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
        sending: false,
        streaming: false,
      };
    
    case CHAT_ACTIONS.SET_CHATS:
      return {
        ...state,
        chats: action.payload.chats,
        pagination: action.payload.pagination,
        loading: false,
      };
    
    case CHAT_ACTIONS.SET_CURRENT_CHAT:
      return {
        ...state,
        currentChat: action.payload,
        messages: action.payload?.messages || [],
      };
    
    case CHAT_ACTIONS.SET_MESSAGES:
      return {
        ...state,
        messages: action.payload,
      };
    
    case CHAT_ACTIONS.ADD_MESSAGE:
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    
    case CHAT_ACTIONS.UPDATE_MESSAGE:
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.id ? { ...msg, ...action.payload } : msg
        ),
      };
    
    case CHAT_ACTIONS.DELETE_MESSAGE:
      return {
        ...state,
        messages: state.messages.filter(msg => msg.id !== action.payload),
      };
    
    case CHAT_ACTIONS.ADD_CHAT:
      return {
        ...state,
        chats: [action.payload, ...state.chats],
      };
    
    case CHAT_ACTIONS.UPDATE_CHAT:
      return {
        ...state,
        chats: state.chats.map(chat =>
          chat.id === action.payload.id ? { ...chat, ...action.payload } : chat
        ),
        currentChat: state.currentChat?.id === action.payload.id
          ? { ...state.currentChat, ...action.payload }
          : state.currentChat,
      };
    
    case CHAT_ACTIONS.DELETE_CHAT:
      return {
        ...state,
        chats: state.chats.filter(chat => chat.id !== action.payload),
        currentChat: state.currentChat?.id === action.payload ? null : state.currentChat,
        messages: state.currentChat?.id === action.payload ? [] : state.messages,
      };
    
    case CHAT_ACTIONS.CLEAR_MESSAGES:
      return {
        ...state,
        messages: [],
      };
    
    case CHAT_ACTIONS.SET_PAGINATION:
      return {
        ...state,
        pagination: action.payload,
      };
    
    case CHAT_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    
    default:
      return state;
  }
};

// 创建上下文
const ChatContext = createContext();

// ChatProvider 组件
export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { user, isAuthenticated } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  // Socket.IO 事件监听
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleNewMessage = (data) => {
      dispatch({
        type: CHAT_ACTIONS.ADD_MESSAGE,
        payload: data.message,
      });
    };

    const handleAiTyping = (data) => {
      dispatch({
        type: CHAT_ACTIONS.SET_AI_TYPING,
        payload: data.typing,
      });
    };

    const handleAiResponse = (data) => {
      dispatch({
        type: CHAT_ACTIONS.ADD_MESSAGE,
        payload: data.message,
      });
      dispatch({
        type: CHAT_ACTIONS.SET_AI_TYPING,
        payload: false,
      });
      dispatch({
        type: CHAT_ACTIONS.SET_SENDING,
        payload: false,
      });
    };

    const handleAiError = (data) => {
      enqueueSnackbar(data.error, { variant: 'error' });
      dispatch({
        type: CHAT_ACTIONS.SET_AI_TYPING,
        payload: false,
      });
      dispatch({
        type: CHAT_ACTIONS.SET_SENDING,
        payload: false,
      });
    };

    const handleStreamStart = () => {
      dispatch({
        type: CHAT_ACTIONS.SET_STREAMING,
        payload: true,
      });
    };

    const handleStreamChunk = (data) => {
      // 处理流式响应块
      // 这里可以实现实时更新消息内容的逻辑
    };

    const handleStreamEnd = (data) => {
      dispatch({
        type: CHAT_ACTIONS.ADD_MESSAGE,
        payload: {
          id: data.messageId,
          role: 'assistant',
          content: data.totalContent,
          timestamp: new Date().toISOString(),
        },
      });
      dispatch({
        type: CHAT_ACTIONS.SET_STREAMING,
        payload: false,
      });
      dispatch({
        type: CHAT_ACTIONS.SET_SENDING,
        payload: false,
      });
    };

    const handleStreamError = (data) => {
      enqueueSnackbar(data.error, { variant: 'error' });
      dispatch({
        type: CHAT_ACTIONS.SET_STREAMING,
        payload: false,
      });
      dispatch({
        type: CHAT_ACTIONS.SET_SENDING,
        payload: false,
      });
    };

    // 注册事件监听器
    socketService.on('new_message', handleNewMessage);
    socketService.on('ai_typing', handleAiTyping);
    socketService.on('ai_response', handleAiResponse);
    socketService.on('ai_error', handleAiError);
    socketService.on('stream_start', handleStreamStart);
    socketService.on('stream_chunk', handleStreamChunk);
    socketService.on('stream_end', handleStreamEnd);
    socketService.on('stream_error', handleStreamError);

    // 清理事件监听器
    return () => {
      socketService.off('new_message', handleNewMessage);
      socketService.off('ai_typing', handleAiTyping);
      socketService.off('ai_response', handleAiResponse);
      socketService.off('ai_error', handleAiError);
      socketService.off('stream_start', handleStreamStart);
      socketService.off('stream_chunk', handleStreamChunk);
      socketService.off('stream_end', handleStreamEnd);
      socketService.off('stream_error', handleStreamError);
    };
  }, [isAuthenticated, enqueueSnackbar]);

  // 获取聊天列表
  const fetchChats = useCallback(async (page = 1, search = '') => {
    try {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: true });
      
      const response = await api.get('/chat', {
        params: { page, search, limit: state.pagination.limit },
      });
      
      dispatch({
        type: CHAT_ACTIONS.SET_CHATS,
        payload: {
          chats: response.data.chats,
          pagination: response.data.pagination,
        },
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || '获取聊天列表失败';
      dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: errorMessage });
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  }, [state.pagination.limit, enqueueSnackbar]);

  // 获取聊天详情
  const fetchChat = useCallback(async (chatId) => {
    try {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: true });
      
      const response = await api.get(`/chat/${chatId}`);
      const chat = response.data.chat;
      
      dispatch({
        type: CHAT_ACTIONS.SET_CURRENT_CHAT,
        payload: chat,
      });
      
      // 加入聊天房间
      socketService.emit('join_chat', { chatId });
      
      return chat;
    } catch (error) {
      const errorMessage = error.response?.data?.message || '获取聊天详情失败';
      dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: errorMessage });
      enqueueSnackbar(errorMessage, { variant: 'error' });
      return null;
    }
  }, [enqueueSnackbar]);

  // 创建新聊天
  const createChat = useCallback(async (chatData) => {
    try {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: true });
      
      const response = await api.post('/chat', chatData);
      const newChat = response.data.chat;
      
      dispatch({
        type: CHAT_ACTIONS.ADD_CHAT,
        payload: newChat,
      });
      
      enqueueSnackbar('新聊天创建成功', { variant: 'success' });
      
      return newChat;
    } catch (error) {
      const errorMessage = error.response?.data?.message || '创建聊天失败';
      dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: errorMessage });
      enqueueSnackbar(errorMessage, { variant: 'error' });
      return null;
    } finally {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: false });
    }
  }, [enqueueSnackbar]);

  // 更新聊天
  const updateChat = useCallback(async (chatId, updates) => {
    try {
      const response = await api.put(`/chat/${chatId}`, updates);
      const updatedChat = response.data.chat;
      
      dispatch({
        type: CHAT_ACTIONS.UPDATE_CHAT,
        payload: updatedChat,
      });
      
      enqueueSnackbar('聊天信息更新成功', { variant: 'success' });
      
      return updatedChat;
    } catch (error) {
      const errorMessage = error.response?.data?.message || '更新聊天失败';
      dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: errorMessage });
      enqueueSnackbar(errorMessage, { variant: 'error' });
      return null;
    }
  }, [enqueueSnackbar]);

  // 删除聊天
  const deleteChat = useCallback(async (chatId) => {
    try {
      await api.delete(`/chat/${chatId}`);
      
      dispatch({
        type: CHAT_ACTIONS.DELETE_CHAT,
        payload: chatId,
      });
      
      enqueueSnackbar('聊天删除成功', { variant: 'success' });
      
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || '删除聊天失败';
      dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: errorMessage });
      enqueueSnackbar(errorMessage, { variant: 'error' });
      return false;
    }
  }, [enqueueSnackbar]);

  // 发送消息
  const sendMessage = useCallback(async (message, options = {}) => {
    if (!state.currentChat) {
      enqueueSnackbar('请先选择或创建一个聊天', { variant: 'warning' });
      return;
    }

    try {
      dispatch({ type: CHAT_ACTIONS.SET_SENDING, payload: true });
      
      // 添加用户消息到界面
      const userMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };
      
      dispatch({
        type: CHAT_ACTIONS.ADD_MESSAGE,
        payload: userMessage,
      });
      
      // 通过 Socket.IO 发送消息
      const messageData = {
        chatId: state.currentChat.id,
        message,
        aiProvider: options.aiProvider || state.currentChat.aiProvider,
        model: options.model || state.currentChat.model,
        settings: options.settings || state.currentChat.settings,
      };
      
      if (options.stream) {
        socketService.emit('send_message_stream', messageData);
      } else {
        socketService.emit('send_message', messageData);
      }
    } catch (error) {
      const errorMessage = error.message || '发送消息失败';
      dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: errorMessage });
      enqueueSnackbar(errorMessage, { variant: 'error' });
      dispatch({ type: CHAT_ACTIONS.SET_SENDING, payload: false });
    }
  }, [state.currentChat, enqueueSnackbar]);

  // 清空聊天消息
  const clearMessages = useCallback(async (chatId) => {
    try {
      await api.delete(`/chat/${chatId}/messages`);
      
      if (state.currentChat?.id === chatId) {
        dispatch({ type: CHAT_ACTIONS.CLEAR_MESSAGES });
      }
      
      enqueueSnackbar('聊天消息已清空', { variant: 'success' });
      
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || '清空消息失败';
      dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: errorMessage });
      enqueueSnackbar(errorMessage, { variant: 'error' });
      return false;
    }
  }, [state.currentChat, enqueueSnackbar]);

  // 导出聊天
  const exportChat = useCallback(async (chatId, format = 'json') => {
    try {
      const response = await api.get(`/chat/${chatId}/export`, {
        params: { format },
        responseType: 'blob',
      });
      
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `chat-${chatId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      enqueueSnackbar('聊天导出成功', { variant: 'success' });
      
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || '导出聊天失败';
      enqueueSnackbar(errorMessage, { variant: 'error' });
      return false;
    }
  }, [enqueueSnackbar]);

  // 清除错误
  const clearError = useCallback(() => {
    dispatch({ type: CHAT_ACTIONS.CLEAR_ERROR });
  }, []);

  // 上下文值
  const contextValue = {
    // 状态
    chats: state.chats,
    currentChat: state.currentChat,
    messages: state.messages,
    loading: state.loading,
    sending: state.sending,
    streaming: state.streaming,
    aiTyping: state.aiTyping,
    error: state.error,
    pagination: state.pagination,
    
    // 方法
    fetchChats,
    fetchChat,
    createChat,
    updateChat,
    deleteChat,
    sendMessage,
    clearMessages,
    exportChat,
    clearError,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

// 自定义 Hook
export const useChat = () => {
  const context = useContext(ChatContext);
  
  if (!context) {
    throw new Error('useChat 必须在 ChatProvider 内部使用');
  }
  
  return context;
};

export default ChatContext;