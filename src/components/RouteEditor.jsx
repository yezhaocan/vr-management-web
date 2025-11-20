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
    cloudStorageId: ''
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
        console.log('原始航线数据:', route);

        // 修复：确保正确初始化航点数据，包括voiceGuide字段
        const waypoints = route.waypoints ? route.waypoints.map((wp, index) => {
          console.log(`航点${index}数据:`, wp);

          // 修复：确保voiceGuide字段存在且包含所有必要的子字段
          const voiceGuide = wp.voiceGuide || {};
          const waypointData = {
            id: wp.id || Date.now() + index,
            name: wp.name || `航点${index + 1}`,
            flightSpeed: wp.flightSpeed || 5,
            hoverDuration: wp.hoverDuration || 0,
            altitude: wp.altitude || 100,
            lat: wp.lat || 39.9042,
            lng: wp.lng || 116.4074,
            voiceGuide: {
              enabled: voiceGuide.enabled || false,
              text: voiceGuide.text || '',
              character: voiceGuide.character || '导游',
              voice: voiceGuide.voice || '女声',
              triggerType: voiceGuide.triggerType || 'time',
              audioFileId: voiceGuide.audioFileId || '',
              audioUrl: voiceGuide.audioUrl || '',
              subtitleFileId: voiceGuide.subtitleFileId || '',
              subtitleUrl: voiceGuide.subtitleUrl || ''
            }
          };
          console.log(`初始化航点${index}语音配置:`, waypointData.voiceGuide);
          return waypointData;
        }) : [];

        // 修复：如果cloudStorageId有值，自动开启背景音乐
        const hasBackgroundMusic = route.cloudStorageId && route.cloudStorageId.trim() !== '';
        const hasVoiceGuide = route.hasVoiceGuide || false;
        setFormData({
          name: route.name || '',
          description: route.description || '',
          estimated_duration: route.estimated_duration || 0,
          waypoints: waypoints,
          hasVoiceGuide: hasVoiceGuide,
          hasBackgroundMusic: hasBackgroundMusic,
          cloudStorageId: route.cloudStorageId || ''
        });
        setNewWaypoint(prev => ({
          ...prev,
          name: `航点${waypoints.length + 1}`
        }));
        console.log('初始化航线数据完成:', {
          waypointsCount: waypoints.length,
          hasVoiceGuide: hasVoiceGuide,
          hasBackgroundMusic: hasBackgroundMusic,
          waypoints: waypoints.map(wp => ({
            name: wp.name,
            subtitleFileId: wp.voiceGuide.subtitleFileId
          }))
        });
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

  // 添加航点
  const addWaypoint = () => {
    if (!newWaypoint.name.trim()) {
      toast({
        title: '提示',
        description: '请输入航点名称',
        variant: 'destructive'
      });
      return;
    }
    const waypoint = {
      id: Date.now(),
      name: newWaypoint.name,
      flightSpeed: Number(newWaypoint.flightSpeed),
      hoverDuration: Number(newWaypoint.hoverDuration),
      altitude: Number(newWaypoint.altitude),
      lat: Number(newWaypoint.lat),
      lng: Number(newWaypoint.lng),
      voiceGuide: {
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

  // 更新航点语音配置 - 修复：确保所有字段正确保存
  const updateWaypointVoiceConfig = (index, field, value) => {
    const updatedWaypoints = [...formData.waypoints];
    if (updatedWaypoints[index]) {
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
      console.log(`更新航点${index}的${field}:`, value, '当前语音配置:', updatedWaypoints[index].voiceGuide);
    }
  };

  // 处理语音合成完成
  const handleSpeechSynthesisComplete = (fileId, audioUrl) => {
    if (selectedVoiceIndex !== null) {
      updateWaypointVoiceConfig(selectedVoiceIndex, 'audioFileId', fileId);
      toast({
        title: '语音文件ID已保存',
        description: `航点${selectedVoiceIndex + 1}的语音文件ID已保存到audioFileId字段`,
        variant: 'default'
      });
    }
  };

  // 处理地图选择
  const handleMapLocationSelect = location => {
    setNewWaypoint(prev => ({
      ...prev,
      lat: location.lat,
      lng: location.lng
    }));
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

      // 修复：准备保存数据，确保包含所有航点语音配置
      const saveData = {
        name: formData.name,
        description: formData.description,
        estimated_duration: Number(formData.estimated_duration),
        waypoints: formData.waypoints.map((waypoint, index) => ({
          name: waypoint.name,
          flightSpeed: waypoint.flightSpeed,
          hoverDuration: waypoint.hoverDuration,
          altitude: waypoint.altitude,
          lat: waypoint.lat,
          lng: waypoint.lng,
          voiceGuide: {
            enabled: waypoint.voiceGuide.enabled,
            text: waypoint.voiceGuide.text,
            character: waypoint.voiceGuide.character,
            voice: waypoint.voiceGuide.voice,
            triggerType: waypoint.voiceGuide.triggerType,
            audioFileId: waypoint.voiceGuide.audioFileId,
            audioUrl: waypoint.voiceGuide.audioUrl,
            subtitleFileId: waypoint.voiceGuide.subtitleFileId,
            subtitleUrl: waypoint.voiceGuide.subtitleUrl
          }
        })),
        waypointCount: formData.waypoints.length,
        hasVoiceGuide: formData.hasVoiceGuide,
        hasBackgroundMusic: formData.hasBackgroundMusic,
        cloudStorageId: formData.cloudStorageId,
        updatedAt: new Date().getTime()
      };
      if (!route) {
        saveData.createdAt = new Date().getTime();
      }
      console.log('保存数据详细检查:', {
        waypoints: saveData.waypoints.map((wp, i) => ({
          index: i,
          name: wp.name,
          audioFileId: wp.voiceGuide.audioFileId,
          subtitleFileId: wp.voiceGuide.subtitleFileId,
          subtitleUrl: wp.voiceGuide.subtitleUrl
        }))
      });
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
          description: '航线、语音文件ID、字幕文件ID和背景音乐云存储ID已更新到数据库',
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
          description: '航线、语音文件ID、字幕文件ID和背景音乐云存储ID已保存到数据库',
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
          <WaypointList waypoints={formData.waypoints} onDeleteWaypoint={deleteWaypoint} onSelectWaypoint={setSelectedVoiceIndex} selectedVoiceIndex={selectedVoiceIndex} />
        </div>
      </div>
      <div>
        <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-600 shadow-lg rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-400 text-sm font-semibold">地图拾取坐标</CardTitle>
            <p className="text-gray-400 text-xs">地图中心点已设置为景区坐标</p>
          </CardHeader>
          <CardContent className="p-0">
            <SimpleMap center={scenicCenter} onLocationSelect={handleMapLocationSelect} currentLocation={{
            lat: newWaypoint.lat,
            lng: newWaypoint.lng
          }} className="h-80" />
          </CardContent>
        </Card>
      </div>
    </div>;

  // 渲染语音讲解标签页
  const renderVoiceConfigTab = () => <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h4 className="text-blue-400 text-sm font-semibold mb-3">选择航点配置语音</h4>
        <div className="h-96 overflow-y-auto border border-gray-600 rounded-lg">
          <WaypointList waypoints={formData.waypoints} onDeleteWaypoint={deleteWaypoint} onSelectWaypoint={setSelectedVoiceIndex} selectedVoiceIndex={selectedVoiceIndex} />
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