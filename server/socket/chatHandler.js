const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Chat = require('../models/Chat');
const aiService = require('../services/aiService');

// Socket.IO 认证中间件
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('未提供认证令牌'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user || !user.isActive) {
      return next(new Error('用户不存在或已被禁用'));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('认证失败'));
  }
};

// 聊天事件处理器
const setupChatHandlers = (io) => {
  // 使用认证中间件
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`用户 ${socket.user.username} 已连接 (${socket.id})`);

    // 用户加入个人房间
    socket.join(`user_${socket.user._id}`);

    // 发送连接成功消息
    socket.emit('connected', {
      message: '连接成功',
      user: {
        id: socket.user._id,
        username: socket.user.username,
        avatar: socket.user.avatar
      }
    });

    // 加入聊天房间
    socket.on('join_chat', async (data) => {
      try {
        const { chatId } = data;
        
        if (!chatId) {
          return socket.emit('error', { message: '聊天ID不能为空' });
        }

        // 验证聊天是否属于当前用户
        const chat = await Chat.findOne({
          _id: chatId,
          userId: socket.user._id,
          isActive: true
        });

        if (!chat) {
          return socket.emit('error', { message: '聊天不存在或无权访问' });
        }

        // 离开之前的聊天房间
        const rooms = Array.from(socket.rooms);
        rooms.forEach(room => {
          if (room.startsWith('chat_')) {
            socket.leave(room);
          }
        });

        // 加入新的聊天房间
        socket.join(`chat_${chatId}`);
        socket.currentChatId = chatId;

        socket.emit('joined_chat', {
          chatId,
          message: '已加入聊天'
        });

        console.log(`用户 ${socket.user.username} 加入聊天 ${chatId}`);
      } catch (error) {
        console.error('加入聊天失败:', error);
        socket.emit('error', { message: '加入聊天失败' });
      }
    });

    // 发送消息
    socket.on('send_message', async (data) => {
      try {
        const {
          chatId,
          message,
          aiProvider = 'openai',
          model = 'gpt-3.5-turbo',
          settings = {}
        } = data;

        if (!chatId || !message) {
          return socket.emit('error', { message: '聊天ID和消息内容不能为空' });
        }

        // 验证聊天权限
        const chat = await Chat.findOne({
          _id: chatId,
          userId: socket.user._id,
          isActive: true
        });

        if (!chat) {
          return socket.emit('error', { message: '聊天不存在或无权访问' });
        }

        // 添加用户消息到聊天记录
        const userMessage = {
          role: 'user',
          content: message,
          timestamp: new Date(),
          tokens: Math.ceil(message.length / 4) // 粗略估算token数
        };

        chat.addMessage(userMessage);
        await chat.save();

        // 向客户端发送用户消息
        socket.emit('message_sent', {
          messageId: userMessage._id,
          message: userMessage,
          chatId
        });

        // 向聊天房间广播新消息（如果有其他连接）
        socket.to(`chat_${chatId}`).emit('new_message', {
          chatId,
          message: userMessage
        });

        // 准备AI响应
        const messages = chat.getRecentMessages(20).map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        // 发送正在输入状态
        socket.emit('ai_typing', { chatId, typing: true });

        try {
          // 调用AI服务
          const aiResponse = await aiService.sendMessage(
            aiProvider,
            messages,
            {
              model,
              ...settings
            }
          );

          if (aiResponse && aiResponse.content) {
            // 添加AI响应到聊天记录
            const assistantMessage = {
              role: 'assistant',
              content: aiResponse.content,
              timestamp: new Date(),
              tokens: aiResponse.tokens || Math.ceil(aiResponse.content.length / 4),
              model: aiResponse.model || model,
              provider: aiProvider
            };

            chat.addMessage(assistantMessage);
            await chat.save();

            // 停止输入状态
            socket.emit('ai_typing', { chatId, typing: false });

            // 发送AI响应
            socket.emit('ai_response', {
              messageId: assistantMessage._id,
              message: assistantMessage,
              chatId,
              usage: aiResponse.usage
            });

            // 向聊天房间广播AI响应
            socket.to(`chat_${chatId}`).emit('new_message', {
              chatId,
              message: assistantMessage
            });

            // 更新用户使用统计
            socket.user.usage.totalMessages += 1;
            socket.user.usage.totalTokens += (userMessage.tokens + assistantMessage.tokens);
            await socket.user.save();

            console.log(`AI响应已发送到聊天 ${chatId}`);
          } else {
            throw new Error('AI响应为空');
          }
        } catch (aiError) {
          console.error('AI响应错误:', aiError);
          
          // 停止输入状态
          socket.emit('ai_typing', { chatId, typing: false });
          
          // 发送错误消息
          socket.emit('ai_error', {
            chatId,
            error: aiError.message || 'AI服务暂时不可用，请稍后重试'
          });
        }
      } catch (error) {
        console.error('发送消息失败:', error);
        socket.emit('error', { message: '发送消息失败' });
      }
    });

    // 流式聊天（仅支持OpenAI和自定义提供商）
    socket.on('send_message_stream', async (data) => {
      try {
        const {
          chatId,
          message,
          aiProvider = 'openai',
          model = 'gpt-3.5-turbo',
          settings = {}
        } = data;

        if (!chatId || !message) {
          return socket.emit('error', { message: '聊天ID和消息内容不能为空' });
        }

        if (aiProvider === 'gemini') {
          return socket.emit('error', { message: 'Gemini不支持流式响应' });
        }

        // 验证聊天权限
        const chat = await Chat.findOne({
          _id: chatId,
          userId: socket.user._id,
          isActive: true
        });

        if (!chat) {
          return socket.emit('error', { message: '聊天不存在或无权访问' });
        }

        // 添加用户消息
        const userMessage = {
          role: 'user',
          content: message,
          timestamp: new Date(),
          tokens: Math.ceil(message.length / 4)
        };

        chat.addMessage(userMessage);
        await chat.save();

        // 发送用户消息确认
        socket.emit('message_sent', {
          messageId: userMessage._id,
          message: userMessage,
          chatId
        });

        // 准备消息历史
        const messages = chat.getRecentMessages(20).map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        // 开始流式响应
        socket.emit('stream_start', { chatId });

        let assistantContent = '';
        let assistantMessageId = null;

        try {
          // 调用流式AI服务
          const stream = await aiService.sendMessageStream(
            aiProvider,
            messages,
            {
              model,
              ...settings
            }
          );

          // 处理流式数据
          for await (const chunk of stream) {
            if (chunk.content) {
              assistantContent += chunk.content;
              
              socket.emit('stream_chunk', {
                chatId,
                content: chunk.content,
                delta: true
              });
            }
          }

          // 流式响应结束
          if (assistantContent) {
            const assistantMessage = {
              role: 'assistant',
              content: assistantContent,
              timestamp: new Date(),
              tokens: Math.ceil(assistantContent.length / 4),
              model: model,
              provider: aiProvider
            };

            chat.addMessage(assistantMessage);
            await chat.save();

            socket.emit('stream_end', {
              chatId,
              messageId: assistantMessage._id,
              totalContent: assistantContent
            });

            // 更新用户使用统计
            socket.user.usage.totalMessages += 1;
            socket.user.usage.totalTokens += (userMessage.tokens + assistantMessage.tokens);
            await socket.user.save();
          }
        } catch (streamError) {
          console.error('流式响应错误:', streamError);
          socket.emit('stream_error', {
            chatId,
            error: streamError.message || '流式响应失败'
          });
        }
      } catch (error) {
        console.error('流式消息发送失败:', error);
        socket.emit('error', { message: '流式消息发送失败' });
      }
    });

    // 停止AI响应
    socket.on('stop_generation', (data) => {
      const { chatId } = data;
      // 这里可以实现停止生成的逻辑
      socket.emit('generation_stopped', { chatId });
    });

    // 获取在线用户数
    socket.on('get_online_users', () => {
      const onlineUsers = io.sockets.sockets.size;
      socket.emit('online_users', { count: onlineUsers });
    });

    // 用户断开连接
    socket.on('disconnect', (reason) => {
      console.log(`用户 ${socket.user.username} 已断开连接: ${reason}`);
      
      // 更新用户最后活动时间
      socket.user.lastActivity = new Date();
      socket.user.save().catch(err => {
        console.error('更新用户活动时间失败:', err);
      });
    });

    // 错误处理
    socket.on('error', (error) => {
      console.error(`Socket错误 (${socket.user.username}):`, error);
    });
  });

  // 定期清理断开的连接
  setInterval(() => {
    const connectedSockets = io.sockets.sockets.size;
    console.log(`当前连接数: ${connectedSockets}`);
  }, 60000); // 每分钟记录一次
};

module.exports = {
  setupChatHandlers,
  authenticateSocket
};