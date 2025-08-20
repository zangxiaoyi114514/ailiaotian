import React, { useState } from 'react';
import {
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  Chip,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  MoreVert,
  Edit,
  Delete,
  Download,
  Share,
  PushPin,
  PushPinOutlined,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useChat } from '../../contexts/ChatContext';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const ChatListItem = ({ chat, isActive, onClick }) => {
  const theme = useTheme();
  const { updateChat, deleteChat, exportChat } = useChat();
  const [anchorEl, setAnchorEl] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  // 处理菜单打开
  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  // 处理菜单关闭
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // 处理编辑
  const handleEdit = () => {
    // TODO: 实现编辑对话标题功能
    console.log('编辑对话:', chat._id);
    handleMenuClose();
  };

  // 处理删除
  const handleDelete = async () => {
    try {
      await deleteChat(chat._id);
    } catch (error) {
      console.error('删除对话失败:', error);
    }
    handleMenuClose();
  };

  // 处理导出
  const handleExport = async (format) => {
    try {
      await exportChat(chat._id, format);
    } catch (error) {
      console.error('导出对话失败:', error);
    }
    handleMenuClose();
  };

  // 处理置顶
  const handlePin = async () => {
    try {
      await updateChat(chat._id, {
        isPinned: !chat.isPinned,
      });
    } catch (error) {
      console.error('置顶操作失败:', error);
    }
    handleMenuClose();
  };

  // 获取AI提供商显示名称
  const getProviderDisplayName = (provider) => {
    switch (provider) {
      case 'openai':
        return 'OpenAI';
      case 'gemini':
        return 'Gemini';
      case 'custom':
        return '自定义';
      default:
        return provider;
    }
  };

  // 获取AI提供商颜色
  const getProviderColor = (provider) => {
    switch (provider) {
      case 'openai':
        return '#10a37f';
      case 'gemini':
        return '#4285f4';
      case 'custom':
        return '#ff6b35';
      default:
        return theme.palette.primary.main;
    }
  };

  // 格式化时间
  const formatTime = (date) => {
    try {
      return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: zhCN,
      });
    } catch (error) {
      return '刚刚';
    }
  };

  return (
    <>
      <ListItem
        disablePadding
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          style={{ width: '100%' }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <ListItemButton
            onClick={onClick}
            selected={isActive}
            sx={{
              borderRadius: 1,
              mx: 1,
              mb: 0.5,
              position: 'relative',
              overflow: 'hidden',
              '&.Mui-selected': {
                backgroundColor: theme.palette.primary.main + '15',
                '&:hover': {
                  backgroundColor: theme.palette.primary.main + '25',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 3,
                  backgroundColor: theme.palette.primary.main,
                },
              },
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <Box sx={{ flexGrow: 1, minWidth: 0, pr: 1 }}>
              {/* 标题行 */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                {/* 置顶图标 */}
                {chat.isPinned && (
                  <PushPin
                    sx={{
                      fontSize: 14,
                      color: theme.palette.warning.main,
                      mr: 0.5,
                    }}
                  />
                )}
                
                {/* 对话标题 */}
                <Typography
                  variant="subtitle2"
                  sx={
                    {
                      fontWeight: isActive ? 600 : 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flexGrow: 1,
                    }
                  }
                >
                  {chat.title}
                </Typography>
              </Box>

              {/* 信息行 */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                {/* AI提供商标签 */}
                <Chip
                  label={getProviderDisplayName(chat.aiProvider)}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.7rem',
                    backgroundColor: getProviderColor(chat.aiProvider) + '20',
                    color: getProviderColor(chat.aiProvider),
                    '& .MuiChip-label': {
                      px: 0.5,
                    },
                  }}
                />
                
                {/* 模型名称 */}
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flexGrow: 1,
                  }}
                >
                  {chat.model}
                </Typography>
              </Box>

              {/* 统计信息 */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                  }}
                >
                  {chat.messageCount || 0} 条消息
                </Typography>
                
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                  }}
                >
                  {formatTime(chat.updatedAt)}
                </Typography>
              </Box>
            </Box>

            {/* 操作按钮 */}
            {(isHovered || isActive) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Tooltip title="更多操作">
                  <IconButton
                    size="small"
                    onClick={handleMenuOpen}
                    sx={{
                      color: theme.palette.text.secondary,
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                    }}
                  >
                    <MoreVert fontSize="small" />
                  </IconButton>
                </Tooltip>
              </motion.div>
            )}
          </ListItemButton>
        </motion.div>
      </ListItem>

      {/* 操作菜单 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{
          elevation: 8,
          sx: {
            minWidth: 160,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1,
              fontSize: '0.875rem',
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handlePin}>
          {chat.isPinned ? (
            <>
              <PushPinOutlined sx={{ mr: 1.5, fontSize: 18 }} />
              取消置顶
            </>
          ) : (
            <>
              <PushPin sx={{ mr: 1.5, fontSize: 18 }} />
              置顶对话
            </>
          )}
        </MenuItem>
        
        <MenuItem onClick={handleEdit}>
          <Edit sx={{ mr: 1.5, fontSize: 18 }} />
          编辑标题
        </MenuItem>
        
        <MenuItem onClick={() => handleExport('json')}>
          <Download sx={{ mr: 1.5, fontSize: 18 }} />
          导出为JSON
        </MenuItem>
        
        <MenuItem onClick={() => handleExport('txt')}>
          <Download sx={{ mr: 1.5, fontSize: 18 }} />
          导出为文本
        </MenuItem>
        
        <MenuItem onClick={handleDelete} sx={{ color: theme.palette.error.main }}>
          <Delete sx={{ mr: 1.5, fontSize: 18 }} />
          删除对话
        </MenuItem>
      </Menu>
    </>
  );
};

export default ChatListItem;