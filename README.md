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

### 前端依赖 (client/package.json)

#### 核心框架
- **react** (^18.2.0) - 现代化的前端框架，提供组件化开发和虚拟DOM
- **react-dom** (^18.2.0) - React的DOM渲染器，负责将React组件渲染到浏览器
- **react-router-dom** (^6.15.0) - React官方路由库，实现单页应用的页面导航
- **react-scripts** (5.0.1) - Create React App的构建工具，包含webpack、babel等配置

#### UI组件库和样式
- **@mui/material** (^5.14.5) - Material-UI核心组件库，提供Google Material Design风格的React组件
- **@mui/icons-material** (^5.14.3) - Material-UI官方图标库，包含数千个Material Design图标
- **@mui/lab** (^5.0.0-alpha.140) - Material-UI实验性组件，提供尚未稳定的新功能组件
- **@emotion/react** (^11.11.1) - CSS-in-JS样式库，MUI的核心依赖，支持动态样式
- **@emotion/styled** (^11.11.0) - 基于emotion的样式化组件库，类似styled-components

#### 动画和交互
- **framer-motion** (^10.16.4) - 强大的React动画库，提供声明式动画API和手势支持
- **notistack** (^3.0.1) - 可堆叠的通知提示组件库，支持多种通知类型
- **react-hot-toast** (^2.4.1) - 轻量级的Toast通知库，提供美观的提示效果

#### 网络通信
- **axios** (^1.5.0) - 基于Promise的HTTP客户端，支持请求/响应拦截器
- **socket.io-client** (^4.7.2) - Socket.IO客户端库，实现实时双向通信

#### 内容渲染和处理
- **react-markdown** (^8.0.7) - React Markdown渲染组件，将Markdown转换为React组件
- **react-syntax-highlighter** (^15.5.0) - 代码语法高亮组件，支持多种编程语言
- **prism-react-renderer** (^2.1.0) - 基于Prism.js的React代码高亮渲染器
- **remark-gfm** (^3.0.1) - GitHub风格Markdown插件，支持表格、删除线等扩展语法
- **rehype-raw** (^6.1.1) - 允许在Markdown中使用原始HTML的处理插件

#### 工具库
- **date-fns** (^2.30.0) - 现代化的JavaScript日期处理库，模块化设计
- **js-cookie** (^3.0.5) - 简单的JavaScript Cookie操作库
- **lodash** (^4.17.21) - 实用工具库，提供数组、对象、函数等操作方法

#### 测试工具
- **@testing-library/jest-dom** (^5.17.0) - Jest的DOM测试扩展，提供自定义匹配器
- **@testing-library/react** (^13.4.0) - React组件测试工具，专注于用户行为测试
- **@testing-library/user-event** (^14.4.3) - 用户事件模拟库，模拟真实的用户交互

#### 开发工具
- **eslint** (^8.45.0) - JavaScript代码检查工具，确保代码质量和一致性
- **eslint-plugin-react** (^7.33.0) - ESLint的React插件，提供React特定的检查规则
- **eslint-plugin-react-hooks** (^4.6.0) - React Hooks的ESLint规则插件

### 后端依赖 (server/package.json)

#### 核心框架
- **express** (^4.18.2) - 快速、极简的Node.js Web应用框架
- **node.js** - JavaScript运行时环境（系统依赖）

#### 数据库驱动
- **mongoose** (^7.5.0) - MongoDB对象文档映射库，提供Schema定义和数据验证
- **mysql2** (^3.14.3) - MySQL数据库驱动，支持Promise、连接池和预处理语句

#### 身份认证和安全
- **jsonwebtoken** (^9.0.2) - JWT令牌生成、验证和解码库
- **bcryptjs** (^2.4.3) - 密码哈希加密库，基于bcrypt算法
- **helmet** (^7.0.0) - Express安全中间件，设置各种HTTP安全头
- **cors** (^2.8.5) - 跨域资源共享中间件，处理CORS策略
- **express-rate-limit** (^6.10.0) - API请求频率限制中间件，防止暴力攻击
- **express-validator** (^7.0.1) - Express请求数据验证中间件

#### 实时通信
- **socket.io** (^4.7.2) - 实时双向通信库，支持WebSocket和轮询

#### AI服务集成
- **openai** (^4.0.0) - OpenAI官方SDK，支持GPT、DALL-E等模型
- **@google/generative-ai** (^0.2.1) - Google Gemini AI官方SDK
- **node-fetch** (^3.3.2) - Node.js的fetch API实现，用于HTTP请求
- **axios** (^1.5.0) - 基于Promise的HTTP客户端，支持拦截器

#### 文件和数据处理
- **multer** (^1.4.5-lts.1) - Express文件上传处理中间件
- **joi** (^17.9.2) - 强大的数据验证库，支持复杂的验证规则
- **fs-extra** (^11.1.1) - 扩展的文件系统操作库，基于原生fs模块
- **crypto** (^1.0.1) - Node.js加密模块，提供加密和哈希功能

#### 日志和监控
- **winston** (^3.10.0) - 多传输异步日志库，支持多种日志格式和输出
- **morgan** (^1.10.0) - HTTP请求日志中间件，记录访问日志

#### 性能优化
- **compression** (^1.7.4) - Express压缩中间件，启用gzip压缩

