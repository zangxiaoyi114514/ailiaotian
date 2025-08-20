const express = require('express');
const { body, query, validationResult } = require('express-validator');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Settings = require('../models/Settings');
const { adminAuth } = require('../middleware/auth');
const { catchAsync, AppError } = require('../middleware/errorHandler');

const router = express.Router();

// 所有管理员路由都需要管理员权限
router.use(adminAuth);

// 获取系统概览统计
router.get('/overview', catchAsync(async (req, res) => {
  const [userStats, chatStats, settings] = await Promise.all([
    User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: {
              $cond: [{ $gte: ['$lastLogin', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] }, 1, 0]
            }
          },
          newUsersThisWeek: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] }, 1, 0]
            }
          }
        }
      }
    ]),
    Chat.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: null,
          totalChats: { $sum: 1 },
          totalMessages: { $sum: '$statistics.totalMessages' },
          totalTokens: { $sum: '$statistics.totalTokens' },
          chatsThisWeek: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] }, 1, 0]
            }
          }
        }
      }
    ]),
    Settings.findOne()
  ]);

  const userOverview = userStats[0] || {
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisWeek: 0
  };

  const chatOverview = chatStats[0] || {
    totalChats: 0,
    totalMessages: 0,
    totalTokens: 0,
    chatsThisWeek: 0
  };

  // 获取AI提供商使用统计
  const providerStats = await Chat.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $group: {
        _id: '$aiProvider',
        count: { $sum: 1 },
        totalTokens: { $sum: '$statistics.totalTokens' }
      }
    }
  ]);

  res.json({
    users: userOverview,
    chats: chatOverview,
    providers: providerStats,
    system: {
      maintenanceMode: settings?.system?.maintenanceMode || false,
      registrationEnabled: settings?.system?.allowRegistration !== false,
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime()
    }
  });
}));

// 用户管理
router.get('/users', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间'),
  query('search')
    .optional()
    .isString()
    .withMessage('搜索关键词必须是字符串'),
  query('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('角色必须是user或admin')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: '输入验证失败',
      errors: errors.array()
    });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search;
  const role = req.query.role;
  const skip = (page - 1) * limit;

  // 构建查询条件
  const query = {};
  
  if (search) {
    query.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (role) {
    query.role = role;
  }

  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await User.countDocuments(query);

  res.json({
    users: users.map(user => ({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      usage: user.usage,
      preferences: user.preferences,
      createdAt: user.createdAt
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// 更新用户信息
router.put('/users/:userId', [
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('角色必须是user或admin'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('激活状态必须是布尔值')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: '输入验证失败',
      errors: errors.array()
    });
  }

  const { userId } = req.params;
  const { role, isActive } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('用户不存在', 404);
  }

  // 防止管理员禁用自己
  if (userId === req.user._id.toString() && isActive === false) {
    throw new AppError('不能禁用自己的账户', 400);
  }

  if (role !== undefined) {
    user.role = role;
  }
  
  if (isActive !== undefined) {
    user.isActive = isActive;
  }

  await user.save();

  res.json({
    message: '用户信息更新成功',
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    }
  });
}));

// 删除用户
router.delete('/users/:userId', catchAsync(async (req, res) => {
  const { userId } = req.params;

  if (userId === req.user._id.toString()) {
    throw new AppError('不能删除自己的账户', 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('用户不存在', 404);
  }

  // 软删除用户的聊天记录
  await Chat.updateMany(
    { userId: userId },
    { isActive: false }
  );

  // 删除用户
  await User.findByIdAndDelete(userId);

  res.json({
    message: '用户删除成功'
  });
}));

// 获取系统设置
router.get('/settings', catchAsync(async (req, res) => {
  let settings = await Settings.findOne();
  
  if (!settings) {
    settings = new Settings();
    await settings.save();
  }

  res.json({ settings });
}));

// 更新系统设置
router.put('/settings', [
  body('aiProviders')
    .optional()
    .isObject()
    .withMessage('AI提供商配置必须是对象'),
  body('system')
    .optional()
    .isObject()
    .withMessage('系统设置必须是对象'),
  body('security')
    .optional()
    .isObject()
    .withMessage('安全设置必须是对象'),
  body('features')
    .optional()
    .isObject()
    .withMessage('功能设置必须是对象'),
  body('ui')
    .optional()
    .isObject()
    .withMessage('界面设置必须是对象')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: '输入验证失败',
      errors: errors.array()
    });
  }

  let settings = await Settings.findOne();
  
  if (!settings) {
    settings = new Settings();
  }

  const { aiProviders, system, security, features, ui } = req.body;

  if (aiProviders) {
    settings.aiProviders = { ...settings.aiProviders, ...aiProviders };
  }
  
  if (system) {
    settings.system = { ...settings.system, ...system };
  }
  
  if (security) {
    settings.security = { ...settings.security, ...security };
  }
  
  if (features) {
    settings.features = { ...settings.features, ...features };
  }
  
  if (ui) {
    settings.ui = { ...settings.ui, ...ui };
  }

  settings.lastUpdated = new Date();
  await settings.save();

  res.json({
    message: '系统设置更新成功',
    settings
  });
}));

