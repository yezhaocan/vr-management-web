// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea, useToast, Card, CardContent, Badge } from '@/components/ui';
// @ts-ignore;
import { Clock, Save, X, Gauge, Repeat, MapPin, Navigation, Play, CheckCircle, Wifi, FileText, Plane, Map, RotateCcw, AlertCircle } from 'lucide-react';

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
  const [airlines, setAirlines] = useState([]); 
  const [drones, setDrones] = useState([]);
  const [errors, setErrors] = useState({});

  // 加载无人机列表
  const loadDrones = async () => {
    try {
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'drone',
        methodName: 'wedaGetRecordsV2',
        params: {
          select: { $master: true },
          filter: { where: {} },
          pageSize: 100,
          pageNumber: 1
        }
      });
      setDrones(result.records || []);
    } catch (error) {
      console.error('加载无人机列表失败:', error);
      toast({
        title: '加载无人机失败',
        description: error.message || '请检查网络连接',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    loadDrones();
  }, []);

  const handleDroneChange = (value) => {
    const drone = drones.find(d => d.sn === value);
    if (drone) {
      handleDroneSelect(drone);
      // 实时验证
      const newErrors = { ...errors };
      delete newErrors.droneSn;
      setErrors(newErrors);
    }
  };

  const handleAirlineChange = (value) => {
    const airline = airlines.find(a => a._id === value);
    if (airline) {
      handleAirlineSelect(airline);
      // 实时验证
      const newErrors = { ...errors };
      delete newErrors.airlineId;
      setErrors(newErrors);
    }
  };

  const handleAirlineSelectInternal = (value) => {
    handleAirlineChange(value);
    
    // 如果是新建任务（没有传入mission prop），自动生成任务名称
    if (!mission) {
      const airline = airlines.find(a => a._id === value);
      if (airline) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        const autoName = `${airline.name} ${year}-${month}-${day} ${hours}:${minutes}`;
        handleInputChange('name', autoName);
      }
    }
  };

  // 验证表单数据
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // 必填项检查
    if (!formData.name?.trim()) {
      newErrors.name = '任务名称不能为空';
      isValid = false;
    }
    if (!formData.droneSn) {
      newErrors.droneSn = '请选择无人机';
      isValid = false;
    }
    if (!formData.airlineId) {
      newErrors.airlineId = '请选择航线';
      isValid = false;
    }

    // 数值范围检查
    if (!formData.maxSpeed || formData.maxSpeed <= 0) {
      newErrors.maxSpeed = '速度必须大于0';
      isValid = false;
    } else if (formData.maxSpeed > 20) {
      newErrors.maxSpeed = '速度不能超过20m/s';
      isValid = false;
    }

    if (formData.repeatCount < 0) {
      newErrors.repeatCount = '重复次数不能为负数';
      isValid = false;
    } else if (formData.repeatCount > 10) {
      newErrors.repeatCount = '重复次数不能超过10次';
      isValid = false;
    }

    setErrors(newErrors);
    
    // 如果有错误，聚焦到第一个错误字段
    if (!isValid) {
      const firstErrorField = Object.keys(newErrors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.focus();
      }
    }

    return isValid;
  };

  // 重置表单
  const handleReset = () => {
    setFormData({
      name: '',
      description: '',
      droneSn: '',
      airlineId: '',
      maxSpeed: 5,
      repeatCount: 0
    });
    setErrors({});
    setSelectedDrone(null);
    setSelectedAirline(null);
  };

  // 辅助组件：带图标的标签
  const FormLabel = ({ icon: Icon, label, required }) => (
    <Label className="flex items-center text-sm font-medium text-foreground mb-2">
      <Icon className="w-4 h-4 mr-2 text-muted-foreground" />
      {label}
      {required && <span style={{ color: '#ff4d4f', marginLeft: '4px' }}>*</span>}
    </Label>
  );

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
    if (!validateForm()) return;
    
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

    // 实时验证逻辑
    const newErrors = { ...errors };
    if (field === 'name') {
      if (!value?.trim()) {
        newErrors.name = '任务名称不能为空';
      } else {
        delete newErrors.name;
      }
    }
    if (field === 'maxSpeed') {
      const speed = parseFloat(value);
      if (!speed || speed <= 0) {
        newErrors.maxSpeed = '速度必须大于0';
      } else if (speed > 20) {
        newErrors.maxSpeed = '速度不能超过20m/s';
      } else {
        delete newErrors.maxSpeed;
      }
    }
    if (field === 'repeatCount') {
      const count = parseInt(value);
      if (count < 0) {
        newErrors.repeatCount = '重复次数不能为负数';
      } else if (count > 10) {
        newErrors.repeatCount = '重复次数不能超过10次';
      } else {
        delete newErrors.repeatCount;
      }
    }
    setErrors(newErrors);
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
          <div className="text-muted-foreground mb-2">
            <MapPin className="h-12 w-12 mx-auto opacity-30" />
          </div>
          <p className="text-muted-foreground text-sm">暂无可用航线</p>
          <p className="text-muted-foreground text-xs mt-1">请先在航线管理页面创建航线</p>
        </div>;
    }
    return <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
        {airlines.map(airline => {
        const waypointCount = airline?.waypoints?.length || airline?.waypointCount || 0;
        return <Card key={airline._id} className={`bg-card border cursor-pointer transition-all duration-200 hover:border-primary/50 dark:hover:border-primary/50 ${selectedAirline?._id === airline._id ? 'border-primary ring-1 ring-primary' : 'border-border'}`} onClick={() => handleAirlineSelect(airline)}>
            <CardContent className="p-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium text-sm">{airline.name}</p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span>{waypointCount}个航点</span>
                      <span>•</span>
                      <span>{airline.estimated_duration || 0}分钟</span>
                    </div>
                  </div>
                </div>
                {selectedAirline?._id === airline._id && <div className="w-2 h-2 bg-primary rounded-full"></div>}
              </div>
            </CardContent>
          </Card>;
      })}
      </div>;
  };
  return <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* 任务编号显示 */}
        {mission?.missionID && <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center border border-blue-200 dark:border-blue-800">
                <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">#{mission.missionID}</span>
              </div>
              <div>
                <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">任务编号: {mission.missionID}</span>
                <p className="text-blue-500/70 dark:text-blue-400/70 text-xs">自增编号，由系统自动生成</p>
              </div>
            </div>
          </div>}

        <div className="grid grid-cols-1 gap-6">
          
          {/* 航线选择 - 调整到最上方 */}
          <div className="space-y-4">
            <div>
              <FormLabel icon={Map} label="选择航线" required />
              <Select 
                value={formData.airlineId} 
                onValueChange={handleAirlineSelectInternal}
              >
                <SelectTrigger className={`w-full ${errors.airlineId ? 'border-destructive' : ''}`} id="airlineId">
                  <SelectValue placeholder="请选择航线" />
                </SelectTrigger>
                <SelectContent>
                  {airlines.map(airline => {
                    const waypointCount = airline?.waypoints?.length || airline?.waypointCount || 0;
                    return (
                      <SelectItem key={airline._id} value={airline._id}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{airline.name}</span>
                          <span className="text-xs text-muted-foreground">{waypointCount}个航点 · {airline.estimated_duration || 0}分钟</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <div className="min-h-[20px] mt-1">
                {errors.airlineId && <p className="text-xs text-destructive flex items-center"><AlertCircle className="w-3 h-3 mr-1"/>{errors.airlineId}</p>}
              </div>
            </div>

            {/* 任务名称 - 自动生成但可编辑 */}
            <div>
              <FormLabel icon={FileText} label="任务名称" required />
              <Input id="name" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} placeholder="请输入任务名称 (选择航线后自动生成)" className={`bg-background border-input text-foreground mt-1 focus:ring-primary ${errors.name ? 'border-destructive' : ''}`} required />
              <div className="min-h-[20px] mt-1">
                {errors.name && <p className="text-xs text-destructive flex items-center"><AlertCircle className="w-3 h-3 mr-1"/>{errors.name}</p>}
              </div>
            </div>

            {/* 无人机选择 */}
            <div>
              <FormLabel icon={Plane} label="选择无人机" required />
              <Select 
                value={formData.droneSn} 
                onValueChange={handleDroneChange}
              >
                <SelectTrigger className={`w-full ${errors.droneSn ? 'border-destructive' : ''}`} id="droneSn">
                  <SelectValue placeholder="请选择无人机" />
                </SelectTrigger>
                <SelectContent>
                  {drones.map(drone => (
                    <SelectItem key={drone.sn} value={drone.sn}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{drone.sn}</span>
                        <span className="text-xs text-muted-foreground">型号: {drone.model} · 电量: {drone.battery}%</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="min-h-[20px] mt-1">
                {errors.droneSn && <p className="text-xs text-destructive flex items-center"><AlertCircle className="w-3 h-3 mr-1"/>{errors.droneSn}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FormLabel icon={Gauge} label="最高飞行速度 (m/s)" required />
                <Input id="maxSpeed" type="number" min="1" max="20" value={formData.maxSpeed} onChange={e => handleInputChange('maxSpeed', parseFloat(e.target.value) || 0)} placeholder="请输入最高飞行速度" className={`bg-background border-input text-foreground focus:ring-primary ${errors.maxSpeed ? 'border-destructive' : ''}`} required />
                <div className="h-5 mt-1">
                  {errors.maxSpeed ? <p className="text-xs text-destructive flex items-center"><AlertCircle className="w-3 h-3 mr-1"/>{errors.maxSpeed}</p> : <p className="text-muted-foreground text-xs">建议值：5-15 m/s</p>}
                </div>
              </div>

              <div>
                <FormLabel icon={Repeat} label="重复飞行次数" required />
                <Input id="repeatCount" type="number" min="0" max="10" value={formData.repeatCount} onChange={e => handleInputChange('repeatCount', parseInt(e.target.value) || 0)} placeholder="请输入重复飞行次数" className={`bg-background border-input text-foreground focus:ring-primary ${errors.repeatCount ? 'border-destructive' : ''}`} required />
                <div className="h-5 mt-1">
                  {errors.repeatCount ? <p className="text-xs text-destructive flex items-center"><AlertCircle className="w-3 h-3 mr-1"/>{errors.repeatCount}</p> : <p className="text-muted-foreground text-xs">
                    {formData.repeatCount === 0 ? '执行1次' : `执行${formData.repeatCount + 1}次`}
                  </p>}
                </div>
              </div>
            </div>
            
            <div>
              <FormLabel icon={FileText} label="任务描述" />
              <Textarea id="description" value={formData.description} onChange={e => handleInputChange('description', e.target.value)} placeholder="请输入任务描述 (可选)" className="bg-background border-input text-foreground mt-1 h-20 focus:ring-primary" />
            </div>
          </div>
        </div>

        {/* 只读信息区域 - 放置在界面下方，简化显示 */}
        {mission && <Card className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="space-y-3">
              <Label className="text-muted-foreground text-sm">只读信息（通过外部平台同步）</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Wifi className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                  <span className="text-muted-foreground">任务状态:</span>
                  <div className="flex items-center">
                    {getStatusBadge(mission.status)}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-green-500 dark:text-green-400" />
                  <span className="text-muted-foreground">任务进度:</span>
                  <span className="text-foreground font-medium">
                    {getProgressDisplay()}
                  </span>
                </div>
              </div>
            </div>
          </Card>}
      </div>

      <div className="flex justify-end space-x-3 p-6 border-t border-border bg-background">
        {!mission && <Button type="button" variant="ghost" onClick={handleReset} className="mr-auto text-muted-foreground hover:text-foreground">
          <RotateCcw className="h-4 w-4 mr-2" />
          重置
        </Button>}
        <Button type="button" variant="outline" onClick={onCancel} className="border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground">
          取消
        </Button>
        <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">
          <Save className="h-4 w-4 mr-2" />
          {loading ? '保存中...' : mission ? '更新任务' : '创建任务'}
        </Button>
      </div>
    </form>;
}