import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Person,
  SmartToy,
  MoreVert,
  ContentCopy,
  VolumeUp,
  Refresh,
  Edit,
  Delete,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import MessageContent from './MessageContent';
import LoadingMessage from './LoadingMessage';

const MessageList = ({ messages, loading, currentChat }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const { deleteMessage, regenerateMessage } = useChat();
  const { enqueueSnackbar } = useSnackbar();
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const messagesContainerRef = useRef(null);
  
  // 处理菜单打开
  const handleMenuOpen = (event, message) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedMessage(message);
  };
  
  // 处理菜单关闭
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMessage(null);
  };
  
  // 复制消息内容
  const handleCopyMessage = async () => {
    if (selectedMessage) {
      try {
        await navigator.clipboard.writeText(selectedMessage.content);
        enqueueSnackbar('消息已复制到剪贴板', { variant: 'success' });
      } catch (error) {
        console.error('复制失败:', error);
        enqueueSnackbar('复制失败', { variant: 'error' });
      }
    }
    handleMenuClose();
  };
  
  // 朗读消息
  const handleSpeakMessage = () => {
    if (selectedMessage && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(selectedMessage.content);
      utterance.lang = 'zh-CN';
      speechSynthesis.speak(utterance);
    } else {
      enqueueSnackbar('您的浏览器不支持语音合成', { variant: 'warning' });
    }
    handleMenuClose();
  };
  
  // 重新生成消息
  const handleRegenerateMessage = async () => {
    if (selectedMessage && selectedMessage.role === 'assistant') {
      try {
        await regenerateMessage(selectedMessage._id);
        enqueueSnackbar('正在重新生成回复...', { variant: 'info' });
      } catch (error) {
        console.error('重新生成失败:', error);
        enqueueSnackbar('重新生成失败', { variant: 'error' });
      }
    }
    handleMenuClose();
  };
  
  // 删除消息
  const handleDeleteMessage = async () => {
    if (selectedMessage) {
      try {
        await deleteMessage(selectedMessage._id);
        enqueueSnackbar('消息已删除', { variant: 'success' });
      } catch (error) {
        console.error('删除失败:', error);
        enqueueSnackbar('删除失败', { variant: 'error' });
      }
    }
    handleMenuClose();
  };
  
  // 获取头像
  const getAvatar = (message) => {
    if (message.role === 'user') {
      return (
        <Avatar
          sx={{
            width: 32,
            height: 32,
            backgroundColor: theme.palette.primary.main,
          }}
        >
          <Person fontSize="small" />
        </Avatar>
      );
    } else {
      const providerColors = {
        openai: '#10a37f',
        gemini: '#4285f4',
        custom: theme.palette.secondary.main,
      };
      
      return (
        <Avatar
          sx={{
            width: 32,
            height: 32,
            backgroundColor: providerColors[message.aiProvider] || theme.palette.secondary.main,
          }}
        >
          <SmartToy fontSize="small" />
        </Avatar>
      );
    }
  };
  
  // 获取消息时间
  const getMessageTime = (timestamp) => {
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      locale: zhCN,
    });
  };
  
  // 消息动画变体
  const messageVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      transition: {
        duration: 0.2,
      },
    },
  };
  
  if (loading && (!messages || messages.length === 0)) {
    return (
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }
  
  if (!messages || messages.length === 0) {
    return (
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          textAlign: 'center',
        }}
      >
        <SmartToy
          sx={{
            fontSize: 64,
            color: theme.palette.text.secondary,
            mb: 2,
          }}
        />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          开始新的对话
        </Typography>
        <Typography variant="body2" color="text.secondary">
          发送消息开始与AI助手对话
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box
      ref={messagesContainerRef}
      sx={{
        flexGrow: 1,
        overflow: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <AnimatePresence>
        {messages.map((message, index) => (
          <motion.div
            key={message._id || index}
            variants={messageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
          >
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                alignItems: 'flex-start',
                flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
              }}
            >
              {/* 头像 */}
              {getAvatar(message)}
              
              {/* 消息内容 */}
              <Box
                sx={{
                  flexGrow: 1,
                  maxWidth: isMobile ? '85%' : '70%',
                }}
              >
                {/* 消息头部信息 */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 0.5,
                    flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {message.role === 'user' ? '你' : 'AI助手'}
                  </Typography>
                  
                  {message.aiProvider && message.role === 'assistant' && (
                    <Chip
                      label={message.aiProvider.toUpperCase()}
                      size="small"
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                  
                  <Typography variant="caption" color="text.secondary">
                    {getMessageTime(message.createdAt)}
                  </Typography>
                  
                  {/* 消息操作菜单 */}
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, message)}
                    sx={{
                      opacity: 0.7,
                      '&:hover': { opacity: 1 },
                    }}
                  >
                    <MoreVert fontSize="small" />
                  </IconButton>
                </Box>
                
                {/* 消息气泡 */}
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    backgroundColor: message.role === 'user'
                      ? theme.palette.primary.main
                      : theme.palette.background.paper,
                    color: message.role === 'user'
                      ? theme.palette.primary.contrastText
                      : theme.palette.text.primary,
                    borderRadius: 2,
                    borderTopLeftRadius: message.role === 'user' ? 2 : 0,
                    borderTopRightRadius: message.role === 'user' ? 0 : 2,
                    position: 'relative',
                    '&:hover': {
                      elevation: 2,
                    },
                  }}
                >
                  <MessageContent
                    content={message.content}
                    role={message.role}
                    isStreaming={message.isStreaming}
                  />
                  
                  {/* 消息状态指示器 */}
                  {message.status && (
                    <Box
                      sx={
                        {
                          position: 'absolute',
                          bottom: 4,
                          right: 8,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                        }
                      }
                    >
                      {message.status === 'sending' && (
                        <CircularProgress size={12} />
                      )}
                      {message.status === 'error' && (
                        <Typography variant="caption" color="error">
                          发送失败
                        </Typography>
                      )}
                    </Box>
                  )}
                </Paper>
              </Box>
            </Box>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* 加载中的消息 */}
      {loading && <LoadingMessage />}
      
      {/* 消息操作菜单 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            minWidth: 150,
          },
        }}
      >
        <MenuItem onClick={handleCopyMessage}>
          <ContentCopy fontSize="small" sx={{ mr: 1 }} />
          复制
        </MenuItem>
        
        <MenuItem onClick={handleSpeakMessage}>
          <VolumeUp fontSize="small" sx={{ mr: 1 }} />
          朗读
        </MenuItem>
        
        {selectedMessage?.role === 'assistant' && (
          <MenuItem onClick={handleRegenerateMessage}>
            <Refresh fontSize="small" sx={{ mr: 1 }} />
            重新生成
          </MenuItem>
        )}
        
        <MenuItem onClick={handleDeleteMessage} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          删除
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default MessageList;