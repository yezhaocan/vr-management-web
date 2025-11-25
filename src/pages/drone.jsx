// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, useToast, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Label, DialogDescription } from '@/components/ui';
// @ts-ignore;
import { Plus, Wifi, Battery, MapPin, Settings, Edit, Trash2, RotateCcw, Drone, Signal, Calendar, Upload, Download, RefreshCw, X, Factory, Home } from 'lucide-react';

// @ts-ignore;
import { AuthGuard } from '@/components/AuthGuard';
export default function DroneManagement(props) {
  const {
    $w,
    style
  } = props;
  const {
    toast
  } = useToast();
  const [drones, setDrones] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingDrone, setEditingDrone] = useState(null);
  const [newDrone, setNewDrone] = useState({
    sn: '',
    model: '',
    manufacturer: '',
    firmware: '',
    battery: 100,
    location: '',
    lastCommunicationTime: '',
    lastUpdate: ''
  });
  const [loading, setLoading] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [returningHome, setReturningHome] = useState({}); // 记录每个无人机的返航状态

  useEffect(() => {
    // 检查登录状态
    if (!$w.auth.currentUser) {
      $w.utils.redirectTo({
        pageId: 'login',
        params: {
          redirect: 'drone'
        }
      });
      return;
    }
    loadDrones();
  }, []);

  // 加载无人机列表
  const loadDrones = async () => {
    try {
      setLoading(true);
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'drone',
        methodName: 'wedaGetRecordsV2',
        params: {
          select: {
            $master: true
          },
          filter: {
            where: {} // 查询所有无人机，移除景区过滤
          },
          pageSize: 100,
          pageNumber: 1,
          orderBy: [{
            createdAt: 'desc'
          }]
        }
      });
      setDrones(result.records || []);
    } catch (error) {
      console.error('数据加载失败:', error);
      toast({
        title: '数据加载失败',
        description: error.message || '请检查网络连接',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // 一键返航功能 - 调用flight_control云函数
  const handleReturnHome = async drone => {
    try {
      // 设置返航状态
      setReturningHome(prev => ({
        ...prev,
        [drone._id]: true
      }));

      // 调用flight_control云函数，path传入/drone/goHome
      const result = await $w.cloud.callFunction({
        name: 'flight_control',
        data: {
          path: '/drone/goHome',
          method: 'POST',
          body: {
            droneId: drone._id,
            droneSn: drone.sn,
            action: 'goHome'
          }
        }
      });
      toast({
        title: '返航指令已发送',
        description: `无人机 ${drone.sn} 正在返航...`,
        variant: 'default'
      });
      console.log('返航指令调用结果:', result);
    } catch (error) {
      console.error('返航指令发送失败:', error);
      toast({
        title: '返航指令发送失败',
        description: error.message || '请检查网络连接',
        variant: 'destructive'
      });
    } finally {
      // 清除返航状态
      setTimeout(() => {
        setReturningHome(prev => ({
          ...prev,
          [drone._id]: false
        }));
      }, 2000);
    }
  };

  // 创建或更新无人机
  const handleCreateDrone = async () => {
    if (!newDrone.sn || !newDrone.model) {
      toast({
        title: '操作失败',
        description: '请填写序列号和型号',
        variant: 'destructive'
      });
      return;
    }
    try {
      setDialogLoading(true);
      const droneData = {
        sn: newDrone.sn,
        model: newDrone.model,
        manufacturer: newDrone.manufacturer || '',
        firmware: newDrone.firmware || 'v1.0.0',
        // 状态字段不再由用户设置
        battery: editingDrone ? editingDrone.battery : 100,
        location: newDrone.location || '设备库',
        lastCommunicationTime: editingDrone ? editingDrone.lastCommunicationTime : new Date().getTime(),
        lastUpdate: editingDrone ? editingDrone.lastUpdate : new Date().toLocaleString('zh-CN'),
        updatedAt: new Date().getTime()
      };
      if (editingDrone) {
        // 更新现有设备
        await $w.cloud.callDataSource({
          dataSourceName: 'drone',
          methodName: 'wedaUpdateV2',
          params: {
            data: droneData,
            filter: {
              where: {
                _id: {
                  $eq: editingDrone._id
                }
              }
            }
          }
        });
        toast({
          title: '更新成功',
          description: `设备 ${newDrone.sn} 已更新`
        });
      } else {
        // 创建新设备
        droneData.createdAt = new Date().getTime();
        await $w.cloud.callDataSource({
          dataSourceName: 'drone',
          methodName: 'wedaCreateV2',
          params: {
            data: droneData
          }
        });
        toast({
          title: '创建成功',
          description: `设备 ${newDrone.sn} 已创建`
        });
      }

      // 重置表单并刷新列表
      setNewDrone({
        sn: '',
        model: '',
        manufacturer: '',
        firmware: '',
        battery: 100,
        location: '',
        lastCommunicationTime: '',
        lastUpdate: ''
      });
      setEditingDrone(null);
      setShowCreateDialog(false);
      loadDrones();
    } catch (error) {
      toast({
        title: '操作失败',
        description: error.message || '请检查网络连接',
        variant: 'destructive'
      });
    } finally {
      setDialogLoading(false);
    }
  };

  // 删除无人机
  const handleDeleteDrone = async drone => {
    try {
      await $w.cloud.callDataSource({
        dataSourceName: 'drone',
        methodName: 'wedaDeleteV2',
        params: {
          filter: {
            where: {
              _id: {
                $eq: drone._id
              }
            }
          }
        }
      });
      toast({
        title: '删除成功',
        description: `设备 ${drone.sn} 已删除`
      });
      loadDrones();
    } catch (error) {
      toast({
        title: '删除失败',
        description: error.message || '请检查网络连接',
        variant: 'destructive'
      });
    }
  };

  // 编辑无人机时，状态字段设为只读
  const handleEditDrone = drone => {
    setEditingDrone(drone);
    setNewDrone({
      sn: drone.sn || '',
      model: drone.model || '',
      manufacturer: drone.manufacturer || '',
      firmware: drone.firmware || '',
      // 状态字段不设置到表单中
      battery: drone.battery || 100,
      location: drone.location || '',
      lastCommunicationTime: drone.lastCommunicationTime || '',
      lastUpdate: drone.lastUpdate || ''
    });
    setShowCreateDialog(true);
  };

  // 优化状态显示 - 保持与设备编号对齐高度
  const getStatusDisplay = status => {
    const statusConfig = {
      online: {
        bg: 'bg-gradient-to-r from-green-500/20 to-green-600/20',
        border: 'border-green-500/40',
        icon: 'text-green-400',
        dot: 'bg-green-400',
        text: 'text-green-300',
        label: '在线'
      },
      offline: {
        bg: 'bg-gradient-to-r from-gray-500/20 to-gray-600/20',
        border: 'border-gray-500/40',
        icon: 'text-gray-400',
        dot: 'bg-gray-400',
        text: 'text-gray-300',
        label: '离线'
      },
      maintenance: {
        bg: 'bg-gradient-to-r from-orange-500/20 to-orange-600/20',
        border: 'border-orange-500/40',
        icon: 'text-orange-400',
        dot: 'bg-orange-400',
        text: 'text-orange-300',
        label: '维护中'
      },
      flying: {
        bg: 'bg-gradient-to-r from-blue-500/20 to-blue-600/20',
        border: 'border-blue-500/40',
        icon: 'text-blue-400',
        dot: 'bg-blue-400',
        text: 'text-blue-300',
        label: '飞行中'
      }
    };
    const config = statusConfig[status] || statusConfig.offline;
    return <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${config.bg} ${config.border} border backdrop-blur-sm h-8`}>
        <div className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`}></div>
        <span className={`text-xs font-medium ${config.text}`}>{config.label}</span>
      </div>;
  };
  const getBatteryColor = level => {
    if (level > 70) return 'text-green-400';
    if (level > 30) return 'text-yellow-400';
    return 'text-red-400';
  };
  const handleRefresh = () => {
    loadDrones();
    toast({
      title: '数据已刷新',
      description: '设备列表已更新'
    });
  };

  // 格式化时间显示
  const formatTime = timestamp => {
    if (!timestamp) return '未知';
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN');
  };

  // 修复弹窗关闭逻辑
  const handleDialogClose = () => {
    setShowCreateDialog(false);
    setEditingDrone(null);
    setNewDrone({
      sn: '',
      model: '',
      manufacturer: '',
      firmware: '',
      battery: 100,
      location: '',
      lastCommunicationTime: '',
      lastUpdate: ''
    });
    setDialogLoading(false);
  };

  // 处理弹窗状态变化
  const handleOpenChange = open => {
    if (!open) {
      handleDialogClose();
    } else {
      setShowCreateDialog(true);
    }
  };
  return <AuthGuard $w={$w}>
      <div style={style} className="min-h-screen bg-gray-900">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Drone className="h-8 w-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">无人机管理</h1>
                <p className="text-gray-400">系统无人机设备管理</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleRefresh} className="border-gray-600 text-gray-300 hover:text-white" disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {loading ? '加载中...' : '刷新'}
              </Button>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                添加设备
              </Button>
            </div>
          </div>

          {/* 加载状态 */}
          {loading && <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-300">加载中...</span>
            </div>}

          {/* 统计卡片 - 优化为暗色主题，移除平均电量统计 */}
          {!loading && <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-600/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-400">在线设备</CardTitle>
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-full flex items-center justify-center border border-green-500/30">
                    <Wifi className="h-4 w-4 text-green-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {drones.filter(d => d.status === 'online').length}
                  </div>
                  <p className="text-xs text-gray-400">当前活跃设备</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-600/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-400">总设备数</CardTitle>
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-full flex items-center justify-center border border-blue-500/30">
                    <Drone className="h-4 w-4 text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{drones.length}</div>
                  <p className="text-xs text-gray-400">已注册设备</p>
                </CardContent>
              </Card>
            </div>}

          {/* 设备列表 - 优化后的卡片布局 */}
          {!loading && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {drones.length === 0 ? <div className="col-span-full text-center py-12">
                  <Drone className="h-16 w-16 mx-auto mb-4 text-gray-500" />
                  <h3 className="text-lg font-medium text-gray-300">暂无设备</h3>
                  <p className="text-gray-500 mt-2">点击"添加设备"创建第一台无人机</p>
                </div> : drones.map(drone => <Card key={drone._id} className="bg-gray-800/50 border-gray-700 hover:border-blue-500/30 transition-all duration-200 min-w-[320px] group">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Drone className={`h-6 w-6 ${drone.status === 'online' ? 'text-green-400' : drone.status === 'maintenance' ? 'text-orange-400' : 'text-gray-400'}`} />
                        <div className="min-w-0">
                          <CardTitle className="text-white text-lg truncate" title={drone.sn}>{drone.sn}</CardTitle>
                          <CardDescription className="text-gray-400">型号: {drone.model}</CardDescription>
                        </div>
                      </div>
                      {/* 优化后的状态显示 - 保持与设备编号对齐高度 */}
                      {getStatusDisplay(drone.status)}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* 状态信息 */}
                    <div className="grid grid-cols-1 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Battery className={`h-4 w-4 ${getBatteryColor(drone.battery)}`} />
                        <span className="text-gray-300">电量</span>
                        <span className={getBatteryColor(drone.battery)}>{drone.battery || 0}%</span>
                      </div>
                    </div>

                    {/* 设备信息 */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Factory className="h-4 w-4 text-blue-400" />
                        <span className="text-gray-300">厂商</span>
                        <span className="text-white text-xs truncate" title={drone.manufacturer}>{drone.manufacturer || '未设置'}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-green-400" />
                        <span className="text-gray-300">位置</span>
                        <span className="text-white text-xs truncate" title={drone.location}>{drone.location || '未知'}</span>
                      </div>
                    </div>

                    {/* 序列号和固件 */}
                    <div className="text-xs text-gray-400 space-y-1">
                      <div className="truncate" title={drone.sn}>序列号: {drone.sn}</div>
                      <div>固件: {drone.firmware || 'v1.0.0'}</div>
                    </div>

                    {/* 最后通信时间 */}
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <Calendar className="h-3 w-3" />
                      <span>最后通信: {formatTime(drone.lastCommunicationTime)}</span>
                    </div>

                    {/* 操作按钮组 - 调整顺序：修改、删除、一键返航 */}
                    <div className="flex space-x-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1 border-gray-600 text-gray-300 hover:text-white hover:border-blue-500/50" onClick={() => handleEditDrone(drone)}>
                        <Edit className="h-3 w-3 mr-1" />
                        修改
                      </Button>
                      <Button variant="outline" size="sm" className="border-red-600 text-red-400 hover:text-red-300 hover:border-red-500/50" onClick={() => handleDeleteDrone(drone)}>
                        <Trash2 className="h-3 w-3 mr-1" />
                        删除
                      </Button>
                      <Button variant="outline" size="sm" className="border-green-600 text-green-400 hover:text-green-300 hover:border-green-500/50" onClick={() => handleReturnHome(drone)} disabled={returningHome[drone._id]}>
                        {returningHome[drone._id] ? <>
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            返航中
                          </> : <>
                            <Home className="h-3 w-3 mr-1" />
                            一键返航
                          </>}
                      </Button>
                    </div>
                  </CardContent>
                </Card>)}
            </div>}

          {/* 创建/编辑设备对话框 - 修复关闭逻辑 */}
          <Dialog open={showCreateDialog} onOpenChange={handleOpenChange}>
            <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingDrone ? '编辑设备' : '新建设备'}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  {editingDrone ? '修改设备信息' : '创建新的无人机设备'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">序列号 *</Label>
                    <Input value={newDrone.sn} onChange={e => setNewDrone(prev => ({
                    ...prev,
                    sn: e.target.value
                  }))} className="bg-gray-700 border-gray-600 text-white" placeholder="请输入序列号" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">设备型号 *</Label>
                    <Input value={newDrone.model} onChange={e => setNewDrone(prev => ({
                    ...prev,
                    model: e.target.value
                  }))} className="bg-gray-700 border-gray-600 text-white" placeholder="请输入设备型号" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">厂商</Label>
                    <Input value={newDrone.manufacturer} onChange={e => setNewDrone(prev => ({
                    ...prev,
                    manufacturer: e.target.value
                  }))} className="bg-gray-700 border-gray-600 text-white" placeholder="请输入厂商名称" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">固件版本</Label>
                    <Input value={newDrone.firmware} onChange={e => setNewDrone(prev => ({
                    ...prev,
                    firmware: e.target.value
                  }))} className="bg-gray-700 border-gray-600 text-white" placeholder="请输入固件版本" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">当前位置</Label>
                  <Input value={newDrone.location} onChange={e => setNewDrone(prev => ({
                  ...prev,
                  location: e.target.value
                }))} className="bg-gray-700 border-gray-600 text-white" placeholder="请输入设备位置" />
                </div>

                {/* 只读字段展示区域 */}
                {editingDrone && <div className="bg-gray-700/30 rounded-lg p-3 space-y-2">
                    <Label className="text-gray-400 text-sm">只读信息（通过外部平台同步）</Label>
                    <div className="grid grid-cols-1 gap-4 text-xs">
                      <div className="flex items-center space-x-2">
                        <Wifi className="h-3 w-3 text-blue-400" />
                        <span className="text-gray-400">状态:</span>
                        <span className="text-white">{editingDrone.status || '未知'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Battery className="h-3 w-3 text-green-400" />
                        <span className="text-gray-400">电量:</span>
                        <span className="text-white">{editingDrone.battery || 0}%</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-3 w-3 text-purple-400" />
                        <span className="text-gray-400">最后通信:</span>
                        <span className="text-white">{formatTime(editingDrone.lastCommunicationTime)}</span>
                      </div>
                    </div>
                  </div>}
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={handleDialogClose} className="border-gray-600 text-gray-300" disabled={dialogLoading}>
                  取消
                </Button>
                <Button onClick={handleCreateDrone} disabled={dialogLoading} className="bg-blue-500 hover:bg-blue-600">
                  {dialogLoading ? '处理中...' : editingDrone ? '更新设备' : '创建设备'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AuthGuard>;
}