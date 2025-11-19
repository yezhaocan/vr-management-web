// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { useToast, Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@/components/ui';
// @ts-ignore;
import { Users, HardDrive, PlayCircle, Shield, TrendingUp, Activity, MapPin } from 'lucide-react';

import { SuperAdminSidebar } from '@/components/SuperAdminSidebar';
// 导入存在的功能页面组件
import DroneManagement from './drone';
import RouteManagement from './route';
import POIManagement from './poi';
import VideoRecordManagement from './video-record';
import FlightTaskManagement from './flight-task';
import ConfigManagement from './config';
import { AuthGuard } from '@/components/AuthGuard';
export default function SuperAdminPage(props) {
  const {
    $w,
    style
  } = props;
  const {
    toast
  } = useToast();
  const [activeMenu, setActiveMenu] = useState('superadmin');
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalDrones: 0,
    todayFlights: 0,
    totalRoutes: 0
  });
  useEffect(() => {
    // 加载系统统计数据
    loadSystemStats();
  }, []);
  const loadSystemStats = async () => {
    try {
      // 模拟加载系统统计数据
      setSystemStats({
        totalUsers: 2846,
        totalDrones: 45,
        todayFlights: 23,
        totalRoutes: 67
      });
    } catch (error) {
      toast({
        title: '数据加载失败',
        description: error.message || '请检查网络连接',
        variant: 'destructive'
      });
    }
  };
  const handleMenuChange = menuId => {
    setActiveMenu(menuId);
  };
  const handleLogout = () => {
    // 模拟退出登录
    $w.utils.redirectTo({
      pageId: 'dashboard',
      params: {}
    });
  };
  const renderContent = () => {
    switch (activeMenu) {
      case 'drone':
        return <DroneManagement $w={$w} />;
      case 'route':
        return <RouteManagement $w={$w} />;
      case 'poi':
        return <POIManagement $w={$w} />;
      case 'video-record':
        return <VideoRecordManagement $w={$w} />;
      case 'flight-task':
        return <FlightTaskManagement $w={$w} />;
      case 'config':
        return <ConfigManagement $w={$w} />;
      default:
        return renderSuperAdminDashboard();
    }
  };
  const renderSuperAdminDashboard = () => <div className="p-6 space-y-6">
      {/* 欢迎区域 */}
      <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-xl p-6 border border-red-500/20">
        <h1 className="text-2xl font-bold text-white mb-2">
          系统管理控制台
        </h1>
        <p className="text-gray-300">平台整体运营数据监控</p>
      </div>

      {/* 系统统计卡片 - 调整为四个统计模块 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500/15 to-blue-600/15 border-blue-500/30 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-300">用户总数</CardTitle>
            <Users className="h-4 w-4 text-blue-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-100 drop-shadow-md">{systemStats.totalUsers}</div>
            <p className="text-xs text-blue-200/80">平台用户总数</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/15 to-green-600/15 border-green-500/30 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-300">无人机设备总数</CardTitle>
            <HardDrive className="h-4 w-4 text-green-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-100 drop-shadow-md">{systemStats.totalDrones}</div>
            <p className="text-xs text-green-200/80">所有设备数量</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/15 to-purple-600/15 border-purple-500/30 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-300">航线总数</CardTitle>
            <MapPin className="h-4 w-4 text-purple-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-100 drop-shadow-md">{systemStats.totalRoutes}</div>
            <p className="text-xs text-purple-200/80">平台航线数量</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/15 to-orange-600/15 border-orange-500/30 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-300">今日飞行任务次数</CardTitle>
            <PlayCircle className="h-4 w-4 text-orange-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-100 drop-shadow-md">{systemStats.todayFlights}</div>
            <p className="text-xs text-orange-200/80">今日执行任务次数</p>
          </CardContent>
        </Card>
      </div>

      {/* 快速操作 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <HardDrive className="h-5 w-5 mr-2 text-blue-400" />
              无人机管理
            </CardTitle>
            <CardDescription className="text-gray-400">
              管理所有无人机设备
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-blue-500 hover:bg-blue-600" onClick={() => setActiveMenu('drone')}>
              进入管理
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <PlayCircle className="h-5 w-5 mr-2 text-green-400" />
              飞行任务
            </CardTitle>
            <CardDescription className="text-gray-400">
              查看和管理飞行任务
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-green-500 hover:bg-green-600" onClick={() => setActiveMenu('flight-task')}>
              进入管理
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Shield className="h-5 w-5 mr-2 text-purple-400" />
              系统监控
            </CardTitle>
            <CardDescription className="text-gray-400">
              查看系统运行状态和日志
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-purple-500 hover:bg-purple-600" onClick={() => setActiveMenu('config')}>
              进入监控
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 系统状态 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-400" />
              平台趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">本月新增用户</span>
                <span className="text-green-400 font-medium">+156</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">本月飞行任务</span>
                <span className="text-blue-400 font-medium">+284</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">系统运行时间</span>
                <span className="text-purple-400 font-medium">99.8%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Activity className="h-5 w-5 mr-2 text-orange-400" />
              实时状态
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">在线无人机</span>
                <span className="text-green-400 font-medium">18</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">活跃航线</span>
                <span className="text-blue-400 font-medium">32</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">今日营收</span>
                <span className="text-purple-400 font-medium">¥12,450</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
  return <AuthGuard $w={$w}>
      <div style={style} className="min-h-screen bg-gray-900">
        <div className="flex h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
          <SuperAdminSidebar activeMenu={activeMenu} onMenuChange={handleMenuChange} onLogout={handleLogout} $w={$w} />
          
          <div className="flex-1 overflow-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    </AuthGuard>;
}