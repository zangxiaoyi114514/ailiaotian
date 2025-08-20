import React from 'react';
import {
  Box,
  Paper,
  Avatar,
  Skeleton,
  useTheme,
} from '@mui/material';
import {
  SmartToy,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const LoadingMessage = ({ aiProvider = 'openai' }) => {
  const theme = useTheme();
  
  // 获取AI提供商颜色
  const getProviderColor = (provider) => {
    const colors = {
      openai: '#10a37f',
      gemini: '#4285f4',
      custom: theme.palette.secondary.main,
    };
    return colors[provider] || theme.palette.secondary.main;
  };
  
  // 动画变体
  const containerVariants = {
    initial: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      transition: {
        duration: 0.2,
      },
    },
  };
  
  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          alignItems: 'flex-start',
          p: 2,
        }}
      >
        {/* AI头像 */}
        <Avatar
          sx={{
            width: 32,
            height: 32,
            backgroundColor: getProviderColor(aiProvider),
          }}
        >
          <SmartToy fontSize="small" />
        </Avatar>
        
        {/* 加载消息气泡 */}
        <Paper
          elevation={1}
          sx={{
            p: 2,
            backgroundColor: theme.palette.background.paper,
            borderRadius: 2,
            borderTopLeftRadius: 0,
            flexGrow: 1,
            maxWidth: '70%',
          }}
        >
          {/* 骨架屏加载效果 */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Skeleton
              variant="text"
              width="90%"
              height={20}
              animation="wave"
              sx={{
                backgroundColor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#f0f0f0',
              }}
            />
            <Skeleton
              variant="text"
              width="75%"
              height={20}
              animation="wave"
              sx={{
                backgroundColor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#f0f0f0',
              }}
            />
            <Skeleton
              variant="text"
              width="60%"
              height={20}
              animation="wave"
              sx={{
                backgroundColor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#f0f0f0',
              }}
            />
          </Box>
        </Paper>
      </Box>
    </motion.div>
  );
};

export default LoadingMessage;