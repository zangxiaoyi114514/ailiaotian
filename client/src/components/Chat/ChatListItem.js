import React, { useState } from 'react';
import {
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import {
  Chat,
  MoreVert,
  Edit,
  Delete,
  Download,
  PushPin,
  PushPinOutlined,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const ChatListItem = ({
  chat,
  isSelected,
  onClick,
  onEdit,
  onDelete,
  onExport,
  onPin,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(chat.title || '');

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
    setEditTitle(chat.title || '');
    setEditDialogOpen(true);
    handleMenuClose();
  };

  // 处理编辑确认
  const handleEditConfirm = () => {
    if (editTitle.trim() && editTitle !== chat.title) {
      onEdit(chat._id, editTitle.trim());
    }
    setEditDialogOpen(false);
  };

  // 处理删除
  const handleDelete = () => {
    onDelete(chat._id);
    handleMenuClose();
  };

  // 处理导出
  const handleExport = () => {
    onExport(chat._id);
    handleMenuClose();
  };

  // 处理置顶
  const handlePin = () => {
    onPin(chat._id, !chat.isPinned);
    handleMenuClose();
  };

  // 获取聊天预览文本
  const getPreviewText = () => {
    if (chat.lastMessage) {
      return chat.lastMessage.content.length > 50
        ? chat.lastMessage.content.substring(0, 50) + '...'
        : chat.lastMessage.content;
    }
    return '暂无消息';
  };

  // 获取时间显示
  const getTimeDisplay = () => {
    const date = new Date(chat.updatedAt || chat.createdAt);
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: zhCN,
    });
  };

  return (
    <>
      <ListItem
        disablePadding
        sx={{
          borderRadius: 1,
          mb: 0.5,
          backgroundColor: isSelected ? 'action.selected' : 'transparent',
          '&:hover': {
            backgroundColor: isSelected ? 'action.selected' : 'action.hover',
          },
        }}
      >
        <ListItemButton
          onClick={() => onClick(chat._id)}
          sx={{
            borderRadius: 1,
            py: 1.5,
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Chat />
          </ListItemIcon>
          
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: isSelected ? 600 : 400,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}
                >
                  {chat.title || '新对话'}
                </Typography>
                
                {chat.isPinned && (
                  <PushPin
                    fontSize="small"
                    sx={{ color: 'primary.main', opacity: 0.7 }}
                  />
                )}
                
                {chat.messageCount > 0 && (
                  <Chip
                    label={chat.messageCount}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                )}
              </Box>
            }
            secondary={
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    mb: 0.5,
                  }}
                >
                  {getPreviewText()}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: '0.7rem' }}
                >
                  {getTimeDisplay()}
                </Typography>
              </Box>
            }
          />
          
          <IconButton
            size="small"
            onClick={handleMenuOpen}
            sx={{
              opacity: 0.7,
              '&:hover': { opacity: 1 },
            }}
          >
            <MoreVert fontSize="small" />
          </IconButton>
        </ListItemButton>
      </ListItem>

      {/* 操作菜单 */}
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
        <MenuItem onClick={handleEdit}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          重命名
        </MenuItem>
        
        <MenuItem onClick={handlePin}>
          {chat.isPinned ? (
            <PushPin fontSize="small" sx={{ mr: 1 }} />
          ) : (
            <PushPinOutlined fontSize="small" sx={{ mr: 1 }} />
          )}
          {chat.isPinned ? '取消置顶' : '置顶'}
        </MenuItem>
        
        <MenuItem onClick={handleExport}>
          <Download fontSize="small" sx={{ mr: 1 }} />
          导出
        </MenuItem>
        
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          删除
        </MenuItem>
      </Menu>

      {/* 编辑对话标题对话框 */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>重命名对话</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="对话标题"
            fullWidth
            variant="outlined"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleEditConfirm();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>取消</Button>
          <Button
            onClick={handleEditConfirm}
            variant="contained"
            disabled={!editTitle.trim()}
          >
            确认
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ChatListItem;