import React, { useState, useEffect } from 'react';
import {
  Menu,
  MenuItem,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Divider,
  Badge,
  Button,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Notifications,
  Info,
  Warning,
  Error,
  CheckCircle,
  Close,
  MarkEmailRead,
  Delete,
  Settings,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAuth } from '../../contexts/AuthContext';
import socketService from '../../services/socket';

const NotificationCenter = ({ anchorEl, open, onClose }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // 模拟通知数据（实际项目中应该从API获取）
  useEffect(() => {
    if (open && user) {
      // 模拟获取通知
      const mockNotifications = [
        {
          id: '1',
          type: 'info',
          title: '欢迎使用AI聊天助手',
          message: '您已成功登录，开始您的AI对话之旅吧！',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          read: false,
        },
        {
          id: '2',
          type: 'success',
          title: '对话已保存',
          message: '您的对话记录已自动保存到云端',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          read: true,
        },
        {
          id: '3',
          type: 'warning',
          title: 'API配额提醒',
          message: '您的API调用次数已使用80%，请注意合理使用',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          read: false,
        },
        {
          id: '4',
          type: 'error',
          title: '连接异常',
          message: '与AI服务的连接出现异常，请检查网络设置',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          read: true,
        },
      ];
      
      setNotifications(mockNotifications);
    }
  }, [open, user]);

  // 监听Socket通知
  useEffect(() => {
    const handleSystemNotification = (data) => {
      const newNotification = {
        id: Date.now().toString(),
        type: data.type || 'info',
        title: data.title,
        message: data.message,
        timestamp: new Date(),
        read: false,
      };
      
      setNotifications(prev => [newNotification, ...prev]);
    };

    socketService.on('system_notification', handleSystemNotification);

    return () => {
      socketService.off('system_notification', handleSystemNotification);
    };
  }, []);

  // 获取通知图标
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle sx={{ color: theme.palette.success.main }} />;
      case 'warning':
        return <Warning sx={{ color: theme.palette.warning.main }} />;
      case 'error':
        return <Error sx={{ color: theme.palette.error.main }} />;
      default:
        return <Info sx={{ color: theme.palette.info.main }} />;
    }
  };

  // 获取通知类型颜色
  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return theme.palette.success.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'error':
        return theme.palette.error.main;
      default:
        return theme.palette.info.main;
    }
  };

  // 标记为已读
  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  // 删除通知
  const deleteNotification = (notificationId) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  // 全部标记为已读
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // 清空所有通知
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // 格式化时间
  const formatTime = (date) => {
    try {
      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: zhCN,
      });
    } catch (error) {
      return '刚刚';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        elevation: 8,
        sx: {
          width: 360,
          maxHeight: 480,
          mt: 1.5,
          borderRadius: 2,
          '& .MuiList-root': {
            py: 0,
          },
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      {/* 头部 */}
      <Box
        sx={{
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Notifications sx={{ color: theme.palette.text.secondary }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              通知中心
            </Typography>
            {unreadCount > 0 && (
              <Badge badgeContent={unreadCount} color="error" max={99} />
            )}
          </Box>
          
          <IconButton size="small" onClick={onClose}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
        
        {/* 操作按钮 */}
        {notifications.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            {unreadCount > 0 && (
              <Button
                size="small"
                startIcon={<MarkEmailRead />}
                onClick={markAllAsRead}
              >
                全部已读
              </Button>
            )}
            
            <Button
              size="small"
              startIcon={<Delete />}
              onClick={clearAllNotifications}
              color="error"
            >
              清空全部
            </Button>
          </Box>
        )}
      </Box>

      {/* 通知列表 */}
      <Box sx={{ maxHeight: 360, overflow: 'auto' }}>
        {notifications.length === 0 ? (
          <Box
            sx={{
              p: 4,
              textAlign: 'center',
              color: theme.palette.text.secondary,
            }}
          >
            <Notifications sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="body2">
              暂无通知消息
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            <AnimatePresence>
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ListItem
                    sx={{
                      py: 1.5,
                      px: 2,
                      backgroundColor: notification.read
                        ? 'transparent'
                        : theme.palette.action.hover,
                      borderLeft: `3px solid ${getNotificationColor(notification.type)}`,
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {getNotificationIcon(notification.type)}
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: notification.read ? 400 : 600,
                              flexGrow: 1,
                            }}
                          >
                            {notification.title}
                          </Typography>
                          
                          {!notification.read && (
                            <Chip
                              label="新"
                              size="small"
                              color="primary"
                              sx={{ height: 16, fontSize: '0.6rem' }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography
                            variant="body2"
                            sx={{
                              color: theme.palette.text.secondary,
                              mb: 0.5,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {notification.message}
                          </Typography>
                          
                          <Typography
                            variant="caption"
                            sx={{ color: theme.palette.text.disabled }}
                          >
                            {formatTime(notification.timestamp)}
                          </Typography>
                        </>
                      }
                    />
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {!notification.read && (
                        <IconButton
                          size="small"
                          onClick={() => markAsRead(notification.id)}
                          sx={{ color: theme.palette.text.secondary }}
                        >
                          <MarkEmailRead fontSize="small" />
                        </IconButton>
                      )}
                      
                      <IconButton
                        size="small"
                        onClick={() => deleteNotification(notification.id)}
                        sx={{ color: theme.palette.error.main }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </ListItem>
                  
                  {index < notifications.length - 1 && <Divider />}
                </motion.div>
              ))}
            </AnimatePresence>
          </List>
        )}
      </Box>

      {/* 底部 */}
      {notifications.length > 0 && (
        <>
          <Divider />
          <Box sx={{ p: 1 }}>
            <Button
              fullWidth
              size="small"
              startIcon={<Settings />}
              onClick={() => {
                onClose();
                // TODO: 导航到通知设置页面
              }}
            >
              通知设置
            </Button>
          </Box>
        </>
      )}
    </Menu>
  );
};

export default NotificationCenter;