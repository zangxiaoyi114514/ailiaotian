# AI聊天网站

一个支持多个AI提供商的现代化聊天网站，具有美观的界面和流畅的动画效果。支持一键初始化配置，开箱即用。

## 功能特性

- 🚀 **一键初始化配置** - 首次访问自动引导完成系统配置
- 🤖 **多AI提供商支持** - OpenAI、Google Gemini、自定义OpenAI格式API
- 🗄️ **多数据库支持** - MongoDB、MySQL，灵活选择
- 🔐 **安全的密钥管理** - 后端存储，前端脱敏显示
- 💬 **实时聊天功能** - WebSocket支持，流畅对话体验
- 📱 **响应式设计** - 完美适配桌面端和移动端
- ✨ **流畅的动画效果** - Framer Motion驱动的现代化交互
- 👤 **用户认证系统** - JWT令牌，安全可靠
- 📊 **管理界面** - 完整的后台管理功能
- 💾 **聊天记录同步** - 云端存储，多设备同步
- 🛡️ **安全防护** - CORS、Helmet、速率限制等多重保护

## 技术栈

### 前端技术
- React 18 + React Router
- Material-UI + Framer Motion
- Socket.IO Client
- Axios + Redux Toolkit

### 后端技术
- Node.js + Express
- Socket.IO + JWT认证
- MongoDB / MySQL
- OpenAI + Google Gemini API

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0
- MongoDB 或 MySQL 数据库

### 安装依赖
```bash
# 安装所有依赖
npm run install:all
```

### 配置环境变量
```bash
# 复制环境变量模板
cp server/.env.example server/.env
```

### 启动应用
```bash
# 开发模式（同时启动前后端）
npm run dev
```

访问 http://localhost:3000 开始使用！

## 项目结构
```
ai-chat-website/
├── client/          # React前端应用
├── server/          # Node.js后端服务
├── package.json     # 项目根配置
└── README.md
```

## 许可证
MIT License
