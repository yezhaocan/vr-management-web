import React, { useMemo } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { MainLayout } from './MainLayout';
import DASHBOARD from './dashboard.jsx';
import DRONE from './drone.jsx';
import ROUTE from './route.jsx';
import POI from './poi.jsx';
import CONFIG from './config.jsx';
import SUPERADMIN from './superadmin.jsx';
import FLIGHT_TASK from './flight-task.jsx';
import VIDEO_RECORD from './video-record.jsx';
import TIPS from './tips.jsx';
import SCENIC_MANAGEMENT from './scenic-management.jsx';

const pageMap = {
  dashboard: DASHBOARD,
  drone: DRONE,
  route: ROUTE,
  poi: POI,
  config: CONFIG,
  superadmin: SUPERADMIN,
  'flight-task': FLIGHT_TASK,
  'video-record': VIDEO_RECORD,
  tips: TIPS,
  'scenic-management': SCENIC_MANAGEMENT,
};

export default function WorkspaceShell(props) {
  const { $w } = props;
  const location = useLocation();

  const pageId = useMemo(() => {
    // 规范化路径，先移除末尾多余斜杠，避免 /workspace/dashboard/ 与 /workspace/dashboard 被识别为不同页面
    const normalizedPath = location.pathname.replace(/\/+$/, '');
    // 仅提取 /workspace/{pageId} 的 pageId，不匹配则返回空字符串
    const matched = normalizedPath.match(/^\/workspace\/([^/]+)$/);
    return matched?.[1] || '';
  }, [location.pathname]);

  // 根据 pageId 从页面映射表中取出当前要渲染的业务页面组件
  const ActivePage = pageMap[pageId];

  // 访问 /workspace 根路径时，统一重定向到默认页 dashboard
  if (location.pathname === '/workspace') {
    return <Navigate to="/workspace/dashboard" replace />;
  }

  // pageId 不存在或不在映射表时，兜底回到 dashboard，避免空白页
  if (!ActivePage) {
    return <Navigate to="/workspace/dashboard" replace />;
  }

  // 主布局固定只挂载一次，内部按 pageId 切换业务页组件
  return (
    <MainLayout $w={$w}>
      <ActivePage $w={$w} />
    </MainLayout>
  );
}
