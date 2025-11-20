// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Input, Label, Textarea, Card, CardContent, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger, useToast, Switch, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
// @ts-ignore;
import { Save, MapPin, Plus, Trash2, Edit3, Volume2, Settings } from 'lucide-react';

// @ts-ignore;
import { WaypointForm } from '@/components/WaypointForm';
// @ts-ignore;
import { WaypointList } from '@/components/WaypointList';
// @ts-ignore;
import { VoiceConfigPanel } from '@/components/VoiceConfigPanel';
// @ts-ignore;
import { BasicInfoPanel } from '@/components/BasicInfoPanel';
// @ts-ignore;
import { TiandituMap } from '@/components/TiandituMap';
export function RouteEditor({
  route,
  $w,
  onSave,
  onCancel
}) {
  const {
    toast
  } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    waypoints: [],
    status: 'draft'
  });
  const [selectedWaypoint, setSelectedWaypoint] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState({
    lat: 39.9042,
    lng: 116.4074
  });

  // 初始化表单数据
  useEffect(() => {
    if (route) {
      console.log('初始化航线数据:', route);
      setFormData({
        name: route.name || '',
        description: route.description || '',
        waypoints: route.waypoints || [],
        status: route.status || 'draft'
      });

      // 设置地图中心点
      if (route.waypoints && route.waypoints.length > 0) {
        const firstWaypoint = route.waypoints[0];
        setMapCenter({
          lat: firstWaypoint.latitude || 39.9042,
          lng: firstWaypoint.longitude || 116.4074
        });
      }
    } else {
      setFormData({
        name: '',
        description: '',
        waypoints: [],
        status: 'draft'
      });
    }
  }, [route]);

  // 处理基础信息变化
  const handleBasicInfoChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 添加航点
  const handleAddWaypoint = waypoint => {
    const newWaypoint = {
      ...waypoint,
      id: Date.now() + Math.random(),
      voiceGuide: waypoint.voiceGuide || {
        enabled: false,
        text: '',
        character: '导游',
        voice: '女声',
        triggerType: 'time',
        audioFileId: '',
        audioUrl: '',
        subtitleFileId: '',
        subtitleUrl: ''
      }
    };
    setFormData(prev => ({
      ...prev,
      waypoints: [...prev.waypoints, newWaypoint]
    }));
    setSelectedWaypoint(newWaypoint);
    toast({
      title: '航点添加成功',
      description: `航点 "${waypoint.name}" 已添加到航线`
    });
  };

  // 更新航点
  const handleUpdateWaypoint = (index, updatedWaypoint) => {
    const updatedWaypoints = [...formData.waypoints];
    updatedWaypoints[index] = {
      ...updatedWaypoint,
      voiceGuide: updatedWaypoint.voiceGuide || {
        enabled: false,
        text: '',
        character: '导游',
        voice: '女声',
        triggerType: 'time',
        audioFileId: '',
        audioUrl: '',
        subtitleFileId: '',
        subtitleUrl: ''
      }
    };
    setFormData(prev => ({
      ...prev,
      waypoints: updatedWaypoints
    }));
    setSelectedWaypoint(updatedWaypoints[index]);
    toast({
      title: '航点更新成功',
      description: `航点 "${updatedWaypoint.name}" 已更新`
    });
  };

  // 删除航点
  const handleDeleteWaypoint = index => {
    const waypointName = formData.waypoints[index].name;
    const updatedWaypoints = formData.waypoints.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      waypoints: updatedWaypoints
    }));
    if (selectedWaypoint && formData.waypoints.indexOf(selectedWaypoint) === index) {
      setSelectedWaypoint(null);
    }
    toast({
      title: '航点删除成功',
      description: `航点 "${waypointName}" 已从航线中删除`
    });
  };

  // 选择航点
  const handleSelectWaypoint = waypoint => {
    setSelectedWaypoint(waypoint);
    setActiveTab('voice');
  };

  // 处理语音配置变化
  const handleVoiceConfigChange = (field, value) => {
    if (!selectedWaypoint) return;
    const waypointIndex = formData.waypoints.findIndex(wp => wp.id === selectedWaypoint.id);
    if (waypointIndex === -1) return;
    const updatedWaypoint = {
      ...selectedWaypoint,
      voiceGuide: {
        ...selectedWaypoint.voiceGuide,
        [field]: value
      }
    };
    handleUpdateWaypoint(waypointIndex, updatedWaypoint);
  };

  // 处理语音合成完成
  const handleSynthesisComplete = (audioFileId, audioUrl) => {
    if (!selectedWaypoint) return;
    const waypointIndex = formData.waypoints.findIndex(wp => wp.id === selectedWaypoint.id);
    if (waypointIndex === -1) return;
    const updatedWaypoint = {
      ...selectedWaypoint,
      voiceGuide: {
        ...selectedWaypoint.voiceGuide,
        audioFileId,
        audioUrl
      }
    };
    handleUpdateWaypoint(waypointIndex, updatedWaypoint);
    toast({
      title: '语音合成完成',
      description: '音频文件已关联到当前航点'
    });
  };

  // 保存航线
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: '验证失败',
        description: '请输入航线名称',
        variant: 'destructive'
      });
      return;
    }
    if (formData.waypoints.length === 0) {
      toast({
        title: '验证失败',
        description: '请至少添加一个航点',
        variant: 'destructive'
      });
      return;
    }
    try {
      setLoading(true);
      console.log('保存航线数据:', formData);
      console.log('航点数据详情:', formData.waypoints.map(wp => ({
        name: wp.name,
        voiceGuide: wp.voiceGuide
      })));
      const airlineData = {
        name: formData.name,
        description: formData.description,
        waypoints: formData.waypoints.map(waypoint => ({
          name: waypoint.name,
          latitude: waypoint.latitude,
          longitude: waypoint.longitude,
          altitude: waypoint.altitude,
          description: waypoint.description,
          voiceGuide: waypoint.voiceGuide ? {
            enabled: waypoint.voiceGuide.enabled || false,
            text: waypoint.voiceGuide.text || '',
            character: waypoint.voiceGuide.character || '导游',
            voice: waypoint.voiceGuide.voice || '女声',
            triggerType: waypoint.voiceGuide.triggerType || 'time',
            audioFileId: waypoint.voiceGuide.audioFileId || '',
            audioUrl: waypoint.voiceGuide.audioUrl || '',
            subtitleFileId: waypoint.voiceGuide.subtitleFileId || '',
            subtitleUrl: waypoint.voiceGuide.subtitleUrl || ''
          } : null,
          createdAt: waypoint.createdAt || new Date().getTime()
        })),
        status: formData.status,
        updatedAt: new Date().getTime()
      };
      console.log('最终保存的数据结构:', airlineData);
      if (route && route._id) {
        // 更新现有航线
        const result = await $w.cloud.callDataSource({
          dataSourceName: 'airline',
          methodName: 'wedaUpdateV2',
          params: {
            filter: {
              where: {
                _id: {
                  $eq: route._id
                }
              }
            },
            data: airlineData
          }
        });
        console.log('航线更新结果:', result);
        toast({
          title: '航线更新成功',
          description: `航线 "${formData.name}" 已更新`
        });
      } else {
        // 创建新航线
        airlineData.createdAt = new Date().getTime();
        const result = await $w.cloud.callDataSource({
          dataSourceName: 'airline',
          methodName: 'wedaCreateV2',
          params: {
            data: airlineData
          }
        });
        console.log('航线创建结果:', result);
        toast({
          title: '航线创建成功',
          description: `航线 "${formData.name}" 已创建`
        });
      }
      onSave && onSave();
    } catch (error) {
      console.error('保存失败:', error);
      toast({
        title: '操作失败',
        description: error.message || '请检查网络连接',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen bg-gray-900 text-white">
      <div className="p-6 space-y-6">
        {/* 头部操作栏 */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <MapPin className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold">{route ? '编辑航线' : '创建航线'}</h1>
              <p className="text-gray-400">配置航线信息和航点语音讲解</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button onClick={onCancel} className="px-6 py-2 bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600">
              取消
            </Button>
            <Button onClick={handleSave} disabled={loading} className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white">
              <Save className="h-4 w-4 mr-2" />
              {loading ? '保存中...' : '保存航线'}
            </Button>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：航点列表和基础信息 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 基础信息 */}
            <BasicInfoPanel formData={formData} onFormDataChange={handleBasicInfoChange} />

            {/* 航点列表 */}
            <WaypointList waypoints={formData.waypoints} selectedWaypoint={selectedWaypoint} onSelectWaypoint={handleSelectWaypoint} onDeleteWaypoint={handleDeleteWaypoint} />

            {/* 添加航点表单 */}
            <WaypointForm onAddWaypoint={handleAddWaypoint} mapCenter={mapCenter} />
          </div>

          {/* 右侧：地图和语音配置 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 地图 */}
            <Card className="bg-gray-800/50 border border-gray-600">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-blue-400" />
                  航线地图
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <TiandituMap waypoints={formData.waypoints} onWaypointSelect={handleSelectWaypoint} center={mapCenter} />
                </div>
              </CardContent>
            </Card>

            {/* 语音配置面板 */}
            {selectedWaypoint && <Card className="bg-gray-800/50 border border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Volume2 className="h-5 w-5 mr-2 text-green-400" />
                    语音讲解配置 - {selectedWaypoint.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <VoiceConfigPanel waypoint={selectedWaypoint} onVoiceConfigChange={handleVoiceConfigChange} onSynthesisComplete={handleSynthesisComplete} $w={$w} />
                </CardContent>
              </Card>}

            {!selectedWaypoint && <Card className="bg-gray-800/50 border border-gray-600">
                <CardContent className="p-8 text-center">
                  <Settings className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">请选择一个航点进行语音配置</p>
                  <p className="text-gray-500 text-sm mt-1">在左侧航点列表中点击选择航点</p>
                </CardContent>
              </Card>}
          </div>
        </div>
      </div>
    </div>;
}