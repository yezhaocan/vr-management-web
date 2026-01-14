// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, useToast, Dialog, DialogContent, DialogHeader, DialogTitle, Tabs, TabsContent, TabsList, TabsTrigger, Input } from '@/components/ui';
// @ts-ignore;
import { Plus, Search, Filter, Edit, Trash2, Play, RefreshCw, Gauge, Repeat, Loader, Clock, CheckCircle, XCircle } from 'lucide-react';

// @ts-ignore;
import { MissionForm } from '@/components/MissionForm';
import { AuthGuard } from '@/components/AuthGuard';
import { MainLayout } from './MainLayout';

export default function FlightTaskPage(props) {
  const { $w, style } = props;
  const { toast } = useToast();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingMission, setEditingMission] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [executingMissions, setExecutingMissions] = useState(new Set());
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    try {
      setLoading(true);
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'mission',
        methodName: 'wedaGetRecordsV2',
        params: {
          select: { $master: true },
          filter: { where: {} },
          pageSize: 100,
          pageNumber: 1,
          orderBy: [{ startTime: 'desc' }],
          getCount: true
        }
      });

      const missionsWithDroneInfo = await Promise.all((result.records || []).map(async mission => {
        if (mission.droneId) {
          try {
            const droneResult = await $w.cloud.callDataSource({
              dataSourceName: 'drone',
              methodName: 'wedaGetItemV2',
              params: {
                filter: { where: { _id: { $eq: mission.droneId } } },
                select: { $master: true }
              }
            });
            if (droneResult) {
              const droneDisplayName = `${droneResult.sn || '未知序列号'}·${droneResult.model || '未知型号'}`;
              return {
                ...mission,
                droneModelSn: droneDisplayName,
                droneInfo: droneResult
              };
            }
          } catch (error) {
            console.error('加载无人机信息失败:', error);
          }
        }
        return mission;
      }));
      setMissions(missionsWithDroneInfo);
    } catch (error) {
      toast({
        title: '加载失败',
        description: error.message || '请检查网络连接',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteMission = async mission => {
    try {
      setExecutingMissions(prev => new Set(prev).add(mission._id));

      const airlineResult = await $w.cloud.callDataSource({
        dataSourceName: 'airline',
        methodName: 'wedaGetItemV2',
        params: {
          filter: { where: { _id: { $eq: mission.airlineId } } },
          select: { $master: true }
        }
      });
      if (!airlineResult || !airlineResult.waypoints || airlineResult.waypoints.length === 0) {
        throw new Error('航线数据不存在或没有配置航点');
      }

      const waypoints = airlineResult.waypoints.map(waypoint => ({
        latitude: waypoint.lat,
        longitude: waypoint.lng,
        altitude: waypoint.altitude,
        speed: waypoint.flightSpeed,
        stay_time: waypoint.hoverDuration
      }));

      const requestBody = {
        mission_id: mission.missionID,
        global_speed: mission.maxSpeed,
        repeat_times: mission.repeatCount,
        auto_return_home: true,
        waypoints: waypoints
      };

      await $w.cloud.callFunction({
        name: 'flight_control',
        data: {
          path: '/mission/executed',
          method: 'POST',
          body: requestBody
        }
      });
      toast({
        title: '任务执行指令已发送',
        description: `任务 "${mission.name}" 执行指令已发送，状态将由外部平台自动同步`,
        variant: 'default'
      });

      loadMissions();
    } catch (error) {
      console.error('执行任务失败:', error);
      toast({
        title: '执行任务失败',
        description: error.message || '请检查网络连接和航线配置',
        variant: 'destructive'
      });
    } finally {
      setTimeout(() => {
        setExecutingMissions(prev => {
          const newSet = new Set(prev);
          newSet.delete(mission._id);
          return newSet;
        });
      }, 2000);
    }
  };

  const getFilteredMissionsByTab = () => {
    const filteredBySearch = missions.filter(mission => {
      const matchesSearch = mission.name?.toLowerCase().includes(searchTerm.toLowerCase()) || mission.description?.toLowerCase().includes(searchTerm.toLowerCase()) || mission.droneModelSn?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
    switch (activeTab) {
      case 'pending':
        return filteredBySearch.filter(mission => mission.status === 'pending');
      case 'executing':
        return filteredBySearch.filter(mission => mission.status === 'executing');
      case 'completed':
        return filteredBySearch.filter(mission => mission.status === 'completed');
      default:
        return filteredBySearch;
    }
  };
  const filteredMissions = getFilteredMissionsByTab();

  const handleDelete = async mission => {
    try {
      await $w.cloud.callDataSource({
        dataSourceName: 'mission',
        methodName: 'wedaDeleteV2',
        params: {
          filter: { where: { _id: { $eq: mission._id } } }
        }
      });
      toast({
        title: '删除成功',
        description: `任务 "${mission.name}" 已删除`
      });
      loadMissions();
    } catch (error) {
      toast({
        title: '删除失败',
        description: error.message || '请检查网络连接',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = status => {
    const variants = {
      'pending': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100/80',
      'executing': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 hover:bg-orange-100/80',
      'completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-100/80'
    };
    const labels = {
      'pending': '待执行',
      'executing': '执行中',
      'completed': '已完成'
    };
    return (
      <Badge variant="secondary" className={`${variants[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </Badge>
    );
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingMission(null);
    loadMissions();
  };

  const handleNewTask = () => {
    setEditingMission(null);
    setShowForm(true);
  };

  const handleEditTask = mission => {
    setEditingMission(mission);
    setShowForm(true);
  };

  const canExecuteMission = mission => {
    return mission.status === 'pending';
  };

  const getStatusCounts = () => {
    const counts = {
      pending: 0,
      executing: 0,
      completed: 0
    };
    missions.forEach(mission => {
      if (counts.hasOwnProperty(mission.status)) {
        counts[mission.status]++;
      }
    });
    return counts;
  };
  const statusCounts = getStatusCounts();

  return (
    <MainLayout $w={$w}>
      <AuthGuard $w={$w}>
          <div style={style} className="space-y-6 animate-in fade-in duration-500">
        {/* 头部操作区 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1 w-full sm:w-auto flex items-center gap-4">
             <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="搜索任务名称、描述或无人机..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  className="pl-10 bg-background border-input w-full hover:border-primary transition-colors duration-200" 
                />
             </div>
          </div>
          <div className="flex space-x-2 w-full sm:w-auto">
            <Button onClick={loadMissions} variant="outline" className="flex-1 sm:flex-none">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? '刷新中' : '刷新'}
            </Button>
            <Button onClick={handleNewTask} className="flex-1 sm:flex-none bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              新建任务
            </Button>
          </div>
        </div>

        {/* 状态标签页 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted p-1 rounded-lg">
            <TabsTrigger value="pending" className="flex items-center space-x-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              <Clock className="h-4 w-4" />
              <span>待执行</span>
              {statusCounts.pending > 0 && (
                <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  {statusCounts.pending}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="executing" className="flex items-center space-x-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              <Loader className="h-4 w-4" />
              <span>执行中</span>
              {statusCounts.executing > 0 && (
                <Badge variant="secondary" className="ml-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                  {statusCounts.executing}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center space-x-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              <CheckCircle className="h-4 w-4" />
              <span>已完成</span>
              {statusCounts.completed > 0 && (
                <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  {statusCounts.completed}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* 任务列表区域 */}
          <div className="mt-6">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredMissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-card border border-dashed border-border rounded-lg text-center">
                <div className="text-muted-foreground/50 mb-4">
                  <Play className="h-16 w-16 mx-auto opacity-20" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {activeTab === 'pending' && '暂无待执行任务'}
                  {activeTab === 'executing' && '暂无执行中任务'}
                  {activeTab === 'completed' && '暂无已完成任务'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">创建新的飞行任务开始管理</p>
                <Button onClick={handleNewTask} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  新建任务
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredMissions.map(mission => (
                  <Card key={mission._id} className="bg-card border-border shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-200">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base font-semibold text-foreground">{mission.name}</CardTitle>
                          <CardDescription className="text-xs text-muted-foreground mt-1">
                            #{mission.missionID}
                          </CardDescription>
                        </div>
                        {getStatusBadge(mission.status)}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4 pt-0">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">无人机</span>
                          <span className="font-medium text-foreground">{mission.droneModelSn || mission.droneId || '未选择'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">航线</span>
                          <span className="font-medium text-foreground">{mission.airlineName || mission.airlineId || '未选择'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">最高速度</span>
                          <div className="flex items-center space-x-1">
                            <Gauge className="h-3 w-3 text-blue-500" />
                            <span className="font-medium text-foreground">{mission.maxSpeed || 5} m/s</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">重复次数</span>
                          <div className="flex items-center space-x-1">
                            <Repeat className="h-3 w-3 text-green-500" />
                            <span className="font-medium text-foreground">
                              {mission.repeatCount === 0 ? '1次' : `${mission.repeatCount + 1}次`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {mission.description && (
                        <div className="pt-3 border-t border-border">
                          <p className="text-xs text-muted-foreground line-clamp-2">{mission.description}</p>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-3 border-t border-border mt-2">
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditTask(mission)} className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10">
                            <Edit className="h-3 w-3 mr-1" />
                            编辑
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(mission)} className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-3 w-3 mr-1" />
                            删除
                          </Button>
                        </div>
                        
                        <div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleExecuteMission(mission)} 
                            disabled={!canExecuteMission(mission) || executingMissions.has(mission._id)} 
                            className={`h-8 border-primary/20 text-primary hover:bg-primary/10 hover:text-primary ${executingMissions.has(mission._id) ? 'opacity-70' : ''}`}
                          >
                            {executingMissions.has(mission._id) ? (
                              <>
                                <Loader className="h-3 w-3 mr-1 animate-spin" />
                                执行中
                              </>
                            ) : (
                              <>
                                <Play className="h-3 w-3 mr-1" />
                                立即执行
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Tabs>

        {/* 任务表单弹窗 */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="w-[800px] h-[800px] bg-background border-border text-foreground transition-all duration-300 flex flex-col p-0">
            <DialogHeader className="p-6 pb-2 border-b border-border">
              <DialogTitle>
                {editingMission ? '编辑飞行任务' : '新建飞行任务'}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 max-h-[800px] overflow-y-auto custom-scrollbar">
               <MissionForm 
                mission={editingMission} 
                $w={$w} 
                onSave={handleFormSuccess} 
                onCancel={() => {
                  setShowForm(false);
                  setEditingMission(null);
                }} 
              />
            </div>
          </DialogContent>
          </Dialog>
        </div>
        </AuthGuard>
      </MainLayout>
  );
}
