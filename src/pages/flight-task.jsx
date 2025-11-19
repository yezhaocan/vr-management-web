// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, useToast, Dialog, DialogContent, DialogHeader, DialogTitle, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
// @ts-ignore;
import { Plus, Search, Filter, Edit, Trash2, Play, RefreshCw, Gauge, Repeat, Loader, Clock, CheckCircle, XCircle } from 'lucide-react';

import { MissionForm } from '@/components/MissionForm';
import { AuthGuard } from '@/components/AuthGuard';
export default function FlightTaskPage(props) {
  const {
    $w,
    style
  } = props;
  const {
    toast
  } = useToast();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingMission, setEditingMission] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [executingMissions, setExecutingMissions] = useState(new Set()); // 跟踪正在执行的任务
  const [activeTab, setActiveTab] = useState('pending'); // 状态标签页

  useEffect(() => {
    loadMissions();
  }, []);

  // 加载任务列表并关联无人机信息
  const loadMissions = async () => {
    try {
      setLoading(true);
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'mission',
        methodName: 'wedaGetRecordsV2',
        params: {
          select: {
            $master: true
          },
          filter: {
            where: {} // 查询所有任务，移除景区过滤
          },
          pageSize: 100,
          pageNumber: 1,
          orderBy: [{
            startTime: 'desc'
          }],
          getCount: true
        }
      });

      // 为每个任务加载无人机信息
      const missionsWithDroneInfo = await Promise.all((result.records || []).map(async mission => {
        if (mission.droneId) {
          try {
            const droneResult = await $w.cloud.callDataSource({
              dataSourceName: 'drone',
              methodName: 'wedaGetItemV2',
              params: {
                filter: {
                  where: {
                    _id: {
                      $eq: mission.droneId
                    }
                  }
                },
                select: {
                  $master: true
                }
              }
            });
            if (droneResult) {
              // 格式化无人机显示名称：sn·model
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

  // 立即执行飞行任务 - 调用flight_control云函数
  const handleExecuteMission = async mission => {
    try {
      // 设置执行状态
      setExecutingMissions(prev => new Set(prev).add(mission._id));

      // 加载航线信息以获取航点数据
      const airlineResult = await $w.cloud.callDataSource({
        dataSourceName: 'airline',
        methodName: 'wedaGetItemV2',
        params: {
          filter: {
            where: {
              _id: {
                $eq: mission.airlineId
              }
            }
          },
          select: {
            $master: true
          }
        }
      });
      if (!airlineResult || !airlineResult.waypoints || airlineResult.waypoints.length === 0) {
        throw new Error('航线数据不存在或没有配置航点');
      }

      // 构建waypoints数组，按照映射规则转换
      const waypoints = airlineResult.waypoints.map(waypoint => ({
        latitude: waypoint.lat,
        longitude: waypoint.lng,
        altitude: waypoint.altitude,
        speed: waypoint.flightSpeed,
        stay_time: waypoint.hoverDuration
      }));

      // 构建请求参数
      const requestBody = {
        mission_id: mission.missionID,
        global_speed: mission.maxSpeed,
        repeat_times: mission.repeatCount,
        auto_return_home: true,
        waypoints: waypoints
      };

      // 调用flight_control云函数
      const result = await $w.cloud.callFunction({
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

      // 重新加载任务列表以获取最新状态
      loadMissions();
    } catch (error) {
      console.error('执行任务失败:', error);
      toast({
        title: '执行任务失败',
        description: error.message || '请检查网络连接和航线配置',
        variant: 'destructive'
      });
    } finally {
      // 清除执行状态
      setTimeout(() => {
        setExecutingMissions(prev => {
          const newSet = new Set(prev);
          newSet.delete(mission._id);
          return newSet;
        });
      }, 2000);
    }
  };

  // 根据状态标签页过滤任务
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
          filter: {
            where: {
              _id: {
                $eq: mission._id
              }
            }
          }
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
      'pending': 'secondary',
      'executing': 'default',
      'completed': 'secondary'
    };
    const labels = {
      'pending': '待执行',
      'executing': '执行中',
      'completed': '已完成'
    };
    return <Badge variant={variants[status] || 'secondary'}>{labels[status] || status}</Badge>;
  };
  const getStatusLabel = status => {
    const labels = {
      'pending': '待执行',
      'executing': '执行中',
      'completed': '已完成'
    };
    return labels[status] || status;
  };
  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingMission(null);
    loadMissions();
  };

  // 新建任务处理函数
  const handleNewTask = () => {
    setEditingMission(null); // 确保editingMission为null
    setShowForm(true); // 打开弹窗
  };

  // 编辑任务处理函数
  const handleEditTask = mission => {
    setEditingMission(mission); // 设置要编辑的任务
    setShowForm(true); // 打开弹窗
  };

  // 检查任务是否允许执行
  const canExecuteMission = mission => {
    // 只有状态为"待执行"的任务才允许执行
    return mission.status === 'pending';
  };

  // 获取各状态任务数量
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
  return <AuthGuard $w={$w}>
      <div style={style} className="min-h-screen bg-gray-900">
        <div className="p-6 space-y-6">
          {/* 头部操作区 */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-white">飞行任务管理</h1>
              <p className="text-gray-400">管理无人机的飞行任务和调度，状态由外部平台自动同步</p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={loadMissions} variant="outline" className="border-gray-600 text-gray-300">
                <RefreshCw className="h-4 w-4 mr-2" />
                刷新
              </Button>
              <Button onClick={handleNewTask} className="bg-blue-500 hover:bg-blue-600">
                <Plus className="h-4 w-4 mr-2" />
                新建任务
              </Button>
            </div>
          </div>

          {/* 搜索和筛选 */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="搜索任务名称、描述或无人机..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="all">全部状态</option>
              <option value="pending">待执行</option>
              <option value="executing">执行中</option>
              <option value="completed">已完成</option>
            </select>
          </div>

          {/* 状态标签页 */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-800/50 border border-gray-700 rounded-lg p-1">
              <TabsTrigger value="pending" className="flex items-center space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Clock className="h-4 w-4" />
                <span>待执行</span>
                {statusCounts.pending > 0 && <Badge variant="secondary" className="ml-1 bg-blue-500/20 text-blue-300">
                    {statusCounts.pending}
                  </Badge>}
              </TabsTrigger>
              <TabsTrigger value="executing" className="flex items-center space-x-2 data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                <Loader className="h-4 w-4" />
                <span>执行中</span>
                {statusCounts.executing > 0 && <Badge variant="secondary" className="ml-1 bg-orange-500/20 text-orange-300">
                    {statusCounts.executing}
                  </Badge>}
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center space-x-2 data-[state=active]:bg-green-600 data-[state=active]:text-white">
                <CheckCircle className="h-4 w-4" />
                <span>已执行</span>
                {statusCounts.completed > 0 && <Badge variant="secondary" className="ml-1 bg-green-500/20 text-green-300">
                    {statusCounts.completed}
                  </Badge>}
              </TabsTrigger>
            </TabsList>

            {/* 任务列表区域 - 添加滚动条支持 */}
            <div className="mt-4">
              {loading ? <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-300">加载中...</span>
                </div> : filteredMissions.length === 0 ? <div className="text-center py-12">
                  <div className="text-gray-500 mb-4">
                    <Play className="h-16 w-16 mx-auto opacity-30" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-300 mb-2">
                    {activeTab === 'pending' && '暂无待执行任务'}
                    {activeTab === 'executing' && '暂无执行中任务'}
                    {activeTab === 'completed' && '暂无已完成任务'}
                  </h3>
                  <p className="text-gray-500 mb-4">创建新的飞行任务开始管理</p>
                  <Button onClick={handleNewTask} className="bg-blue-500 hover:bg-blue-600">
                    <Plus className="h-4 w-4 mr-2" />
                    新建任务
                  </Button>
                </div> : <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 max-h-[calc(100vh-300px)] overflow-y-auto pb-4">
                  {filteredMissions.map(mission => <Card key={mission._id} className="bg-gray-800/50 border-gray-700 hover:border-blue-500/30 transition-all duration-200">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-white text-lg">{mission.name}</CardTitle>
                            <CardDescription className="text-gray-400">
                              #{mission.missionID}
                            </CardDescription>
                          </div>
                          {getStatusBadge(mission.status)}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">无人机:</span>
                            <span className="text-white font-medium text-sm">{mission.droneModelSn || mission.droneId || '未选择'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">航线:</span>
                            <span className="text-white font-medium text-sm">{mission.airlineName || mission.airlineId || '未选择'}</span>
                          </div>
                          
                          {/* 显示最高飞行速度 */}
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">最高速度:</span>
                            <div className="flex items-center space-x-1">
                              <Gauge className="h-3 w-3 text-blue-400" />
                              <span className="text-white font-medium text-sm">{mission.maxSpeed || 5} m/s</span>
                            </div>
                          </div>
                          
                          {/* 显示重复飞行次数 */}
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">重复次数:</span>
                            <div className="flex items-center space-x-1">
                              <Repeat className="h-3 w-3 text-green-400" />
                              <span className="text-white font-medium text-sm">
                                {mission.repeatCount === 0 ? '1次' : `${mission.repeatCount + 1}次`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {mission.description && <div className="mt-3 pt-3 border-t border-gray-700">
                            <p className="text-gray-400 text-sm line-clamp-2">{mission.description}</p>
                          </div>}

                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-700">
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditTask(mission)} className="text-blue-400 border-blue-400 hover:bg-blue-400/10">
                              <Edit className="h-3 w-3 mr-1" />
                              编辑
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(mission)} className="text-red-400 border-red-400 hover:bg-red-400/10">
                              <Trash2 className="h-3 w-3 mr-1" />
                              删除
                            </Button>
                          </div>
                          
                          <div className="flex space-x-1">
                            {/* 立即执行按钮 - 根据状态控制是否可用 */}
                            <Button variant="outline" size="sm" onClick={() => handleExecuteMission(mission)} disabled={!canExecuteMission(mission) || executingMissions.has(mission._id)} className="text-green-400 border-green-400 hover:bg-green-400/10 disabled:opacity-50 disabled:cursor-not-allowed">
                              {executingMissions.has(mission._id) ? <>
                                  <Loader className="h-3 w-3 mr-1 animate-spin" />
                                  执行中
                                </> : <>
                                  <Play className="h-3 w-3 mr-1" />
                                  立即执行
                                </>}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>)}
                </div>}
            </div>
          </Tabs>

          {/* 任务表单弹窗 */}
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingMission ? '编辑飞行任务' : '新建飞行任务'}
                </DialogTitle>
              </DialogHeader>
              <MissionForm mission={editingMission} $w={$w} onSave={handleFormSuccess} onCancel={() => {
              setShowForm(false);
              setEditingMission(null);
            }} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AuthGuard>;
}