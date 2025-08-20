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
  FormControlLabel,
  Checkbox,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Person,
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  PersonAdd,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from 'notistack';

const RegisterPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  const { user, register, loading, error } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  
  // 如果已登录，重定向到聊天页面
  useEffect(() => {
    if (user) {
      navigate('/chat', { replace: true });
    }
  }, [user, navigate]);
  
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
    
    if (!formData.username) {
      errors.username = '请输入用户名';
    } else if (formData.username.length < 2) {
      errors.username = '用户名至少需要2个字符';
    } else if (formData.username.length > 20) {
      errors.username = '用户名不能超过20个字符';
    }
    
    if (!formData.email) {
      errors.email = '请输入邮箱地址';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = '请输入有效的邮箱地址';
    }
    
    if (!formData.password) {
      errors.password = '请输入密码';
    } else if (formData.password.length < 6) {
      errors.password = '密码至少需要6个字符';
    } else if (formData.password.length > 50) {
      errors.password = '密码不能超过50个字符';
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = '请确认密码';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = '两次输入的密码不一致';
    }
    
    if (!agreeToTerms) {
      errors.terms = '请同意服务条款和隐私政策';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // 处理注册
  const handleRegister = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await register(formData.username, formData.email, formData.password);
      enqueueSnackbar('注册成功，欢迎使用AI助手！', { variant: 'success' });
    } catch (error) {
      console.error('注册失败:', error);
      enqueueSnackbar(error.message || '注册失败，请重试', { variant: 'error' });
    }
  };
  
  // 处理键盘事件
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleRegister(event);
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
            <PersonAdd
              sx={{
                fontSize: 48,
                color: theme.palette.primary.main,
                mb: 2,
              }}
            />
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
              创建账户
            </Typography>
            <Typography variant="body2" color="text.secondary">
              注册新账户开始使用AI助手
            </Typography>
          </Box>
          
          {/* 错误提示 */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {/* 注册表单 */}
          <Box component="form" onSubmit={handleRegister} sx={{ mt: 2 }}>
            {/* 用户名输入 */}
            <TextField
              fullWidth
              label="用户名"
              value={formData.username}
              onChange={handleInputChange('username')}
              onKeyPress={handleKeyPress}
              error={!!formErrors.username}
              helperText={formErrors.username}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color={formErrors.username ? 'error' : 'action'} />
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
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
            
            {/* 确认密码输入 */}
            <TextField
              fullWidth
              label="确认密码"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
              onKeyPress={handleKeyPress}
              error={!!formErrors.confirmPassword}
              helperText={formErrors.confirmPassword}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color={formErrors.confirmPassword ? 'error' : 'action'} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      disabled={loading}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
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
            
            {/* 服务条款同意 */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  disabled={loading}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" color="text.secondary">
                  我同意{' '}
                  <Link
                    href="#"
                    sx={{
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    服务条款
                  </Link>
                  {' '}和{' '}
                  <Link
                    href="#"
                    sx={{
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    隐私政策
                  </Link>
                </Typography>
              }
              sx={{ mb: 2 }}
            />
            
            {/* 错误提示 */}
            {formErrors.terms && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formErrors.terms}
              </Alert>
            )}
            
            {/* 注册按钮 */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontSize: '1.1rem',
                fontWeight: 600,
                textTransform: 'none',
                mb: 2,
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                '创建账户'
              )}
            </Button>
            
            {/* 分割线 */}
            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                或
              </Typography>
            </Divider>
            
            {/* 登录链接 */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                已有账户？{' '}
                <Link
                  component={RouterLink}
                  to="/login"
                  sx={{
                    color: theme.palette.primary.main,
                    textDecoration: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  立即登录
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default RegisterPage;