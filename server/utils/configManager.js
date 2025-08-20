const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
const mysql = require('mysql2/promise');

class ConfigManager {
  constructor() {
    this.configPath = path.join(__dirname, '../config.json');
    this.config = null;
  }

  // 加载配置文件
  async loadConfig() {
    try {
      const configData = await fs.readFile(this.configPath, 'utf8');
      this.config = JSON.parse(configData);
      return this.config;
    } catch (error) {
      console.log('配置文件不存在或格式错误:', error.message);
      return null;
    }
  }

  // 保存配置文件
  async saveConfig(config) {
    try {
      await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf8');
      this.config = config;
      return true;
    } catch (error) {
      console.error('保存配置文件失败:', error);
      throw error;
    }
  }

  // 获取当前配置
  getConfig() {
    return this.config;
  }

  // 检查配置是否存在
  async configExists() {
    try {
      await fs.access(this.configPath);
      return true;
    } catch (error) {
      return false;
    }
  }

  // 验证数据库配置
  validateDatabaseConfig(dbConfig) {
    // 检查配置对象是否存在
    if (!dbConfig || typeof dbConfig !== 'object') {
      throw new Error('数据库配置无效');
    }

    const required = ['type', 'host', 'port', 'database'];
    const missing = required.filter(field => !dbConfig[field] || (typeof dbConfig[field] === 'string' && dbConfig[field].trim() === ''));
    
    if (missing.length > 0) {
      throw new Error(`数据库配置缺少必需字段: ${missing.join(', ')}`);
    }

    // 验证端口号
    const port = parseInt(dbConfig.port);
    if (isNaN(port) || port < 1 || port > 65535) {
      throw new Error('数据库端口号无效');
    }

    // 验证数据库类型
    const supportedTypes = ['mongodb', 'mysql'];
    if (!supportedTypes.includes(dbConfig.type)) {
      throw new Error(`不支持的数据库类型: ${dbConfig.type}`);
    }

    // 对于需要认证的数据库，检查用户名和密码
    if (dbConfig.type === 'mysql') {
      if (!dbConfig.username || dbConfig.username.trim() === '') {
        throw new Error('MySQL数据库需要提供用户名');
      }
      if (!dbConfig.password || dbConfig.password.trim() === '') {
        throw new Error('MySQL数据库需要提供密码');
      }
    }

    return true;
  }

  // 验证AI配置
  validateAIConfig(aiConfig) {
    // 检查配置对象是否存在
    if (!aiConfig || typeof aiConfig !== 'object') {
      throw new Error('AI配置无效');
    }

    if (!aiConfig.openai_api_key || aiConfig.openai_api_key.trim() === '') {
      throw new Error('OpenAI API Key是必需的');
    }

    if (!aiConfig.openai_base_url || aiConfig.openai_base_url.trim() === '') {
      throw new Error('OpenAI Base URL是必需的');
    }

    // 验证URL格式
    try {
      new URL(aiConfig.openai_base_url.trim());
    } catch (error) {
      throw new Error('OpenAI Base URL格式无效');
    }

    // 验证API Key格式（基本检查）
    if (aiConfig.openai_api_key.trim().length < 10) {
      throw new Error('OpenAI API Key格式无效');
    }

    return true;
  }

  // 验证管理员配置
  validateAdminConfig(adminConfig) {
    // 检查配置对象是否存在
    if (!adminConfig || typeof adminConfig !== 'object') {
      throw new Error('管理员配置无效');
    }

    const required = ['username', 'email', 'password'];
    const missing = required.filter(field => !adminConfig[field] || (typeof adminConfig[field] === 'string' && adminConfig[field].trim() === ''));
    
    if (missing.length > 0) {
      throw new Error(`管理员配置缺少必需字段: ${missing.join(', ')}`);
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminConfig.email.trim())) {
      throw new Error('邮箱格式无效');
    }

    // 验证密码强度
    if (adminConfig.password.trim().length < 6) {
      throw new Error('密码长度至少6位');
    }

