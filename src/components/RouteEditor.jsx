// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger, useToast, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui';
// @ts-ignore;
import { Save, X, Upload, Music } from 'lucide-react';

// @ts-ignore;
import { BasicInfoPanel } from './BasicInfoPanel';
// @ts-ignore;
import { WaypointForm } from './WaypointForm';
// @ts-ignore;
import { WaypointList } from './WaypointList';
// @ts-ignore;
import { VoiceConfigPanel } from './VoiceConfigPanel';
// @ts-ignore;
import { SimpleMap } from './SimpleMap';

// 获取景区中心点（从scenic_spot数据源获取）
const getScenicCenter = async $w => {
  try {
    const result = await $w.cloud.callDataSource({
      dataSourceName: 'scenic_spot',
      methodName: 'wedaGetRecordsV2',
      params: {
        pageSize: 1,
        pageNumber: 1,
        orderBy: [{
          createdAt: 'desc'
        }]
      }
    });
    if (result.records && result.records.length > 0) {
      const scenicSpot = result.records[0];
      if (scenicSpot.latitude && scenicSpot.longitude) {
        return [scenicSpot.latitude, scenicSpot.longitude];
      }
    }
  } catch (error) {
    console.error('获取景区中心点失败:', error);
  }
  return [39.9042, 116.4074];
};

// 坐标精度验证函数 - 确保8位小数精度
const validateCoordinate = (value, type) => {
  const num = parseFloat(value);
  if (isNaN(num)) {
    throw new Error(`无效的${type}坐标值`);
  }

  // 验证坐标范围
  if (type === '纬度' && (num < -90 || num > 90)) {
    throw new Error('纬度范围应在-90到90之间');
  }
  if (type === '经度' && (num < -180 || num > 180)) {
    throw new Error('经度范围应在-180到180之间');
  }

  // 返回8位小数精度
  return parseFloat(num.toFixed(8));
};

