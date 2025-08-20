const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
require('dotenv').config();

// 导入路由
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');
const initRoutes = require('./routes/init');

// 导入中间件
const { authMiddleware } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
});

// 基础中间件
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: '请求过于频繁，请稍后再试'
});
app.use('/api/', limiter);

// 数据库连接
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-chat', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // 5秒超时
  connectTimeoutMS: 10000, // 10秒连接超时
})
.then(() => console.log('MongoDB 连接成功'))
.catch(err => {
  console.error('MongoDB 连接失败:', err.message);
  console.log('服务器将在没有数据库连接的情况下继续运行');
});

// 监听连接事件
mongoose.connection.on('connected', () => {
  console.log('MongoDB 连接已建立');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB 连接错误:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB 连接已断开');
});

// 防止未处理的Promise拒绝导致进程崩溃
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  // 不要退出进程，让服务器继续运行
});

// 设置 Socket.IO 聊天处理器
const { setupChatHandlers } = require('./socket/chatHandler');
setupChatHandlers(io);

// 将 io 实例添加到 app 中，供路由使用
app.set('io', io);

// 路由
app.use('/api/admin', initRoutes); // 初始化路由不需要认证
app.use('/api/auth', authRoutes);
app.use('/api/chat', authMiddleware, chatRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 错误处理中间件
app.use(errorHandler);

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({ message: '接口不存在' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    mongoose.connection.close(false, () => {
      console.log('MongoDB 连接已关闭');
      process.exit(0);
    });
  });
});

module.exports = { app, server, io };