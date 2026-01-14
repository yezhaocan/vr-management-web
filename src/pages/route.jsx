// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, useToast, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Input } from '@/components/ui';
// @ts-ignore;
import { Plus, Edit, Trash2, Play, Music, Volume2, AlertTriangle, Map, Clock, Search } from 'lucide-react';

// @ts-ignore;
import { RouteEditor } from '@/components/RouteEditor';
// @ts-ignore;
import { AirlineList } from '@/components/AirlineList';
import { AuthGuard } from '@/components/AuthGuard';
import { MainLayout } from './MainLayout';

export default function RoutePage(props) {
  const { $w, style } = props;
  const [routes, setRoutes] = useState([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState(null);
  const { toast } = useToast();
  const [searchKeyword, setSearchKeyword] = useState(''); // 新增：搜索关键词状态

  const loadRoutes = async () => {
    try {
      setLoading(true);
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'airline',
        methodName: 'wedaGetRecordsV2',
        params: {
          pageSize: 100,
          pageNumber: 1,
          orderBy: [{ createdAt: 'desc' }],
          select: { $master: true }
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

  const handleCreateRoute = () => {
    setEditingRoute(null);
    setShowEditor(true);
  };

  const handleEditRoute = route => {
    setEditingRoute(route);
    setShowEditor(true);
  };

  const handleDeleteRoute = route => {
    setRouteToDelete(route);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteRoute = async () => {
    if (!routeToDelete) return;
    try {
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'airline',
        methodName: 'wedaDeleteV2',
        params: {
          filter: { where: { _id: { $eq: routeToDelete._id } } }
        }
      });
      if (result.count > 0) {
        toast({ title: '删除成功', description: '航线已删除', variant: 'default' });
        loadRoutes();
      }
    } catch (error) {
      console.error('删除航线失败:', error);
      toast({
        title: '删除失败',
        description: error.message || '请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setDeleteConfirmOpen(false);
      setRouteToDelete(null);
    }
  };

  const cancelDeleteRoute = () => {
    setDeleteConfirmOpen(false);
    setRouteToDelete(null);
  };

  const handleEditorClose = () => {
    setShowEditor(false);
    setEditingRoute(null);
  };

  const handleEditorSuccess = () => {
    setShowEditor(false);
    setEditingRoute(null);
    loadRoutes();
  };

  const hasVoiceGuide = route => {
    if (!route.waypoints || !Array.isArray(route.waypoints)) return false;
    return route.waypoints.some(waypoint => waypoint.voiceGuide && waypoint.voiceGuide.enabled === true);
  };

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

  // 过滤航线列表
  const filteredRoutes = routes.filter(route => 
    route.name?.toLowerCase().includes(searchKeyword.toLowerCase()) || 
    route.description?.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  return (
    <MainLayout $w={$w}>
      <AuthGuard $w={$w}>
          <div style={style} className="space-y-6 animate-in fade-in duration-500">
        
        {/* 统计信息卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="flex flex-row items-center p-6 border border-border bg-card shadow-sm gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Map className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex flex-col items-start space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">总航线数</h3>
              <div className="text-3xl font-bold text-primary">{stats.totalRoutes}</div>
              <p className="text-xs text-muted-foreground">已规划航线</p>
            </div>
          </Card>

          <Card className="flex flex-row items-center p-6 border border-border bg-card shadow-sm gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <Music className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex flex-col items-start space-y-1 flex-1">
              <h3 className="text-sm font-medium text-muted-foreground">带背景音乐</h3>
              <div className="text-3xl font-bold text-primary">{stats.routesWithBackgroundMusic}</div>
            </div>
            <div className="flex flex-col items-end">
               <span className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.backgroundMusicPercentage}%</span>
               <span className="text-xs text-muted-foreground">占比</span>
            </div>
          </Card>

          <Card className="flex flex-row items-center p-6 border border-border bg-card shadow-sm gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <Volume2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex flex-col items-start space-y-1 flex-1">
              <h3 className="text-sm font-medium text-muted-foreground">带语音讲解</h3>
              <div className="text-3xl font-bold text-primary">{stats.routesWithVoiceGuide}</div>
            </div>
            <div className="flex flex-col items-end">
               <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.voiceGuidePercentage}%</span>
               <span className="text-xs text-muted-foreground">占比</span>
            </div>
          </Card>
        </div>

        {/* 顶部工具栏 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1 w-full sm:w-auto flex items-center gap-4">
             <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="搜索航线名称或描述..." 
                  value={searchKeyword} 
                  onChange={e => setSearchKeyword(e.target.value)} 
                  className="pl-10 bg-background border-input w-full hover:border-primary transition-colors duration-200" 
                />
             </div>
          </div>
          <Button onClick={handleCreateRoute} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" /> 创建航线
          </Button>
        </div>

        {/* 航线列表 */}
        <div className="bg-background">
          <AirlineList routes={filteredRoutes} onEdit={handleEditRoute} onDelete={handleDeleteRoute} hasVoiceGuide={hasVoiceGuide} />
        </div>

        {/* 航线编辑器弹窗 */}
        {showEditor && <RouteEditor route={editingRoute} onClose={handleEditorClose} onSuccess={handleEditorSuccess} $w={$w} />}

        {/* 删除确认对话框 */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="bg-background border-border text-foreground sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <DialogTitle>确认删除航线</DialogTitle>
              </div>
              <DialogDescription>
                您确定要删除这条航线吗？此操作不可恢复。
              </DialogDescription>
            </DialogHeader>
            
            {routeToDelete && (
              <div className="bg-muted/50 rounded-md p-4 space-y-2 text-sm border border-border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">航线名称</span>
                  <span className="font-medium text-foreground">{routeToDelete.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">航点数量</span>
                  <span className="font-medium text-foreground">{routeToDelete.waypointCount || 0} 个</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">预计时长</span>
                  <span className="font-medium text-foreground">{routeToDelete.estimated_duration || 0} 分钟</span>
                </div>
              </div>
            )}
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={cancelDeleteRoute}>
                取消
              </Button>
              <Button variant="destructive" onClick={confirmDeleteRoute}>
                确认删除
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        </div>
        </AuthGuard>
      </MainLayout>
  );
}