// 背景音乐上传组件
function BackgroundMusicUploader({
  cloudStorageId,
  onCloudStorageIdChange,
  $w
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const {
    toast
  } = useToast();

  // 检查是否为音频文件的函数
  const isAudioFile = file => {
    // 检查MIME类型是否为音频
    if (file.type.startsWith('audio/')) {
      return true;
    }

    // 检查文件扩展名是否为音频格式
    const fileName = file.name.toLowerCase();
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a', '.webm', '.weba'];
    return audioExtensions.some(ext => fileName.endsWith(ext));
  };
  const handleFileUpload = async event => {
    const file = event.target.files[0];
    if (!file) return;

    // 使用更宽松的文件类型检查，支持WEBM等格式
    if (!isAudioFile(file)) {
      toast({
        title: '文件类型错误',
        description: '请上传音频文件（支持MP3、WAV、WEBM等格式）',
        variant: 'destructive'
      });
      return;
    }
    console.log('上传文件信息:', {
      name: file.name,
      type: file.type,
      size: file.size
    });
    setIsUploading(true);
    try {
      // 获取云开发实例
      const tcb = await $w.cloud.getCloudInstance();

      // 生成唯一文件名
      const timestamp = Date.now();
      const fileName = `background-music-${timestamp}.${file.name.split('.').pop()}`;
      const filePath = `background-music/${fileName}`;

      // 上传文件到云存储
      const uploadResult = await tcb.uploadFile({
        cloudPath: filePath,
        filePath: file
      });

      // 获取文件ID
      const fileId = uploadResult.fileID;

      // 获取文件访问URL
      const tempUrlResult = await tcb.getTempFileURL({
        fileList: [fileId]
      });
      const fileUrl = tempUrlResult.fileList[0].tempFileURL;

      // 更新状态
      setFileName(file.name);
      setFileUrl(fileUrl);

      // 调用上传完成回调 - 直接传递cloudStorageId
      onCloudStorageIdChange(fileId);
      toast({
        title: '上传成功',
        description: '背景音乐文件已上传，云存储ID已保存',
        variant: 'default'
      });
    } catch (error) {
      console.error('上传背景音乐失败:', error);
      toast({
        title: '上传失败',
        description: error.message || '请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  // 清除已上传的音乐
  const handleClearMusic = () => {
    setFileName('');
    setFileUrl('');
    onCloudStorageIdChange('');
    toast({
      title: '已清除',
      description: '背景音乐已清除',
      variant: 'default'
    });
  };
  return <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Music className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">背景音乐配置</h3>
      </div>

      {/* 文件上传区域 */}
      <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
        <input type="file" id="background-music-upload" accept="audio/*,.webm,.weba" onChange={handleFileUpload} className="hidden" />
        <label htmlFor="background-music-upload" className="cursor-pointer">
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-300 mb-2 text-lg">点击上传背景音乐文件</p>
          <p className="text-gray-500 text-sm">支持 MP3、WAV、WEBM 等所有音频格式</p>
        </label>
      </div>

      {/* 上传状态显示 */}
      {isUploading && <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
          <p className="text-gray-400 mt-2">上传中...</p>
        </div>}

      {/* 已上传文件信息 */}
      {cloudStorageId && <Card className="bg-green-900/20 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 font-medium text-sm">已上传背景音乐</p>
                <p className="text-gray-400 text-xs truncate" title={fileName}>
                  {fileName}
                </p>
                <p className="text-gray-500 text-xs">云存储ID: {cloudStorageId.substring(0, 12)}...</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClearMusic} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                删除
              </Button>
            </div>
          </CardContent>
        </Card>}
    </div>;
}
export function RouteEditor(props) {
  const {
    route,
    onClose,
    onSuccess,
    $w
  } = props;
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    estimated_duration: 0,
    waypoints: [],
    hasVoiceGuide: false,
    hasBackgroundMusic: false,
    cloudStorageId: '' // 修复：使用正确的字段名
  });
  const [newWaypoint, setNewWaypoint] = useState({
    name: '航点1',
    flightSpeed: 5,
    hoverDuration: 0,
    altitude: 100,
    lat: 39.9042,
    lng: 116.4074
  });
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(null);
  const [scenicCenter, setScenicCenter] = useState([39.9042, 116.4074]);
  const [clearConnectionsTrigger, setClearConnectionsTrigger] = useState(false);
  const {
    toast
  } = useToast();

  // 初始化表单数据和景区中心点
  useEffect(() => {
    const initializeData = async () => {
      try {
        const center = await getScenicCenter($w);
        setScenicCenter(center);
        setNewWaypoint(prev => ({
          ...prev,
          lat: center[0],
          lng: center[1]
        }));
      } catch (error) {
        console.error('初始化景区中心点失败:', error);
      }
      if (route) {
        // 修复：确保正确初始化航点数据，包括voiceGuide字段和subtitleFileId
        const waypoints = route.waypoints ? route.waypoints.map((wp, index) => {
          // 修复：确保voiceGuide字段存在且包含所有必要的子字段，包括subtitleFileId
          const voiceGuide = wp.voiceGuide || {};
          return {
            id: wp.id || Date.now() + index,
            name: wp.name || `航点${index + 1}`,
            flightSpeed: wp.flightSpeed || 5,
            hoverDuration: wp.hoverDuration || 0,
            altitude: wp.altitude || 100,
            lat: validateCoordinate(wp.lat || 39.9042, '纬度'),
            // 确保8位小数精度
            lng: validateCoordinate(wp.lng || 116.4074, '经度'),
            // 确保8位小数精度
            voiceGuide: {
              enabled: voiceGuide.enabled || false,
              text: voiceGuide.text || '',
              character: voiceGuide.character || '导游',
              voice: voiceGuide.voice || '女声',
              triggerType: voiceGuide.triggerType || 'time',
              audioFileId: voiceGuide.audioFileId || '',
              audioUrl: voiceGuide.audioUrl || '',
              subtitleFileId: voiceGuide.subtitleFileId || '' // 新增：字幕文件ID
            }
          };
        }) : [];

        // 修复：如果cloudStorageId有值，自动开启背景音乐
        const hasBackgroundMusic = route.cloudStorageId && route.cloudStorageId.trim() !== '';
        setFormData({
          name: route.name || '',
          description: route.description || '',
          estimated_duration: route.estimated_duration || 0,
          waypoints: waypoints,
          hasVoiceGuide: route.hasVoiceGuide || false,
          hasBackgroundMusic: hasBackgroundMusic,
          cloudStorageId: route.cloudStorageId || ''
        });
        setNewWaypoint(prev => ({
          ...prev,
          name: `航点${waypoints.length + 1}`
        }));
        console.log('初始化航点数据:', waypoints);
      }
    };
    initializeData();
  }, [route, $w]);

  // 处理表单字段变化
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 处理背景音乐云存储ID变化
  const handleCloudStorageIdChange = cloudStorageId => {
    setFormData(prev => ({
      ...prev,
      cloudStorageId: cloudStorageId,
      // 如果设置了cloudStorageId，自动开启背景音乐
      hasBackgroundMusic: cloudStorageId && cloudStorageId.trim() !== ''
    }));
  };

  // 处理航点字段变化
  const handleWaypointChange = (field, value) => {
    setNewWaypoint(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 添加航点 - 确保8位小数精度（静默添加，不显示成功提示）
  const addWaypoint = validatedWaypoint => {
    if (!validatedWaypoint.name.trim()) {
      toast({
        title: '提示',
        description: '请输入航点名称',
        variant: 'destructive'
      });
      return;
    }
    const waypoint = {
      id: Date.now(),
      name: validatedWaypoint.name,
      flightSpeed: Number(validatedWaypoint.flightSpeed),
      hoverDuration: Number(validatedWaypoint.hoverDuration),
      altitude: Number(validatedWaypoint.altitude),
      lat: validatedWaypoint.lat,
      // 已经验证过的8位小数精度
      lng: validatedWaypoint.lng,
      // 已经验证过的8位小数精度
      voiceGuide: {
        enabled: false,
        text: '',
        character: '导游',
        voice: '女声',
        triggerType: 'time',
        audioFileId: '',
        audioUrl: '',
        subtitleFileId: '' // 新增：初始化字幕文件ID
      }
    };
    setFormData(prev => ({
      ...prev,
      waypoints: [...prev.waypoints, waypoint]
    }));
    setNewWaypoint({
      name: `航点${formData.waypoints.length + 2}`,
      flightSpeed: 5,
      hoverDuration: 0,
      altitude: 100,
      lat: scenicCenter[0],
      lng: scenicCenter[1]
    });
  };

  // 删除航点
  const deleteWaypoint = index => {
    const updatedWaypoints = formData.waypoints.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      waypoints: updatedWaypoints
    }));
    setNewWaypoint(prev => ({
      ...prev,
      name: `航点${updatedWaypoints.length + 1}`
    }));
  };

  // 清除所有连线
  const handleClearConnections = () => {
    setClearConnectionsTrigger(prev => !prev);
    toast({
      title: '连线已清除',
      description: '所有航点连线已从地图上移除',
      variant: 'default'
    });
  };

  // 更新航点语音配置 - 修复：确保audioFileId和subtitleFileId正确保存
  const updateWaypointVoiceConfig = (index, field, value) => {
    const updatedWaypoints = [...formData.waypoints];
    updatedWaypoints[index] = {
      ...updatedWaypoints[index],
      voiceGuide: {
        ...updatedWaypoints[index].voiceGuide,
        [field]: value
      }
    };
    setFormData(prev => ({
      ...prev,
      waypoints: updatedWaypoints
    }));
    console.log(`更新航点${index}的${field}:`, value);
  };

  // 处理语音合成完成 - 修复：只保存audioFileId，不保存audioUrl
  const handleSpeechSynthesisComplete = (fileId, audioUrl) => {
    if (selectedVoiceIndex !== null) {
      // 修复：只保存云存储ID到audioFileId字段
      updateWaypointVoiceConfig(selectedVoiceIndex, 'audioFileId', fileId);
      // 不保存临时链接到audioUrl字段
      toast({
        title: '语音文件ID已保存',
        description: `航点${selectedVoiceIndex + 1}的语音文件ID已保存到audioFileId字段`,
        variant: 'default'
      });
    }
  };

  // 处理地图选择 - 确保8位小数精度
  const handleMapLocationSelect = location => {
    try {
      const validatedLat = validateCoordinate(location.lat, '纬度');
      const validatedLng = validateCoordinate(location.lng, '经度');
      setNewWaypoint(prev => ({
        ...prev,
        lat: validatedLat,
        lng: validatedLng
      }));
    } catch (error) {
      toast({
        title: '坐标验证失败',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  // 保存航线 - 确保所有数据正确保存到数据库
  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        toast({
          title: '验证失败',
          description: '请输入航线名称',
          variant: 'destructive'
        });
        return;
      }
      if (formData.waypoints.length < 2) {
        toast({
          title: '验证失败',
          description: '航线至少需要2个航点',
          variant: 'destructive'
        });
        return;
      }

      // 验证所有航点的坐标精度
      const validatedWaypoints = formData.waypoints.map((waypoint, index) => {
        const validatedLat = validateCoordinate(waypoint.lat, '纬度');
        const validatedLng = validateCoordinate(waypoint.lng, '经度');
        return {
          name: waypoint.name,
          flightSpeed: waypoint.flightSpeed,
          hoverDuration: waypoint.hoverDuration,
          altitude: waypoint.altitude,
          lat: validatedLat,
          // 确保8位小数精度
          lng: validatedLng,
          // 确保8位小数精度
          voiceGuide: {
            enabled: waypoint.voiceGuide.enabled,
            text: waypoint.voiceGuide.text,
            character: waypoint.voiceGuide.character,
            voice: waypoint.voiceGuide.voice,
            triggerType: waypoint.voiceGuide.triggerType,
            audioFileId: waypoint.voiceGuide.audioFileId,
            audioUrl: '',
            // 修复：不保存临时链接，只保存云存储ID
            subtitleFileId: waypoint.voiceGuide.subtitleFileId // 新增：保存字幕文件ID
          }
        };
      });

      // 修复：准备保存数据，确保包含所有航点语音配置和背景音乐云存储ID
      const saveData = {
        name: formData.name,
        description: formData.description,
        estimated_duration: Number(formData.estimated_duration),
        waypoints: validatedWaypoints,
        waypointCount: formData.waypoints.length,
        hasVoiceGuide: formData.hasVoiceGuide,
        hasBackgroundMusic: formData.hasBackgroundMusic,
        cloudStorageId: formData.cloudStorageId
      };
      console.log('保存数据:', saveData);
      console.log('航点坐标精度验证:', validatedWaypoints.map((wp, i) => ({
        index: i,
        name: wp.name,
        lat: wp.lat.toFixed(8),
        lng: wp.lng.toFixed(8)
      })));
      if (route) {
        // 更新现有航线
        const result = await $w.cloud.callDataSource({
          dataSourceName: 'airline',
          methodName: 'wedaUpdateV2',
          params: {
            data: saveData,
            filter: {
              where: {
                _id: {
                  $eq: route._id
                }
              }
            }
          }
        });
        console.log('更新航线结果:', result);
        toast({
          title: '更新成功',
          description: '航线、语音文件ID、字幕文件ID和背景音乐云存储ID已更新到数据库，坐标精度: 8位小数',
          variant: 'default'
        });
      } else {
        // 创建新航线
        const result = await $w.cloud.callDataSource({
          dataSourceName: 'airline',
          methodName: 'wedaCreateV2',
          params: {
            data: saveData
          }
        });
        console.log('创建航线结果:', result);
        toast({
          title: '创建成功',
          description: '航线、语音文件ID、字幕文件ID和背景音乐云存储ID已保存到数据库，坐标精度: 8位小数',
          variant: 'default'
        });
      }
      onSuccess();
    } catch (error) {
      console.error('保存航线失败:', error);
      toast({
        title: '保存失败',
        description: error.message || '请稍后重试',
        variant: 'destructive'
      });
    }
  };

  // 渲染航点列表标签页
  const renderWaypointListTab = () => <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <WaypointForm newWaypoint={newWaypoint} onWaypointChange={handleWaypointChange} onAddWaypoint={addWaypoint} scenicCenter={scenicCenter} />
        <div className="h-64 overflow-y-auto border border-gray-600 rounded-lg">
          <WaypointList waypoints={formData.waypoints} onDeleteWaypoint={deleteWaypoint} onSelectWaypoint={setSelectedVoiceIndex} selectedVoiceIndex={selectedVoiceIndex} locked={true} // 启用列表锁定功能
        />
        </div>
      </div>
      <div>
        <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-600 shadow-lg rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-400 text-sm font-semibold">地图拾取坐标</CardTitle>
            <p className="text-gray-400 text-xs">地图中心点已设置为景区坐标，坐标精度: 8位小数</p>
          </CardHeader>
          <CardContent className="p-0">
            <SimpleMap center={scenicCenter} onLocationSelect={handleMapLocationSelect} currentLocation={{
            lat: newWaypoint.lat,
            lng: newWaypoint.lng
          }} waypoints={formData.waypoints} onClearConnections={clearConnectionsTrigger} className="h-80" />
          </CardContent>
        </Card>
      </div>
    </div>;

  // 渲染语音讲解标签页
  const renderVoiceConfigTab = () => <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h4 className="text-blue-400 text-sm font-semibold mb-3">选择航点配置语音</h4>
        <div className="h-96 overflow-y-auto border border-gray-600 rounded-lg">
          <WaypointList waypoints={formData.waypoints} onDeleteWaypoint={deleteWaypoint} onSelectWaypoint={setSelectedVoiceIndex} selectedVoiceIndex={selectedVoiceIndex} locked={true} // 启用列表锁定功能
        />
        </div>
      </div>
      <div className="h-96 overflow-y-auto">
        <VoiceConfigPanel waypoint={selectedVoiceIndex !== null ? formData.waypoints[selectedVoiceIndex] : null} onVoiceConfigChange={(field, value) => updateWaypointVoiceConfig(selectedVoiceIndex, field, value)} onSynthesisComplete={handleSpeechSynthesisComplete} $w={$w} />
      </div>
    </div>;

  // 渲染背景音乐标签页
  const renderMusicConfigTab = () => <div className="space-y-6">
      <div className="flex items-center space-x-2 cursor-pointer" onClick={() => handleInputChange('hasBackgroundMusic', !formData.hasBackgroundMusic)}>
        <input type="checkbox" checked={formData.hasBackgroundMusic} onChange={e => handleInputChange('hasBackgroundMusic', e.target.checked)} className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2" />
        <label className="text-white text-sm font-medium cursor-pointer">启用背景音乐</label>
      </div>
      
      {formData.hasBackgroundMusic && <BackgroundMusicUploader cloudStorageId={formData.cloudStorageId} onCloudStorageIdChange={handleCloudStorageIdChange} $w={$w} />}
    </div>;
  return <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl min-h-[600px] max-h-[90vh] bg-gray-900 border border-gray-700 shadow-2xl rounded-3xl flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            {route ? '编辑航线' : '创建航线'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-4 bg-gray-800/50 backdrop-blur-sm border-b border-gray-600 rounded-t-xl flex-shrink-0">
              <TabsTrigger value="basic" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:shadow-sm">
                基本信息
              </TabsTrigger>
              <TabsTrigger value="waypoints" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:shadow-sm">
                航点列表
              </TabsTrigger>
              <TabsTrigger value="voice" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:shadow-sm">
                语音讲解
              </TabsTrigger>
              <TabsTrigger value="music" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:shadow-sm">
                背景音乐
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-800/30 backdrop-blur-sm min-h-[400px]">
              <TabsContent value="basic" className="space-y-6 h-full">
                <BasicInfoPanel formData={formData} onInputChange={handleInputChange} />
              </TabsContent>

              <TabsContent value="waypoints" className="space-y-6 h-full">
                {renderWaypointListTab()}
              </TabsContent>

              <TabsContent value="voice" className="space-y-6 h-full">
                {renderVoiceConfigTab()}
              </TabsContent>

              <TabsContent value="music" className="space-y-6 h-full">
                {renderMusicConfigTab()}
              </TabsContent>
            </div>
          </Tabs>

          {/* 保存按钮区域 - 固定在底部 */}
          <div className="flex-shrink-0 border-t border-gray-600 bg-gray-800/50 backdrop-blur-sm rounded-b-xl p-6">
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
                <X className="w-4 h-4 mr-2" /> 取消
              </Button>
              <Button onClick={handleSave} className="group relative bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-600 text-white font-semibold shadow-lg">
                <span className="absolute inset-0 w-full h-full transition duration-300 ease-out transform bg-white opacity-0 group-hover:opacity-10 rounded-lg"></span>
                <Save className="w-4 h-4 mr-2" /> 保存航线
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
}