import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Divider,
  Tooltip,
  Badge,
  TextField,
  InputAdornment,
  Collapse,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Add,
  Search,
  Chat,
  History,
  Settings,
  Person,
  AdminPanelSettings,
  ChevronLeft,
  ChevronRight,
  ExpandLess,
  ExpandMore,
  Delete,
  Edit,
  MoreVert,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { useSettings } from '../../contexts/SettingsContext';
import ChatListItem from '../Chat/ChatListItem';

const Sidebar = ({ isCollapsed, onToggleCollapse, onClose }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { user } = useAuth();
  const { chats, currentChat, loading, createChat, fetchChats } = useChat();
  const { userPreferences } = useSettings();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    recentChats: true,
    navigation: true,
  });

  // 获取聊天列表
  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user, fetchChats]);

  // 处理导航
  const handleNavigation = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  // 创建新聊天
  const handleCreateChat = async () => {
    try {
      const newChat = await createChat({
        title: '新对话',
        aiProvider: userPreferences.defaultAiProvider,
        model: userPreferences.defaultModel,
        settings: userPreferences.messageSettings,
      });
      
      if (newChat) {
        navigate(`/chat/${newChat._id}`);
        if (onClose) onClose();
      }
    } catch (error) {
      console.error('创建聊天失败:', error);
    }
  };

  // 切换展开状态
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // 过滤聊天列表
  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 导航项配置
  const navigationItems = [
    {
      text: '聊天',
      icon: <Chat />,
      path: '/chat',
      active: location.pathname.startsWith('/chat'),
    },
    {
      text: '个人资料',
      icon: <Person />,
      path: '/profile',
      active: location.pathname === '/profile',
    },
    {
      text: '设置',
      icon: <Settings />,
      path: '/settings',
      active: location.pathname === '/settings',
    },
  ];

  // 管理员导航项
  if (user?.role === 'admin') {
    navigationItems.push({
      text: '管理面板',
      icon: <AdminPanelSettings />,
      path: '/admin',
      active: location.pathname.startsWith('/admin'),
      badge: 'Admin',
    });
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.background.paper,
      }}
    >
      {/* 顶部工具栏 */}
      <Box
        sx={{
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {!isCollapsed && (
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: theme.palette.text.primary,
            }}
          >
            对话列表
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* 新建聊天按钮 */}
          <Tooltip title="新建对话">
            <IconButton
              onClick={handleCreateChat}
              size="small"
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
              }}
            >
              <Add fontSize="small" />
            </IconButton>
          </Tooltip>
          
          {/* 折叠按钮 */}
          <Tooltip title={isCollapsed ? '展开侧边栏' : '折叠侧边栏'}>
            <IconButton onClick={onToggleCollapse} size="small">
              {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* 搜索框 */}
      {!isCollapsed && (
        <Box sx={{ p: 2, pb: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="搜索对话..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        </Box>
      )}

      {/* 主要内容区域 */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {!isCollapsed ? (
          <>
            {/* 最近对话 */}
            <Box>
              <ListItemButton
                onClick={() => toggleSection('recentChats')}
                sx={{ px: 2, py: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <History fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="最近对话"
                  primaryTypographyProps={{
                    variant: 'subtitle2',
                    fontWeight: 600,
                  }}
                />
                <Badge badgeContent={filteredChats.length} color="primary" max={99}>
                  {expandedSections.recentChats ? <ExpandLess /> : <ExpandMore />}
                </Badge>
              </ListItemButton>
              
              <Collapse in={expandedSections.recentChats}>
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  <AnimatePresence>
                    {loading ? (
                      <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          加载中...
                        </Typography>
                      </Box>
                    ) : filteredChats.length > 0 ? (
                      filteredChats.map((chat, index) => (
                        <motion.div
                          key={chat._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <ChatListItem
                            chat={chat}
                            isActive={currentChat?._id === chat._id}
                            onClick={() => {
                              navigate(`/chat/${chat._id}`);
                              if (onClose) onClose();
                            }}
                          />
                        </motion.div>
                      ))
                    ) : (
                      <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          {searchQuery ? '未找到匹配的对话' : '暂无对话记录'}
                        </Typography>
                      </Box>
                    )}
                  </AnimatePresence>
                </Box>
              </Collapse>
            </Box>

            <Divider sx={{ my: 1 }} />

            {/* 导航菜单 */}
            <Box>
              <ListItemButton
                onClick={() => toggleSection('navigation')}
                sx={{ px: 2, py: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Settings fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="导航菜单"
                  primaryTypographyProps={{
                    variant: 'subtitle2',
                    fontWeight: 600,
                  }}
                />
                {expandedSections.navigation ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
              
              <Collapse in={expandedSections.navigation}>
                <List sx={{ py: 0 }}>
                  {navigationItems.map((item) => (
                    <ListItem key={item.path} disablePadding>
                      <ListItemButton
                        onClick={() => handleNavigation(item.path)}
                        selected={item.active}
                        sx={{
                          pl: 4,
                          borderRadius: 1,
                          mx: 1,
                          mb: 0.5,
                          '&.Mui-selected': {
                            backgroundColor: theme.palette.primary.main + '20',
                            '&:hover': {
                              backgroundColor: theme.palette.primary.main + '30',
                            },
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText primary={item.text} />
                        {item.badge && (
                          <Chip
                            label={item.badge}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </Box>
          </>
        ) : (
          // 折叠状态的导航
          <List sx={{ py: 1 }}>
            {/* 新建聊天 */}
            <ListItem disablePadding>
              <Tooltip title="新建对话" placement="right">
                <ListItemButton
                  onClick={handleCreateChat}
                  sx={{
                    justifyContent: 'center',
                    minHeight: 48,
                    px: 2,
                  }}
                >
                  <Add />
                </ListItemButton>
              </Tooltip>
            </ListItem>
            
            <Divider sx={{ my: 1 }} />
            
            {/* 导航项 */}
            {navigationItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <Tooltip title={item.text} placement="right">
                  <ListItemButton
                    onClick={() => handleNavigation(item.path)}
                    selected={item.active}
                    sx={{
                      justifyContent: 'center',
                      minHeight: 48,
                      px: 2,
                      '&.Mui-selected': {
                        backgroundColor: theme.palette.primary.main + '20',
                      },
                    }}
                  >
                    <Badge
                      badgeContent={item.badge ? 1 : 0}
                      color="primary"
                      variant="dot"
                      invisible={!item.badge}
                    >
                      {item.icon}
                    </Badge>
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* 底部用户信息 */}
      {!isCollapsed && (
        <Box
          sx={{
            p: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.default,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.palette.primary.contrastText,
                fontWeight: 600,
              }}
            >
              {user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </Box>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.username || '用户'}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.email || ''}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Sidebar;