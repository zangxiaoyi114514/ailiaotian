import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { api } from './services/api';

// Contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ChatProvider } from './contexts/ChatContext';

// Components
import MainLayout from './components/Layout/MainLayout';
import AuthLayout from './components/Layout/AuthLayout';

// Pages
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';
import InitializePage from './pages/InitializePage';

// Hooks
import { useSettings } from './contexts/SettingsContext';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Public Route Component (redirect to chat if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return !user ? children : <Navigate to="/" replace />;
};

// Initialization Check Component
const InitializationCheck = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkInitializationStatus();
  }, []);

  const checkInitializationStatus = async () => {
    try {
      const response = await api.get('/admin/init-status');
      setIsInitialized(response.data.initialized);
    } catch (error) {
      console.log('检查初始化状态失败:', error);
      // 如果API调用失败，假设需要初始化
      setIsInitialized(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isInitialized) {
    return <InitializePage />;
  }

  return children;
};

// Theme Component
const AppWithTheme = () => {
  const { settings } = useSettings();
  
  const theme = createTheme({
    palette: {
      mode: settings?.theme || 'light',
      primary: {
        main: settings?.primaryColor || '#1976d2',
        light: '#42a5f5',
        dark: '#1565c0',
      },
      secondary: {
        main: settings?.secondaryColor || '#dc004e',
        light: '#ff5983',
        dark: '#9a0036',
      },
      background: {
        default: settings?.theme === 'dark' ? '#121212' : '#f5f5f5',
        paper: settings?.theme === 'dark' ? '#1e1e1e' : '#ffffff',
      },
      text: {
        primary: settings?.theme === 'dark' ? '#ffffff' : '#333333',
        secondary: settings?.theme === 'dark' ? '#b3b3b3' : '#666666',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 600,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 500,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 500,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 500,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.5,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.43,
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            fontWeight: 500,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider 
        maxSnack={3}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        autoHideDuration={3000}
      >
        <Router>
          <Routes>
            {/* 初始化路由 */}
            <Route path="/initialize" element={<InitializePage />} />
            
            {/* 认证路由 */}
            <Route path="/login" element={
              <PublicRoute>
                <AuthLayout>
                  <LoginPage />
                </AuthLayout>
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <AuthLayout>
                  <RegisterPage />
                </AuthLayout>
              </PublicRoute>
            } />
            
            {/* 受保护的路由 */}
            <Route path="/" element={
              <InitializationCheck>
                <ProtectedRoute>
                  <MainLayout>
                    <ChatPage />
                  </MainLayout>
                </ProtectedRoute>
              </InitializationCheck>
            } />
            
            <Route path="/profile" element={
              <InitializationCheck>
                <ProtectedRoute>
                  <MainLayout>
                    <ProfilePage />
                  </MainLayout>
                </ProtectedRoute>
              </InitializationCheck>
            } />
            
            <Route path="/settings" element={
              <InitializationCheck>
                <ProtectedRoute>
                  <MainLayout>
                    <SettingsPage />
                  </MainLayout>
                </ProtectedRoute>
              </InitializationCheck>
            } />
            
            {/* 管理员路由 */}
            <Route path="/admin" element={
              <InitializationCheck>
                <AdminRoute>
                  <MainLayout>
                    <AdminPage />
                  </MainLayout>
                </AdminRoute>
              </InitializationCheck>
            } />
            
            {/* 404 页面 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </SnackbarProvider>
    </ThemeProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ChatProvider>
          <AppWithTheme />
        </ChatProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;