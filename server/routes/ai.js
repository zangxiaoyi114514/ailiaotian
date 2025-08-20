const express = require('express');
const { body, validationResult } = require('express-validator');
const aiService = require('../services/aiService');
const Chat = require('../models/Chat');
const User = require('../models/User');
const { catchAsync, AppError } = require('../middleware/errorHandler');

const router = express.Router();

// 发送消息到AI
router.post('/chat', [
  body('message')
    .notEmpty()
    .withMessage('消息内容不能为空')
    .isLength({ max: 4000 })
    .withMessage('消息内容不能超过4000个字符'),
  body('chatId')
    .optional()
    .isMongoId()
    .withMessage('无效的聊天ID'),
  body('provider')
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

  const { message, chatId, provider, model, settings = {} } = req.body;
  const userId = req.user._id;

  let chat;
  
  // 获取或创建聊天记录
  if (chatId) {
    chat = await Chat.findOne({ _id: chatId, userId });
    if (!chat) {
      throw new AppError('聊天记录不存在', 404);
    }
  } else {
    // 创建新的聊天记录
    chat = new Chat({
      userId,
      title: message.length > 50 ? message.substring(0, 50) + '...' : message,
      aiProvider: provider,
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
  }

  // 添加用户消息
  await chat.addMessage('user', message, 0, model || chat.model, provider);

  try {
    // 准备发送给AI的消息历史
    const messages = chat.getRecentMessages(20).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // 发送到AI服务
    const aiResponse = await aiService.sendMessage(provider, messages, {
      model: model || chat.model,
      ...chat.settings
    });

    // 添加AI回复
    await chat.addMessage(
      'assistant',
      aiResponse.content,
      aiResponse.usage?.total_tokens || 0,
      aiResponse.model,
      provider
    );

    // 更新用户使用统计
    await req.user.incrementUsage(aiResponse.usage?.total_tokens || 0);

    // 通过Socket.IO发送实时更新
    const io = req.app.get('io');
    io.to(userId.toString()).emit('message_received', {
      chatId: chat._id,
      message: {
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date(),
        model: aiResponse.model,
        provider: provider
      }
    });

    res.json({
      message: 'AI回复成功',
      chatId: chat._id,
      response: {
        content: aiResponse.content,
        model: aiResponse.model,
        usage: aiResponse.usage,
        provider: provider
      },
      chat: {
        id: chat._id,
        title: chat.title,
        messageCount: chat.messages.length,
        lastActivity: chat.lastActivity
      }
    });
  } catch (error) {
    console.error('AI服务错误:', error);
    
    // 添加错误消息到聊天记录
    await chat.addMessage(
      'system',
      `AI服务错误: ${error.message}`,
      0,
      model || chat.model,
      provider
    );

    throw error;
  }
}));

// 流式聊天接口
router.post('/chat/stream', [
  body('message')
    .notEmpty()
    .withMessage('消息内容不能为空')
    .isLength({ max: 4000 })
    .withMessage('消息内容不能超过4000个字符'),
  body('chatId')
    .optional()
    .isMongoId()
    .withMessage('无效的聊天ID'),
  body('provider')
    .isIn(['openai', 'custom'])
    .withMessage('该提供商不支持流式响应'),
  body('model')
    .optional()
    .isString()
    .withMessage('模型名称必须是字符串')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: '输入验证失败',
      errors: errors.array()
    });
  }

  const { message, chatId, provider, model, settings = {} } = req.body;
  const userId = req.user._id;

  let chat;
  
  // 获取或创建聊天记录
  if (chatId) {
    chat = await Chat.findOne({ _id: chatId, userId });
    if (!chat) {
      throw new AppError('聊天记录不存在', 404);
    }
  } else {
    chat = new Chat({
      userId,
      title: message.length > 50 ? message.substring(0, 50) + '...' : message,
      aiProvider: provider,
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
  }

  // 添加用户消息
  await chat.addMessage('user', message, 0, model || chat.model, provider);

  try {
    // 设置SSE响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // 准备消息历史
    const messages = chat.getRecentMessages(20).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // 获取流式响应
    const stream = await aiService.sendMessageStream(provider, messages, {
      model: model || chat.model,
      ...chat.settings
    });

    let fullResponse = '';
    let totalTokens = 0;

    // 处理流式数据
    if (provider === 'openai') {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content, type: 'content' })}\n\n`);
        }
        
        if (chunk.choices[0]?.finish_reason) {
          totalTokens = chunk.usage?.total_tokens || 0;
          break;
        }
      }
    } else if (provider === 'custom') {
      stream.on('data', (chunk) => {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              if (content) {
                fullResponse += content;
                res.write(`data: ${JSON.stringify({ content, type: 'content' })}\n\n`);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      });

      stream.on('end', () => {
        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        res.end();
      });

      return;
    }

    // 保存完整的AI回复
    if (fullResponse) {
      await chat.addMessage(
        'assistant',
        fullResponse,
        totalTokens,
        model || chat.model,
        provider
      );

      // 更新用户使用统计
      await req.user.incrementUsage(totalTokens);
    }

    // 发送完成信号
    res.write(`data: ${JSON.stringify({ type: 'done', chatId: chat._id })}\n\n`);
    res.end();

  } catch (error) {
    console.error('流式AI服务错误:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
    res.end();
  }
}));

// 获取可用的AI模型
router.get('/models/:provider', catchAsync(async (req, res) => {
  const { provider } = req.params;
  
  if (!['openai', 'gemini', 'custom'].includes(provider)) {
    throw new AppError('无效的AI提供商', 400);
  }

  const models = await aiService.getAvailableModels(provider);
  const status = await aiService.checkProviderStatus(provider);

  res.json({
    provider,
    status,
    models
  });
}));

// 检查AI提供商状态
router.get('/status', catchAsync(async (req, res) => {
  const providers = ['openai', 'gemini', 'custom'];
  const status = {};

  for (const provider of providers) {
    status[provider] = await aiService.checkProviderStatus(provider);
  }

  res.json({
    providers: status,
    timestamp: new Date().toISOString()
  });
}));

// 测试AI提供商连接
router.post('/test/:provider', catchAsync(async (req, res) => {
  const { provider } = req.params;
  
  if (!['openai', 'gemini', 'custom'].includes(provider)) {
    throw new AppError('无效的AI提供商', 400);
  }

  try {
    const testMessage = [{ role: 'user', content: '你好，这是一个连接测试。' }];
    const response = await aiService.sendMessage(provider, testMessage);
    
    res.json({
      message: '连接测试成功',
      provider,
      response: {
        content: response.content.substring(0, 100) + '...',
        model: response.model,
        usage: response.usage
      }
    });
  } catch (error) {
    throw new AppError(`${provider} 连接测试失败: ${error.message}`, 500);
  }
}));

module.exports = router;