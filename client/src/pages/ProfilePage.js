import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  IconButton,
  Divider,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Person,
  Edit,
  Save,
  Cancel,
  PhotoCamera,
  Email,
  CalendarToday,
  Chat,
  TrendingUp,
  Security,
  Notifications,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { useSnackbar } from 'notistack';

const ProfilePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();
  
  const { user, updateProfile, changePassword, loading } = useAuth();
  const { chats } = useChat();
  
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
  });
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState({});
  
  // 更新用户数据
  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
      });
    }
  }, [user]);
  
  // 处理输入变化
  const handleInputChange = (field) => (event) => {
    setProfileData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    
    // 清除错误
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };
  
  // 处理密码输入变化
  const handlePasswordChange = (field) => (event) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    
    // 清除错误
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };
  
  // 验证个人资料表单
  const validateProfileForm = () => {
    const errors = {};
    
    if (!profileData.username) {
      errors.username = '请输入用户名';
    } else if (profileData.username.length < 2) {
      errors.username = '用户名至少需要2个字符';
    } else if (profileData.username.length > 20) {
      errors.username = '用户名不能超过20个字符';
    }
    
    if (!profileData.email) {
      errors.email = '请输入邮箱地址';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      errors.email = '请输入有效的邮箱地址';
    }
    
    if (profileData.bio && profileData.bio.length > 200) {
      errors.bio = '个人简介不能超过200个字符';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // 验证密码表单
  const validatePasswordForm = () => {
    const errors = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = '请输入当前密码';
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = '请输入新密码';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = '密码至少需要6个字符';
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = '请确认新密码';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = '两次输入的密码不一致';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // 保存个人资料
  const handleSaveProfile = async () => {
    if (!validateProfileForm()) {
      return;
    }
    
    try {
      await updateProfile(profileData);
      setEditMode(false);
      enqueueSnackbar('个人资料更新成功', { variant: 'success' });
    } catch (error) {
      console.error('更新失败:', error);
      enqueueSnackbar(error.message || '更新失败，请重试', { variant: 'error' });
    }
  };
  
  // 取消编辑
  const handleCancelEdit = () => {
    setProfileData({
      username: user?.username || '',
      email: user?.email || '',
      bio: user?.bio || '',
    });
    setEditMode(false);
    setFormErrors({});
  };
  
  // 修改密码
  const handleChangePassword = async () => {
    if (!validatePasswordForm()) {
      return;
    }
    
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordDialog(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setFormErrors({});
      enqueueSnackbar('密码修改成功', { variant: 'success' });
    } catch (error) {
      console.error('密码修改失败:', error);
      enqueueSnackbar(error.message || '密码修改失败，请重试', { variant: 'error' });
    }
  };
  
  // 获取用户统计信息
  const getUserStats = () => {
    const totalChats = chats?.length || 0;
    const totalMessages = chats?.reduce((sum, chat) => sum + (chat.messageCount || 0), 0) || 0;
    const joinDate = user?.createdAt ? format(new Date(user.createdAt), 'yyyy年MM月dd日', { locale: zhCN }) : '';
    const lastActive = user?.lastActiveAt ? formatDistanceToNow(new Date(user.lastActiveAt), { addSuffix: true, locale: zhCN }) : '';
    
    return { totalChats, totalMessages, joinDate, lastActive };
  };
  
  const stats = getUserStats();
  
  // 动画变体
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
      },
    },
  };
  
  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
        {/* 页面标题 */}
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          个人资料
        </Typography>
        
        <Grid container spacing={3}>
          {/* 左侧：个人信息 */}
          <Grid item xs={12} md={8}>
            <motion.div variants={itemVariants}>
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                {/* 头像和基本信息 */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      sx={{
                        width: 80,
                        height: 80,
                        fontSize: '2rem',
                        backgroundColor: theme.palette.primary.main,
                      }}
                    >
                      {user.username?.charAt(0).toUpperCase() || <Person />}
                    </Avatar>
                    <IconButton
                      sx={{
                        position: 'absolute',
                        bottom: -5,
                        right: -5,
                        backgroundColor: theme.palette.background.paper,
                        boxShadow: 2,
                        '&:hover': {
                          backgroundColor: theme.palette.background.paper,
                        },
                      }}
                      size="small"
                    >
                      <PhotoCamera fontSize="small" />
                    </IconButton>
                  </Box>
                  
                  <Box sx={{ ml: 3, flexGrow: 1 }}>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                      {user.username}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {user.email}
                    </Typography>
                    <Chip
                      label={user.role === 'admin' ? '管理员' : '用户'}
                      color={user.role === 'admin' ? 'primary' : 'default'}
                      size="small"
                    />
                  </Box>
                  
                  <Box>
                    {!editMode ? (
                      <Button
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() => setEditMode(true)}
                      >
                        编辑资料
                      </Button>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          startIcon={<Save />}
                          onClick={handleSaveProfile}
                          disabled={loading}
                        >
                          保存
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Cancel />}
                          onClick={handleCancelEdit}
                          disabled={loading}
                        >
                          取消
                        </Button>
                      </Box>
                    )}
                  </Box>
                </Box>
                
                <Divider sx={{ mb: 3 }} />
                
                {/* 个人信息表单 */}
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="用户名"
                      value={profileData.username}
                      onChange={handleInputChange('username')}
                      disabled={!editMode || loading}
                      error={!!formErrors.username}
                      helperText={formErrors.username}
                      InputProps={{
                        startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="邮箱地址"
                      type="email"
                      value={profileData.email}
                      onChange={handleInputChange('email')}
                      disabled={!editMode || loading}
                      error={!!formErrors.email}
                      helperText={formErrors.email}
                      InputProps={{
                        startAdornment: <Email sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="个人简介"
                      multiline
                      rows={3}
                      value={profileData.bio}
                      onChange={handleInputChange('bio')}
                      disabled={!editMode || loading}
                      error={!!formErrors.bio}
                      helperText={formErrors.bio || `${profileData.bio.length}/200`}
                      placeholder="介绍一下自己吧..."
                    />
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 3 }} />
                
                {/* 安全设置 */}
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Security sx={{ mr: 1 }} />
                    安全设置
                  </Typography>
                  
                  <Button
                    variant="outlined"
                    onClick={() => setPasswordDialog(true)}
                    sx={{ mt: 1 }}
                  >
                    修改密码
                  </Button>
                </Box>
              </Paper>
            </motion.div>
          </Grid>
          
          {/* 右侧：统计信息 */}
          <Grid item xs={12} md={4}>
            <motion.div variants={itemVariants}>
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUp sx={{ mr: 1 }} />
                  使用统计
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      总对话数
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {stats.totalChats}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      总消息数
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {stats.totalMessages}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      加入时间
                    </Typography>
                    <Typography variant="body2">
                      {stats.joinDate}
                    </Typography>
                  </Box>
                  
                  {stats.lastActive && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        最后活跃
                      </Typography>
                      <Typography variant="body2">
                        {stats.lastActive}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </motion.div>
            
            {/* 快捷操作 */}
            <motion.div variants={itemVariants}>
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                  快捷操作
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Chat />}
                    fullWidth
                    href="/chat"
                  >
                    开始新对话
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<Notifications />}
                    fullWidth
                  >
                    通知设置
                  </Button>
                </Box>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
        
        {/* 修改密码对话框 */}
        <Dialog
          open={passwordDialog}
          onClose={() => setPasswordDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>修改密码</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="当前密码"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange('currentPassword')}
                error={!!formErrors.currentPassword}
                helperText={formErrors.currentPassword}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="新密码"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange('newPassword')}
                error={!!formErrors.newPassword}
                helperText={formErrors.newPassword}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="确认新密码"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange('confirmPassword')}
                error={!!formErrors.confirmPassword}
                helperText={formErrors.confirmPassword}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPasswordDialog(false)}>取消</Button>
            <Button
              onClick={handleChangePassword}
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : '确认修改'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </motion.div>
  );
};

export default ProfilePage;