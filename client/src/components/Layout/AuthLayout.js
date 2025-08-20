import React from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Brightness4,
  Brightness7,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSettings } from '../../contexts/SettingsContext';

const AuthLayout = ({ children, title, subtitle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { toggleTheme, isDarkMode, siteName } = useSettings();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDarkMode
          ? `linear-gradient(135deg, ${theme.palette.grey[900]} 0%, ${theme.palette.grey[800]} 100%)`
          : `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 背景装饰 */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          background: `
            radial-gradient(circle at 20% 80%, ${theme.palette.primary.main} 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, ${theme.palette.secondary.main} 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, ${theme.palette.primary.light} 0%, transparent 50%)
          `,
        }}
      />

      {/* 主题切换按钮 */}
      <IconButton
        onClick={toggleTheme}
        sx={
          {
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 1,
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          }
        }
      >
        {isDarkMode ? <Brightness7 /> : <Brightness4 />}
      </IconButton>

      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={24}
            sx={{
              p: { xs: 3, sm: 4 },
              borderRadius: 3,
              backgroundColor: theme.palette.background.paper,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${theme.palette.divider}`,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* 顶部装饰条 */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              }}
            />

            {/* 头部 */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              {/* Logo/站点名称 */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <Typography
                  variant={isMobile ? 'h4' : 'h3'}
                  component="h1"
                  sx={{
                    fontWeight: 700,
                    mb: 1,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {siteName}
                </Typography>
              </motion.div>

              {/* 页面标题 */}
              {title && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Typography
                    variant="h5"
                    component="h2"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      mb: 1,
                    }}
                  >
                    {title}
                  </Typography>
                </motion.div>
              )}

              {/* 副标题 */}
              {subtitle && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      color: theme.palette.text.secondary,
                      maxWidth: 400,
                      mx: 'auto',
                    }}
                  >
                    {subtitle}
                  </Typography>
                </motion.div>
              )}
            </Box>

            {/* 表单内容 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {children}
            </motion.div>

            {/* 底部装饰 */}
            <Box
              sx={{
                position: 'absolute',
                bottom: -50,
                right: -50,
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: `linear-gradient(45deg, ${theme.palette.primary.main}20, ${theme.palette.secondary.main}20)`,
                opacity: 0.5,
              }}
            />
            
            <Box
              sx={{
                position: 'absolute',
                top: -30,
                left: -30,
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: `linear-gradient(45deg, ${theme.palette.secondary.main}20, ${theme.palette.primary.main}20)`,
                opacity: 0.5,
              }}
            />
          </Paper>
        </motion.div>

        {/* 底部信息 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Typography
            variant="body2"
            sx={{
              textAlign: 'center',
              mt: 3,
              color: theme.palette.common.white,
              opacity: 0.8,
            }}
          >
            © 2024 {siteName}. 智能对话，无限可能。
          </Typography>
        </motion.div>
      </Container>

      {/* 浮动粒子效果 */}
      {[...Array(6)].map((_, index) => (
        <motion.div
          key={index}
          initial={{
            opacity: 0,
            scale: 0,
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            opacity: [0, 0.6, 0],
            scale: [0, 1, 0],
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          transition={{
            duration: 8 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
          style={{
            position: 'absolute',
            width: 4 + Math.random() * 4,
            height: 4 + Math.random() * 4,
            borderRadius: '50%',
            background: theme.palette.primary.main,
            pointerEvents: 'none',
          }}
        />
      ))}
    </Box>
  );
};

export default AuthLayout;