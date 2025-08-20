import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
  }

  // 连接到Socket.IO服务器
  connect(token, serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000') {
    if (this.socket && this.isConnected) {
      console.log('Socket already connected');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.socket = io(serverUrl, {
          auth: {
            token: token,
          },
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
          autoConnect: true,
          forceNew: false
        });

        // 连接成功事件
        this.socket.on('connect', () => {
          console.log('Socket connected:', this.socket.id);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve(this.socket);
        });

        // 连接错误事件
        this.socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          this.isConnected = false;
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(new Error(`Failed to connect after ${this.maxReconnectAttempts} attempts`));
          }
        });

        // 断开连接事件
        this.socket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          this.isConnected = false;
          
          // 如果是服务器主动断开，尝试重连
          if (reason === 'io server disconnect') {
            this.socket.connect();
          }
        });

        // 重连事件
        this.socket.on('reconnect', (attemptNumber) => {
          console.log('Socket reconnected after', attemptNumber, 'attempts');
          this.isConnected = true;
          this.reconnectAttempts = 0;
        });

        // 重连尝试事件
        this.socket.on('reconnect_attempt', (attemptNumber) => {
          console.log('Socket reconnection attempt:', attemptNumber);
          this.reconnectAttempts = attemptNumber;
        });

        // 重连失败事件
        this.socket.on('reconnect_failed', () => {
          console.error('Socket reconnection failed');
          this.isConnected = false;
        });

        // 认证错误事件
        this.socket.on('auth_error', (error) => {
          console.error('Socket authentication error:', error);
          this.isConnected = false;
          this.disconnect();
          reject(new Error(`Authentication failed: ${error.message || error}`));
        });

        // 服务器错误事件
        this.socket.on('error', (error) => {
          console.error('Socket server error:', error);
        });

      } catch (error) {
        console.error('Socket connection setup error:', error);
        reject(error);
      }
    });
  }

  // 断开连接
  disconnect() {
    if (this.socket) {
      console.log('Disconnecting socket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  // 发送消息
  emit(event, data, callback) {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected. Cannot emit event:', event);
      return false;
    }

    try {
      if (callback && typeof callback === 'function') {
        this.socket.emit(event, data, callback);
      } else {
        this.socket.emit(event, data);
      }
      return true;
    } catch (error) {
      console.error('Error emitting socket event:', error);
      return false;
    }
  }

  // 监听事件
  on(event, callback) {
    if (!this.socket) {
      console.warn('Socket not initialized. Cannot listen to event:', event);
      return;
    }

    // 存储监听器引用以便后续移除
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    this.socket.on(event, callback);
  }

  // 移除事件监听器
  off(event, callback) {
    if (!this.socket) {
      return;
    }

    if (callback) {
      this.socket.off(event, callback);
      
      // 从监听器集合中移除
      if (this.listeners.has(event)) {
        this.listeners.get(event).delete(callback);
        if (this.listeners.get(event).size === 0) {
          this.listeners.delete(event);
        }
      }
    } else {
      // 移除所有该事件的监听器
      this.socket.off(event);
      this.listeners.delete(event);
    }
  }

  // 一次性事件监听
  once(event, callback) {
    if (!this.socket) {
      console.warn('Socket not initialized. Cannot listen to event:', event);
      return;
    }

    this.socket.once(event, callback);
  }

  // 获取连接状态
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id || null,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  // 检查是否已连接
  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }

  // 获取Socket实例
  getSocket() {
    return this.socket;
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

  // 聊天相关方法
  
  // 加入聊天房间
  joinChatRoom(chatId, userId) {
    return this.emit('join_chat', { chatId, userId });
  }

  // 离开聊天房间
  leaveChatRoom(chatId, userId) {
    return this.emit('leave_chat', { chatId, userId });
  }

  // 发送聊天消息
  sendMessage(messageData) {
    return this.emit('send_message', messageData);
  }

  // 监听新消息
  onNewMessage(callback) {
    this.on('new_message', callback);
  }

  // 监听消息更新
  onMessageUpdate(callback) {
    this.on('message_updated', callback);
  }

  // 监听消息删除
  onMessageDelete(callback) {
    this.on('message_deleted', callback);
  }

  // 监听用户输入状态
  onUserTyping(callback) {
    this.on('user_typing', callback);
  }

  // 发送输入状态
  sendTypingStatus(chatId, userId, isTyping) {
    return this.emit('typing_status', { chatId, userId, isTyping });
  }

  // 监听用户在线状态
  onUserOnlineStatus(callback) {
    this.on('user_online_status', callback);
  }

  // 监听聊天室用户列表更新
  onChatRoomUsers(callback) {
    this.on('chat_room_users', callback);
  }

  // 请求聊天历史
  requestChatHistory(chatId, page = 1, limit = 50) {
    return new Promise((resolve, reject) => {
      this.emit('get_chat_history', { chatId, page, limit }, (response) => {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error || 'Failed to get chat history'));
        }
      });
    });
  }

  // 监听错误事件
  onError(callback) {
    this.on('error', callback);
  }

  // 监听服务器通知
  onNotification(callback) {
    this.on('notification', callback);
  }

  // 清理所有监听器
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
    this.listeners.clear();
  }
}

// 创建单例实例
const socketService = new SocketService();

export default socketService;

// 导出类以便测试
export { SocketService };

// 导出常用方法的快捷方式
export const {
  connect,
  disconnect,
  emit,
  on,
  off,
  once,
  isSocketConnected,
  getConnectionStatus,
  joinChatRoom,
  leaveChatRoom,
  sendMessage,
  onNewMessage,
  onMessageUpdate,
  onMessageDelete,
  onUserTyping,
  sendTypingStatus,
  onUserOnlineStatus,
  requestChatHistory
} = socketService;