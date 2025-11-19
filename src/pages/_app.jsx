// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { useToast } from '@/components/ui';

export default function App(props) {
  const {
    $w,
    style,
    children
  } = props;
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // 检查登录状态
  const checkAuthStatus = async () => {
    try {
      const tcb = await $w.cloud.getCloudInstance();
      const auth = tcb.auth();

      // 获取当前用户信息
      const user = auth.getCurrentUser();
      if (user) {
        // 已登录
        setIsAuthenticated(true);
        setCurrentUser(user);
        setLoading(false);
      } else {
        // 未登录，检查是否有登录状态
        const loginState = auth.hasLoginState();
        if (loginState) {
          setIsAuthenticated(true);
          setCurrentUser(loginState.user);
          setLoading(false);
        } else {
          // 未登录，重定向到登录页
          setIsAuthenticated(false);
          setLoading(false);

          // 获取当前页面路径，避免循环重定向
          const currentPage = window.location.pathname.replace('/', '') || 'dashboard';
          if (currentPage !== 'login') {
            $w.utils.redirectTo({
              pageId: 'login',
              params: {
                redirect: currentPage
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('认证检查失败:', error);
      setLoading(false);

      // 出错时也重定向到登录页
      const currentPage = window.location.pathname.replace('/', '') || 'dashboard';
      if (currentPage !== 'login') {
        $w.utils.redirectTo({
          pageId: 'login',
          params: {
            redirect: currentPage
          }
        });
      }
    }
  };

  // 处理登录成功
  const handleLoginSuccess = () => {
    checkAuthStatus();
  };

  // 处理退出登录
  const handleLogout = async () => {
    try {
      const tcb = await $w.cloud.getCloudInstance();
      const auth = tcb.auth();
      await auth.signOut();
      setIsAuthenticated(false);
      setCurrentUser(null);

      // 重定向到登录页
      $w.utils.redirectTo({
        pageId: 'login',
        params: {}
      });
      toast({
        title: '退出成功',
        description: '您已成功退出登录',
        duration: 2000
      });
    } catch (error) {
      console.error('退出登录失败:', error);
      toast({
        title: '退出失败',
        description: '请重试',
        variant: 'destructive'
      });
    }
  };

  // 渲染加载状态
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-white text-lg">检查登录状态...</div>
        </div>
      </div>;
  }

  // 如果是登录页，直接渲染
  const currentPage = window.location.pathname.replace('/', '') || 'dashboard';
  if (currentPage === 'login') {
    return React.cloneElement(children, {
      ...props,
      onLoginSuccess: handleLoginSuccess
    });
  }

  // 未登录时显示重定向提示
  if (!isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">正在重定向到登录页...</h2>
          <p className="text-gray-400">请稍候，系统正在为您跳转到登录页面</p>
        </div>
      </div>;
  }

  // 已登录，渲染应用内容
  return React.cloneElement(children, {
    ...props,
    currentUser: currentUser,
    onLogout: handleLogout
  });
}