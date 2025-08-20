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

// App Content Component (needs to be inside SettingsProvider to use theme)
const AppContent = () => {
  return (
    <InitializationCheck>
      <ChatProvider>
        <Routes>

                  {/* Public Routes */}
                  <Route
                    path="/login"
                    element={
                      <PublicRoute>
                        <AuthLayout>
                          <LoginPage />
                        </AuthLayout>
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <PublicRoute>
                        <AuthLayout>
                          <RegisterPage />
                        </AuthLayout>
                      </PublicRoute>
                    }
                  />
                  
                  {/* Protected Routes */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <MainLayout>
                          <ChatPage />
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/chat"
                    element={
                      <ProtectedRoute>
                        <MainLayout>
                          <ChatPage />
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/chat/:chatId"
                    element={
                      <ProtectedRoute>
                        <MainLayout>
                          <ChatPage />
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <MainLayout>
                          <ProfilePage />
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <MainLayout>
                          <SettingsPage />
                        </MainLayout>
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Admin Routes */}
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <MainLayout>
                          <AdminPage />
                        </MainLayout>
                      </AdminRoute>
                    }
                  />
                  
                  {/* 404 Page */}
                  <Route path="/404" element={<NotFoundPage />} />
                  
                  {/* Catch all route */}
                  <Route path="*" element={<Navigate to="/404" replace />} />

        </Routes>
      </ChatProvider>
    </InitializationCheck>
  );
};

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;