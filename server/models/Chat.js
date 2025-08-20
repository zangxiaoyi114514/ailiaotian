const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  tokens: {
    type: Number,
    default: 0
  },
  model: {
    type: String,
    default: ''
  },
  provider: {
    type: String,
    enum: ['openai', 'gemini', 'custom'],
    default: 'openai'
  }
});

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  messages: [messageSchema],
  aiProvider: {
    type: String,
    enum: ['openai', 'gemini', 'custom'],
    default: 'openai'
  },
  model: {
    type: String,
    default: 'gpt-3.5-turbo'
  },
  settings: {
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 2
    },
    maxTokens: {
      type: Number,
      default: 2048,
      min: 1,
      max: 4096
    },
    topP: {
      type: Number,
      default: 1,
      min: 0,
      max: 1
    },
    frequencyPenalty: {
      type: Number,
      default: 0,
      min: -2,
      max: 2
    },
    presencePenalty: {
      type: Number,
      default: 0,
      min: -2,
      max: 2
    }
  },
  statistics: {
    totalMessages: {
      type: Number,
      default: 0
    },
    totalTokens: {
      type: Number,
      default: 0
    },
    totalCost: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 添加消息方法
chatSchema.methods.addMessage = function(role, content, tokens = 0, model = '', provider = 'openai') {
  const message = {
    role,
    content,
    tokens,
    model,
    provider,
    timestamp: new Date()
  };
  
  this.messages.push(message);
  this.statistics.totalMessages += 1;
  this.statistics.totalTokens += tokens;
  this.lastActivity = new Date();
  
  return this.save();
};

// 获取最近的消息
chatSchema.methods.getRecentMessages = function(limit = 10) {
  return this.messages.slice(-limit);
};

// 更新统计信息
chatSchema.methods.updateStatistics = function() {
  this.statistics.totalMessages = this.messages.length;
  this.statistics.totalTokens = this.messages.reduce((total, msg) => total + (msg.tokens || 0), 0);
  return this.save();
};

// 生成聊天标题（基于第一条用户消息）
chatSchema.methods.generateTitle = function() {
  const firstUserMessage = this.messages.find(msg => msg.role === 'user');
  if (firstUserMessage) {
    const content = firstUserMessage.content;
    this.title = content.length > 50 ? content.substring(0, 50) + '...' : content;
  }
  return this.save();
};

// 索引
chatSchema.index({ userId: 1, createdAt: -1 });
chatSchema.index({ userId: 1, isActive: 1, lastActivity: -1 });
chatSchema.index({ createdAt: -1 });
chatSchema.index({ lastActivity: -1 });

// 虚拟字段：消息数量
chatSchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

// 确保虚拟字段被序列化
chatSchema.set('toJSON', { virtuals: true });
chatSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Chat', chatSchema);