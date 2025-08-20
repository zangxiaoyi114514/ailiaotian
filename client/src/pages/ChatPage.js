import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Collapse,
  Divider,
  Chip,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Send,
  Settings,
  ExpandMore,
  ExpandLess,
  Stop,
  Refresh,
  ContentCopy,
  Download,
  VolumeUp,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import MessageList from '../components/Chat/MessageList';
import TypingIndicator from '../components/Chat/TypingIndicator';
import { useSnackbar } from 'notistack';

const ChatPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  const { user } = useAuth();
  const {
    currentChat,
    messages,
    loading,
    sending,
    streaming,
    fetchChat,
    sendMessage,
    sendStreamMessage,
    stopStreaming,
  } = useChat();
  const {
    userPreferences,
    updateMessageSettings,
    getAvailableProviders,
    getProviderModels,
  } = useSettings();
  
  const [message, setMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    aiProvider: userPreferences.defaultAiProvider,
    model: userPreferences.defaultModel,
    ...userPreferences.messageSettings,
  });
  const [isTyping, setIsTyping] = useState(false);
  
  const messageInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  // 加载聊天数据
  useEffect(() => {
    if (chatId && chatId !== 'new') {
      fetchChat(chatId);
    }
  }, [chatId, fetchChat]);
  
  // 自动滚动到底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // 处理发送消息
  const handleSendMessage = async () => {
    if (!message.trim() || sending || streaming) return;
    
    const messageData = {
      content: message.trim(),
      chatId: chatId === 'new' ? null : chatId,
      aiProvider: localSettings.aiProvider,
      model: localSettings.model,
      settings: {
        temperature: localSettings.temperature,
        maxTokens: localSettings.maxTokens,
        topP: localSettings.topP,
        frequencyPenalty: localSettings.frequencyPenalty,
        presencePenalty: localSettings.presencePenalty,
      },
    };
    
    try {
      setMessage('');
      
      // 根据设置选择发送方式
      if (userPreferences.uiSettings.enableStreaming && 
          (localSettings.aiProvider === 'openai' || localSettings.aiProvider === 'custom')) {
        await sendStreamMessage(messageData);
      } else {
        await sendMessage(messageData);
      }
      
      // 如果是新聊天，导航到新创建的聊天
      if (chatId === 'new' && currentChat?._id) {
        navigate(`/chat/${currentChat._id}`, { replace: true });
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      enqueueSnackbar('发送消息失败，请重试', { variant: 'error' });
    }
  };
  
  // 处理键盘事件
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };
  
  // 处理停止生成
  const handleStopGeneration = () => {
    stopStreaming();
  };
  
  // 处理设置更新
  const handleSettingsUpdate = (newSettings) => {
    setLocalSettings(prev => ({ ...prev, ...newSettings }));
    updateMessageSettings(newSettings);
  };
  
  // 获取可用模型
  const availableModels = getProviderModels(localSettings.aiProvider);
  
  // 如果没有用户信息，重定向到登录页
  if (!user) {
    navigate('/login');
    return null;
  }
  
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.background.default,
      }}
    >
      {/* 聊天头部 */}
      <Paper
        elevation={1}
        sx={{
          p: 2,
          borderRadius: 0,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {currentChat?.title || '新对话'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Chip
                label={localSettings.aiProvider.toUpperCase()}
                size="small"
                color="primary"
                variant="outlined"
              />
              <Typography variant="caption" color="text.secondary">
                {localSettings.model}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={() => setShowSettings(!showSettings)}
              color={showSettings ? 'primary' : 'default'}
            >
              <Settings />
            </IconButton>
          </Box>
        </Box>
        
        {/* 设置面板 */}
        <Collapse in={showSettings}>
          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 2 }}>
              {/* AI提供商选择 */}
              <FormControl size="small">
                <InputLabel>AI提供商</InputLabel>
                <Select
                  value={localSettings.aiProvider}
                  label="AI提供商"
                  onChange={(e) => handleSettingsUpdate({ aiProvider: e.target.value })}
                >
                  {getAvailableProviders().map(provider => (
                    <MenuItem key={provider} value={provider}>
                      {provider.toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {/* 模型选择 */}
              <FormControl size="small">
                <InputLabel>模型</InputLabel>
                <Select
                  value={localSettings.model}
                  label="模型"
                  onChange={(e) => handleSettingsUpdate({ model: e.target.value })}
                >
                  {availableModels.map(model => (
                    <MenuItem key={model} value={model}>
                      {model}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            {/* 高级设置 */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                高级设置
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
                {/* 温度 */}
                <Box>
                  <Typography variant="body2" gutterBottom>
                    温度: {localSettings.temperature}
                  </Typography>
                  <Slider
                    value={localSettings.temperature}
                    onChange={(_, value) => handleSettingsUpdate({ temperature: value })}
                    min={0}
                    max={2}
                    step={0.1}
                    marks={[
                      { value: 0, label: '0' },
                      { value: 1, label: '1' },
                      { value: 2, label: '2' },
                    ]}
                  />
                </Box>
                
                {/* 最大令牌数 */}
                <Box>
                  <Typography variant="body2" gutterBottom>
                    最大令牌数: {localSettings.maxTokens}
                  </Typography>
                  <Slider
                    value={localSettings.maxTokens}
                    onChange={(_, value) => handleSettingsUpdate({ maxTokens: value })}
                    min={100}
                    max={4000}
                    step={100}
                    marks={[
                      { value: 100, label: '100' },
                      { value: 2000, label: '2K' },
                      { value: 4000, label: '4K' },
                    ]}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        </Collapse>
      </Paper>
      
      {/* 消息列表 */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <MessageList
          messages={messages}
          loading={loading}
          currentChat={currentChat}
        />
        
        {/* 打字指示器 */}
        <AnimatePresence>
          {(isTyping || streaming) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <TypingIndicator />
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </Box>
      
      {/* 输入区域 */}
      <Paper
        elevation={3}
        sx={{
          p: 2,
          borderRadius: 0,
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            ref={messageInputRef}
            fullWidth
            multiline
            maxRows={4}
            placeholder="输入您的消息..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sending || streaming}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                backgroundColor: theme.palette.background.default,
              },
            }}
          />
          
          {/* 发送/停止按钮 */}
          {streaming ? (
            <IconButton
              onClick={handleStopGeneration}
              color="error"
              sx={{
                width: 48,
                height: 48,
                backgroundColor: theme.palette.error.main,
                color: theme.palette.error.contrastText,
                '&:hover': {
                  backgroundColor: theme.palette.error.dark,
                },
              }}
            >
              <Stop />
            </IconButton>
          ) : (
            <IconButton
              onClick={handleSendMessage}
              disabled={!message.trim() || sending}
              color="primary"
              sx={{
                width: 48,
                height: 48,
                backgroundColor: message.trim() && !sending
                  ? theme.palette.primary.main
                  : theme.palette.action.disabled,
                color: theme.palette.primary.contrastText,
                '&:hover': {
                  backgroundColor: message.trim() && !sending
                    ? theme.palette.primary.dark
                    : theme.palette.action.disabled,
                },
              }}
            >
              {sending ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Send />
              )}
            </IconButton>
          )}
        </Box>
        
        {/* 输入提示 */}
        <Typography
          variant="caption"
          sx={{
            mt: 1,
            color: theme.palette.text.secondary,
            textAlign: 'center',
            display: 'block',
          }}
        >
          按 Enter 发送，Shift + Enter 换行
        </Typography>
      </Paper>
    </Box>
  );
};

export default ChatPage;