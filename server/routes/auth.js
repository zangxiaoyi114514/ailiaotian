const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const { catchAsync, AppError } = require('../middleware/errorHandler');

const router = express.Router();

// 生成JWT令牌
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// 用户注册
router.post('/register', [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('用户名长度必须在3-30个字符之间')
    .matches(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/)
    .withMessage('用户名只能包含字母、数字、下划线和中文'),
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码长度至少6个字符')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('密码必须包含至少一个字母和一个数字')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: '输入验证失败',
      errors: errors.array()
    });
  }

  const { username, email, password } = req.body;

  // 检查用户是否已存在
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new AppError('该邮箱已被注册', 400);
    }
    if (existingUser.username === username) {
      throw new AppError('该用户名已被使用', 400);
    }
  }

  // 创建新用户
  const user = new User({
    username,
    email,
    password
  });

  await user.save();

  // 生成令牌
  const token = generateToken(user._id);

  res.status(201).json({
    message: '注册成功',
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      preferences: user.preferences
    }
  });
}));

// 用户登录
router.post('/login', [
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: '输入验证失败',
      errors: errors.array()
    });
  }

  const { email, password } = req.body;

  // 查找用户
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new AppError('邮箱或密码错误', 401);
  }

  // 检查账户状态
  if (!user.isActive) {
    throw new AppError('账户已被禁用，请联系管理员', 401);
  }

  // 验证密码
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError('邮箱或密码错误', 401);
  }

  // 更新最后登录时间
  await user.updateLastLogin();

  // 生成令牌
  const token = generateToken(user._id);

  res.json({
    message: '登录成功',
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      preferences: user.preferences,
      lastLogin: user.lastLogin
    }
  });
}));

// 获取当前用户信息
router.get('/profile', authMiddleware, catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  res.json({
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      preferences: user.preferences,
      usage: user.usage,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    }
  });
}));

// 更新用户信息
router.put('/profile', authMiddleware, [
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('用户名长度必须在3-30个字符之间')
    .matches(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/)
    .withMessage('用户名只能包含字母、数字、下划线和中文'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('头像必须是有效的URL')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: '输入验证失败',
      errors: errors.array()
    });
  }

  const { username, avatar, preferences } = req.body;
  const user = await User.findById(req.user._id);

  // 检查用户名是否已被使用
  if (username && username !== user.username) {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      throw new AppError('该用户名已被使用', 400);
    }
    user.username = username;
  }

  if (avatar !== undefined) {
    user.avatar = avatar;
  }

  if (preferences) {
    user.preferences = { ...user.preferences, ...preferences };
  }

  await user.save();

  res.json({
    message: '用户信息更新成功',
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      preferences: user.preferences
    }
  });
}));

// 修改密码
router.put('/password', authMiddleware, [
  body('currentPassword')
    .notEmpty()
    .withMessage('当前密码不能为空'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('新密码长度至少6个字符')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('新密码必须包含至少一个字母和一个数字')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: '输入验证失败',
      errors: errors.array()
    });
  }

  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  // 验证当前密码
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new AppError('当前密码错误', 400);
  }

  // 更新密码
  user.password = newPassword;
  await user.save();

  res.json({
    message: '密码修改成功'
  });
}));

// 验证令牌
router.get('/verify', authMiddleware, (req, res) => {
  res.json({
    message: '令牌有效',
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role
    }
  });
});

module.exports = router;