const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const Settings = require('../models/Settings');
const { AppError } = require('../middleware/errorHandler');

class AIService {
  constructor() {
    this.openaiClient = null;
    this.geminiClient = null;
    this.settings = null;
  }

  // 初始化AI客户端
  async initialize() {
    this.settings = await Settings.getSettings();
    
    // 初始化OpenAI客户端
    if (this.settings.aiProviders.openai.enabled && this.settings.aiProviders.openai.apiKey) {
      this.openaiClient = new OpenAI({
        apiKey: this.settings.aiProviders.openai.apiKey,
        baseURL: this.settings.aiProviders.openai.baseUrl
      });
    }
    
    // 初始化Gemini客户端
    if (this.settings.aiProviders.gemini.enabled && this.settings.aiProviders.gemini.apiKey) {
      this.geminiClient = new GoogleGenerativeAI(this.settings.aiProviders.gemini.apiKey);
    }
  }

  // 发送消息到AI提供商
  async sendMessage(provider, messages, options = {}) {
    await this.initialize();
    
    const providerConfig = this.settings.aiProviders[provider];
    if (!providerConfig || !providerConfig.enabled) {
      throw new AppError(`AI提供商 ${provider} 未启用`, 400);
    }

    switch (provider) {
      case 'openai':
        return await this.sendToOpenAI(messages, options);
      case 'gemini':
        return await this.sendToGemini(messages, options);
      case 'custom':
        return await this.sendToCustom(messages, options);
      default:
        throw new AppError(`不支持的AI提供商: ${provider}`, 400);
    }
  }

  // OpenAI接口
  async sendToOpenAI(messages, options = {}) {
    if (!this.openaiClient) {
      throw new AppError('OpenAI客户端未初始化', 500);
    }

    try {
      const response = await this.openaiClient.chat.completions.create({
        model: options.model || this.settings.aiProviders.openai.defaultModel,
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2048,
        top_p: options.topP || 1,
        frequency_penalty: options.frequencyPenalty || 0,
        presence_penalty: options.presencePenalty || 0,
        stream: options.stream || false
      });

      return {
        content: response.choices[0].message.content,
        model: response.model,
        usage: response.usage,
        provider: 'openai'
      };
    } catch (error) {
      console.error('OpenAI API错误:', error);
      throw new AppError(`OpenAI API错误: ${error.message}`, 500);
    }
  }

  // Gemini接口
  async sendToGemini(messages, options = {}) {
    if (!this.geminiClient) {
      throw new AppError('Gemini客户端未初始化', 500);
    }

    try {
      const model = this.geminiClient.getGenerativeModel({
        model: options.model || this.settings.aiProviders.gemini.defaultModel
      });

      // 转换消息格式
      const prompt = this.convertMessagesToGeminiFormat(messages);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        content: text,
        model: options.model || this.settings.aiProviders.gemini.defaultModel,
        usage: {
          prompt_tokens: 0, // Gemini不提供详细的token统计
          completion_tokens: 0,
          total_tokens: 0
        },
        provider: 'gemini'
      };
    } catch (error) {
      console.error('Gemini API错误:', error);
      throw new AppError(`Gemini API错误: ${error.message}`, 500);
    }
  }

  // 自定义OpenAI格式接口
  async sendToCustom(messages, options = {}) {
    const customConfig = this.settings.aiProviders.custom;
    if (!customConfig.apiKey || !customConfig.baseUrl) {
      throw new AppError('自定义API配置不完整', 500);
    }

    try {
      const response = await axios.post(
        `${customConfig.baseUrl}/chat/completions`,
        {
          model: options.model || customConfig.defaultModel,
          messages: messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2048,
          top_p: options.topP || 1,
          frequency_penalty: options.frequencyPenalty || 0,
          presence_penalty: options.presencePenalty || 0,
          stream: options.stream || false
        },
        {
          headers: {
            'Authorization': `Bearer ${customConfig.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      return {
        content: response.data.choices[0].message.content,
        model: response.data.model,
        usage: response.data.usage,
        provider: 'custom'
      };
    } catch (error) {
      console.error('自定义API错误:', error);
      if (error.response) {
        throw new AppError(`自定义API错误: ${error.response.data.error?.message || error.message}`, error.response.status);
      }
      throw new AppError(`自定义API错误: ${error.message}`, 500);
    }
  }

  // 流式响应
  async sendMessageStream(provider, messages, options = {}) {
    await this.initialize();
    
    const providerConfig = this.settings.aiProviders[provider];
    if (!providerConfig || !providerConfig.enabled) {
      throw new AppError(`AI提供商 ${provider} 未启用`, 400);
    }

    options.stream = true;
    
    switch (provider) {
      case 'openai':
        return await this.streamFromOpenAI(messages, options);
      case 'custom':
        return await this.streamFromCustom(messages, options);
      default:
        throw new AppError(`提供商 ${provider} 不支持流式响应`, 400);
    }
  }

  // OpenAI流式响应
  async streamFromOpenAI(messages, options = {}) {
    if (!this.openaiClient) {
      throw new AppError('OpenAI客户端未初始化', 500);
    }

    try {
      const stream = await this.openaiClient.chat.completions.create({
        model: options.model || this.settings.aiProviders.openai.defaultModel,
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2048,
        stream: true
      });

      return stream;
    } catch (error) {
      console.error('OpenAI流式API错误:', error);
      throw new AppError(`OpenAI流式API错误: ${error.message}`, 500);
    }
  }

  // 自定义API流式响应
  async streamFromCustom(messages, options = {}) {
    const customConfig = this.settings.aiProviders.custom;
    if (!customConfig.apiKey || !customConfig.baseUrl) {
      throw new AppError('自定义API配置不完整', 500);
    }

    try {
      const response = await axios.post(
        `${customConfig.baseUrl}/chat/completions`,
        {
          model: options.model || customConfig.defaultModel,
          messages: messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2048,
          stream: true
        },
        {
          headers: {
            'Authorization': `Bearer ${customConfig.apiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'stream',
          timeout: 60000
        }
      );

      return response.data;
    } catch (error) {
      console.error('自定义API流式错误:', error);
      throw new AppError(`自定义API流式错误: ${error.message}`, 500);
    }
  }

  // 转换消息格式为Gemini格式
  convertMessagesToGeminiFormat(messages) {
    // 将OpenAI格式的消息转换为Gemini格式
    const conversation = messages.map(msg => {
      if (msg.role === 'system') {
        return `System: ${msg.content}`;
      } else if (msg.role === 'user') {
        return `User: ${msg.content}`;
      } else if (msg.role === 'assistant') {
        return `Assistant: ${msg.content}`;
      }
      return msg.content;
    }).join('\n\n');

    return conversation + '\n\nAssistant:';
  }

  // 获取可用的模型列表
  async getAvailableModels(provider) {
    await this.initialize();
    
    const providerConfig = this.settings.aiProviders[provider];
    if (!providerConfig || !providerConfig.enabled) {
      return [];
    }

    return providerConfig.models || [];
  }

  // 检查提供商状态
  async checkProviderStatus(provider) {
    await this.initialize();
    
    const providerConfig = this.settings.aiProviders[provider];
    if (!providerConfig) {
      return { status: 'not_configured', message: '提供商未配置' };
    }
    
    if (!providerConfig.enabled) {
      return { status: 'disabled', message: '提供商已禁用' };
    }
    
    if (!providerConfig.apiKey) {
      return { status: 'no_api_key', message: 'API密钥未配置' };
    }
    
    return { status: 'ready', message: '提供商就绪' };
  }
}

// 创建单例实例
const aiService = new AIService();

module.exports = aiService;