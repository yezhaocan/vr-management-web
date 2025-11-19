// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, useToast, Badge } from '@/components/ui';
// @ts-ignore;
import { Plus, Edit, Trash2, Play, Music, Volume2 } from 'lucide-react';

// @ts-ignore;
import { RouteEditor } from '@/components/RouteEditor';
// @ts-ignore;
import { AirlineList } from '@/components/AirlineList';
export default function RoutePage(props) {
  const {
    $w,
    style
  } = props;
  const [routes, setRoutes] = useState([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const {
    toast
  } = useToast();

  // 加载航线数据
  const loadRoutes = async () => {
    try {
      setLoading(true);
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'airline',
        methodName: 'wedaGetRecordsV2',
        params: {
          pageSize: 100,
          pageNumber: 1,
          orderBy: [{
            createdAt: 'desc'
          }],
          select: {
            $master: true
          }
        }
      });
      setRoutes(result.records || []);
    } catch (error) {
      console.error('加载航线失败:', error);
      toast({
        title: '加载失败',
        description: error.message || '请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadRoutes();
  }, []);

  // 创建新航线
  const handleCreateRoute = () => {
    setEditingRoute(null);
    setShowEditor(true);
  };

  // 编辑航线
  const handleEditRoute = route => {
    setEditingRoute(route);
    setShowEditor(true);
  };

  // 删除航线
  const handleDeleteRoute = async route => {
    try {
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'airline',
        methodName: 'wedaDeleteV2',
        params: {
          filter: {
            where: {
              _id: {
                $eq: route._id
              }
            }
          }
        }
      });
      if (result.count > 0) {
        toast({
          title: '删除成功',
          description: '航线已删除',
          variant: 'default'
        });
        loadRoutes();
      }
    } catch (error) {
      console.error('删除航线失败:', error);
      toast({
        title: '删除失败',
        description: error.message || '请稍后重试',
        variant: 'destructive'
      });
    }
  };

  // 处理编辑器关闭
  const handleEditorClose = () => {
    setShowEditor(false);
    setEditingRoute(null);
  };

  // 处理编辑器保存成功
  const handleEditorSuccess = () => {
    setShowEditor(false);
    setEditingRoute(null);
    loadRoutes();
  };

  // 检查航线是否有语音讲解（只要有一个航点开启了语音讲解就认为有）
  const hasVoiceGuide = route => {
    if (!route.waypoints || !Array.isArray(route.waypoints)) return false;
    return route.waypoints.some(waypoint => waypoint.voiceGuide && waypoint.voiceGuide.enabled === true);
  };

  // 统计信息
  const getStats = () => {
    const totalRoutes = routes.length;
    const routesWithBackgroundMusic = routes.filter(route => route.cloudStorageId && route.cloudStorageId.trim() !== '').length;
    const routesWithVoiceGuide = routes.filter(route => hasVoiceGuide(route)).length;
    return {
      totalRoutes,
      routesWithBackgroundMusic,
      routesWithVoiceGuide,
      backgroundMusicPercentage: totalRoutes > 0 ? Math.round(routesWithBackgroundMusic / totalRoutes * 100) : 0,
      voiceGuidePercentage: totalRoutes > 0 ? Math.round(routesWithVoiceGuide / totalRoutes * 100) : 0
    };
  };
  const stats = getStats();
  return <div style={style} className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 头部标题和操作按钮 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">航线管理</h1>
            <p className="text-gray-400">创建和管理无人机飞行航线</p>
          </div>
          <Button onClick={handleCreateRoute} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold">
            <Plus className="w-4 h-4 mr-2" /> 创建航线
          </Button>
        </div>

        {/* 统计信息卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-600 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">总航线数</p>
                  <p className="text-3xl font-bold text-white">{stats.totalRoutes}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Play className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-600 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">带背景音乐</p>
                  <p className="text-3xl font-bold text-white">{stats.routesWithBackgroundMusic}</p>
                  <p className="text-green-400 text-sm">{stats.backgroundMusicPercentage}%</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Music className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-600 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">带语音讲解</p>
                  <p className="text-3xl font-bold text-white">{stats.routesWithVoiceGuide}</p>
                  <p className="text-purple-400 text-sm">{stats.voiceGuidePercentage}%</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Volume2 className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 航线列表 */}
        <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-600 shadow-lg rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-white">航线列表</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                <span className="ml-3 text-gray-400">加载中...</span>
              </div> : <AirlineList routes={routes} onEdit={handleEditRoute} onDelete={handleDeleteRoute} hasVoiceGuide={hasVoiceGuide} />}
          </CardContent>
        </Card>

        {/* 航线编辑器弹窗 */}
        {showEditor && <RouteEditor route={editingRoute} onClose={handleEditorClose} onSuccess={handleEditorSuccess} $w={$w} />}
      </div>
    </div>;
}