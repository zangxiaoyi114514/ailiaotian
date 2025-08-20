import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.messageQueue = [];
  }

  // 连接到服务器
  connect(token) {
    if (this.socket && this.isConnected) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
        
        this.socket = io(serverUrl, {
          auth: {
            token: token,
          },
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
        });

        // 连接成功
        this.socket.on('connect', () => {
          console.log('Socket连接成功');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // 发送队列中的消息
          this.flushMessageQueue();
          
          resolve();
        });

        // 连接失败
        this.socket.on('connect_error', (error) => {
          console.error('Socket连接失败:', error.message);
          this.isConnected = false;
          
          if (this.reconnectAttempts === 0) {
            reject(new Error(`连接失败: ${error.message}`));
          }
        });

        // 断开连接
        this.socket.on('disconnect', (reason) => {
          console.log('Socket连接断开:', reason);
          this.isConnected = false;
          
          // 触发断开连接事件
          this.emit('disconnected', reason);
        });

        // 重连尝试
        this.socket.on('reconnect_attempt', (attemptNumber) => {
          console.log(`Socket重连尝试 ${attemptNumber}/${this.maxReconnectAttempts}`);
          this.reconnectAttempts = attemptNumber;
        });

        // 重连成功
        this.socket.on('reconnect', (attemptNumber) => {
          console.log(`Socket重连成功，尝试次数: ${attemptNumber}`);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // 发送队列中的消息
          this.flushMessageQueue();
          
          // 触发重连成功事件
          this.emit('reconnected');
        });

        // 重连失败
        this.socket.on('reconnect_failed', () => {
          console.error('Socket重连失败，已达到最大重连次数');
          this.isConnected = false;
          
          // 触发重连失败事件
          this.emit('reconnect_failed');
        });

        // 认证错误
        this.socket.on('auth_error', (error) => {
          console.error('Socket认证失败:', error.message);
          this.disconnect();
          
          // 触发认证错误事件
          this.emit('auth_error', error);
        });

        // 服务器错误
        this.socket.on('error', (error) => {
          console.error('Socket服务器错误:', error);
          
          // 触发错误事件
          this.emit('error', error);
        });

        // 设置默认事件监听器
        this.setupDefaultListeners();
        
      } catch (error) {
        console.error('创建Socket连接失败:', error);
        reject(error);
      }
    });
  }

  // 设置默认事件监听器
  setupDefaultListeners() {
    if (!this.socket) return;

    // 新消息
    this.socket.on('new_message', (data) => {
      this.emit('new_message', data);
    });

    // 消息更新
    this.socket.on('message_updated', (data) => {
      this.emit('message_updated', data);
    });

    // 打字指示器
    this.socket.on('typing', (data) => {
      this.emit('typing', data);
    });

    this.socket.on('stop_typing', (data) => {
      this.emit('stop_typing', data);
    });

    // 流式响应
    this.socket.on('stream_start', (data) => {
      this.emit('stream_start', data);
    });

    this.socket.on('stream_data', (data) => {
      this.emit('stream_data', data);
    });

    this.socket.on('stream_end', (data) => {
      this.emit('stream_end', data);
    });

    this.socket.on('stream_error', (data) => {
      this.emit('stream_error', data);
    });

    // 聊天事件
    this.socket.on('chat_created', (data) => {
      this.emit('chat_created', data);
    });

    this.socket.on('chat_updated', (data) => {
      this.emit('chat_updated', data);
    });

    this.socket.on('chat_deleted', (data) => {
      this.emit('chat_deleted', data);
    });

    // 用户状态
    this.socket.on('user_online', (data) => {
      this.emit('user_online', data);
    });

    this.socket.on('user_offline', (data) => {
      this.emit('user_offline', data);
    });

    // 系统通知
    this.socket.on('system_notification', (data) => {
      this.emit('system_notification', data);
    });

    // 维护模式
    this.socket.on('maintenance_mode', (data) => {
      this.emit('maintenance_mode', data);
    });
  }

  // 断开连接
  disconnect() {
    if (this.socket) {
      console.log('断开Socket连接');
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.listeners.clear();
    this.messageQueue = [];
  }

  // 发送消息
  emit(event, data) {
    if (this.isConnected && this.socket) {
      this.socket.emit(event, data);
    } else {
      // 如果未连接，将消息加入队列
      this.messageQueue.push({ event, data });
    }
  }

  // 监听事件
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event).push(callback);
    
    // 如果socket已连接，直接添加监听器
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // 移除事件监听器
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      
      if (callbacks.length === 0) {
        this.listeners.delete(event);
      }
    }
    
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // 发送队列中的消息
  flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const { event, data } = this.messageQueue.shift();
      this.socket.emit(event, data);
    }
  }

  // 聊天相关方法
  joinChat(chatId) {
    this.emit('join_chat', { chatId });
  }

  leaveChat(chatId) {
    this.emit('leave_chat', { chatId });
  }

  sendMessage(messageData) {
    this.emit('send_message', messageData);
  }

  sendStreamMessage(messageData) {
    this.emit('send_stream_message', messageData);
  }

  startTyping(chatId) {
    this.emit('start_typing', { chatId });
  }

  stopTyping(chatId) {
    this.emit('stop_typing', { chatId });
  }

  // 获取连接状态
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
    };
  }

  // 检查是否已连接
  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }

  // 手动重连
  reconnect(token) {
    this.disconnect();
    return this.connect(token);
  }

  // 更新认证token
  updateAuth(token) {
    if (this.socket) {
      this.socket.auth = { token };
    }
  }

  // 获取Socket ID
  getSocketId() {
    return this.socket?.id || null;
  }

  // 设置重连配置
  setReconnectConfig(maxAttempts, delay) {
    this.maxReconnectAttempts = maxAttempts;
    this.reconnectDelay = delay;
    
    if (this.socket) {
      this.socket.io.opts.reconnectionAttempts = maxAttempts;
      this.socket.io.opts.reconnectionDelay = delay;
    }
  }
}

// 创建单例实例
const socketService = new SocketService();

// 导出实例和类
export default socketService;
export { SocketService };