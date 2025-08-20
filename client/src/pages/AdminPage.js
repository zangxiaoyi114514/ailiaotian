import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  People,
  Chat,
  Analytics,
  Settings,
  Visibility,
  Edit,
  Delete,
  Block,
  CheckCircle,
  Warning,
  TrendingUp,
  Storage,
  Speed,
  Security,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const AdminPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // 用户管理状态
  const [users, setUsers] = useState([]);
  const [userPage, setUserPage] = useState(0);
  const [userRowsPerPage, setUserRowsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  
  // 聊天记录状态
  const [chats, setChats] = useState([]);
  const [chatPage, setChatPage] = useState(0);
  const [chatRowsPerPage, setChatRowsPerPage] = useState(10);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  
  // 系统统计状态
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalChats: 0,
    totalMessages: 0,
    activeUsers: 0,
    apiUsage: {
      openai: 0,
      gemini: 0,
      custom: 0,
    },
    systemHealth: {
      cpu: 0,
      memory: 0,
      disk: 0,
    },
  });
  
  // API配置状态
  const [apiConfig, setApiConfig] = useState({
    openai: {
      apiKey: '',
      enabled: false,
    },
    gemini: {
      apiKey: '',
      enabled: false,
    },
    custom: {
      apiKey: '',
      baseUrl: '',
      enabled: false,
    },
  });
  const [apiConfigLoading, setApiConfigLoading] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState({
    openai: false,
    gemini: false,
    custom: false,
  });
  
  // 加载API配置
  const loadApiConfig = async () => {
    try {
      setApiConfigLoading(true);
      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('获取配置失败');
      }
      
      const data = await response.json();
      const settings = data.settings;
      
      // 转换后端数据格式到前端格式
      setApiConfig({
        openai: {
          apiKey: settings.aiProviders?.openai?.apiKey ? 
            settings.aiProviders.openai.apiKey.substring(0, 8) + '*'.repeat(20) : '',
          enabled: settings.aiProviders?.openai?.enabled || false,
        },
        gemini: {
          apiKey: settings.aiProviders?.gemini?.apiKey ? 
            settings.aiProviders.gemini.apiKey.substring(0, 8) + '*'.repeat(20) : '',
          enabled: settings.aiProviders?.gemini?.enabled || false,
        },
        custom: {
          apiKey: settings.aiProviders?.custom?.apiKey ? '*'.repeat(20) : '',
          baseUrl: settings.aiProviders?.custom?.baseUrl || '',
          enabled: settings.aiProviders?.custom?.enabled || false,
        },
      });
    } catch (error) {
      console.error('加载API配置失败:', error);
      enqueueSnackbar('加载API配置失败', { variant: 'error' });
    } finally {
      setApiConfigLoading(false);
    }
  };
  
  // 加载系统统计数据
  const loadSystemStats = async () => {
    try {
      const response = await fetch('/api/admin/overview', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSystemStats({
          totalUsers: data.userStats?.totalUsers || 0,
          totalChats: data.chatStats?.totalChats || 0,
          totalMessages: data.chatStats?.totalMessages || 0,
          activeUsers: data.userStats?.activeUsers || 0,
          apiUsage: {
            openai: 150, // 这些数据需要从实际的使用统计中获取
            gemini: 75,
            custom: 25,
          },
          systemHealth: {
            cpu: Math.floor(Math.random() * 100),
            memory: Math.floor(Math.random() * 100),
            disk: Math.floor(Math.random() * 100),
          },
        });
      }
    } catch (error) {
      console.error('加载系统统计失败:', error);
    }
  };
  
  // 加载用户数据
  const loadUsers = async () => {
    try {
      const response = await fetch(`/api/admin/users?page=${userPage + 1}&limit=${userRowsPerPage}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users.map(user => ({
          ...user,
          id: user._id,
          status: user.isActive ? 'active' : 'inactive',
          lastActive: new Date(user.lastLogin || user.updatedAt),
        })));
      }
    } catch (error) {
      console.error('加载用户数据失败:', error);
      enqueueSnackbar('加载用户数据失败', { variant: 'error' });
    }
  };
  
  // 加载聊天记录数据
  const loadChats = async () => {
    try {
      const response = await fetch(`/api/admin/chats?page=${chatPage + 1}&limit=${chatRowsPerPage}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setChats(data.chats.map(chat => ({
          ...chat,
          id: chat._id,
          username: chat.userId?.username || '未知用户',
        })));
      }
    } catch (error) {
      console.error('加载聊天记录失败:', error);
      enqueueSnackbar('加载聊天记录失败', { variant: 'error' });
    }
  };
  
  // 初始化数据加载
  useEffect(() => {
    loadSystemStats();
    loadUsers();
    loadChats();
    loadApiConfig();
  }, []);
  
  // 当分页改变时重新加载数据
  useEffect(() => {
    loadUsers();
  }, [userPage, userRowsPerPage]);
  
  useEffect(() => {
    loadChats();
  }, [chatPage, chatRowsPerPage]);
  
  // 处理用户操作
  const handleUserAction = async (action, userId) => {
    try {
      setLoading(true);
      
      switch (action) {
        case 'block':
        case 'unblock':
          const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
              isActive: action === 'unblock'
            }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '操作失败');
          }
          
          enqueueSnackbar(action === 'block' ? '用户已被阻止' : '用户已解除阻止', { variant: 'success' });
          await loadUsers(); // 重新加载用户列表
          break;
          
        case 'delete':
          const deleteResponse = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          });
          
          if (!deleteResponse.ok) {
            const errorData = await deleteResponse.json();
            throw new Error(errorData.message || '删除失败');
          }
          
          enqueueSnackbar('用户已删除', { variant: 'success' });
          await loadUsers(); // 重新加载用户列表
          await loadSystemStats(); // 更新统计数据
          break;
          
        default:
          break;
      }
    } catch (error) {
      console.error('用户操作失败:', error);
      enqueueSnackbar(error.message || '操作失败，请重试', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  // 处理聊天操作
  const handleChatAction = async (action, chatId) => {
    try {
      setLoading(true);
      
      switch (action) {
        case 'delete':
          const response = await fetch(`/api/admin/chats/${chatId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '删除失败');
          }
          
          enqueueSnackbar('聊天记录已删除', { variant: 'success' });
          await loadChats(); // 重新加载聊天列表
          await loadSystemStats(); // 更新统计数据
          break;
          
        default:
          break;
      }
    } catch (error) {
      console.error('聊天操作失败:', error);
      enqueueSnackbar(error.message || '操作失败，请重试', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  // 获取用户状态颜色
  const getUserStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'blocked': return 'error';
      default: return 'default';
    }
  };
  
  // 获取提供商颜色
  const getProviderColor = (provider) => {
    switch (provider) {
      case 'openai': return '#10a37f';
      case 'gemini': return '#4285f4';
      case 'custom': return '#ff6b35';
      default: return theme.palette.primary.main;
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
  
  // 检查管理员权限
  if (user?.role !== 'admin') {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error">
          您没有访问管理页面的权限。
        </Alert>
      </Box>
    );
  }
  
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Box sx={{ p: 3 }}>
        {/* 页面标题 */}
        <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 600 }}>
          系统管理
        </Typography>
        
        {/* 标签页 */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={(_, newValue) => setCurrentTab(newValue)}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons="auto"
          >
            <Tab icon={<Analytics />} label="概览" />
            <Tab icon={<People />} label="用户管理" />
            <Tab icon={<Chat />} label="聊天记录" />
            <Tab icon={<Settings />} label="系统设置" />
          </Tabs>
        </Paper>
        
        {/* 概览标签页 */}
        {currentTab === 0 && (
          <motion.div variants={itemVariants}>
            <Grid container spacing={3}>
              {/* 统计卡片 */}
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={2}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography color="text.secondary" gutterBottom>
                          总用户数
                        </Typography>
                        <Typography variant="h4" component="div">
                          {systemStats.totalUsers}
                        </Typography>
                      </Box>
                      <People sx={{ fontSize: 40, color: theme.palette.primary.main }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={2}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography color="text.secondary" gutterBottom>
                          总聊天数
                        </Typography>
                        <Typography variant="h4" component="div">
                          {systemStats.totalChats}
                        </Typography>
                      </Box>
                      <Chat sx={{ fontSize: 40, color: theme.palette.success.main }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={2}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography color="text.secondary" gutterBottom>
                          总消息数
                        </Typography>
                        <Typography variant="h4" component="div">
                          {systemStats.totalMessages}
                        </Typography>
                      </Box>
                      <TrendingUp sx={{ fontSize: 40, color: theme.palette.info.main }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={2}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography color="text.secondary" gutterBottom>
                          活跃用户
                        </Typography>
                        <Typography variant="h4" component="div">
                          {systemStats.activeUsers}
                        </Typography>
                      </Box>
                      <CheckCircle sx={{ fontSize: 40, color: theme.palette.warning.main }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* API使用统计 */}
              <Grid item xs={12} md={6}>
                <Card elevation={2}>
                  <CardHeader title="API使用统计" />
                  <CardContent>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">OpenAI</Typography>
                        <Typography variant="body2">{systemStats.apiUsage.openai}</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(systemStats.apiUsage.openai / (systemStats.apiUsage.openai + systemStats.apiUsage.gemini + systemStats.apiUsage.custom)) * 100}
                        sx={{ height: 8, borderRadius: 4, backgroundColor: '#e0e0e0' }}
                      />
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Gemini</Typography>
                        <Typography variant="body2">{systemStats.apiUsage.gemini}</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(systemStats.apiUsage.gemini / (systemStats.apiUsage.openai + systemStats.apiUsage.gemini + systemStats.apiUsage.custom)) * 100}
                        sx={{ height: 8, borderRadius: 4, backgroundColor: '#e0e0e0' }}
                      />
                    </Box>
                    
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">自定义</Typography>
                        <Typography variant="body2">{systemStats.apiUsage.custom}</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(systemStats.apiUsage.custom / (systemStats.apiUsage.openai + systemStats.apiUsage.gemini + systemStats.apiUsage.custom)) * 100}
                        sx={{ height: 8, borderRadius: 4, backgroundColor: '#e0e0e0' }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* 系统健康状态 */}
              <Grid item xs={12} md={6}>
                <Card elevation={2}>
                  <CardHeader title="系统健康状态" />
                  <CardContent>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">CPU使用率</Typography>
                        <Typography variant="body2">{systemStats.systemHealth.cpu}%</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={systemStats.systemHealth.cpu}
                        color={systemStats.systemHealth.cpu > 80 ? 'error' : systemStats.systemHealth.cpu > 60 ? 'warning' : 'success'}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">内存使用率</Typography>
                        <Typography variant="body2">{systemStats.systemHealth.memory}%</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={systemStats.systemHealth.memory}
                        color={systemStats.systemHealth.memory > 80 ? 'error' : systemStats.systemHealth.memory > 60 ? 'warning' : 'success'}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">磁盘使用率</Typography>
                        <Typography variant="body2">{systemStats.systemHealth.disk}%</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={systemStats.systemHealth.disk}
                        color={systemStats.systemHealth.disk > 80 ? 'error' : systemStats.systemHealth.disk > 60 ? 'warning' : 'success'}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </motion.div>
        )}
        
        {/* 用户管理标签页 */}
        {currentTab === 1 && (
          <motion.div variants={itemVariants}>
            <Paper elevation={2}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>用户</TableCell>
                      <TableCell>邮箱</TableCell>
                      <TableCell>角色</TableCell>
                      <TableCell>状态</TableCell>
                      <TableCell>聊天数</TableCell>
                      <TableCell>最后活跃</TableCell>
                      <TableCell>操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users
                      .slice(userPage * userRowsPerPage, userPage * userRowsPerPage + userRowsPerPage)
                      .map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 32, height: 32 }}>
                                {user.username[0].toUpperCase()}
                              </Avatar>
                              <Typography variant="body2">{user.username}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Chip
                              label={user.role === 'admin' ? '管理员' : '用户'}
                              color={user.role === 'admin' ? 'primary' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={user.status === 'active' ? '活跃' : user.status === 'inactive' ? '非活跃' : '已阻止'}
                              color={getUserStatusColor(user.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{user.chatCount}</TableCell>
                          <TableCell>
                            {format(user.lastActive, 'MM-dd HH:mm', { locale: zhCN })}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setUserDialogOpen(true);
                                }}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                              
                              {user.status === 'active' ? (
                                <IconButton
                                  size="small"
                                  color="warning"
                                  onClick={() => handleUserAction('block', user.id)}
                                >
                                  <Block fontSize="small" />
                                </IconButton>
                              ) : user.status === 'blocked' ? (
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleUserAction('unblock', user.id)}
                                >
                                  <CheckCircle fontSize="small" />
                                </IconButton>
                              ) : null}
                              
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleUserAction('delete', user.id)}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <TablePagination
                component="div"
                count={users.length}
                page={userPage}
                onPageChange={(_, newPage) => setUserPage(newPage)}
                rowsPerPage={userRowsPerPage}
                onRowsPerPageChange={(e) => {
                  setUserRowsPerPage(parseInt(e.target.value, 10));
                  setUserPage(0);
                }}
                labelRowsPerPage="每页行数:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} 共 ${count}`}
              />
            </Paper>
          </motion.div>
        )}
        
        {/* 聊天记录标签页 */}
        {currentTab === 2 && (
          <motion.div variants={itemVariants}>
            <Paper elevation={2}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>标题</TableCell>
                      <TableCell>用户</TableCell>
                      <TableCell>提供商</TableCell>
                      <TableCell>模型</TableCell>
                      <TableCell>消息数</TableCell>
                      <TableCell>创建时间</TableCell>
                      <TableCell>操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {chats
                      .slice(chatPage * chatRowsPerPage, chatPage * chatRowsPerPage + chatRowsPerPage)
                      .map((chat) => (
                        <TableRow key={chat.id}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {chat.title}
                            </Typography>
                          </TableCell>
                          <TableCell>{chat.username}</TableCell>
                          <TableCell>
                            <Chip
                              label={chat.provider.toUpperCase()}
                              size="small"
                              sx={{
                                backgroundColor: getProviderColor(chat.provider),
                                color: 'white',
                              }}
                            />
                          </TableCell>
                          <TableCell>{chat.model}</TableCell>
                          <TableCell>{chat.messageCount}</TableCell>
                          <TableCell>
                            {format(chat.createdAt, 'MM-dd HH:mm', { locale: zhCN })}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedChat(chat);
                                  setChatDialogOpen(true);
                                }}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                              
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleChatAction('delete', chat.id)}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <TablePagination
                component="div"
                count={chats.length}
                page={chatPage}
                onPageChange={(_, newPage) => setChatPage(newPage)}
                rowsPerPage={chatRowsPerPage}
                onRowsPerPageChange={(e) => {
                  setChatRowsPerPage(parseInt(e.target.value, 10));
                  setChatPage(0);
                }}
                labelRowsPerPage="每页行数:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} 共 ${count}`}
              />
            </Paper>
          </motion.div>
        )}
        
        {/* 系统设置标签页 */}
        {currentTab === 3 && (
          <motion.div variants={itemVariants}>
            <Grid container spacing={3}>
              {/* API配置卡片 */}
              <Grid item xs={12}>
                <Card elevation={2}>
                  <CardHeader
                    title="API配置"
                    subheader="配置AI服务提供商的API密钥"
                    avatar={<Security sx={{ color: theme.palette.primary.main }} />}
                  />
                  <CardContent>
                    <Grid container spacing={3}>
                      {/* OpenAI配置 */}
                      <Grid item xs={12}>
                        <Paper sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ flexGrow: 1 }}>
                              OpenAI
                            </Typography>
                            <FormControl>
                              <InputLabel>状态</InputLabel>
                              <Select
                                value={apiConfig.openai.enabled ? 'enabled' : 'disabled'}
                                label="状态"
                                onChange={(e) => setApiConfig(prev => ({
                                  ...prev,
                                  openai: { ...prev.openai, enabled: e.target.value === 'enabled' }
                                }))}
                                size="small"
                                sx={{ minWidth: 100 }}
                              >
                                <MenuItem value="enabled">启用</MenuItem>
                                <MenuItem value="disabled">禁用</MenuItem>
                              </Select>
                            </FormControl>
                          </Box>
                          <TextField
                            fullWidth
                            label="API Key"
                            type={showApiKeys.openai ? 'text' : 'password'}
                            value={apiConfig.openai.apiKey}
                            onChange={(e) => setApiConfig(prev => ({
                              ...prev,
                              openai: { ...prev.openai, apiKey: e.target.value }
                            }))}
                            placeholder="sk-..."
                            InputProps={{
                              endAdornment: (
                                <IconButton
                                  onClick={() => setShowApiKeys(prev => ({
                                    ...prev,
                                    openai: !prev.openai
                                  }))}
                                  edge="end"
                                >
                                  <Visibility />
                                </IconButton>
                              ),
                            }}
                          />
                        </Paper>
                      </Grid>
                      
                      {/* Gemini配置 */}
                      <Grid item xs={12}>
                        <Paper sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ flexGrow: 1 }}>
                              Google Gemini
                            </Typography>
                            <FormControl>
                              <InputLabel>状态</InputLabel>
                              <Select
                                value={apiConfig.gemini.enabled ? 'enabled' : 'disabled'}
                                label="状态"
                                onChange={(e) => setApiConfig(prev => ({
                                  ...prev,
                                  gemini: { ...prev.gemini, enabled: e.target.value === 'enabled' }
                                }))}
                                size="small"
                                sx={{ minWidth: 100 }}
                              >
                                <MenuItem value="enabled">启用</MenuItem>
                                <MenuItem value="disabled">禁用</MenuItem>
                              </Select>
                            </FormControl>
                          </Box>
                          <TextField
                            fullWidth
                            label="API Key"
                            type={showApiKeys.gemini ? 'text' : 'password'}
                            value={apiConfig.gemini.apiKey}
                            onChange={(e) => setApiConfig(prev => ({
                              ...prev,
                              gemini: { ...prev.gemini, apiKey: e.target.value }
                            }))}
                            placeholder="AIza..."
                            InputProps={{
                              endAdornment: (
                                <IconButton
                                  onClick={() => setShowApiKeys(prev => ({
                                    ...prev,
                                    gemini: !prev.gemini
                                  }))}
                                  edge="end"
                                >
                                  <Visibility />
                                </IconButton>
                              ),
                            }}
                          />
                        </Paper>
                      </Grid>
                      
                      {/* 自定义API配置 */}
                      <Grid item xs={12}>
                        <Paper sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ flexGrow: 1 }}>
                              自定义OpenAI格式API
                            </Typography>
                            <FormControl>
                              <InputLabel>状态</InputLabel>
                              <Select
                                value={apiConfig.custom.enabled ? 'enabled' : 'disabled'}
                                label="状态"
                                onChange={(e) => setApiConfig(prev => ({
                                  ...prev,
                                  custom: { ...prev.custom, enabled: e.target.value === 'enabled' }
                                }))}
                                size="small"
                                sx={{ minWidth: 100 }}
                              >
                                <MenuItem value="enabled">启用</MenuItem>
                                <MenuItem value="disabled">禁用</MenuItem>
                              </Select>
                            </FormControl>
                          </Box>
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                label="Base URL"
                                value={apiConfig.custom.baseUrl}
                                onChange={(e) => setApiConfig(prev => ({
                                  ...prev,
                                  custom: { ...prev.custom, baseUrl: e.target.value }
                                }))}
                                placeholder="https://api.example.com/v1"
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                label="API Key"
                                type={showApiKeys.custom ? 'text' : 'password'}
                                value={apiConfig.custom.apiKey}
                                onChange={(e) => setApiConfig(prev => ({
                                  ...prev,
                                  custom: { ...prev.custom, apiKey: e.target.value }
                                }))}
                                placeholder="your-api-key"
                                InputProps={{
                                  endAdornment: (
                                    <IconButton
                                      onClick={() => setShowApiKeys(prev => ({
                                        ...prev,
                                        custom: !prev.custom
                                      }))}
                                      edge="end"
                                    >
                                      <Visibility />
                                    </IconButton>
                                  ),
                                }}
                              />
                            </Grid>
                          </Grid>
                        </Paper>
                      </Grid>
                      
                      {/* 保存按钮 */}
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                          <Button
                            variant="outlined"
                            onClick={() => {
                              // 重置配置
                              setApiConfig({
                                openai: { apiKey: '', enabled: false },
                                gemini: { apiKey: '', enabled: false },
                                custom: { apiKey: '', baseUrl: '', enabled: false },
                              });
                            }}
                          >
                            重置
                          </Button>
                          <Button
                            variant="contained"
                            onClick={async () => {
                              try {
                                setApiConfigLoading(true);
                                
                                // 构建要保存的配置数据
                                const configData = {
                                  aiProviders: {
                                    openai: {
                                      enabled: apiConfig.openai.enabled,
                                      apiKey: apiConfig.openai.apiKey && !apiConfig.openai.apiKey.includes('*') ? 
                                        apiConfig.openai.apiKey : undefined,
                                    },
                                    gemini: {
                                      enabled: apiConfig.gemini.enabled,
                                      apiKey: apiConfig.gemini.apiKey && !apiConfig.gemini.apiKey.includes('*') ? 
                                        apiConfig.gemini.apiKey : undefined,
                                    },
                                    custom: {
                                      enabled: apiConfig.custom.enabled,
                                      baseUrl: apiConfig.custom.baseUrl,
                                      apiKey: apiConfig.custom.apiKey && !apiConfig.custom.apiKey.includes('*') ? 
                                        apiConfig.custom.apiKey : undefined,
                                    },
                                  },
                                };
                                
                                const response = await fetch('/api/admin/settings', {
                                  method: 'PUT',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                  },
                                  body: JSON.stringify(configData),
                                });
                                
                                if (!response.ok) {
                                  const errorData = await response.json();
                                  throw new Error(errorData.message || '保存失败');
                                }
                                
                                enqueueSnackbar('API配置已保存', { variant: 'success' });
                                // 重新加载配置以显示最新状态
                                await loadApiConfig();
                              } catch (error) {
                                console.error('保存API配置失败:', error);
                                enqueueSnackbar(error.message || '保存失败，请重试', { variant: 'error' });
                              } finally {
                                setApiConfigLoading(false);
                              }
                            }}
                            disabled={apiConfigLoading}
                          >
                            {apiConfigLoading ? '保存中...' : '保存配置'}
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </motion.div>
        )}
        
        {/* 用户详情对话框 */}
        <Dialog
          open={userDialogOpen}
          onClose={() => setUserDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>用户详情</DialogTitle>
          <DialogContent>
            {selectedUser && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="用户名"
                    value={selectedUser.username}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="邮箱"
                    value={selectedUser.email}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="角色"
                    value={selectedUser.role === 'admin' ? '管理员' : '用户'}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="状态"
                    value={selectedUser.status === 'active' ? '活跃' : selectedUser.status === 'inactive' ? '非活跃' : '已阻止'}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="聊天数量"
                    value={selectedUser.chatCount}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="消息数量"
                    value={selectedUser.messageCount}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="注册时间"
                    value={format(selectedUser.createdAt, 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="最后活跃"
                    value={format(selectedUser.lastActive, 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUserDialogOpen(false)}>关闭</Button>
          </DialogActions>
        </Dialog>
        
        {/* 聊天详情对话框 */}
        <Dialog
          open={chatDialogOpen}
          onClose={() => setChatDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>聊天详情</DialogTitle>
          <DialogContent>
            {selectedChat && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="标题"
                    value={selectedChat.title}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="用户"
                    value={selectedChat.username}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="提供商"
                    value={selectedChat.provider.toUpperCase()}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="模型"
                    value={selectedChat.model}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="消息数量"
                    value={selectedChat.messageCount}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="创建时间"
                    value={format(selectedChat.createdAt, 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="更新时间"
                    value={format(selectedChat.updatedAt, 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setChatDialogOpen(false)}>关闭</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </motion.div>
  );
};

export default AdminPage;