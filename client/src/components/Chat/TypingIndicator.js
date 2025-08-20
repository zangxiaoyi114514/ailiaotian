import React from 'react';
import {
  Box,
  Paper,
  Avatar,
  useTheme,
} from '@mui/material';
import {
  SmartToy,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const TypingIndicator = ({ aiProvider = 'openai' }) => {
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
  
  // 打字动画变体
  const dotVariants = {
    initial: {
      y: 0,
    },
    animate: {
      y: [-4, 0, -4],
      transition: {
        duration: 1.4,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };
  
  // 容器动画变体
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
        
        {/* 打字指示器气泡 */}
        <Paper
          elevation={1}
          sx={{
            p: 2,
            backgroundColor: theme.palette.background.paper,
            borderRadius: 2,
            borderTopLeftRadius: 0,
            minWidth: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5,
          }}
        >
          {/* 三个跳动的点 */}
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              variants={dotVariants}
              initial="initial"
              animate="animate"
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: theme.palette.text.secondary,
              }}
              transition={{
                delay: index * 0.2,
              }}
            />
          ))}
        </Paper>
      </Box>
    </motion.div>
  );
};

export default TypingIndicator;