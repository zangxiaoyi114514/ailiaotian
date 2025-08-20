import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  InputAdornment,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  PersonAdd,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from 'notistack';

const LoginPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  
  const { user, login, loading, error } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  
  // 如果已登录，重定向到聊天页面
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/chat';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);
  
  // 处理输入变化
  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    
    // 清除对应字段的错误
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };
  
  // 表单验证
  const validateForm = () => {
    const errors = {};
    
    if (!formData.email) {
      errors.email = '请输入邮箱地址';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = '请输入有效的邮箱地址';
    }
    
    if (!formData.password) {
      errors.password = '请输入密码';
    } else if (formData.password.length < 6) {
      errors.password = '密码至少需要6个字符';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // 处理登录
  const handleLogin = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await login(formData.email, formData.password);
      enqueueSnackbar('登录成功', { variant: 'success' });
    } catch (error) {
      console.error('登录失败:', error);
      enqueueSnackbar(error.message || '登录失败，请重试', { variant: 'error' });
    }
  };
  
  // 处理键盘事件
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleLogin(event);
    }
  };
  
  // 动画变体
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  };
  
  const formVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        delay: 0.2,
        ease: 'easeOut',
      },
    },
  };
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Paper
          component={motion.div}
          variants={formVariants}
          elevation={8}
          sx={{
            p: 4,
            width: isMobile ? '100%' : 400,
            maxWidth: 400,
            borderRadius: 3,
            backgroundColor: theme.palette.background.paper,
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* 标题 */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <LoginIcon
              sx={{
                fontSize: 48,
                color: theme.palette.primary.main,
                mb: 2,
              }}
            />
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
              欢迎回来
            </Typography>
            <Typography variant="body2" color="text.secondary">
              登录您的账户以继续使用AI助手
            </Typography>
          </Box>
          
          {/* 错误提示 */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {/* 登录表单 */}
          <Box component="form" onSubmit={handleLogin} sx={{ mt: 2 }}>
            {/* 邮箱输入 */}
            <TextField
              fullWidth
              label="邮箱地址"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              onKeyPress={handleKeyPress}
              error={!!formErrors.email}
              helperText={formErrors.email}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color={formErrors.email ? 'error' : 'action'} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
            
            {/* 密码输入 */}
            <TextField
              fullWidth
              label="密码"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange('password')}
              onKeyPress={handleKeyPress}
              error={!!formErrors.password}
              helperText={formErrors.password}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color={formErrors.password ? 'error' : 'action'} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
            
            {/* 登录按钮 */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={
                {
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  mb: 2,
                }
              }
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                '登录'
              )}
            </Button>
            
            {/* 分割线 */}
            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                或
              </Typography>
            </Divider>
            
            {/* 注册链接 */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                还没有账户？{' '}
                <Link
                  component={RouterLink}
                  to="/register"
                  sx={{
                    color: theme.palette.primary.main,
                    textDecoration: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  立即注册
                </Link>
              </Typography>
            </Box>
            
            {/* 忘记密码链接 */}
            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Link
                component={RouterLink}
                to="/forgot-password"
                sx={{
                  color: theme.palette.text.secondary,
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    textDecoration: 'underline',
                    color: theme.palette.primary.main,
                  },
                }}
              >
                忘记密码？
              </Link>
            </Box>
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default LoginPage;