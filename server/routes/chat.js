const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Chat = require('../models/Chat');
const { catchAsync, AppError } = require('../middleware/errorHandler');

const router = express.Router();

// 获取用户的聊天列表
router.get('/', [
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
    .withMessage('搜索关键词必须是字符串')
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
  const skip = (page - 1) * limit;

  // 构建查询条件
  const query = {
    userId: req.user._id,
    isActive: true
  };

  if (search) {
    query.title = { $regex: search, $options: 'i' };
  }

  // 获取聊天列表
  const chats = await Chat.find(query)
    .select('title aiProvider model statistics lastActivity createdAt')
    .sort({ lastActivity: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // 获取总数
  const total = await Chat.countDocuments(query);

  res.json({
    chats: chats.map(chat => ({
      id: chat._id,
      title: chat.title,
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

// 获取特定聊天的详细信息
router.get('/:chatId', catchAsync(async (req, res) => {
  const { chatId } = req.params;
  
  const chat = await Chat.findOne({
    _id: chatId,
    userId: req.user._id,
    isActive: true
  });

  if (!chat) {
    throw new AppError('聊天记录不存在', 404);
  }

  res.json({
    chat: {
      id: chat._id,
      title: chat.title,
      aiProvider: chat.aiProvider,
      model: chat.model,
      settings: chat.settings,
      messages: chat.messages.map(msg => ({
        id: msg._id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        tokens: msg.tokens,
        model: msg.model,
        provider: msg.provider
      })),
      statistics: chat.statistics,
      lastActivity: chat.lastActivity,
      createdAt: chat.createdAt
    }
  });
}));

// 创建新聊天
router.post('/', [
  body('title')
    .notEmpty()
    .withMessage('聊天标题不能为空')
    .isLength({ max: 100 })
    .withMessage('聊天标题不能超过100个字符'),
  body('aiProvider')
    .isIn(['openai', 'gemini', 'custom'])
    .withMessage('无效的AI提供商'),
  body('model')
    .optional()
    .isString()
    .withMessage('模型名称必须是字符串'),
  body('settings')
    .optional()
    .isObject()
    .withMessage('设置必须是对象')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: '输入验证失败',
      errors: errors.array()
    });
  }

  const { title, aiProvider, model, settings = {} } = req.body;

  const chat = new Chat({
    userId: req.user._id,
    title,
    aiProvider,
    model: model || 'gpt-3.5-turbo',
    settings: {
      temperature: settings.temperature || 0.7,
      maxTokens: settings.maxTokens || 2048,
      topP: settings.topP || 1,
      frequencyPenalty: settings.frequencyPenalty || 0,
      presencePenalty: settings.presencePenalty || 0
    }
  });

  await chat.save();

  res.status(201).json({
    message: '聊天创建成功',
    chat: {
      id: chat._id,
      title: chat.title,
      aiProvider: chat.aiProvider,
      model: chat.model,
      settings: chat.settings,
      messages: [],
      statistics: chat.statistics,
      lastActivity: chat.lastActivity,
      createdAt: chat.createdAt
    }
  });
}));

// 更新聊天信息
router.put('/:chatId', [
  body('title')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('聊天标题长度必须在1-100个字符之间'),
  body('settings')
    .optional()
    .isObject()
    .withMessage('设置必须是对象')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: '输入验证失败',
      errors: errors.array()
    });
  }

  const { chatId } = req.params;
  const { title, settings } = req.body;

  const chat = await Chat.findOne({
    _id: chatId,
    userId: req.user._id,
    isActive: true
  });

  if (!chat) {
    throw new AppError('聊天记录不存在', 404);
  }

  if (title) {
    chat.title = title;
  }

  if (settings) {
    chat.settings = { ...chat.settings, ...settings };
  }

  chat.lastActivity = new Date();
  await chat.save();

  res.json({
    message: '聊天信息更新成功',
    chat: {
      id: chat._id,
      title: chat.title,
      settings: chat.settings,
      lastActivity: chat.lastActivity
    }
  });
}));

// 删除聊天（软删除）
router.delete('/:chatId', catchAsync(async (req, res) => {
  const { chatId } = req.params;

  const chat = await Chat.findOne({
    _id: chatId,
    userId: req.user._id,
    isActive: true
  });

  if (!chat) {
    throw new AppError('聊天记录不存在', 404);
  }

  chat.isActive = false;
  await chat.save();

  res.json({
    message: '聊天删除成功'
  });
}));

// 清空聊天消息
router.delete('/:chatId/messages', catchAsync(async (req, res) => {
  const { chatId } = req.params;

  const chat = await Chat.findOne({
    _id: chatId,
    userId: req.user._id,
    isActive: true
  });

  if (!chat) {
    throw new AppError('聊天记录不存在', 404);
  }

  chat.messages = [];
  chat.statistics.totalMessages = 0;
  chat.statistics.totalTokens = 0;
  chat.lastActivity = new Date();
  
  await chat.save();

  res.json({
    message: '聊天消息清空成功'
  });
}));

// 导出聊天记录
router.get('/:chatId/export', catchAsync(async (req, res) => {
  const { chatId } = req.params;
  const format = req.query.format || 'json';

  const chat = await Chat.findOne({
    _id: chatId,
    userId: req.user._id,
    isActive: true
  });

  if (!chat) {
    throw new AppError('聊天记录不存在', 404);
  }

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="chat-${chatId}.json"`);
    
    res.json({
      title: chat.title,
      aiProvider: chat.aiProvider,
      model: chat.model,
      messages: chat.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      })),
      statistics: chat.statistics,
      createdAt: chat.createdAt,
      exportedAt: new Date().toISOString()
    });
  } else if (format === 'txt') {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="chat-${chatId}.txt"`);
    
    let content = `聊天标题: ${chat.title}\n`;
    content += `AI提供商: ${chat.aiProvider}\n`;
    content += `模型: ${chat.model}\n`;
    content += `创建时间: ${chat.createdAt.toLocaleString('zh-CN')}\n`;
    content += `消息数量: ${chat.messages.length}\n`;
    content += `\n${'='.repeat(50)}\n\n`;
    
    for (const msg of chat.messages) {
      const timestamp = msg.timestamp.toLocaleString('zh-CN');
      const role = msg.role === 'user' ? '用户' : msg.role === 'assistant' ? 'AI助手' : '系统';
      content += `[${timestamp}] ${role}:\n${msg.content}\n\n`;
    }
    
    res.send(content);
  } else {
    throw new AppError('不支持的导出格式', 400);
  }
}));

