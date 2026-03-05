// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Loader } from 'lucide-react';

export function AuthGuard({
  children,
  $w
}) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  useEffect(() => {
    checkAuth();
  }, []);
  const checkAuth = async () => {
    try {
      const tcb = await $w.cloud.getCloudInstance();
      const auth = tcb.auth();
      const loginState = auth.hasLoginState();
      if (loginState) {
        setIsAuthenticated(true);
      } else {
        // 未登录，重定向到登录页
        $w.utils.redirectTo({
          pageId: 'login',
          params: {}
        });
      }
    } catch (error) {
      console.error('认证检查失败:', error);
      // 出错时也重定向到登录页
      $w.utils.redirectTo({
        pageId: 'login',
        params: {}
      });
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="w-8 h-8 text-blue-400 animate-spin" />
          <div className="text-white text-lg">检查登录状态...</div>
        </div>
      </div>;
  }
  if (!isAuthenticated) {
    return null; // 重定向中
  }
  return children;
}