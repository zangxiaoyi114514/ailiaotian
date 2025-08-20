import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { api } from '../services/api';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginTop: theme.spacing(4),
  borderRadius: theme.spacing(2),
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  textAlign: 'center'
}));

const ConfigCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(2),
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
}));

const steps = ['数据库配置', 'AI服务配置', '管理员账户', '完成设置'];

const InitializePage = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // 数据库配置
  const [dbConfig, setDbConfig] = useState({
    type: 'mongodb',
    host: 'localhost',
    port: '27017',
    database: 'ai_chat',
    username: '',
    password: ''
  });

  // AI服务配置
  const [aiConfig, setAiConfig] = useState({
    openai_api_key: '',
    openai_base_url: 'https://api.openai.com/v1',
    gemini_api_key: '',
    default_model: 'gpt-3.5-turbo'
  });

  // 管理员账户
  const [adminConfig, setAdminConfig] = useState({
    username: 'admin',
    email: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    checkInitializationStatus();
  }, []);

  const checkInitializationStatus = async () => {
    try {
      const response = await api.get('/admin/init-status');
      setIsInitialized(response.data.initialized);
    } catch (error) {
      console.log('检查初始化状态失败:', error);
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setError('');
    setSuccess('');
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setError('');
    setSuccess('');
  };

  const testDatabaseConnection = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await api.post('/admin/test-db', dbConfig);
      if (response.data.success) {
        setSuccess('数据库连接测试成功！');
      } else {
        setError(response.data.message || '数据库连接失败');
      }
    } catch (error) {
      setError(error.response?.data?.message || '数据库连接测试失败');
    } finally {
      setLoading(false);
    }
  };

  const testAIService = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await api.post('/admin/test-ai', aiConfig);
      if (response.data.success) {
        setSuccess('AI服务连接测试成功！');
      } else {
        setError(response.data.message || 'AI服务连接失败');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'AI服务连接测试失败');
    } finally {
      setLoading(false);
    }
  };

  const completeInitialization = async () => {
    if (adminConfig.password !== adminConfig.confirmPassword) {
      setError('密码确认不匹配');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await api.post('/admin/initialize', {
        database: dbConfig,
        ai: aiConfig,
        admin: {
          username: adminConfig.username,
          email: adminConfig.email,
          password: adminConfig.password
        }
      });
      
      if (response.data.success) {
        setSuccess('系统初始化完成！');
        setIsInitialized(true);
        handleNext();
      } else {
        setError(response.data.message || '初始化失败');
      }
    } catch (error) {
      setError(error.response?.data?.message || '初始化失败');
    } finally {
      setLoading(false);
    }
  };

  const renderDatabaseConfig = () => (
    <ConfigCard>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          数据库配置
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>数据库类型</InputLabel>
              <Select
                value={dbConfig.type}
                label="数据库类型"
                onChange={(e) => setDbConfig({...dbConfig, type: e.target.value})}
              >
                <MenuItem value="mongodb">MongoDB</MenuItem>
                <MenuItem value="mysql">MySQL</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="主机地址"
              value={dbConfig.host}
              onChange={(e) => setDbConfig({...dbConfig, host: e.target.value})}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="端口"
              value={dbConfig.port}
              onChange={(e) => setDbConfig({...dbConfig, port: e.target.value})}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="数据库名"
              value={dbConfig.database}
              onChange={(e) => setDbConfig({...dbConfig, database: e.target.value})}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="用户名"
              value={dbConfig.username}
              onChange={(e) => setDbConfig({...dbConfig, username: e.target.value})}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="password"
              label="密码"
              value={dbConfig.password}
              onChange={(e) => setDbConfig({...dbConfig, password: e.target.value})}
            />
          </Grid>
        </Grid>
        <Box sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            onClick={testDatabaseConnection}
            disabled={loading}
            sx={{ mr: 2 }}
          >
            {loading ? <CircularProgress size={20} /> : '测试连接'}
          </Button>
        </Box>
      </CardContent>
    </ConfigCard>
  );

  const renderAIConfig = () => (
    <ConfigCard>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          AI服务配置
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="OpenAI API Key"
              type="password"
              value={aiConfig.openai_api_key}
              onChange={(e) => setAiConfig({...aiConfig, openai_api_key: e.target.value})}
              helperText="用于访问OpenAI GPT模型"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="OpenAI Base URL"
              value={aiConfig.openai_base_url}
              onChange={(e) => setAiConfig({...aiConfig, openai_base_url: e.target.value})}
              helperText="OpenAI API基础URL，支持第三方兼容接口"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Gemini API Key"
              type="password"
              value={aiConfig.gemini_api_key}
              onChange={(e) => setAiConfig({...aiConfig, gemini_api_key: e.target.value})}
              helperText="用于访问Google Gemini模型（可选）"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>默认模型</InputLabel>
              <Select
                value={aiConfig.default_model}
                label="默认模型"
                onChange={(e) => setAiConfig({...aiConfig, default_model: e.target.value})}
              >
                <MenuItem value="gpt-3.5-turbo">GPT-3.5 Turbo</MenuItem>
                <MenuItem value="gpt-4">GPT-4</MenuItem>
                <MenuItem value="gpt-4-turbo">GPT-4 Turbo</MenuItem>
                <MenuItem value="gemini-pro">Gemini Pro</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <Box sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            onClick={testAIService}
            disabled={loading || !aiConfig.openai_api_key}
            sx={{ mr: 2 }}
          >
            {loading ? <CircularProgress size={20} /> : '测试AI服务'}
          </Button>
        </Box>
      </CardContent>
    </ConfigCard>
  );

  const renderAdminConfig = () => (
    <ConfigCard>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          管理员账户设置
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="用户名"
              value={adminConfig.username}
              onChange={(e) => setAdminConfig({...adminConfig, username: e.target.value})}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="邮箱"
              type="email"
              value={adminConfig.email}
              onChange={(e) => setAdminConfig({...adminConfig, email: e.target.value})}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="密码"
              type="password"
              value={adminConfig.password}
              onChange={(e) => setAdminConfig({...adminConfig, password: e.target.value})}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="确认密码"
              type="password"
              value={adminConfig.confirmPassword}
              onChange={(e) => setAdminConfig({...adminConfig, confirmPassword: e.target.value})}
              error={adminConfig.password !== adminConfig.confirmPassword && adminConfig.confirmPassword !== ''}
              helperText={adminConfig.password !== adminConfig.confirmPassword && adminConfig.confirmPassword !== '' ? '密码不匹配' : ''}
            />
          </Grid>
        </Grid>
      </CardContent>
    </ConfigCard>
  );

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return renderDatabaseConfig();
      case 1:
        return renderAIConfig();
      case 2:
        return renderAdminConfig();
      case 3:
        return (
          <ConfigCard>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h5" gutterBottom color="success.main">
                🎉 初始化完成！
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                系统已成功初始化，您现在可以开始使用AI聊天应用了。
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => window.location.href = '/login'}
              >
                前往登录
              </Button>
            </CardContent>
          </ConfigCard>
        );
      default:
        return null;
    }
  };

  if (isInitialized && activeStep < 3) {
    return (
      <Container maxWidth="md">
        <StyledPaper>
          <Typography variant="h4" gutterBottom>
            系统已初始化
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            系统已经完成初始化设置，请直接登录使用。
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => window.location.href = '/login'}
            sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
          >
            前往登录
          </Button>
        </StyledPaper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <StyledPaper>
        <Typography variant="h4" gutterBottom>
          AI聊天系统初始化
        </Typography>
        <Typography variant="body1">
          欢迎使用AI聊天系统！请按照以下步骤完成初始化设置。
        </Typography>
      </StyledPaper>

      <Paper sx={{ p: 3, mt: 3, borderRadius: 2 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            上一步
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={() => window.location.href = '/login'}
            >
              完成
            </Button>
          ) : activeStep === steps.length - 2 ? (
            <Button
              variant="contained"
              onClick={completeInitialization}
              disabled={loading || !adminConfig.username || !adminConfig.email || !adminConfig.password || adminConfig.password !== adminConfig.confirmPassword}
            >
              {loading ? <CircularProgress size={20} /> : '完成初始化'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
            >
              下一步
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default InitializePage;