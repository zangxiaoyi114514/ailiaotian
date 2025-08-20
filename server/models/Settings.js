const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // AI提供商配置
  aiProviders: {
    openai: {
      enabled: {
        type: Boolean,
        default: true
      },
      apiKey: {
        type: String,
        default: ''
      },
      baseUrl: {
        type: String,
        default: 'https://api.openai.com/v1'
      },
      models: [{
        name: String,
        displayName: String,
        maxTokens: Number,
        costPer1kTokens: Number
      }],
      defaultModel: {
        type: String,
        default: 'gpt-3.5-turbo'
      }
    },
    gemini: {
      enabled: {
        type: Boolean,
        default: false
      },
      apiKey: {
        type: String,
        default: ''
      },
      baseUrl: {
        type: String,
        default: 'https://generativelanguage.googleapis.com/v1beta'
      },
      models: [{
        name: String,
        displayName: String,
        maxTokens: Number,
        costPer1kTokens: Number
      }],
      defaultModel: {
        type: String,
        default: 'gemini-pro'
      }
    },
    custom: {
      enabled: {
        type: Boolean,
        default: false
      },
      apiKey: {
        type: String,
        default: ''
      },
      baseUrl: {
        type: String,
        default: ''
      },
      models: [{
        name: String,
        displayName: String,
        maxTokens: Number,
        costPer1kTokens: Number
      }],
      defaultModel: {
        type: String,
        default: ''
      }
    }
  },
  
  // 系统配置
  system: {
    siteName: {
      type: String,
      default: 'AI聊天助手'
    },
    siteDescription: {
      type: String,
      default: '智能AI聊天助手，支持多个AI提供商'
    },
    allowRegistration: {
      type: Boolean,
      default: true
    },
    maxUsersPerDay: {
      type: Number,
      default: 100
    },
    maxMessagesPerUser: {
      type: Number,
      default: 1000
    },
    maxTokensPerUser: {
      type: Number,
      default: 100000
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    maintenanceMessage: {
      type: String,
      default: '系统维护中，请稍后再试'
    }
  },
  
  // 安全配置
  security: {
    rateLimitPerMinute: {
      type: Number,
      default: 20
    },
    rateLimitPerHour: {
      type: Number,
      default: 100
    },
    maxConcurrentChats: {
      type: Number,
      default: 5
    },
    sessionTimeout: {
      type: Number,
      default: 24 * 60 * 60 * 1000 // 24小时
    },
    passwordMinLength: {
      type: Number,
      default: 6
    },
    requireEmailVerification: {
      type: Boolean,
      default: false
    }
  },
  
  // 功能开关
  features: {
    enableFileUpload: {
      type: Boolean,
      default: false
    },
    enableImageGeneration: {
      type: Boolean,
      default: false
    },
    enableVoiceInput: {
      type: Boolean,
      default: false
    },
    enableExport: {
      type: Boolean,
      default: true
    },
    enableSharing: {
      type: Boolean,
      default: false
    }
  },
  
  // 界面配置
  ui: {
    defaultTheme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    primaryColor: {
      type: String,
      default: '#1976d2'
    },
    secondaryColor: {
      type: String,
      default: '#dc004e'
    },
    showWelcomeMessage: {
      type: Boolean,
      default: true
    },
    welcomeMessage: {
      type: String,
      default: '欢迎使用AI聊天助手！我可以帮助您解答问题、提供建议和进行对话。'
    }
  },
  
  // 统计信息
  statistics: {
    totalUsers: {
      type: Number,
      default: 0
    },
    totalChats: {
      type: Number,
      default: 0
    },
    totalMessages: {
      type: Number,
      default: 0
    },
    totalTokensUsed: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// 获取或创建默认设置
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this();
    await settings.save();
  }
  return settings;
};

// 更新设置
settingsSchema.statics.updateSettings = async function(updates) {
  let settings = await this.getSettings();
  Object.assign(settings, updates);
  return settings.save();
};

// 更新统计信息
settingsSchema.methods.updateStatistics = async function(stats) {
  Object.assign(this.statistics, stats);
  this.statistics.lastUpdated = new Date();
  return this.save();
};

// 检查功能是否启用
settingsSchema.methods.isFeatureEnabled = function(feature) {
  return this.features[feature] || false;
};

// 检查AI提供商是否启用
settingsSchema.methods.isProviderEnabled = function(provider) {
  return this.aiProviders[provider]?.enabled || false;
};

// 获取AI提供商配置
settingsSchema.methods.getProviderConfig = function(provider) {
  return this.aiProviders[provider] || null;
};

module.exports = mongoose.model('Settings', settingsSchema);