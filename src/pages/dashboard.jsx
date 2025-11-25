// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { useToast, Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@/components/ui';
// @ts-ignore;
import { Drone, Navigation, MapPin, Video, Lightbulb, Settings, Users, DollarSign, PlayCircle, RefreshCw, LogOut } from 'lucide-react';

import { Sidebar } from '@/components/Sidebar';
import { SuperAdminSidebar } from '@/components/SuperAdminSidebar';

// 导入各个功能页面组件
import DroneManagement from './drone';
import RouteManagement from './route';
import POIManagement from './poi';
import VideoRecordManagement from './video-record';
import TipsManagement from './tips';
import FlightTaskManagement from './flight-task';
import ConfigManagement from './config';
import ScenicManagement from './scenic-management';
export default function Dashboard(props) {
  const {
    $w
  } = props;
  const {
    toast
  } = useToast();

  const [currentUser, setCurrentUser] = useState(null);

  const getCurrentUser = async () => {
    try {
      const tcb = await $w.cloud.getCloudInstance();
      const auth = tcb.auth();
      setCurrentUser(auth.currentUser);
    } catch (error) {
      console.error('获取当前用户信息失败:', error);
    }
  };

  useEffect(() => {
    getCurrentUser();
  }, []);

  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    totalFlights: 0,
    activeDrones: 0,
    pendingTasks: 0,
    totalTips: 0
  });
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState('user'); // 'user' 或 'superadmin'

  useEffect(() => {
    // 加载统计数据
    loadDashboardStats();
    // 判断用户角色
    checkUserRole();
  }, []);
  const checkUserRole = () => {
    // 根据当前用户信息判断角色
    const user = $w?.auth?.currentUser;
    if (user && user.type === 'superadmin') {
      setUserRole('superadmin');
    } else {
      setUserRole('user');
    }
  };
  const loadDashboardStats = async () => {
    try {
      setLoading(true);

      // 并行加载所有统计数据
      const [droneResult, tipsResult, missionResult] = await Promise.all([
        // 获取无人机数量
        $w.cloud.callDataSource({
          dataSourceName: 'drone',
          methodName: 'wedaGetRecordsV2',
          params: {
            select: {
              $master: true
            },
            filter: {
              where: {}
            },
            pageSize: 1,
            pageNumber: 1,
            getCount: true
          }
        }),
        // 获取tips数量
        $w.cloud.callDataSource({
          dataSourceName: 'tips',
          methodName: 'wedaGetRecordsV2',
          params: {
            select: {
              $master: true
            },
            filter: {
              where: {}
            },
            pageSize: 1,
            pageNumber: 1,
            getCount: true
          }
        }),
        // 获取飞行任务统计
        $w.cloud.callDataSource({
          dataSourceName: 'mission',
          methodName: 'wedaGetRecordsV2',
          params: {
            select: {
              $master: true
            },
            filter: {
              where: {}
            },
            pageSize: 1,
            pageNumber: 1,
            getCount: true
          }
        })]);

      // 获取待执行任务数量
      const pendingTasksResult = await $w.cloud.callDataSource({
        dataSourceName: 'mission',
        methodName: 'wedaGetRecordsV2',
        params: {
          select: {
            $master: true
          },
          filter: {
            where: {
              status: {
                $eq: 'pending'
              }
            }
          },
          pageSize: 1,
          pageNumber: 1,
          getCount: true
        }
      });
      setSystemStats({
        totalUsers: 156,
        // 保持模拟数据
        totalRevenue: 284500,
        // 保持模拟数据
        totalFlights: missionResult.total || 0,
        activeDrones: droneResult.total || 0,
        pendingTasks: pendingTasksResult.total || 0,
        totalTips: tipsResult.total || 0
      });
    } catch (error) {
      console.error('加载统计数据失败:', error);
      toast({
        title: '数据加载失败',
        description: error.message || '请检查网络连接',
        variant: 'destructive'
      });
      // 使用默认值
      setSystemStats({
        totalUsers: 156,
        totalRevenue: 284500,
        totalFlights: 0,
        activeDrones: 0,
        pendingTasks: 0,
        totalTips: 0
      });
    } finally {
      setLoading(false);
    }
  };
  const handleMenuChange = menuId => {
    setActiveMenu(menuId);
  };
  const handleLogout = async () => {
    try {
      const tcb = await $w.cloud.getCloudInstance();
      const auth = tcb.auth();
      console.log(`🚀 ~ handleLogout ~ auth-> `, auth)
      auth.currentUser && await auth.signOut();
      toast({
        title: '退出成功',
        description: '您已成功退出登录',
        duration: 2000
      });

      // 跳转到登录页
      // $w.utils.redirectTo({
      //   pageId: 'login',
      //   params: {}
      // });
      window.location.href = '/login'
    } catch (error) {

    }
  };
  const renderContent = () => {
    switch (activeMenu) {
      case 'scenic-management':
        return <ScenicManagement $w={$w} />;
      case 'drone':
        return <DroneManagement $w={$w} />;
      case 'route':
        return <RouteManagement $w={$w} />;
      case 'poi':
        return <POIManagement $w={$w} />;
      case 'video-record':
        return <VideoRecordManagement $w={$w} />;
      case 'tips':
        return <TipsManagement $w={$w} />;
      case 'flight-task':
        return <FlightTaskManagement $w={$w} />;
      case 'config':
        return <ConfigManagement $w={$w} />;
      default:
        return renderDashboard();
    }
  };
  const renderDashboard = () => <div className="flex-1 p-6 overflow-y-auto">
    {/* 欢迎区域 */}
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            欢迎回来，{currentUser?.name || '管理员'}！
          </h1>
          <p className="text-gray-400">VR观光管理系统运行观测台</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white" onClick={loadDashboardStats} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? '数据加载中...' : '刷新数据'}
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            退出登录
          </Button>
        </div>
      </div>
    </div>

    {/* 统计卡片 */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
      <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-400">用户数量</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-white">{systemStats.totalUsers}</div>
            <div className="p-2 rounded-lg bg-blue-500">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">系统用户</p>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-400">营收总额</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-white">¥{systemStats.totalRevenue.toLocaleString()}</div>
            <div className="p-2 rounded-lg bg-green-500">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">累计收入</p>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-400">飞行记录</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-white">{systemStats.totalFlights}</div>
            <div className="p-2 rounded-lg bg-purple-500">
              <PlayCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">累计飞行次数</p>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-400">活跃无人机</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-white">{systemStats.activeDrones}</div>
            <div className="p-2 rounded-lg bg-orange-500">
              <Drone className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">在线设备</p>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-400">待执行任务</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-white">{systemStats.pendingTasks}</div>
            <div className="p-2 rounded-lg bg-red-500">
              <Settings className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">等待执行</p>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-400">Tips数量</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-white">{systemStats.totalTips}</div>
            <div className="p-2 rounded-lg bg-yellow-500">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">提示信息</p>
        </CardContent>
      </Card>
    </div>

    {/* 快速操作 */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            景区管理
          </CardTitle>
          <CardDescription className="text-gray-400">管理景区信息和坐标位置</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 w-full" onClick={() => setActiveMenu('scenic-management')}>
            进入管理
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Navigation className="w-5 h-5 mr-2" />
            航线管理
          </CardTitle>
          <CardDescription className="text-gray-400">规划和管理飞行航线</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 w-full" onClick={() => setActiveMenu('route')}>
            进入管理
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <PlayCircle className="w-5 h-5 mr-2" />
            飞行任务
          </CardTitle>
          <CardDescription className="text-gray-400">创建和执行飞行任务</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 w-full" onClick={() => setActiveMenu('flight-task')}>
            进入管理
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            系统配置
          </CardTitle>
          <CardDescription className="text-gray-400">系统参数和设置管理</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 w-full" onClick={() => setActiveMenu('config')}>
            进入管理
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>;
  return <div className="flex h-screen bg-gray-900">
    {/* 侧边栏 */}
    {userRole === 'superadmin' ? <SuperAdminSidebar activeMenu={activeMenu} onMenuChange={handleMenuChange} onLogout={handleLogout} $w={$w} /> : <Sidebar activeMenu={activeMenu} onMenuChange={handleMenuChange} onLogout={handleLogout} $w={$w} />}

    {/* 主内容区域 */}
    <div className="flex-1 flex flex-col overflow-hidden">
      {renderContent()}
    </div>
  </div>;
}