// 获取聊天统计信息
router.get('/:chatId/stats', catchAsync(async (req, res) => {
  const { chatId } = req.params;

  const chat = await Chat.findOne({
    _id: chatId,
    userId: req.user._id,
    isActive: true
  });

  if (!chat) {
    throw new AppError('聊天记录不存在', 404);
  }

  // 计算详细统计信息
  const messagesByRole = chat.messages.reduce((acc, msg) => {
    acc[msg.role] = (acc[msg.role] || 0) + 1;
    return acc;
  }, {});

  const tokensByRole = chat.messages.reduce((acc, msg) => {
    acc[msg.role] = (acc[msg.role] || 0) + (msg.tokens || 0);
    return acc;
  }, {});

  const messagesByDate = chat.messages.reduce((acc, msg) => {
    const date = msg.timestamp.toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  res.json({
    chatId: chat._id,
    title: chat.title,
    statistics: {
      ...chat.statistics,
      messagesByRole,
      tokensByRole,
      messagesByDate,
      averageTokensPerMessage: chat.statistics.totalMessages > 0 
        ? Math.round(chat.statistics.totalTokens / chat.statistics.totalMessages) 
        : 0,
      chatDuration: chat.lastActivity - chat.createdAt,
      firstMessage: chat.messages[0]?.timestamp,
      lastMessage: chat.messages[chat.messages.length - 1]?.timestamp
    }
  });
}));

module.exports = router;