import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  ContentCopy,
  Check,
} from '@mui/icons-material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  oneDark,
  oneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
    const codeIndex = `${language}-${codeString.slice(0, 20)}`;
    
    if (!inline && match) {
      return (
        <Box
          sx={{
            position: 'relative',
            my: 2,
            borderRadius: 1,
            overflow: 'hidden',
            backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
          }}
        >
          {/* 代码块头部 */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1,
              backgroundColor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#e0e0e0',
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
              {language || 'code'}
            </Typography>
            
            <Tooltip title={copiedCode === codeIndex ? '已复制!' : '复制代码'}>
              <IconButton
                size="small"
                onClick={() => copyToClipboard(codeString, codeIndex)}
                sx={{
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    color: theme.palette.text.primary,
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
          </Box>
          
          {/* 代码内容 */}
          <SyntaxHighlighter
            style={theme.palette.mode === 'dark' ? oneDark : oneLight}
            language={language}
            PreTag="div"
            customStyle={{
              margin: 0,
              padding: '16px',
              backgroundColor: 'transparent',
              fontSize: '14px',
              lineHeight: '1.5',
            }}
            codeTagProps={{
              style: {
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              },
            }}
            {...props}
          >
            {codeString}
          </SyntaxHighlighter>
        </Box>
      );
    }
    
    // 内联代码
    return (
      <code
        className={className}
        style={{
          backgroundColor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#f5f5f5',
          padding: '2px 6px',
          borderRadius: '4px',
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          fontSize: '0.9em',
        }}
        {...props}
      >
        {children}
      </code>
    );
  };
  
  // 自定义链接组件
  const LinkComponent = ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: theme.palette.primary.main,
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => {
        e.target.style.textDecoration = 'underline';
      }}
      onMouseLeave={(e) => {
        e.target.style.textDecoration = 'none';
      }}
    >
      {children}
    </a>
  );
  
  // 自定义表格组件
  const TableComponent = ({ children }) => (
    <Box
      sx={{
        overflowX: 'auto',
        my: 2,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
        }}
      >
        {children}
      </table>
    </Box>
  );
  
  // 自定义表格头组件
  const TableHeadComponent = ({ children }) => (
    <thead
      style={{
        backgroundColor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#f5f5f5',
      }}
    >
      {children}
    </thead>
  );
  
  // 自定义表格单元格组件
  const TableCellComponent = ({ children, isHeader }) => (
    <td
      style={{
        padding: '12px',
        borderBottom: `1px solid ${theme.palette.divider}`,
        textAlign: 'left',
        fontWeight: isHeader ? 'bold' : 'normal',
      }}
    >
      {children}
    </td>
  );
  
  // 自定义引用组件
  const BlockquoteComponent = ({ children }) => (
    <Box
      component="blockquote"
      sx={{
        borderLeft: `4px solid ${theme.palette.primary.main}`,
        pl: 2,
        py: 1,
        my: 2,
        backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9f9f9',
        fontStyle: 'italic',
        margin: 0,
      }}
    >
      {children}
    </Box>
  );
  
  // 自定义列表组件
  const ListComponent = ({ ordered, children }) => {
    const Component = ordered ? 'ol' : 'ul';
    return (
      <Component
        style={{
          paddingLeft: '24px',
          margin: '16px 0',
        }}
      >
        {children}
      </Component>
    );
  };
  
  // 自定义列表项组件
  const ListItemComponent = ({ children }) => (
    <li
      style={{
        marginBottom: '8px',
        lineHeight: '1.6',
      }}
    >
      {children}
    </li>
  );
  
  // 如果是用户消息，直接显示文本
  if (role === 'user') {
    return (
      <Typography
        variant="body1"
        sx={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          lineHeight: 1.6,
        }}
      >
        {content}
      </Typography>
    );
  }
  
  // AI消息使用Markdown渲染
  return (
    <Box
      sx={{
        '& p': {
          margin: '8px 0',
          lineHeight: 1.6,
          '&:first-of-type': { marginTop: 0 },
          '&:last-of-type': { marginBottom: 0 },
        },
        '& h1, & h2, & h3, & h4, & h5, & h6': {
          margin: '16px 0 8px 0',
          fontWeight: 600,
          '&:first-of-type': { marginTop: 0 },
        },
        '& h1': { fontSize: '1.5rem' },
        '& h2': { fontSize: '1.3rem' },
        '& h3': { fontSize: '1.1rem' },
        '& h4, & h5, & h6': { fontSize: '1rem' },
        '& ul, & ol': {
          margin: '8px 0',
          paddingLeft: '24px',
        },
        '& li': {
          marginBottom: '4px',
        },
        '& hr': {
          border: 'none',
          borderTop: `1px solid ${theme.palette.divider}`,
          margin: '16px 0',
        },
        '& strong': {
          fontWeight: 600,
        },
        '& em': {
          fontStyle: 'italic',
        },
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: CodeBlock,
          a: LinkComponent,
          table: TableComponent,
          thead: TableHeadComponent,
          td: ({ children, ...props }) => (
            <TableCellComponent {...props}>{children}</TableCellComponent>
          ),
          th: ({ children, ...props }) => (
            <TableCellComponent isHeader {...props}>{children}</TableCellComponent>
          ),
          blockquote: BlockquoteComponent,
          ul: ({ children }) => <ListComponent ordered={false}>{children}</ListComponent>,
          ol: ({ children }) => <ListComponent ordered={true}>{children}</ListComponent>,
          li: ListItemComponent,
        }}
      >
        {content}
      </ReactMarkdown>
      
      {/* 流式输入光标 */}
      {isStreaming && (
        <Box
          component="span"
          sx={{
            display: 'inline-block',
            width: '2px',
            height: '1.2em',
            backgroundColor: theme.palette.primary.main,
            animation: 'blink 1s infinite',
            '@keyframes blink': {
              '0%, 50%': { opacity: 1 },
              '51%, 100%': { opacity: 0 },
            },
          }}
        />
      )}
    </Box>
  );
};

export default MessageContent;