const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const configManager = require('../utils/configManager');

const router = express.Router();

// 检查系统是否已初始化
router.get('/init-status', async (req, res) => {
  try {
    // 检查配置文件是否存在
    const configExists = await configManager.configExists();

    // 检查是否有管理员用户
    let hasAdmin = false;
    try {
      // 检查数据库连接状态
      if (require('mongoose').connection.readyState === 1) {
        const adminUser = await User.findOne({ role: 'admin' }).maxTimeMS(2000); // 2秒超时
        hasAdmin = !!adminUser;
      } else {
        // 数据库未连接，假设没有管理员用户
        hasAdmin = false;
      }
    } catch (error) {
      console.log('检查管理员用户失败:', error.message);
      hasAdmin = false;
    }

    const initialized = configExists && hasAdmin;

    res.json({
      success: true,
      initialized,
      configExists,
      hasAdmin,
      dbConnected: require('mongoose').connection.readyState === 1
    });
  } catch (error) {
    console.error('检查初始化状态失败:', error);
    res.status(500).json({
      success: false,
      message: '检查初始化状态失败',
      error: error.message
    });
  }
});

// 测试数据库连接
router.post('/test-db', async (req, res) => {
  try {
    const result = await configManager.testDatabaseConnection(req.body);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('数据库连接测试失败:', error);
    res.status(400).json({
      success: false,
      message: '数据库连接测试失败',
      error: error.message
    });
  }
});

// 测试AI服务连接
router.post('/test-ai', async (req, res) => {
  try {
    const result = await configManager.testAIConnection(req.body);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        models: result.models || []
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('AI服务连接测试失败:', error);
    res.status(400).json({
      success: false,
      message: 'AI服务连接测试失败',
      error: error.message
    });
  }
});

// 完成系统初始化
router.post('/initialize', async (req, res) => {
  try {
    const { database, ai, admin } = req.body;

    // 验证必需字段
    if (!database || !ai || !admin) {
      return res.status(400).json({
        success: false,
        message: '缺少必需的配置信息'
      });
    }

    // 检查是否已经初始化
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: '系统已经初始化，不能重复初始化'
      });
    }

    // 验证配置
    try {
      configManager.validateDatabaseConfig(database);
      configManager.validateAIConfig(ai);
      configManager.validateAdminConfig(admin);
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError.message
      });
    }

    // 创建配置文件
    const config = {
      database: {
        type: database.type,
        host: database.host,
        port: database.port,
        database: database.database,
        username: database.username,
        password: database.password
      },
      ai: {
        openai_api_key: ai.openai_api_key,
        openai_base_url: ai.openai_base_url,
        gemini_api_key: ai.gemini_api_key,
        default_model: ai.default_model
      },
      initialized: true,
      initialized_at: new Date().toISOString()
    };

    // 保存配置文件
    await configManager.saveConfig(config);

    // 创建管理员用户
    const hashedPassword = await bcrypt.hash(admin.password, 12);
    const adminUser = new User({
      username: admin.username,
      email: admin.email,
      password: hashedPassword,
      role: 'admin',
      isActive: true
    });

    await adminUser.save();

    // 应用配置到环境变量
    configManager.applyConfigToEnvironment(config);

    res.json({
      success: true,
      message: '系统初始化完成',
      admin: {
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role
      }
    });
  } catch (error) {
    console.error('系统初始化失败:', error);
    res.status(500).json({
      success: false,
      message: '系统初始化失败',
      error: error.message
    });
  }
});

// 获取当前配置（用于编辑）
router.get('/config', async (req, res) => {
  try {
    if (!configManager.configExists()) {
      return res.status(404).json({
        success: false,
        message: '配置文件不存在'
      });
    }

    const config = await configManager.loadConfig();
    const safeConfig = configManager.sanitizeConfig(config);

    res.json({
      success: true,
      config: safeConfig
    });
  } catch (error) {
    console.error('获取配置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取配置失败',
      error: error.message
    });
  }
});

module.exports = router;