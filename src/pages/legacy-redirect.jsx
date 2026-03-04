import React, { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const workspacePages = new Set([
  'dashboard',
  'drone',
  'route',
  'poi',
  'config',
  'superadmin',
  'flight-task',
  'video-record',
  'tips',
  'scenic-management',
]);

export default function LegacyRedirect() {
  const location = useLocation();

  const target = useMemo(() => {
    // 统一去掉路径末尾斜杠，避免重定向目标受 URL 细节影响
    const normalizedPath = location.pathname.replace(/\/+$/, '');
    // 将 /dashboard 这类旧路径提取为 pageId（去掉首个斜杠）
    const currentPageId = normalizedPath.replace(/^\//, '');

    // 命中已知业务页时，重定向到新的 /workspace/{pageId} 路由结构
    if (workspacePages.has(currentPageId)) {
      return `/workspace/${currentPageId}`;
    }

    // 其它未知旧路径统一回退到工作台默认页
    return '/workspace/dashboard';
  }, [location.pathname]);

  // 使用 replace 避免保留旧路由历史，减少返回键回跳
  return <Navigate to={target} replace />;
}
