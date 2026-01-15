// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea, useToast, Card, CardContent, Badge } from '@/components/ui';
// @ts-ignore;
import { Clock, Save, X, Gauge, Repeat, MapPin, Navigation, Play, CheckCircle, Wifi } from 'lucide-react';

import { DroneList } from './DroneList';
import { AirlineList } from './AirlineList';
export function MissionForm({
  mission,
  $w,
  onSave,
  onCancel
}) {
  const {
    toast
  } = useToast();
  const [formData, setFormData] = useState({
    name: mission?.name || '',
    description: mission?.description || '',
    droneSn: mission?.droneSn || '',
    airlineId: mission?.airlineId || '',
    maxSpeed: mission?.maxSpeed || 5,
    repeatCount: mission?.repeatCount || 0
  });
  const [selectedDrone, setSelectedDrone] = useState(null);
  const [selectedAirline, setSelectedAirline] = useState(null);
  const [loading, setLoading] = useState(false);
  const [airlineWaypoints, setAirlineWaypoints] = useState(0);
  const [airlines, setAirlines] = useState([]); // 新增：存储航线列表

  // 加载航线列表
  const loadAirlines = async () => {
    try {
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'airline',
        methodName: 'wedaGetRecordsV2',
        params: {
          select: {
            $master: true
          },
          filter: {
            where: {} // 查询所有航线
          },
          pageSize: 100,
          pageNumber: 1,
          orderBy: [{
            createdAt: 'desc'
          }],
          getCount: true
        }
      });
      setAirlines(result.records || []);
    } catch (error) {
      console.error('加载航线列表失败:', error);
      toast({
        title: '加载航线失败',
        description: error.message || '请检查网络连接',
        variant: 'destructive'
      });
    }
  };

  // 获取航线航点数量
  const getAirlineWaypointCount = async airlineId => {
    if (!airlineId) return 0;
    try {
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'airline',
        methodName: 'wedaGetItemV2',
        params: {
          filter: {
            where: {
              _id: {
                $eq: airlineId
              }
            }
          },
          select: {
            $master: true
          }
        }
      });
      return result?.waypoints?.length || result?.waypointCount || 0;
    } catch (error) {
      console.error('获取航线航点数量失败:', error);
      return 0;
    }
  };
  useEffect(() => {
    // 加载航线列表
    loadAirlines();
    if (mission?.droneSn) {
      loadDroneInfoBySn(mission.droneSn);
    }
    if (mission?.airlineId) {
      loadAirlineInfo(mission.airlineId);
    }
    if (mission) {
      setFormData(prev => ({
        ...prev,
        maxSpeed: mission.maxSpeed || 5,
        repeatCount: mission.repeatCount || 0
      }));
    }
  }, [mission]);

  // 根据序列号加载无人机信息
  const loadDroneInfoBySn = async droneSn => {
    try {
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'drone',
        methodName: 'wedaGetRecordsV2',
        params: {
          filter: {
            where: {
              sn: {
                $eq: droneSn
              }
            }
          },
          select: {
            $master: true
          }
        }
      });
      if (result.records && result.records.length > 0) {
        const drone = result.records[0];
        setSelectedDrone(drone);
        const droneDisplayName = `${drone.sn || '未知序列号'}·${drone.model || '未知型号'}`;
        setFormData(prev => ({
          ...prev,
          droneModelSn: droneDisplayName
        }));
      }
    } catch (error) {
      console.error('根据序列号加载无人机信息失败:', error);
    }
  };
  const loadAirlineInfo = async airlineId => {
    try {
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'airline',
        methodName: 'wedaGetItemV2',
        params: {
          filter: {
            where: {
              _id: {
                $eq: airlineId
              }
            }
          },
          select: {
            $master: true
          }
        }
      });
      setSelectedAirline(result);
      // 获取航点数量
      const waypointCount = result?.waypoints?.length || result?.waypointCount || 0;
      setAirlineWaypoints(waypointCount);
    } catch (error) {
      console.error('加载航线信息失败:', error);
    }
  };
  const handleDroneSelect = drone => {
    setSelectedDrone(drone);
    const droneDisplayName = `${drone.sn || '未知序列号'}·${drone.model || '未知型号'}`;
    setFormData(prev => ({
      ...prev,
      droneSn: drone.sn,
      droneModelSn: droneDisplayName
    }));
  };
  const handleAirlineSelect = async airline => {
    setSelectedAirline(airline);
    setFormData(prev => ({
      ...prev,
      airlineId: airline._id,
      airlineName: airline.name
    }));
    // 获取航点数量
    const waypointCount = airline?.waypoints?.length || airline?.waypointCount || 0;
    setAirlineWaypoints(waypointCount);
  };
  const handleSubmit = async e => {
    e.preventDefault();
    if (!formData.name || !formData.droneSn || !formData.airlineId) {
      toast({
        title: '表单验证失败',
        description: '请填写任务名称并选择无人机和航线',
        variant: 'destructive'
      });
      return;
    }
    if (!formData.maxSpeed || formData.maxSpeed <= 0) {
      toast({
        title: '表单验证失败',
        description: '最高飞行速度必须大于0',
        variant: 'destructive'
      });
      return;
    }
    if (formData.repeatCount < 0) {
      toast({
        title: '表单验证失败',
        description: '重复飞行次数不能为负数',
        variant: 'destructive'
      });
      return;
    }
    setLoading(true);
    try {
      // 生成自增任务编号
      let missionID = mission?.missionID;
      if (!missionID) {
        // 获取当前最大任务编号
        const result = await $w.cloud.callDataSource({
          dataSourceName: 'mission',
          methodName: 'wedaGetRecordsV2',
          params: {
            select: {
              missionID: true
            },
            orderBy: [{
              missionID: 'desc'
            }],
            pageSize: 1
          }
        });
        const maxMissionID = result.records?.[0]?.missionID || 0;
        missionID = maxMissionID + 1;
      }
      const missionData = {
        ...formData,
        missionID: missionID,
        status: mission?.status || 'pending',
        startTime: mission?.startTime || Date.now(),
        current_waypoint_index: mission?.current_waypoint_index || 0
      };
      delete missionData.scenic;
      if (mission?._id) {
        await $w.cloud.callDataSource({
          dataSourceName: 'mission',
          methodName: 'wedaUpdateV2',
          params: {
            filter: {
              where: {
                _id: {
                  $eq: mission._id
                }
              }
            },
            data: missionData
          }
        });
        toast({
          title: '任务更新成功',
          description: `任务 "${formData.name}" 已更新`
        });
      } else {
        await $w.cloud.callDataSource({
          dataSourceName: 'mission',
          methodName: 'wedaCreateV2',
          params: {
            data: missionData
          }
        });
        toast({
          title: '任务创建成功',
          description: `任务 "${formData.name}" 已创建`
        });
      }
      onSave && onSave();
    } catch (error) {
      toast({
        title: '操作失败',
        description: error.message || '请检查网络连接',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 获取状态徽章
  const getStatusBadge = status => {
    const variants = {
      'pending': 'secondary',
      'executing': 'default',
      'completed': 'secondary',
      'cancelled': 'destructive'
    };
    const labels = {
      'pending': '待执行',
      'executing': '执行中',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    const icons = {
      'pending': <Clock className="h-3 w-3 mr-1" />,
      'executing': <Play className="h-3 w-3 mr-1" />,
      'completed': <CheckCircle className="h-3 w-3 mr-1" />,
      'cancelled': <X className="h-3 w-3 mr-1" />
    };
    return <Badge variant={variants[status] || 'secondary'} className="flex items-center">
        {icons[status] || <Clock className="h-3 w-3 mr-1" />}
        {labels[status] || status}
      </Badge>;
  };

  // 获取任务进度显示 - 格式：current_waypoint_index/航点总数
  const getProgressDisplay = () => {
    if (!mission?.current_waypoint_index && mission?.current_waypoint_index !== 0) {
      return '未开始';
    }
    return `${mission.current_waypoint_index}/${airlineWaypoints}`;
  };

  // 简化的航线选择组件
  const SimpleAirlineSelector = () => {
    if (airlines.length === 0) {
      return <div className="text-center py-8">
          <div className="text-gray-500 mb-2">
            <MapPin className="h-12 w-12 mx-auto opacity-30" />
          </div>
          <p className="text-gray-400 text-sm">暂无可用航线</p>
          <p className="text-gray-500 text-xs mt-1">请先在航线管理页面创建航线</p>
        </div>;
    }
    return <div className="space-y-3 max-h-60 overflow-y-auto">
        {airlines.map(airline => {
        const waypointCount = airline?.waypoints?.length || airline?.waypointCount || 0;
        return <Card key={airline._id} className={`bg-gray-800/50 border cursor-pointer transition-all duration-200 hover:border-blue-500/50 ${selectedAirline?._id === airline._id ? 'border-blue-500' : 'border-gray-600'}`} onClick={() => handleAirlineSelect(airline)}>
            <CardContent className="p-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-full flex items-center justify-center border border-green-500/30">
                    <MapPin className="h-4 w-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{airline.name}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <span>{waypointCount}个航点</span>
                      <span>•</span>
                      <span>{airline.estimated_duration || 0}分钟</span>
                    </div>
                  </div>
                </div>
                {selectedAirline?._id === airline._id && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
              </div>
            </CardContent>
          </Card>;
      })}
      </div>;
  };
  return <form onSubmit={handleSubmit} className="space-y-6">
      {/* 任务编号显示 */}
      {mission?.missionID && <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30">
              <span className="text-blue-400 font-bold text-sm">#{mission.missionID}</span>
            </div>
            <div>
              <span className="text-blue-400 text-sm font-medium">任务编号: {mission.missionID}</span>
              <p className="text-blue-400/70 text-xs">自增编号，由系统自动生成</p>
            </div>
          </div>
        </div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 基础信息 */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-white">任务名称 *</Label>
            <Input id="name" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} placeholder="请输入任务名称" className="bg-gray-800 border-gray-600 text-white mt-1" required />
          </div>

          <div>
            <Label htmlFor="description" className="text-white">任务描述</Label>
            <Textarea id="description" value={formData.description} onChange={e => handleInputChange('description', e.target.value)} placeholder="请输入任务描述" className="bg-gray-800 border-gray-600 text-white mt-1 h-20" />
          </div>

          <div>
            <Label htmlFor="maxSpeed" className="text-white">最高飞行速度 (m/s) *</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Gauge className="h-4 w-4 text-blue-400" />
              <Input id="maxSpeed" type="number" min="1" max="20" value={formData.maxSpeed} onChange={e => handleInputChange('maxSpeed', parseFloat(e.target.value) || 5)} placeholder="请输入最高飞行速度" className="bg-gray-800 border-gray-600 text-white" required />
            </div>
            <p className="text-gray-400 text-xs mt-1">建议值：5-15 m/s</p>
          </div>

          <div>
            <Label htmlFor="repeatCount" className="text-white">重复飞行次数 *</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Repeat className="h-4 w-4 text-green-400" />
              <Input id="repeatCount" type="number" min="0" max="10" value={formData.repeatCount} onChange={e => handleInputChange('repeatCount', parseInt(e.target.value) || 0)} placeholder="请输入重复飞行次数" className="bg-gray-800 border-gray-600 text-white" required />
            </div>
            <p className="text-gray-400 text-xs mt-1">
              {formData.repeatCount === 0 ? '执行1次' : `执行${formData.repeatCount + 1}次`}
            </p>
          </div>
        </div>

        {/* 设备选择 - 横版卡片样式 */}
        <div className="space-y-4">
          <div>
            <Label className="text-white">选择无人机 *</Label>
            {selectedDrone ? <Card className="bg-gray-800/50 border-gray-600 mt-1 hover:border-blue-500/30 transition-all duration-200">
                <CardContent className="p-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-full flex items-center justify-center border border-blue-500/30">
                        <Navigation className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{selectedDrone.sn || '未知序列号'}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <span>型号: {selectedDrone.model || '未知型号'}</span>
                          <span>•</span>
                          <span>电量: {selectedDrone.battery || 0}%</span>
                        </div>
                      </div>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => {
                  setSelectedDrone(null);
                  handleInputChange('droneSn', '');
                  handleInputChange('droneModelSn', '');
                }} className="text-red-400 border-red-400 hover:bg-red-400/10">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card> : <div className="mt-1">
                <DroneList $w={$w} onDroneSelect={handleDroneSelect} />
              </div>}
          </div>

          <div>
            <Label className="text-white">选择航线 *</Label>
            {selectedAirline ? <Card className="bg-gray-800/50 border-gray-600 mt-1 hover:border-green-500/30 transition-all duration-200">
                <CardContent className="p-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-full flex items-center justify-center border border-green-500/30">
                        <MapPin className="h-5 w-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{selectedAirline.name}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <span>{airlineWaypoints}个航点</span>
                          <span>•</span>
                          <span>{selectedAirline.estimated_duration || 0}分钟</span>
                        </div>
                      </div>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => {
                  setSelectedAirline(null);
                  handleInputChange('airlineId', '');
                  handleInputChange('airlineName', '');
                }} className="text-red-400 border-red-400 hover:bg-red-400/10">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card> : <div className="mt-1">
                <SimpleAirlineSelector />
              </div>}
          </div>
        </div>
      </div>

      {/* 只读信息区域 - 放置在界面下方，简化显示 */}
      {mission && <Card className="bg-gray-700/30 rounded-lg p-4">
          <div className="space-y-3">
            <Label className="text-gray-400 text-sm">只读信息（通过外部平台同步）</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Wifi className="h-4 w-4 text-blue-400" />
                <span className="text-gray-400">任务状态:</span>
                <div className="flex items-center">
                  {getStatusBadge(mission.status)}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-green-400" />
                <span className="text-gray-400">任务进度:</span>
                <span className="text-white font-medium">
                  {getProgressDisplay()}
                </span>
              </div>
            </div>
          </div>
        </Card>}

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
        <Button type="button" variant="outline" onClick={onCancel} className="border-gray-600 text-gray-300">
          取消
        </Button>
        <Button type="submit" disabled={loading} className="bg-blue-500 hover:bg-blue-600">
          <Save className="h-4 w-4 mr-2" />
          {loading ? '保存中...' : mission ? '更新任务' : '创建任务'}
        </Button>
      </div>
    </form>;
}