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
  // 生成下一个航点的默认名称
  const getNextWaypointName = (currentWaypoints = formData.waypoints) => {
    return `航点${currentWaypoints.length + 1}`;
  };

  const [newWaypoint, setNewWaypoint] = useState({
    name: '航点1',
    flightSpeed: 5,
    hoverDuration: 0,
    altitude: 100,
    lat: 39.9042,
    lng: 116.4074
  });
  const [editingIndex, setEditingIndex] = useState(null); // 新增：当前编辑的航点索引
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(null);
  const [scenicCenter, setScenicCenter] = useState([39.9042, 116.4074]);
  const [clearConnectionsTrigger, setClearConnectionsTrigger] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tempFileStorage, setTempFileStorage] = useState(new Map()); // 存储临时文件数据

  // 初始化时设置正确的航点名称
  useEffect(() => {
    if (editingIndex === null) {
      setNewWaypoint(prev => ({
        ...prev,
        name: getNextWaypointName()
      }));
    }
  }, [formData.waypoints.length, editingIndex]);
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
        // 更新新航点名称为下一个序号
        setNewWaypoint(prev => ({
          ...prev,
          name: getNextWaypointName(waypoints)
        }));
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
    const updatedNewWaypoint = {
      ...newWaypoint,
      [field]: value
    };
    setNewWaypoint(updatedNewWaypoint);

    // 如果正在编辑，实时同步到列表（仅前端内存）
    if (editingIndex !== null) {
      const updatedWaypoints = [...formData.waypoints];
      updatedWaypoints[editingIndex] = {
        ...updatedWaypoints[editingIndex],
        [field]: value,
        _unsaved: true // 标记为未保存
      };
      setFormData(prev => ({
        ...prev,
        waypoints: updatedWaypoints
      }));
    }
  };

  // 保存航点（确认编辑或添加新航点）
  const handleSaveWaypoint = () => {
    try {
      if (!newWaypoint.name.trim()) {
        toast({
          title: '提示',
          description: '请输入航点名称',
          variant: 'destructive'
        });
        return;
      }

      // 检查航点名称是否重复
      const trimmedName = newWaypoint.name.trim();
      const isDuplicateName = formData.waypoints.some((waypoint, index) => {
        // 如果是编辑模式，排除当前正在编辑的航点
        if (editingIndex !== null && index === editingIndex) {
          return false;
        }
        return waypoint.name.trim() === trimmedName;
      });

      if (isDuplicateName) {
        toast({
          title: '名称重复',
          description: '航点名称不能重复，请使用其他名称',
          variant: 'destructive'
        });
        return;
      }

      // 验证坐标精度
      const validatedLat = validateCoordinate(newWaypoint.lat, '纬度');
      const validatedLng = validateCoordinate(newWaypoint.lng, '经度');

      // 构造标准航点对象
      const waypointData = {
        name: trimmedName, // 使用去除空格的名称
        flightSpeed: Number(newWaypoint.flightSpeed),
        hoverDuration: Number(newWaypoint.hoverDuration),
        altitude: Number(newWaypoint.altitude),
        lat: validatedLat,
        lng: validatedLng,
        voiceGuide: newWaypoint.voiceGuide || {
          enabled: false,
          text: '',
          character: '导游',
          voice: '女声',
          triggerType: 'time',
          audioFileId: '',
          audioUrl: '',
          subtitleFileId: ''
        },
        _unsaved: false // 保存后移除未保存标记
      };

      if (editingIndex !== null) {
        // 更新现有航点
        const updatedWaypoints = [...formData.waypoints];
        updatedWaypoints[editingIndex] = {
          ...updatedWaypoints[editingIndex],
          ...waypointData
        };
        setFormData(prev => ({
          ...prev,
          waypoints: updatedWaypoints
        }));
        
        // 保持在编辑模式，并更新状态
        checkAndSwitchMode(validatedLat, validatedLng, updatedWaypoints);
        
        toast({ title: '已保存', description: '航点修改已保存到列表', variant: 'default' });
      } else {
        // 添加新航点
        const newPoint = {
          ...waypointData,
          id: Date.now()
        };
        const updatedWaypoints = [...formData.waypoints, newPoint];
        setFormData(prev => ({
          ...prev,
          waypoints: updatedWaypoints
        }));
        
        // 立即进入新航点的编辑模式
        const newIndex = updatedWaypoints.length - 1;
        setEditingIndex(newIndex);
        
        // 更新表单状态为刚添加的航点（保持当前数据，状态改为已保存）
        setNewWaypoint({
          ...waypointData, // 使用刚才保存的数据
          voiceGuide: newPoint.voiceGuide // 确保包含完整的语音配置
        });
        
        toast({ title: '已添加', description: '新航点已添加并进入编辑模式', variant: 'default' });
        
        // 再次检查确认模式（双重保障）
        checkAndSwitchMode(validatedLat, validatedLng, updatedWaypoints);
      }
    } catch (error) {
      toast({
        title: '验证失败',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  // 添加航点 - 已废弃，由 handleSaveWaypoint 替代，保留作为别名以兼容 WaypointForm props
  const addWaypoint = () => handleSaveWaypoint();

  // 删除航点
  const deleteWaypoint = index => {
    const updatedWaypoints = formData.waypoints.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      waypoints: updatedWaypoints
    }));
    // 重置新航点名称
    setNewWaypoint(prev => ({
      ...prev,
      name: getNextWaypointName(updatedWaypoints)
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
    
    setFormData(prev => {
      // 必须在回调函数内部基于 prev.waypoints 创建副本
      // 否则连续调用时会基于旧的 formData.waypoints 进行修改
      const updatedWaypoints = [...prev.waypoints];
      updatedWaypoints[index] = {
        ...updatedWaypoints[index],
        voiceGuide: {
          ...updatedWaypoints[index].voiceGuide,
          [field]: value
        }
      };

      return {
        ...prev,
        waypoints: updatedWaypoints
      }
    });
  };

  // 处理语音合成完成 - 修复：存储临时文件数据，延迟上传
  const handleSpeechSynthesisComplete = (tempAudioId, audioUrl, tempSubtitleId, blobData) => {
    if (selectedVoiceIndex !== null) {
      // 存储临时文件数据
      const newTempStorage = new Map(tempFileStorage);
      
      if (blobData.audioBlob) {
        newTempStorage.set(tempAudioId, {
          type: 'audio',
          blob: blobData.audioBlob,
          waypointName: blobData.waypointName,
          waypointIndex: selectedVoiceIndex
        });
      }
      
      if (blobData.subtitleBlob) {
        newTempStorage.set(tempSubtitleId, {
          type: 'subtitle', 
          blob: blobData.subtitleBlob,
          waypointName: blobData.waypointName,
          waypointIndex: selectedVoiceIndex
        });
      }
      
      setTempFileStorage(newTempStorage);
      
      // 更新航点配置为临时ID（保存时会替换为真实文件ID）
      updateWaypointVoiceConfig(selectedVoiceIndex, 'audioFileId', tempAudioId);
      if (tempSubtitleId) {
        updateWaypointVoiceConfig(selectedVoiceIndex, 'subtitleFileId', tempSubtitleId);
      }
      
      toast({
        title: '语音和字幕已生成',
        description: `航点${selectedVoiceIndex + 1}的文件将在保存航线时上传到云存储`,
        variant: 'default'
      });
    }
  };

  // 检查点位是否已存在并处理状态切换
  const checkAndSwitchMode = (lat, lng, waypoints = formData.waypoints) => {
    // 验证坐标精度
    const validatedLat = validateCoordinate(lat, '纬度');
    const validatedLng = validateCoordinate(lng, '经度');

    // 尝试通过坐标匹配已存在的航点
    const existingIndex = waypoints.findIndex(wp => 
      Math.abs(wp.lat - validatedLat) < 0.00000001 && 
      Math.abs(wp.lng - validatedLng) < 0.00000001
    );

    if (existingIndex !== -1) {
      // [场景A] 坐标匹配到已有航点 -> 进入/保持编辑模式
      setEditingIndex(existingIndex);
      
      // 同步航点信息到表单
      setNewWaypoint({
        name: waypoints[existingIndex].name,
        flightSpeed: waypoints[existingIndex].flightSpeed || 5,
        hoverDuration: waypoints[existingIndex].hoverDuration || 0,
        altitude: waypoints[existingIndex].altitude || 100,
        lat: validatedLat,
        lng: validatedLng,
        // 保留语音配置
        voiceGuide: waypoints[existingIndex].voiceGuide
      });
      
      return true; // 返回true表示是已有航点
    } else {
      // [场景B] 坐标未匹配 -> 保持/切换至新增模式
      // 注意：此函数不负责重置为新航点默认值（除非显式调用），主要用于状态判断
      // 如果需要重置编辑状态
      // setEditingIndex(null); 
      return false; // 返回false表示是新坐标
    }
  };

  // 处理地图选择 - 确保8位小数精度
  const handleMapLocationSelect = location => {
    try {
      // 1. 验证坐标精度
      const validatedLat = validateCoordinate(location.lat, '纬度');
      const validatedLng = validateCoordinate(location.lng, '经度');
      
      // 2. 优先使用 checkAndSwitchMode 进行逻辑判断
      // 如果直接传递了index，则直接使用index（优化性能）
      if (typeof location.index !== 'undefined') {
        const index = location.index;
        setEditingIndex(index);
        setNewWaypoint({
          name: formData.waypoints[index].name,
          flightSpeed: formData.waypoints[index].flightSpeed || 5,
          hoverDuration: formData.waypoints[index].hoverDuration || 0,
          altitude: formData.waypoints[index].altitude || 100,
          lat: validatedLat,
          lng: validatedLng,
          voiceGuide: formData.waypoints[index].voiceGuide
        });
        toast({ title: '编辑模式', description: `正在编辑: ${formData.waypoints[index].name}`, duration: 2000 });
        return;
      }

      // 如果没有索引，尝试坐标匹配
      const isExisting = checkAndSwitchMode(validatedLat, validatedLng);

      if (isExisting) {
         toast({ title: '编辑模式', description: `正在编辑: ${newWaypoint.name}`, duration: 2000 });
      } else {
        // [场景B] 点击了地图空白区域（非现有航点位置）
        if (editingIndex !== null) {
          // [需求实现] 当前处于编辑模式 -> 自动退出编辑模式 (切换至新增模式)
          
          // 1. 清除当前选中的编辑对象
          setEditingIndex(null);
          
          // 2. 重置表单内容 (清空输入、恢复默认值、清除验证状态)
          setNewWaypoint({
            name: getNextWaypointName(), // 自动生成默认名称
            flightSpeed: 5,
            hoverDuration: 0,
            altitude: 100,
            lat: validatedLat, // 使用点击位置作为新航点坐标
            lng: validatedLng,
            voiceGuide: {
              enabled: false,
              text: '',
              character: '导游',
              voice: '女声',
              triggerType: 'time',
              audioFileId: '',
              audioUrl: '',
              subtitleFileId: ''
            }
          });
          
          // 3. 状态变更事件通知
          toast({ title: '新增模式', description: '已退出编辑，切换至新增航点模式', duration: 2000 });
        } else {
          // [场景C] 当前处于新增模式 -> 仅更新新航点坐标
          
          // 确保处于新增模式（重置底部按钮状态）
          setEditingIndex(null);
          
          setNewWaypoint(prev => ({
            ...prev,
            lat: validatedLat,
            lng: validatedLng
          }));
        }
      }
    } catch (error) {
      console.error('[RouteEditor] 坐标处理异常:', error);
      toast({
        title: '操作失败',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  // 处理删除当前编辑的航点（从表单操作）
  const handleDeleteCurrentWaypoint = () => {
    if (editingIndex !== null) {
      try {
        // 1. 执行删除操作
        const updatedWaypoints = formData.waypoints.filter((_, i) => i !== editingIndex);
        
        // 2. 更新数据状态
        setFormData(prev => ({
          ...prev,
          waypoints: updatedWaypoints
        }));

        // 3. 退出编辑模式
        setEditingIndex(null);

        // 4. 重置表单为新航点默认值
        setNewWaypoint({
          name: getNextWaypointName(updatedWaypoints),
          flightSpeed: 5,
          hoverDuration: 0,
          altitude: 100,
          lat: scenicCenter[0],
          lng: scenicCenter[1],
          voiceGuide: {
            enabled: false,
            text: '',
            character: '导游',
            voice: '女声',
            triggerType: 'time',
            audioFileId: '',
            audioUrl: '',
            subtitleFileId: ''
          }
        });

        // 5. 用户反馈
        toast({
          title: '已删除',
          description: '航点已从列表中移除',
          variant: 'default'
        });
      } catch (error) {
        console.error('删除航点失败:', error);
        toast({
          title: '删除失败',
          description: '操作出现异常，请重试',
          variant: 'destructive'
        });
      }
    } else {
      // 新增模式下的重置逻辑
      setNewWaypoint({
        name: getNextWaypointName(),
        flightSpeed: 5,
        hoverDuration: 0,
        altitude: 100,
        lat: scenicCenter[0],
        lng: scenicCenter[1],
        voiceGuide: {
          enabled: false,
          text: '',
          character: '导游',
          voice: '女声',
          triggerType: 'time',
          audioFileId: '',
          audioUrl: '',
          subtitleFileId: ''
        }
      });
      toast({
        title: '已重置',
        description: '航点表单已重置',
        variant: 'default'
      });
    }
  };

  // 批量上传临时文件到云存储
  const uploadTempFiles = async () => {
    const tempFiles = Array.from(tempFileStorage.entries());
    if (tempFiles.length === 0) return {};

    const uploadResults = {};
    const tcb = await $w.cloud.getCloudInstance();

    for (const [tempId, fileData] of tempFiles) {
      try {
        const { type, blob, waypointName } = fileData;
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        
        let cloudPath;
        if (type === 'audio') {
          cloudPath = `audio/${waypointName}_${timestamp}_${randomStr}.webm`;
        } else if (type === 'subtitle') {
          cloudPath = `subtitle/${waypointName}_${timestamp}_${randomStr}.srt`;
        }

        const uploadResult = await tcb.uploadFile({
          cloudPath: cloudPath,
          filePath: blob
        });

        uploadResults[tempId] = uploadResult.fileID;
      } catch (error) {
        console.error(`上传失败: ${tempId}`, error);
        throw new Error(`上传${fileData.type}文件失败: ${error.message}`);
      }
    }

    return uploadResults;
  };

  // 保存航线 - 增加批量上传逻辑
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

      setIsSaving(true);

      // 1. 批量上传临时文件
      let uploadResults = {};
      if (tempFileStorage.size > 0) {
        toast({
          title: '上传中',
          description: '正在上传语音和字幕文件到云存储...',
          variant: 'default'
        });
        uploadResults = await uploadTempFiles();
      }

      // 2. 验证所有航点的坐标精度并替换临时ID为真实文件ID
      const validatedWaypoints = formData.waypoints.map((waypoint, index) => {
        const validatedLat = validateCoordinate(waypoint.lat, '纬度');
        const validatedLng = validateCoordinate(waypoint.lng, '经度');
        
        // 替换临时ID为真实文件ID
        let audioFileId = waypoint.voiceGuide.audioFileId;
        let subtitleFileId = waypoint.voiceGuide.subtitleFileId;
        
        if (audioFileId && uploadResults[audioFileId]) {
          audioFileId = uploadResults[audioFileId];
        }
        if (subtitleFileId && uploadResults[subtitleFileId]) {
          subtitleFileId = uploadResults[subtitleFileId];
        }
        
        return {
          name: waypoint.name,
          flightSpeed: waypoint.flightSpeed,
          hoverDuration: waypoint.hoverDuration,
          altitude: waypoint.altitude,
          lat: validatedLat,
          lng: validatedLng,
          voiceGuide: {
            enabled: waypoint.voiceGuide.enabled,
            text: waypoint.voiceGuide.text,
            character: waypoint.voiceGuide.character,
            voice: waypoint.voiceGuide.voice,
            triggerType: waypoint.voiceGuide.triggerType,
            audioFileId: audioFileId,
            audioUrl: '', // 不保存临时链接
            subtitleFileId: subtitleFileId
          }
        };
      });

      // 3. 准备保存数据
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

      // 4. 保存到数据库
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
        toast({
          title: '更新成功',
          description: '航线和所有文件已成功保存到云存储和数据库',
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
        toast({
          title: '创建成功',
          description: '航线和所有文件已成功保存到云存储和数据库',
          variant: 'default'
        });
      }

      // 5. 清理临时文件存储
      setTempFileStorage(new Map());
      
      onSuccess();
    } catch (error) {
      console.error('保存航线失败:', error);
      toast({
        title: '保存失败',
        description: error.message || '请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 渲染航点列表标签页
  const renderWaypointListTab = () => <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      <div className="lg:col-span-1 space-y-4 flex flex-col h-full">
        {/* 移除左侧表单顶部的title标题区域 */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar h-full">
          <WaypointForm newWaypoint={newWaypoint} onWaypointChange={handleWaypointChange} onAddWaypoint={addWaypoint} onDeleteWaypoint={handleDeleteCurrentWaypoint} scenicCenter={scenicCenter} isEditing={editingIndex !== null} />
        </div>
      </div>
      <div className="lg:col-span-2 flex flex-col h-full">
        {/* 将坐标精度提示信息从表单中移出，改为在右侧地图区域以info提示框形式展示 */}
        <div className="flex justify-between items-center mb-3 flex-shrink-0">
          <h4 className="text-foreground text-sm font-semibold">地图选点</h4>
          <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded border border-border">
            提示：点击地图可自动填充坐标，支持8位小数精度
          </div>
        </div>
        <Card className="bg-card border-border shadow-sm flex-1 flex flex-col min-h-0">
          {/* 移除地图标题栏 */}
          <CardContent className="p-0 relative flex-1">
            <SimpleMap center={scenicCenter} onLocationSelect={handleMapLocationSelect} currentLocation={{
            lat: newWaypoint.lat,
            lng: newWaypoint.lng
          }} waypoints={formData.waypoints} onClearConnections={clearConnectionsTrigger} className="h-full w-full absolute inset-0" />
            
          </CardContent>
        </Card>
      </div>
    </div>;

  // 渲染语音讲解标签页
  const renderVoiceConfigTab = () => <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      <div className="flex flex-col h-full min-h-0">
        <h4 className="text-foreground text-sm font-semibold mb-3">选择航点配置语音</h4>
        <div className="flex-1 min-h-0 overflow-y-auto border border-border rounded-lg bg-background/50 p-2 custom-scrollbar">
          <WaypointList waypoints={formData.waypoints} onDeleteWaypoint={deleteWaypoint} onSelectWaypoint={setSelectedVoiceIndex} selectedVoiceIndex={selectedVoiceIndex} locked={true} // 启用列表锁定功能
        />
        </div>
      </div>
      <div className="flex flex-col h-full min-h-0">
        <h4 className="text-foreground text-sm font-semibold mb-3">语音配置详情</h4>
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          <VoiceConfigPanel waypoint={selectedVoiceIndex !== null ? formData.waypoints[selectedVoiceIndex] : null} onVoiceConfigChange={(field, value) => updateWaypointVoiceConfig(selectedVoiceIndex, field, value)} onSynthesisComplete={handleSpeechSynthesisComplete} $w={$w} tempFileStorage={tempFileStorage} />
        </div>
      </div>
    </div>;

  // 渲染背景音乐标签页
  const renderMusicConfigTab = () => <div className="space-y-6">
      <div className="flex items-center space-x-2 cursor-pointer" onClick={() => handleInputChange('hasBackgroundMusic', !formData.hasBackgroundMusic)}>
        <input type="checkbox" checked={formData.hasBackgroundMusic} onChange={e => handleInputChange('hasBackgroundMusic', e.target.checked)} className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-primary focus:ring-2" />
        <label className="text-foreground text-sm font-medium cursor-pointer">启用背景音乐</label>
      </div>
      
      {formData.hasBackgroundMusic && <BackgroundMusicUploader cloudStorageId={formData.cloudStorageId} onCloudStorageIdChange={handleCloudStorageIdChange} $w={$w} />}
    </div>;
  return <Dialog open={true} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-7xl min-h-[600px] max-h-[90vh] bg-background border border-border shadow-xl rounded-lg flex flex-col p-0 overflow-hidden" onPointerDownOutside={e => e.preventDefault()}>
        <DialogHeader className="flex-shrink-0 p-6 border-b border-border bg-card">
          <DialogTitle className="text-xl font-bold text-foreground">
            {route ? '编辑航线' : '创建航线'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 bg-background/50">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="flex w-full bg-background border-b border-border rounded-none p-0 h-12 justify-start px-6 gap-6">
              <TabsTrigger value="basic" className="h-full rounded-none border-b-2 border-transparent px-0 data-[state=active]:border-[#1890FF] data-[state=active]:bg-background data-[state=active]:text-[#1890FF] data-[state=active]:shadow-none transition-all text-sm font-medium text-muted-foreground hover:text-foreground">
                基本信息
              </TabsTrigger>
              <TabsTrigger value="waypoints" className="h-full rounded-none border-b-2 border-transparent px-0 data-[state=active]:border-[#1890FF] data-[state=active]:bg-background data-[state=active]:text-[#1890FF] data-[state=active]:shadow-none transition-all text-sm font-medium text-muted-foreground hover:text-foreground">
                航点列表
              </TabsTrigger>
              <TabsTrigger value="voice" className="h-full rounded-none border-b-2 border-transparent px-0 data-[state=active]:border-[#1890FF] data-[state=active]:bg-background data-[state=active]:text-[#1890FF] data-[state=active]:shadow-none transition-all text-sm font-medium text-muted-foreground hover:text-foreground">
                语音讲解
              </TabsTrigger>
              <TabsTrigger value="music" className="h-full rounded-none border-b-2 border-transparent px-0 data-[state=active]:border-[#1890FF] data-[state=active]:bg-background data-[state=active]:text-[#1890FF] data-[state=active]:shadow-none transition-all text-sm font-medium text-muted-foreground hover:text-foreground">
                背景音乐
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-6 min-h-[400px]">
              <TabsContent value="basic" className="space-y-6 h-full mt-0">
                <BasicInfoPanel formData={formData} onInputChange={handleInputChange} />
              </TabsContent>

              <TabsContent value="waypoints" className="space-y-6 h-full mt-0">
                {renderWaypointListTab()}
              </TabsContent>

              <TabsContent value="voice" className="space-y-6 h-full mt-0">
                {renderVoiceConfigTab()}
              </TabsContent>

              <TabsContent value="music" className="space-y-6 h-full mt-0">
                {renderMusicConfigTab()}
              </TabsContent>
            </div>
          </Tabs>

          {/* 保存按钮区域 - 固定在底部 */}
          <div className="flex-shrink-0 border-t border-border bg-card p-4">
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={onClose} className="border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground" disabled={isSaving}>
                <X className="w-4 h-4 mr-2" /> 取消
              </Button>
              <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" /> 保存航线
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
}