#### 环境配置
- **dotenv** (^16.3.1) - 环境变量加载库，从.env文件加载配置

#### 开发和测试工具
- **nodemon** (^3.0.1) - 开发时自动重启Node.js应用的工具
- **jest** (^29.6.2) - JavaScript测试框架，支持单元测试和集成测试
- **supertest** (^6.3.3) - HTTP断言库，用于测试Express应用
- **eslint** (^8.45.0) - JavaScript代码检查工具
- **eslint-config-node** (^4.1.0) - Node.js的ESLint配置
- **@types/jest** (^29.5.3) - Jest的TypeScript类型定义

## 快速开始

### 1. 安装依赖
```bash
npm run install:all
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 初始化配置
首次访问 http://localhost:3000 会自动跳转到初始化页面，按照引导完成以下配置：

#### 数据库配置
- **MongoDB**: 支持本地和云端MongoDB
- **MySQL**: 支持本地和远程MySQL服务器

#### AI服务配置
- **OpenAI**: 配置API Key和Base URL
- **Google Gemini**: 配置Gemini API Key
- **自定义API**: 支持任何OpenAI格式的API

#### 管理员账户
- 设置管理员用户名、邮箱和密码

### 4. 访问应用
- **前端**: http://localhost:3000
- **后端API**: http://localhost:5000
- **管理界面**: http://localhost:3000/admin
- **初始化页面**: http://localhost:3000/init（仅首次访问）

## 项目结构

```
ai-chat-website/
├── client/                 # React前端
│   ├── public/
│   ├── src/
│   │   ├── components/     # 组件
│   │   ├── pages/         # 页面
│   │   ├── hooks/         # 自定义钩子
│   │   ├── store/         # 状态管理
│   │   ├── utils/         # 工具函数
│   │   └── styles/        # 样式文件
│   └── package.json
├── server/                # Node.js后端
│   ├── controllers/       # 控制器
│   ├── models/           # 数据模型
│   ├── routes/           # 路由
│   ├── middleware/       # 中间件
│   ├── services/         # 服务层
│   ├── utils/            # 工具函数
│   └── index.js          # 入口文件
└── README.md
```

## API文档

### 初始化接口
- GET `/api/admin/init-status` - 检查系统初始化状态
- POST `/api/admin/test-db` - 测试数据库连接
- POST `/api/admin/initialize` - 完成系统初始化

### 认证接口
- POST `/api/auth/register` - 用户注册
- POST `/api/auth/login` - 用户登录
- GET `/api/auth/verify` - 验证令牌
- GET `/api/auth/profile` - 获取用户信息
- PUT `/api/auth/profile` - 更新用户信息
- PUT `/api/auth/change-password` - 修改密码

### 聊天接口
- GET `/api/chat` - 获取聊天记录列表
- POST `/api/chat` - 创建新对话
- GET `/api/chat/:id` - 获取特定聊天记录
- PUT `/api/chat/:id` - 更新聊天信息
- DELETE `/api/chat/:id` - 删除聊天记录

### AI接口
- POST `/api/ai/chat` - 发送消息到AI
- GET `/api/ai/models` - 获取可用模型列表
- GET `/api/ai/status/:provider` - 获取AI提供商状态
- POST `/api/ai/test/:provider` - 测试AI提供商连接

### 管理接口
- GET `/api/admin/overview` - 获取系统概览
- GET `/api/admin/users` - 获取用户列表
- PUT `/api/admin/users/:id` - 更新用户信息
- DELETE `/api/admin/users/:id` - 删除用户
- GET `/api/admin/chats` - 获取所有聊天记录
- DELETE `/api/admin/chats/:id` - 删除聊天记录
- GET `/api/admin/settings` - 获取系统设置
- PUT `/api/admin/settings` - 更新系统设置
- POST `/api/admin/maintenance` - 设置维护模式
- GET `/api/admin/logs` - 获取系统日志

## 环境变量配置

### 前端环境变量 (client/.env)
```env
# API服务器地址
REACT_APP_API_URL=http://localhost:5000/api

# Socket.IO服务器地址
REACT_APP_SERVER_URL=http://localhost:5000

# 应用环境
NODE_ENV=development
```

### 后端环境变量 (server/.env)
```env
# 服务器端口
PORT=5000

# JWT密钥
JWT_SECRET=your-super-secret-jwt-key

# 数据库连接（初始化后自动配置）
MONGODB_URI=mongodb://localhost:27017/ai-chat

# AI服务配置（初始化后自动配置）
OPENAI_API_KEY=your-openai-api-key
OPENAI_BASE_URL=https://api.openai.com/v1
GEMINI_API_KEY=your-gemini-api-key
```

## 部署

### 生产环境构建
```bash
npm run build
```

### 启动生产服务器
```bash
npm start
```

## 故障排除

### 常见问题

1. **前端无法连接后端**
   - 检查后端服务器是否正常启动
   - 确认CORS配置正确
   - 验证API地址配置

2. **数据库连接失败**
   - 确认数据库服务正在运行
   - 检查连接字符串格式
   - 验证用户名密码正确性

3. **AI服务无响应**
   - 检查API密钥是否有效
   - 确认网络连接正常
   - 验证Base URL配置

### 日志查看
- 前端日志：浏览器开发者工具控制台
- 后端日志：终端输出或日志文件
- 数据库日志：对应数据库的日志系统

## 许可证

MIT License