import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  ContentCopy,
  Check,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  oneDark,
  oneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useSnackbar } from 'notistack';

const MessageContent = ({ content, role, isStreaming }) => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [copiedCode, setCopiedCode] = useState(null);
  
  // 复制代码到剪贴板
  const copyToClipboard = async (code, index) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(index);
      enqueueSnackbar('代码已复制到剪贴板', { variant: 'success' });
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('复制失败:', error);
      enqueueSnackbar('复制失败', { variant: 'error' });
    }
  };
  
  // 自定义代码块组件
  const CodeBlock = ({ node, inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    const codeString = String(children).replace(/\n$/, '');
    const codeIndex = `${language}-${codeString.substring(0, 20)}`;
    
    if (!inline && match) {
      return (
        <Box
          sx={{
            position: 'relative',
            my: 2,
            borderRadius: 1,
            overflow: 'hidden',
            '& pre': {
              margin: 0,
              borderRadius: 1,
            },
          }}
        >
          {/* 复制按钮 */}
          <Tooltip title={copiedCode === codeIndex ? '已复制' : '复制代码'}>
            <IconButton
              size="small"
              onClick={() => copyToClipboard(codeString, codeIndex)}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                },
              }}
            >
              {copiedCode === codeIndex ? (
                <Check fontSize="small" />
              ) : (
                <ContentCopy fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
          
          <SyntaxHighlighter
            style={theme.palette.mode === 'dark' ? oneDark : oneLight}
            language={language}
            PreTag="div"
            customStyle={{
              fontSize: '0.875rem',
              lineHeight: 1.5,
            }}
            {...props}
          >
            {codeString}
          </SyntaxHighlighter>
        </Box>
      );
    }
    
    return (
      <code
        className={className}
        style={{
          backgroundColor: theme.palette.action.hover,
          padding: '2px 4px',
          borderRadius: 4,
          fontSize: '0.875em',
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
        }}
        {...props}
      >
        {children}
      </code>
    );
  };
  
  // Markdown组件配置
  const markdownComponents = {
    code: CodeBlock,
    // 自定义链接样式
    a: ({ node, ...props }) => (
      <a
        {...props}
        style={{
          color: theme.palette.primary.main,
          textDecoration: 'none',
        }}
        target="_blank"
        rel="noopener noreferrer"
      />
    ),
    // 自定义表格样式
    table: ({ node, ...props }) => (
      <Box
        component="table"
        sx={{
          borderCollapse: 'collapse',
          width: '100%',
          my: 2,
          '& th, & td': {
            border: `1px solid ${theme.palette.divider}`,
            padding: 1,
            textAlign: 'left',
          },
          '& th': {
            backgroundColor: theme.palette.action.hover,
            fontWeight: 600,
          },
        }}
        {...props}
      />
    ),
    // 自定义引用样式
    blockquote: ({ node, ...props }) => (
      <Box
        component="blockquote"
        sx={{
          borderLeft: `4px solid ${theme.palette.primary.main}`,
          pl: 2,
          py: 1,
          my: 2,
          backgroundColor: theme.palette.action.hover,
          fontStyle: 'italic',
          '& p': {
            margin: 0,
          },
        }}
        {...props}
      />
    ),
  };
  
  if (role === 'user') {
    // 用户消息直接显示文本
    return (
      <Box
        sx={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          lineHeight: 1.5,
        }}
      >
        {content}
      </Box>
    );
  }
  
  // AI消息使用Markdown渲染
  return (
    <Box
      sx={{
        '& p': {
          margin: 0,
          marginBottom: 1,
          '&:last-child': {
            marginBottom: 0,
          },
        },
        '& ul, & ol': {
          marginTop: 0,
          marginBottom: 1,
          paddingLeft: 2,
        },
        '& li': {
          marginBottom: 0.5,
        },
        '& h1, & h2, & h3, & h4, & h5, & h6': {
          marginTop: 1,
          marginBottom: 1,
          '&:first-of-type': {
            marginTop: 0,
          },
        },
        lineHeight: 1.6,
        wordBreak: 'break-word',
      }}
    >
      <ReactMarkdown components={markdownComponents}>
        {content + (isStreaming ? '▊' : '')}
      </ReactMarkdown>
    </Box>
  );
};

export default MessageContent;