// 测试AI提供商连接
router.post('/settings/test-provider', [
  body('provider')
    .isIn(['openai', 'gemini', 'custom'])
    .withMessage('无效的AI提供商'),
  body('config')
    .isObject()
    .withMessage('配置信息必须是对象')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: '输入验证失败',
      errors: errors.array()
    });
  }

  const { provider, config } = req.body;
  const aiService = require('../services/aiService');

  try {
    // 临时初始化AI服务进行测试
    const testSettings = {
      aiProviders: {
        [provider]: config
      }
    };
    
    await aiService.initialize(testSettings);
    const status = await aiService.checkProviderStatus(provider);
    
    if (status.available) {
      res.json({
        success: true,
        message: 'AI提供商连接测试成功',
        models: status.models || []
      });
    } else {
      res.status(400).json({
        success: false,
        message: status.error || 'AI提供商连接失败'
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'AI提供商连接测试失败'
    });
  }
}));

// 获取聊天记录管理
router.get('/chats', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间'),
  query('userId')
    .optional()
    .isMongoId()
    .withMessage('用户ID格式无效'),
  query('provider')
    .optional()
    .isIn(['openai', 'gemini', 'custom'])
    .withMessage('无效的AI提供商')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: '输入验证失败',
      errors: errors.array()
    });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const userId = req.query.userId;
  const provider = req.query.provider;
  const skip = (page - 1) * limit;

  // 构建查询条件
  const query = { isActive: true };
  
  if (userId) {
    query.userId = userId;
  }
  
  if (provider) {
    query.aiProvider = provider;
  }

  const chats = await Chat.find(query)
    .populate('userId', 'username email')
    .select('title aiProvider model statistics lastActivity createdAt userId')
    .sort({ lastActivity: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Chat.countDocuments(query);

  res.json({
    chats: chats.map(chat => ({
      id: chat._id,
      title: chat.title,
      user: chat.userId,
      aiProvider: chat.aiProvider,
      model: chat.model,
      messageCount: chat.statistics.totalMessages,
      totalTokens: chat.statistics.totalTokens,
      lastActivity: chat.lastActivity,
      createdAt: chat.createdAt
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// 删除聊天记录
router.delete('/chats/:chatId', catchAsync(async (req, res) => {
  const { chatId } = req.params;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new AppError('聊天记录不存在', 404);
  }

  chat.isActive = false;
  await chat.save();

  res.json({
    message: '聊天记录删除成功'
  });
}));

// 获取系统日志（简单实现）
router.get('/logs', [
  query('level')
    .optional()
    .isIn(['error', 'warn', 'info', 'debug'])
    .withMessage('日志级别无效'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('限制数量必须在1-1000之间')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: '输入验证失败',
      errors: errors.array()
    });
  }

  // 这里可以集成真实的日志系统，如Winston
  // 目前返回模拟数据
  const logs = [
    {
      timestamp: new Date(),
      level: 'info',
      message: '系统启动成功',
      meta: { service: 'server' }
    },
    {
      timestamp: new Date(Date.now() - 60000),
      level: 'warn',
      message: 'AI提供商响应缓慢',
      meta: { provider: 'openai', responseTime: 5000 }
    }
  ];

  res.json({ logs });
}));

// 系统维护模式切换
router.post('/maintenance', [
  body('enabled')
    .isBoolean()
    .withMessage('维护模式状态必须是布尔值'),
  body('message')
    .optional()
    .isString()
    .withMessage('维护消息必须是字符串')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: '输入验证失败',
      errors: errors.array()
    });
  }

  const { enabled, message } = req.body;

  let settings = await Settings.findOne();
  if (!settings) {
    settings = new Settings();
  }

  settings.system.maintenanceMode = enabled;
  if (message) {
    settings.system.maintenanceMessage = message;
  }
  settings.lastUpdated = new Date();
  
  await settings.save();

  res.json({
    message: enabled ? '维护模式已开启' : '维护模式已关闭',
    maintenanceMode: enabled
  });
}));

module.exports = router;