// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, useToast, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Label, DialogDescription } from '@/components/ui';
// @ts-ignore;
import { Plus, Wifi, Battery, MapPin, Edit, Trash2, Drone, Calendar, RefreshCw, Factory, Home, Signal, Search } from 'lucide-react';
// @ts-ignore;
import { AuthGuard } from '@/components/AuthGuard';
import { MainLayout } from './MainLayout';

export default function DroneManagement(props) {
  const { $w, style } = props;
  const { toast } = useToast();
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
  const [returningHome, setReturningHome] = useState({});

  useEffect(() => {
    if (!$w.auth.currentUser) {
      $w.utils.redirectTo({
        pageId: 'login',
        params: { redirect: 'drone' }
      });
      return;
    }
    loadDrones();
  }, []);

  const loadDrones = async () => {
    try {
      setLoading(true);
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'drone',
        methodName: 'wedaGetRecordsV2',
        params: {
          select: { $master: true },
          filter: { where: {} },
          pageSize: 100,
          pageNumber: 1,
          orderBy: [{ createdAt: 'desc' }]
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

  const handleReturnHome = async drone => {
    try {
      setReturningHome(prev => ({ ...prev, [drone._id]: true }));
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
    } catch (error) {
      console.error('返航指令发送失败:', error);
      toast({
        title: '返航指令发送失败',
        description: error.message || '请检查网络连接',
        variant: 'destructive'
      });
    } finally {
      setTimeout(() => {
        setReturningHome(prev => ({ ...prev, [drone._id]: false }));
      }, 2000);
    }
  };

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
        battery: editingDrone ? editingDrone.battery : 100,
        location: newDrone.location || '设备库',
        lastCommunicationTime: editingDrone ? editingDrone.lastCommunicationTime : new Date().getTime(),
        lastUpdate: editingDrone ? editingDrone.lastUpdate : new Date().toLocaleString('zh-CN'),
        updatedAt: new Date().getTime()
      };
      if (editingDrone) {
        await $w.cloud.callDataSource({
          dataSourceName: 'drone',
          methodName: 'wedaUpdateV2',
          params: {
            data: droneData,
            filter: { where: { _id: { $eq: editingDrone._id } } }
          }
        });
        toast({ title: '更新成功', description: `设备 ${newDrone.sn} 已更新` });
      } else {
        droneData.createdAt = new Date().getTime();
        await $w.cloud.callDataSource({
          dataSourceName: 'drone',
          methodName: 'wedaCreateV2',
          params: { data: droneData }
        });
        toast({ title: '创建成功', description: `设备 ${newDrone.sn} 已创建` });
      }

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

  const handleDeleteDrone = async drone => {
    try {
      await $w.cloud.callDataSource({
        dataSourceName: 'drone',
        methodName: 'wedaDeleteV2',
        params: {
          filter: { where: { _id: { $eq: drone._id } } }
        }
      });
      toast({ title: '删除成功', description: `设备 ${drone.sn} 已删除` });
      loadDrones();
    } catch (error) {
      toast({
        title: '删除失败',
        description: error.message || '请检查网络连接',
        variant: 'destructive'
      });
    }
  };

  const handleEditDrone = drone => {
    setEditingDrone(drone);
    setNewDrone({
      sn: drone.sn || '',
      model: drone.model || '',
      manufacturer: drone.manufacturer || '',
      firmware: drone.firmware || '',
      battery: drone.battery || 100,
      location: drone.location || '',
      lastCommunicationTime: drone.lastCommunicationTime || '',
      lastUpdate: drone.lastUpdate || ''
    });
    setShowCreateDialog(true);
  };

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

  const handleOpenChange = open => {
    if (!open) handleDialogClose();
    else setShowCreateDialog(true);
  };

  const formatTime = timestamp => {
    if (!timestamp) return '未知';
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN');
  };

  const getStatusDisplay = status => {
    const statusConfig = {
      online: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-400',
        dot: 'bg-green-500',
        label: '在线'
      },
      offline: {
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-700 dark:text-gray-400',
        dot: 'bg-gray-500',
        label: '离线'
      },
      maintenance: {
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        text: 'text-orange-700 dark:text-orange-400',
        dot: 'bg-orange-500',
        label: '维护中'
      },
      flying: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-400',
        dot: 'bg-blue-500',
        label: '飞行中'
      }
    };
    const config = statusConfig[status] || statusConfig.offline;
    return (
      <div className={`flex items-center space-x-2 px-2.5 py-0.5 rounded-full ${config.bg}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`}></div>
        <span className={`text-xs font-medium ${config.text}`}>{config.label}</span>
      </div>
    );
  };

  const getBatteryColor = level => {
    if (level > 70) return 'text-green-500 dark:text-green-400';
    if (level > 30) return 'text-yellow-500 dark:text-yellow-400';
    return 'text-red-500 dark:text-red-400';
  };

  return (
    <MainLayout $w={$w}>
      <AuthGuard $w={$w}>
          <div style={style} className="space-y-6 animate-in fade-in duration-500">
        
        {/* 顶部工具栏 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1 w-full sm:w-auto flex items-center gap-4">
             <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="搜索设备..." 
                  className="pl-10 bg-background border-input w-full hover:border-primary transition-colors duration-200" 
                />
             </div>
          </div>
          <div className="flex space-x-2 w-full sm:w-auto">
            <Button variant="outline" onClick={loadDrones} className="flex-1 sm:flex-none" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? '刷新中' : '刷新列表'}
            </Button>
            <Button onClick={() => setShowCreateDialog(true)} className="flex-1 sm:flex-none bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              添加设备
            </Button>
          </div>
        </div>

        {/* 统计概览 */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">在线设备</CardTitle>
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {drones.filter(d => d.status === 'online').length}
                </div>
                <p className="text-xs text-muted-foreground">当前实时在线</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">总设备数</CardTitle>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Drone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{drones.length}</div>
                <p className="text-xs text-muted-foreground">已注册入网</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 设备列表 */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drones.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 bg-card border border-dashed border-border rounded-lg">
                <Drone className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-foreground">暂无设备</h3>
                <p className="text-sm text-muted-foreground mt-2">点击上方"添加设备"按钮开始接入</p>
              </div>
            ) : (
              drones.map(drone => (
                <Card key={drone._id} className="bg-card border-border shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-200 group">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className={`p-2 rounded-lg ${drone.status === 'online' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                          <Drone className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base font-semibold text-foreground truncate" title={drone.sn}>
                            {drone.sn}
                          </CardTitle>
                          <CardDescription className="truncate text-xs">
                            {drone.model}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusDisplay(drone.status)}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Battery className={`h-4 w-4 ${getBatteryColor(drone.battery)}`} />
                        <span className="text-muted-foreground text-xs">电量</span>
                        <span className={`font-medium ${getBatteryColor(drone.battery)}`}>{drone.battery || 0}%</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Signal className="h-4 w-4 text-blue-500" />
                        <span className="text-muted-foreground text-xs">信号</span>
                        <span className="text-foreground text-xs font-medium">良好</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-border">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center">
                          <Factory className="h-3 w-3 mr-1" /> 厂商
                        </span>
                        <span className="text-foreground font-medium truncate max-w-[120px]" title={drone.manufacturer}>{drone.manufacturer || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center">
                          <MapPin className="h-3 w-3 mr-1" /> 位置
                        </span>
                        <span className="text-foreground font-medium truncate max-w-[120px]" title={drone.location}>{drone.location || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center">
                          <Calendar className="h-3 w-3 mr-1" /> 更新
                        </span>
                        <span className="text-foreground truncate max-w-[140px]">{formatTime(drone.lastCommunicationTime)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => handleEditDrone(drone)}>
                        <Edit className="h-3 w-3 mr-1" />
                        编辑
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30" onClick={() => handleDeleteDrone(drone)}>
                        <Trash2 className="h-3 w-3 mr-1" />
                        删除
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="flex-1 h-8 text-xs bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary border-primary/20" 
                        onClick={() => handleReturnHome(drone)} 
                        disabled={returningHome[drone._id]}
                      >
                        {returningHome[drone._id] ? (
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Home className="h-3 w-3 mr-1" />
                        )}
                        {returningHome[drone._id] ? '返航' : '返航'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* 创建/编辑设备对话框 */}
        <Dialog open={showCreateDialog} onOpenChange={handleOpenChange}>
          <DialogContent className="sm:max-w-[600px] bg-background border-border text-foreground">
            <DialogHeader>
              <DialogTitle>{editingDrone ? '编辑设备' : '新建设备'}</DialogTitle>
              <DialogDescription>
                {editingDrone ? '修改设备的基本信息和配置' : '录入新的无人机设备信息'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sn">序列号 <span className="text-destructive">*</span></Label>
                  <Input 
                    id="sn"
                    value={newDrone.sn} 
                    onChange={e => setNewDrone(prev => ({ ...prev, sn: e.target.value }))} 
                    placeholder="请输入设备SN码"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">设备型号 <span className="text-destructive">*</span></Label>
                  <Input 
                    id="model"
                    value={newDrone.model} 
                    onChange={e => setNewDrone(prev => ({ ...prev, model: e.target.value }))} 
                    placeholder="例如: Mavic 3" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">厂商名称</Label>
                  <Input 
                    id="manufacturer"
                    value={newDrone.manufacturer} 
                    onChange={e => setNewDrone(prev => ({ ...prev, manufacturer: e.target.value }))} 
                    placeholder="例如: DJI" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firmware">固件版本</Label>
                  <Input 
                    id="firmware"
                    value={newDrone.firmware} 
                    onChange={e => setNewDrone(prev => ({ ...prev, firmware: e.target.value }))} 
                    placeholder="例如: v1.0.0" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">部署位置</Label>
                <Input 
                  id="location"
                  value={newDrone.location} 
                  onChange={e => setNewDrone(prev => ({ ...prev, location: e.target.value }))} 
                  placeholder="请输入设备当前部署位置" 
                />
              </div>

              {editingDrone && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
                  <h4 className="font-medium text-muted-foreground">实时状态信息 (自动同步)</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">运行状态</span>
                      <span className="font-medium">{editingDrone.status || '未知'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">剩余电量</span>
                      <span className={`font-medium ${getBatteryColor(editingDrone.battery)}`}>{editingDrone.battery || 0}%</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">最后通信</span>
                      <span className="font-medium truncate">{formatTime(editingDrone.lastCommunicationTime)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleDialogClose} disabled={dialogLoading}>
                取消
              </Button>
              <Button onClick={handleCreateDrone} disabled={dialogLoading}>
                {dialogLoading ? '处理中...' : '保存提交'}
              </Button>
            </div>
          </DialogContent>
          </Dialog>
        </div>
        </AuthGuard>
      </MainLayout>
  );
}