    // 验证用户名格式
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(adminConfig.username.trim())) {
      throw new Error('用户名只能包含字母、数字和下划线，长度3-20位');
    }

    return true;
  }

  // 验证完整配置
  validateConfig(config) {
    if (!config.database || !config.ai) {
      throw new Error('配置文件格式无效');
    }

    this.validateDatabaseConfig(config.database);
    this.validateAIConfig(config.ai);

    return true;
  }

  // 生成数据库连接字符串
  generateConnectionString(dbConfig) {
    const { type, host, port, database, username, password } = dbConfig;
    
    switch (type) {
      case 'mongodb':
        if (username && password) {
          return `mongodb://${username}:${password}@${host}:${port}/${database}`;
        } else {
          return `mongodb://${host}:${port}/${database}`;
        }
      case 'mysql':
        return `mysql://${username}:${password}@${host}:${port}/${database}`;

      default:
        throw new Error(`不支持的数据库类型: ${type}`);
    }
  }

  // 测试数据库连接
  async testDatabaseConnection(dbConfig) {
    this.validateDatabaseConfig(dbConfig);
    
    if (dbConfig.type === 'mongodb') {
      const connectionString = this.generateConnectionString(dbConfig);
      try {
        const testConnection = await mongoose.createConnection(connectionString, {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000
        });
        await testConnection.close();
        return { success: true, message: 'MongoDB连接测试成功' };
      } catch (error) {
        return { success: false, message: `MongoDB连接失败: ${error.message}` };
      }
    }
    
    if (dbConfig.type === 'mysql') {
      try {
        const connection = await mysql.createConnection({
          host: dbConfig.host,
          port: dbConfig.port,
          user: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.database,
          connectTimeout: 5000
        });
        await connection.ping();
        await connection.end();
        return { success: true, message: 'MySQL连接测试成功' };
      } catch (error) {
        return { success: false, message: `MySQL连接失败: ${error.message}` };
      }
    }
    
    // 不支持的数据库类型
    return { success: false, message: `不支持的数据库类型: ${dbConfig.type}` };
  }

  // 测试AI服务连接
  async testAIConnection(aiConfig) {
    this.validateAIConfig(aiConfig);
    
    try {
      const axios = require('axios');
      const response = await axios.get(`${aiConfig.openai_base_url}/models`, {
        headers: {
          'Authorization': `Bearer ${aiConfig.openai_api_key}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      return { 
        success: true, 
        message: 'AI服务连接测试成功',
        models: response.data.data ? response.data.data.slice(0, 5).map(model => model.id) : []
      };
    } catch (error) {
      if (error.response) {
        return { 
          success: false, 
          message: `AI服务连接失败: ${error.response.status} ${error.response.statusText}` 
        };
      }
      return { 
        success: false, 
        message: `AI服务连接失败: ${error.message}` 
      };
    }
  }

  // 应用配置到环境变量
  applyConfigToEnvironment(config) {
    if (config.ai) {
      process.env.OPENAI_API_KEY = config.ai.openai_api_key;
      process.env.OPENAI_BASE_URL = config.ai.openai_base_url;
      
      if (config.ai.gemini_api_key) {
        process.env.GEMINI_API_KEY = config.ai.gemini_api_key;
      }
      
      if (config.ai.default_model) {
        process.env.DEFAULT_AI_MODEL = config.ai.default_model;
      }
    }

    if (config.database) {
      const connectionString = this.generateConnectionString(config.database);
      process.env.MONGODB_URI = connectionString;
    }
  }

  // 获取脱敏配置（隐藏敏感信息）
  getSanitizedConfig(config = this.config) {
    if (!config) return null;
    
    const sanitized = JSON.parse(JSON.stringify(config));
    
    // 隐藏数据库密码
    if (sanitized.database && sanitized.database.password) {
      sanitized.database.password = '***';
    }
    
    // 隐藏API密钥
    if (sanitized.ai) {
      if (sanitized.ai.openai_api_key) {
        sanitized.ai.openai_api_key = sanitized.ai.openai_api_key.substring(0, 8) + '***';
      }
      if (sanitized.ai.gemini_api_key) {
        sanitized.ai.gemini_api_key = sanitized.ai.gemini_api_key.substring(0, 8) + '***';
      }
    }
    
    return sanitized;
  }

  // 初始化时加载配置
  async initialize() {
    const config = await this.loadConfig();
    if (config) {
      this.applyConfigToEnvironment(config);
      console.log('配置文件加载成功');
    } else {
      console.log('未找到配置文件，系统需要初始化');
    }
    return config;
  }
}

// 创建单例实例
const configManager = new ConfigManager();

module.exports = configManager;