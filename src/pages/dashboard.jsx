// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { useToast, Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@/components/ui';
// @ts-ignore;
import { Drone, Navigation, MapPin, PlayCircle, Lightbulb, Settings, Users, DollarSign, RefreshCw, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from './MainLayout';
import { AuthGuard } from '@/components/AuthGuard';

export default function Dashboard(props) {
  const {
    $w
  } = props;
  const {
    toast
  } = useToast();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    totalFlights: 0,
    activeDrones: 0,
    pendingTasks: 0,
    totalTips: 0
  });
  const [loading, setLoading] = useState(false);

  const getCurrentUser = async () => {
    try {
      const tcb = await $w.cloud.getCloudInstance();
      const auth = tcb.auth();
      const userInfo = await auth.getUserInfo();
      console.log(`🚀 ~ getCurrentUser ~ userInfo-> `, auth.hasLoginState())
      setCurrentUser(userInfo || {});
    } catch (error) {
      console.error('获取当前用户信息失败:', error);
    }
  };

  useEffect(() => {
    getCurrentUser();
    loadDashboardStats();
  }, []);

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
            select: { $master: true },
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
            select: { $master: true },
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
            select: { $master: true },
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
          select: { $master: true },
          filter: {
            where: {
              status: { $eq: 'pending' }
            }
          },
          pageSize: 1,
          pageNumber: 1,
          getCount: true
        }
      });

      setSystemStats({
        totalUsers: 156, // 保持模拟数据
        totalRevenue: 284500, // 保持模拟数据
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

  return (
    <MainLayout $w={$w}>
      <AuthGuard $w={$w}>
        <div className="space-y-6">
      {/* 欢迎区域 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-lg border border-border shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            欢迎回来，{currentUser?.name || '管理员'}！
          </h1>
          <p className="text-muted-foreground">VR观光管理系统运行观测台</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={loadDashboardStats} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? '数据加载中...' : '刷新数据'}
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatsCard 
          title="飞行记录" 
          value={systemStats.totalFlights} 
          subValue="累计飞行次数" 
          icon={<PlayCircle className="w-5 h-5 text-white" />} 
          color="bg-purple-500" 
        />
        <StatsCard 
          title="活跃无人机" 
          value={systemStats.activeDrones} 
          subValue="在线设备" 
          icon={<Drone className="w-5 h-5 text-white" />} 
          color="bg-orange-500" 
        />
        <StatsCard 
          title="待执行任务" 
          value={systemStats.pendingTasks} 
          subValue="等待执行" 
          icon={<Settings className="w-5 h-5 text-white" />} 
          color="bg-red-500" 
        />
        <StatsCard 
          title="TIPS数量" 
          value={systemStats.totalTips} 
          subValue="提示信息" 
          icon={<Lightbulb className="w-5 h-5 text-white" />} 
          color="bg-yellow-500" 
        />
      </div>

      {/* 快速操作 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <QuickActionCard 
          title="景区管理" 
          description="管理景区信息和坐标位置" 
          icon={<MapPin className="w-5 h-5 mr-2" />} 
          onClick={() => navigate('/scenic-management')} 
        />
        <QuickActionCard 
          title="航线管理" 
          description="规划和管理飞行航线" 
          icon={<Navigation className="w-5 h-5 mr-2" />} 
          onClick={() => navigate('/route')} 
        />
        <QuickActionCard 
          title="飞行任务" 
          description="创建和执行飞行任务" 
          icon={<PlayCircle className="w-5 h-5 mr-2" />} 
          onClick={() => navigate('/flight-task')} 
        />
        <QuickActionCard 
          title="系统配置" 
          description="系统参数和设置管理" 
          icon={<Settings className="w-5 h-5 mr-2" />} 
          onClick={() => navigate('/config')} 
        />
      </div>
      </div>
      </AuthGuard>
    </MainLayout>
  );
}

// 辅助组件：统计卡片
function StatsCard({ title, value, subValue, icon, color }) {
  return (
    <Card className="bg-card border-border hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-foreground">{value}</div>
          <div className={`p-2 rounded-lg ${color} shadow-sm`}>
            {icon}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
      </CardContent>
    </Card>
  );
}

// 辅助组件：快速操作卡片
function QuickActionCard({ title, description, icon, onClick }) {
  return (
    <Card className="bg-card border-border hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group" onClick={onClick}>
      <CardHeader>
        <CardTitle className="text-foreground flex items-center group-hover:text-primary transition-colors">
          {icon}
          {title}
        </CardTitle>
        <CardDescription className="text-muted-foreground">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          进入管理
        </Button>
      </CardContent>
    </Card>
  );
}
