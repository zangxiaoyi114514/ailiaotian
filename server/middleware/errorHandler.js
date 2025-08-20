const errorHandler = (err, req, res, next) => {
  console.error('错误详情:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Mongoose 验证错误
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      message: '数据验证失败',
      errors
    });
  }

  // Mongoose 重复键错误
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    return res.status(400).json({
      message: `${field} '${value}' 已存在`
    });
  }

  // Mongoose CastError
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: '无效的ID格式'
    });
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: '无效的令牌'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: '令牌已过期'
    });
  }

  // 文件上传错误
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      message: '文件大小超出限制'
    });
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      message: '文件数量超出限制'
    });
  }

  // 速率限制错误
  if (err.status === 429) {
    return res.status(429).json({
      message: '请求过于频繁，请稍后再试'
    });
  }

  // AI API 错误
  if (err.response && err.response.data) {
    const { status, data } = err.response;
    return res.status(status || 500).json({
      message: 'AI服务错误',
      error: data.error || data.message || '未知错误'
    });
  }

  // 自定义应用错误
  if (err.isOperational) {
    return res.status(err.statusCode || 500).json({
      message: err.message
    });
  }

  // 默认服务器错误
  res.status(500).json({
    message: process.env.NODE_ENV === 'production' 
      ? '服务器内部错误' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

// 自定义错误类
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 异步错误捕获包装器
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 错误处理
const notFound = (req, res, next) => {
  const error = new AppError(`接口 ${req.originalUrl} 不存在`, 404);
  next(error);
};

module.exports = {
  errorHandler,
  AppError,
  catchAsync,
  notFound
};

// 默认导出错误处理中间件
module.exports = errorHandler;
module.exports.AppError = AppError;
module.exports.catchAsync = catchAsync;
module.exports.notFound = notFound;