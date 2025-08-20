import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Button,
  Divider,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Alert,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Palette,
  Language,
  SmartToy,
  Tune,
  Notifications,
  Security,
  Storage,
  Refresh,
  Save,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from 'notistack';

const SettingsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();
  
  const { user } = useAuth();
  const {
    userPreferences,
    systemSettings,
    loading,
    updateTheme,
    updateLanguage,
    updateAiProvider,
    updateModel,
    updateMessageSettings,
    updateUiSettings,
    getAvailableProviders,
    getProviderModels,
    resetToDefaults,
  } = useSettings();
  
  const [localSettings, setLocalSettings] = useState({
    theme: userPreferences.theme,
    language: userPreferences.language,
    defaultAiProvider: userPreferences.defaultAiProvider,
    defaultModel: userPreferences.defaultModel,
    messageSettings: { ...userPreferences.messageSettings },
    uiSettings: { ...userPreferences.uiSettings },
  });
  const [hasChanges, setHasChanges] = useState(false);
  
  // 监听设置变化
  useEffect(() => {
    const newSettings = {
      theme: userPreferences.theme,
      language: userPreferences.language,
      defaultAiProvider: userPreferences.defaultAiProvider,
      defaultModel: userPreferences.defaultModel,
      messageSettings: { ...userPreferences.messageSettings },
      uiSettings: { ...userPreferences.uiSettings },
    };
    
    setLocalSettings(newSettings);
    setHasChanges(false);
  }, [userPreferences]);
  
  // 处理设置变化
  const handleSettingChange = (category, key, value) => {
    setLocalSettings(prev => {
      const newSettings = { ...prev };
      
      if (category) {
        newSettings[category] = {
          ...newSettings[category],
          [key]: value,
        };
      } else {
        newSettings[key] = value;
      }
      
      return newSettings;
    });
    
    setHasChanges(true);
  };
  
  // 保存设置
  const handleSaveSettings = async () => {
    try {
      // 更新各项设置
      if (localSettings.theme !== userPreferences.theme) {
        await updateTheme(localSettings.theme);
      }
      
      if (localSettings.language !== userPreferences.language) {
        await updateLanguage(localSettings.language);
      }
      
      if (localSettings.defaultAiProvider !== userPreferences.defaultAiProvider) {
        await updateAiProvider(localSettings.defaultAiProvider);
      }
      
      if (localSettings.defaultModel !== userPreferences.defaultModel) {
        await updateModel(localSettings.defaultModel);
      }
      
      await updateMessageSettings(localSettings.messageSettings);
      await updateUiSettings(localSettings.uiSettings);
      
      setHasChanges(false);
      enqueueSnackbar('设置保存成功', { variant: 'success' });
    } catch (error) {
      console.error('保存设置失败:', error);
      enqueueSnackbar('保存设置失败，请重试', { variant: 'error' });
    }
  };
  
  // 重置设置
  const handleResetSettings = async () => {
    try {
      await resetToDefaults();
      enqueueSnackbar('设置已重置为默认值', { variant: 'info' });
    } catch (error) {
      console.error('重置设置失败:', error);
      enqueueSnackbar('重置设置失败，请重试', { variant: 'error' });
    }
  };
  
  // 获取可用模型
  const availableModels = getProviderModels(localSettings.defaultAiProvider);
  
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
  
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
        {/* 页面标题 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            设置
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleResetSettings}
              disabled={loading}
            >
              重置默认
            </Button>
            
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSaveSettings}
              disabled={!hasChanges || loading}
            >
              保存设置
            </Button>
          </Box>
        </Box>
        
        {/* 变更提示 */}
        {hasChanges && (
          <motion.div variants={itemVariants}>
            <Alert severity="info" sx={{ mb: 3 }}>
              您有未保存的更改，请点击"保存设置"按钮保存。
            </Alert>
          </motion.div>
        )}
        
        <Grid container spacing={3}>
          {/* 外观设置 */}
          <Grid item xs={12} md={6}>
            <motion.div variants={itemVariants}>
              <Card elevation={2}>
                <CardHeader
                  avatar={<Palette color="primary" />}
                  title="外观设置"
                  subheader="自定义界面外观和主题"
                />
                <CardContent>
                  {/* 主题选择 */}
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>主题</InputLabel>
                    <Select
                      value={localSettings.theme}
                      label="主题"
                      onChange={(e) => handleSettingChange(null, 'theme', e.target.value)}
                    >
                      <MenuItem value="light">浅色主题</MenuItem>
                      <MenuItem value="dark">深色主题</MenuItem>
                      <MenuItem value="auto">跟随系统</MenuItem>
                    </Select>
                  </FormControl>
                  
                  {/* 语言选择 */}
                  <FormControl fullWidth>
                    <InputLabel>语言</InputLabel>
                    <Select
                      value={localSettings.language}
                      label="语言"
                      onChange={(e) => handleSettingChange(null, 'language', e.target.value)}
                    >
                      <MenuItem value="zh-CN">简体中文</MenuItem>
                      <MenuItem value="en-US">English</MenuItem>
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          
          {/* AI设置 */}
          <Grid item xs={12} md={6}>
            <motion.div variants={itemVariants}>
              <Card elevation={2}>
                <CardHeader
                  avatar={<SmartToy color="primary" />}
                  title="AI设置"
                  subheader="配置默认AI提供商和模型"
                />
                <CardContent>
                  {/* AI提供商选择 */}
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>默认AI提供商</InputLabel>
                    <Select
                      value={localSettings.defaultAiProvider}
                      label="默认AI提供商"
                      onChange={(e) => {
                        const provider = e.target.value;
                        handleSettingChange(null, 'defaultAiProvider', provider);
                        // 自动选择该提供商的第一个模型
                        const models = getProviderModels(provider);
                        if (models.length > 0) {
                          handleSettingChange(null, 'defaultModel', models[0]);
                        }
                      }}
                    >
                      {getAvailableProviders().map(provider => (
                        <MenuItem key={provider} value={provider}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {provider.toUpperCase()}
                            {!systemSettings.providers?.[provider]?.enabled && (
                              <Chip label="未配置" size="small" color="warning" />
                            )}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  {/* 模型选择 */}
                  <FormControl fullWidth>
                    <InputLabel>默认模型</InputLabel>
                    <Select
                      value={localSettings.defaultModel}
                      label="默认模型"
                      onChange={(e) => handleSettingChange(null, 'defaultModel', e.target.value)}
                    >
                      {availableModels.map(model => (
                        <MenuItem key={model} value={model}>
                          {model}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          
          {/* 消息设置 */}
          <Grid item xs={12}>
            <motion.div variants={itemVariants}>
              <Card elevation={2}>
                <CardHeader
                  avatar={<Tune color="primary" />}
                  title="消息设置"
                  subheader="调整AI回复的参数和行为"
                />
                <CardContent>
                  <Grid container spacing={3}>
                    {/* 温度 */}
                    <Grid item xs={12} sm={6}>
                      <Typography gutterBottom>
                        温度: {localSettings.messageSettings.temperature}
                      </Typography>
                      <Slider
                        value={localSettings.messageSettings.temperature}
                        onChange={(_, value) => handleSettingChange('messageSettings', 'temperature', value)}
                        min={0}
                        max={2}
                        step={0.1}
                        marks={[
                          { value: 0, label: '0' },
                          { value: 1, label: '1' },
                          { value: 2, label: '2' },
                        ]}
                      />
                      <Typography variant="caption" color="text.secondary">
                        控制回复的随机性，值越高越有创意
                      </Typography>
                    </Grid>
                    
                    {/* 最大令牌数 */}
                    <Grid item xs={12} sm={6}>
                      <Typography gutterBottom>
                        最大令牌数: {localSettings.messageSettings.maxTokens}
                      </Typography>
                      <Slider
                        value={localSettings.messageSettings.maxTokens}
                        onChange={(_, value) => handleSettingChange('messageSettings', 'maxTokens', value)}
                        min={100}
                        max={4000}
                        step={100}
                        marks={[
                          { value: 100, label: '100' },
                          { value: 2000, label: '2K' },
                          { value: 4000, label: '4K' },
                        ]}
                      />
                      <Typography variant="caption" color="text.secondary">
                        限制AI回复的最大长度
                      </Typography>
                    </Grid>
                    
                    {/* Top P */}
                    <Grid item xs={12} sm={6}>
                      <Typography gutterBottom>
                        Top P: {localSettings.messageSettings.topP}
                      </Typography>
                      <Slider
                        value={localSettings.messageSettings.topP}
                        onChange={(_, value) => handleSettingChange('messageSettings', 'topP', value)}
                        min={0}
                        max={1}
                        step={0.1}
                        marks={[
                          { value: 0, label: '0' },
                          { value: 0.5, label: '0.5' },
                          { value: 1, label: '1' },
                        ]}
                      />
                      <Typography variant="caption" color="text.secondary">
                        控制词汇选择的多样性
                      </Typography>
                    </Grid>
                    
                    {/* 频率惩罚 */}
                    <Grid item xs={12} sm={6}>
                      <Typography gutterBottom>
                        频率惩罚: {localSettings.messageSettings.frequencyPenalty}
                      </Typography>
                      <Slider
                        value={localSettings.messageSettings.frequencyPenalty}
                        onChange={(_, value) => handleSettingChange('messageSettings', 'frequencyPenalty', value)}
                        min={0}
                        max={2}
                        step={0.1}
                        marks={[
                          { value: 0, label: '0' },
                          { value: 1, label: '1' },
                          { value: 2, label: '2' },
                        ]}
                      />
                      <Typography variant="caption" color="text.secondary">
                        减少重复词汇的使用
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          
          {/* 界面设置 */}
          <Grid item xs={12} md={6}>
            <motion.div variants={itemVariants}>
              <Card elevation={2}>
                <CardHeader
                  avatar={<Notifications color="primary" />}
                  title="界面设置"
                  subheader="自定义用户界面行为"
                />
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={localSettings.uiSettings.enableStreaming}
                          onChange={(e) => handleSettingChange('uiSettings', 'enableStreaming', e.target.checked)}
                        />
                      }
                      label="启用流式回复"
                    />
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={localSettings.uiSettings.showTypingIndicator}
                          onChange={(e) => handleSettingChange('uiSettings', 'showTypingIndicator', e.target.checked)}
                        />
                      }
                      label="显示打字指示器"
                    />
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={localSettings.uiSettings.autoScrollToBottom}
                          onChange={(e) => handleSettingChange('uiSettings', 'autoScrollToBottom', e.target.checked)}
                        />
                      }
                      label="自动滚动到底部"
                    />
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={localSettings.uiSettings.showMessageTimestamp}
                          onChange={(e) => handleSettingChange('uiSettings', 'showMessageTimestamp', e.target.checked)}
                        />
                      }
                      label="显示消息时间戳"
                    />
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={localSettings.uiSettings.enableSoundNotifications}
                          onChange={(e) => handleSettingChange('uiSettings', 'enableSoundNotifications', e.target.checked)}
                        />
                      }
                      label="启用声音通知"
                    />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          
          {/* 存储设置 */}
          <Grid item xs={12} md={6}>
            <motion.div variants={itemVariants}>
              <Card elevation={2}>
                <CardHeader
                  avatar={<Storage color="primary" />}
                  title="存储设置"
                  subheader="管理数据存储和隐私"
                />
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={localSettings.uiSettings.saveConversationHistory}
                          onChange={(e) => handleSettingChange('uiSettings', 'saveConversationHistory', e.target.checked)}
                        />
                      }
                      label="保存对话历史"
                    />
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={localSettings.uiSettings.enableAnalytics}
                          onChange={(e) => handleSettingChange('uiSettings', 'enableAnalytics', e.target.checked)}
                        />
                      }
                      label="启用使用分析"
                    />
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Typography variant="body2" color="text.secondary">
                      数据存储在本地浏览器中，您可以随时清除。
                    </Typography>
                    
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => {
                        localStorage.clear();
                        enqueueSnackbar('本地数据已清除', { variant: 'info' });
                      }}
                    >
                      清除本地数据
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </Box>
    </motion.div>
  );
};

export default SettingsPage;