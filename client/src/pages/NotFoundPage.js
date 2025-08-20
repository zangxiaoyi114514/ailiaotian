import React from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Home,
  ArrowBack,
  SearchOff,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  
  // 动画变体
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
        staggerChildren: 0.2,
      },
    },
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };
  
  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      rotate: [-5, 5, -5],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };
  
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          py: 4,
        }}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ width: '100%' }}
        >
          {/* 404图标 */}
          <motion.div variants={itemVariants}>
            <motion.div variants={floatingVariants} animate="animate">
              <SearchOff
                sx={{
                  fontSize: isMobile ? 120 : 180,
                  color: theme.palette.primary.main,
                  mb: 2,
                  opacity: 0.8,
                }}
              />
            </motion.div>
          </motion.div>
          
          {/* 404标题 */}
          <motion.div variants={itemVariants}>
            <Typography
              variant={isMobile ? 'h2' : 'h1'}
              component="h1"
              sx={{
                fontWeight: 700,
                mb: 2,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              404
            </Typography>
          </motion.div>
          
          {/* 错误描述 */}
          <motion.div variants={itemVariants}>
            <Typography
              variant={isMobile ? 'h5' : 'h4'}
              component="h2"
              sx={{
                fontWeight: 600,
                mb: 2,
                color: theme.palette.text.primary,
              }}
            >
              页面未找到
            </Typography>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Typography
              variant="body1"
              sx={
                {
                  mb: 4,
                  color: theme.palette.text.secondary,
                  maxWidth: 500,
                  mx: 'auto',
                  lineHeight: 1.6,
                }
              }
            >
              抱歉，您访问的页面不存在或已被移动。请检查URL是否正确，或返回首页继续浏览。
            </Typography>
          </motion.div>
          
          {/* 操作按钮 */}
          <motion.div variants={itemVariants}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: 2,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Button
                variant="contained"
                size="large"
                startIcon={<Home />}
                onClick={() => navigate('/')}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  boxShadow: theme.shadows[4],
                  '&:hover': {
                    boxShadow: theme.shadows[8],
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                返回首页
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                startIcon={<ArrowBack />}
                onClick={() => navigate(-1)}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                返回上页
              </Button>
            </Box>
          </motion.div>
          
          {/* 装饰元素 */}
          <motion.div
            variants={itemVariants}
            style={{
              position: 'absolute',
              top: '20%',
              left: '10%',
              opacity: 0.1,
              zIndex: -1,
            }}
          >
            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                }}
              />
            </motion.div>
          </motion.div>
          
          <motion.div
            variants={itemVariants}
            style={{
              position: 'absolute',
              bottom: '20%',
              right: '10%',
              opacity: 0.1,
              zIndex: -1,
            }}
          >
            <motion.div
              animate={{
                rotate: -360,
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
                }}
              />
            </motion.div>
          </motion.div>
          
          {/* 粒子效果 */}
          {[...Array(6)].map((_, index) => (
            <motion.div
              key={index}
              style={{
                position: 'absolute',
                width: 4,
                height: 4,
                borderRadius: '50%',
                backgroundColor: theme.palette.primary.main,
                opacity: 0.3,
                left: `${20 + index * 15}%`,
                top: `${30 + (index % 2) * 40}%`,
              }}
              animate={{
                y: [-20, 20, -20],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 3 + index * 0.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: index * 0.2,
              }}
            />
          ))}
        </motion.div>
      </Box>
    </Container>
  );
};

export default NotFoundPage;