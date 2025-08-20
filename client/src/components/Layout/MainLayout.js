import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Settings,
  ExitToApp,
  Brightness4,
  Brightness7,
  Notifications,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useChat } from '../../contexts/ChatContext';
import Sidebar from './Sidebar';
import NotificationCenter from '../Notifications/NotificationCenter';

const DRAWER_WIDTH = 280;

const MainLayout = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { user, logout } = useAuth();
  const { toggleTheme, isDarkMode, siteName } = useSettings();
  const { unreadCount } = useChat();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 处理移动端抽屉切换
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // 处理侧边栏折叠
  const handleSidebarToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  // 处理用户菜单
  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  // 处理通知菜单
  const handleNotificationOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  // 处理导航
  const handleNavigation = (path) => {
    navigate(path);
    handleUserMenuClose();
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // 处理登出
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('登出失败:', error);
    }
    handleUserMenuClose();
  };

  // 响应式处理
  useEffect(() => {
    if (!isMobile) {
      setMobileOpen(false);
    }
  }, [isMobile]);

  // 获取页面标题
  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case '/':
      case '/chat':
        return '聊天';
      case '/profile':
        return '个人资料';
      case '/admin':
        return '管理面板';
      case '/settings':
        return '设置';
      default:
        return '聊天';
    }
  };

  // 侧边栏内容
  const sidebarContent = (
    <Sidebar 
      isCollapsed={isCollapsed}
      onToggleCollapse={handleSidebarToggle}
      onClose={() => setMobileOpen(false)}
    />
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* 顶部应用栏 */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          boxShadow: theme.shadows[1],
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar>
          {/* 菜单按钮 */}
          <IconButton
            color="inherit"
            aria-label="打开菜单"
            edge="start"
            onClick={isMobile ? handleDrawerToggle : handleSidebarToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          {/* 站点标题 */}
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ 
              flexGrow: 1,
              fontWeight: 600,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {siteName} - {getPageTitle()}
          </Typography>

          {/* 右侧工具栏 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* 主题切换 */}
            <Tooltip title={isDarkMode ? '切换到浅色模式' : '切换到深色模式'}>
              <IconButton color="inherit" onClick={toggleTheme}>
                {isDarkMode ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
            </Tooltip>

            {/* 通知 */}
            <Tooltip title="通知">
              <IconButton color="inherit" onClick={handleNotificationOpen}>
                <Badge badgeContent={unreadCount} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* 用户菜单 */}
            <Tooltip title="用户菜单">
              <IconButton
                color="inherit"
                onClick={handleUserMenuOpen}
                sx={{ p: 0.5 }}
              >
                <Avatar
                  sx={{ 
                    width: 32, 
                    height: 32,
                    bgcolor: theme.palette.primary.main,
                  }}
                >
                  {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* 用户菜单 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleUserMenuClose}
        onClick={handleUserMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            minWidth: 200,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => handleNavigation('/profile')}>
          <AccountCircle sx={{ mr: 2 }} />
          个人资料
        </MenuItem>
        
        <MenuItem onClick={() => handleNavigation('/settings')}>
          <Settings sx={{ mr: 2 }} />
          设置
        </MenuItem>
        
        {user?.role === 'admin' && (
          <MenuItem onClick={() => handleNavigation('/admin')}>
            <AdminPanelSettings sx={{ mr: 2 }} />
            管理面板
          </MenuItem>
        )}
        
        <Divider />
        
        <MenuItem onClick={handleLogout}>
          <ExitToApp sx={{ mr: 2 }} />
          退出登录
        </MenuItem>
      </Menu>

      {/* 通知中心 */}
      <NotificationCenter
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationClose}
      />

      {/* 侧边栏 */}
      <Box
        component="nav"
        sx={{ 
          width: { md: isCollapsed ? 64 : DRAWER_WIDTH }, 
          flexShrink: { md: 0 } 
        }}
      >
        {/* 移动端抽屉 */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // 更好的移动端性能
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              backgroundColor: theme.palette.background.paper,
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }}
        >
          {sidebarContent}
        </Drawer>

        {/* 桌面端抽屉 */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: isCollapsed ? 64 : DRAWER_WIDTH,
              backgroundColor: theme.palette.background.paper,
              borderRight: `1px solid ${theme.palette.divider}`,
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              overflowX: 'hidden',
            },
          }}
          open
        >
          {sidebarContent}
        </Drawer>
      </Box>

      {/* 主内容区域 */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* 工具栏占位符 */}
        <Toolbar />
        
        {/* 页面内容 */}
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;