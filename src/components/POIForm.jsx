// @ts-ignore;
import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore;
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, useToast, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
// @ts-ignore;
import { MapPin, Navigation, Upload, X, Image, Video, Palette, Type, Code, Eye, CheckCircle, AlertCircle, Copy, RotateCcw } from 'lucide-react';

// 本地存储键名
const SCENIC_SPOT_STORAGE_KEY = 'scenic_spot_data';
// 天地图API密钥
const TIAN_DI_TU_KEY = 'eaa119242fd58a04007ad66abc2546f7';
export function POIForm({
  poi,
  $w,
  open,
  onOpenChange,
  onSave,
  onCancel
}) {
  const {
    toast
  } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    latitude: '',
    longitude: '',
    height: '',
    imageFileId: '',
    videoFileId: '',
    fontFamily: 'Arial',
    fontSize: '14',
    fontColor: '#000000',
    extension: ''
  });
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [jsonError, setJsonError] = useState('');
  const [jsonValid, setJsonValid] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const extensionTextareaRef = useRef(null);

  // 从本地存储获取景区数据
  const getScenicDataFromLocal = () => {
    try {
      const storedData = localStorage.getItem(SCENIC_SPOT_STORAGE_KEY);
      return storedData ? JSON.parse(storedData) : null;
    } catch (error) {
      console.error('从本地存储获取数据失败:', error);
      return null;
    }
  };

  // 获取文件临时链接
  const getFileUrl = async fileId => {
    if (!fileId) return '';
    try {
      const tcb = await $w.cloud.getCloudInstance();
      const result = await tcb.getTempFileURL({
        fileList: [fileId]
      });
      if (result.fileList && result.fileList[0]) {
        return result.fileList[0].tempFileURL;
      }
      return '';
    } catch (error) {
      console.error('获取文件链接失败:', error);
      return '';
    }
  };

  // 初始化表单数据和预览链接
  useEffect(() => {
    const initializeFormData = async () => {
      if (poi) {
        // 获取图片和视频的预览链接
        let imageUrl = '';
        let videoUrl = '';
        if (poi.imageFileId) {
          imageUrl = await getFileUrl(poi.imageFileId);
        }
        if (poi.videoFileId) {
          videoUrl = await getFileUrl(poi.videoFileId);
        }
        setFormData({
          name: poi.name || '',
          description: poi.description || '',
          latitude: poi.latitude?.toString() || '',
          longitude: poi.longitude?.toString() || '',
          height: poi.height?.toString() || '',
          imageFileId: poi.imageFileId || '',
          videoFileId: poi.videoFileId || '',
          fontFamily: poi.fontFamily || 'Arial',
          fontSize: poi.fontSize?.toString() || '14',
          fontColor: poi.fontColor || '#000000',
          extension: poi.extension || ''
        });
        setImagePreviewUrl(imageUrl);
        setVideoPreviewUrl(videoUrl);
      } else {
        setFormData({
          name: '',
          description: '',
          latitude: '',
          longitude: '',
          height: '',
          imageFileId: '',
          videoFileId: '',
          fontFamily: 'Arial',
          fontSize: '14',
          fontColor: '#000000',
          extension: ''
        });
        setImagePreviewUrl('');
        setVideoPreviewUrl('');
      }
    };
    if (open) {
      initializeFormData();
    }
  }, [poi, open]);

  // 监听extension变化，自动验证JSON
  useEffect(() => {
    validateJson(formData.extension);
  }, [formData.extension]);

  // 检查天地图API是否已加载
  const isTianDiTuLoaded = () => {
    return typeof window.T !== 'undefined' && window.T !== null;
  };

  // 加载天地图API
  const loadTianDiTuAPI = () => {
    return new Promise((resolve, reject) => {
      if (isTianDiTuLoaded()) {
        resolve();
        return;
      }
      if (window._tdtLoading) {
        const checkInterval = setInterval(() => {
          if (isTianDiTuLoaded()) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        return;
      }
      window._tdtLoading = true;
      const script = document.createElement('script');
      script.src = `https://api.tianditu.gov.cn/api?v=4.0&tk=${TIAN_DI_TU_KEY}`;
      script.onload = () => {
        const checkAPI = setInterval(() => {
          if (isTianDiTuLoaded()) {
            clearInterval(checkAPI);
            window._tdtLoading = false;
            resolve();
          }
        }, 100);
        setTimeout(() => {
          clearInterval(checkAPI);
          window._tdtLoading = false;
          reject(new Error('天地图API加载超时'));
        }, 10000);
      };
      script.onerror = () => {
        window._tdtLoading = false;
        reject(new Error('天地图API加载失败'));
      };
      document.head.appendChild(script);
    });
  };

  // 初始化地图
  const initializeMap = async () => {
    if (!mapContainerRef.current || mapLoaded) return;
    try {
      if (!mapContainerRef.current || mapContainerRef.current.offsetWidth === 0) {
        setTimeout(() => initializeMap(), 100);
        return;
      }
      await loadTianDiTuAPI();
      if (!mapContainerRef.current) {
        throw new Error('地图容器不存在');
      }
      const scenicData = getScenicDataFromLocal();
      let mapCenter;
      if (scenicData && scenicData.latitude && scenicData.longitude) {
        mapCenter = new T.LngLat(scenicData.longitude, scenicData.latitude);
      } else if (formData.latitude && formData.longitude) {
        mapCenter = new T.LngLat(parseFloat(formData.longitude), parseFloat(formData.latitude));
      } else {
        mapCenter = new T.LngLat(116.397428, 39.90923);
      }
      const mapInstance = new T.Map(mapContainerRef.current);
      mapInstance.centerAndZoom(mapCenter, 12);
      mapInstance.addControl(new T.Control.Zoom());
      mapInstance.addControl(new T.Control.MapType());

      // 地图点击事件 - 移除坐标拾取成功提示
      const handleMapClick = e => {
        try {
          const lngLat = e.lnglat;
          const latitude = lngLat.lat.toFixed(6);
          const longitude = lngLat.lng.toFixed(6);
          setFormData(prev => ({
            ...prev,
            latitude: latitude,
            longitude: longitude
          }));
          // 移除坐标拾取成功提示
          addMarker(lngLat, mapInstance);
        } catch (error) {
          console.error('坐标拾取错误:', error);
        }
      };
      mapInstance.addEventListener('click', handleMapClick);
      mapInstanceRef.current = mapInstance;
      setMapLoaded(true);

      // 如果已有坐标，添加标记
      if (formData.latitude && formData.longitude) {
        const lngLat = new T.LngLat(parseFloat(formData.longitude), parseFloat(formData.latitude));
        addMarker(lngLat, mapInstance);
      }
    } catch (error) {
      console.error('地图初始化失败:', error);
      toast({
        title: '地图加载失败',
        description: error.message || '请检查网络连接',
        variant: 'destructive'
      });
    }
  };

  // 添加地图标记
  const addMarker = (lngLat, mapInstance = mapInstanceRef.current) => {
    if (!mapInstance) return;
    try {
      // 清除之前的标记
      if (mapInstance._markers) {
        mapInstance._markers.forEach(marker => {
          mapInstance.removeOverLay(marker);
        });
      }
      const marker = new T.Marker(lngLat);
      mapInstance.addOverLay(marker);
      if (!mapInstance._markers) {
        mapInstance._markers = [];
      }
      mapInstance._markers.push(marker);
    } catch (error) {
      console.error('添加标记失败:', error);
    }
  };

  // 清理地图资源
  const cleanupMap = () => {
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      } catch (error) {
        console.error('清理地图资源失败:', error);
      }
    }
    setMapLoaded(false);
  };

  // 地图生命周期管理
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        initializeMap();
      }, 300);
    } else {
      cleanupMap();
    }
    return () => {
      cleanupMap();
    };
  }, [open]);

  // 处理输入框变化
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 处理JSON扩展字段变化
  const handleExtensionChange = value => {
    setFormData(prev => ({
      ...prev,
      extension: value
    }));
  };

  // JSON格式校验
  const validateJson = jsonString => {
    if (!jsonString.trim()) {
      setJsonError('');
      setJsonValid(false);
      return true;
    }
    try {
      const parsed = JSON.parse(jsonString);
      if (typeof parsed === 'object' && parsed !== null) {
        setJsonError('');
        setJsonValid(true);
        return true;
      } else {
        setJsonError('JSON格式不正确，必须是一个对象');
        setJsonValid(false);
        return false;
      }
    } catch (error) {
      setJsonError('JSON格式错误: ' + error.message);
      setJsonValid(false);
      return false;
    }
  };

  // 格式化JSON
  const formatJson = () => {
    if (!formData.extension.trim()) return;
    try {
      const parsed = JSON.parse(formData.extension);
      const formatted = JSON.stringify(parsed, null, 2);
      setFormData(prev => ({
        ...prev,
        extension: formatted
      }));
      toast({
        title: 'JSON格式化成功',
        description: 'JSON已格式化'
      });
    } catch (error) {
      toast({
        title: '格式化失败',
        description: 'JSON格式不正确，无法格式化',
        variant: 'destructive'
      });
    }
  };

  // 压缩JSON
  const compressJson = () => {
    if (!formData.extension.trim()) return;
    try {
      const parsed = JSON.parse(formData.extension);
      const compressed = JSON.stringify(parsed);
      setFormData(prev => ({
        ...prev,
        extension: compressed
      }));
      toast({
        title: 'JSON压缩成功',
        description: 'JSON已压缩'
      });
    } catch (error) {
      toast({
        title: '压缩失败',
        description: 'JSON格式不正确，无法压缩',
        variant: 'destructive'
      });
    }
  };

  // 复制JSON到剪贴板
  const copyJson = async () => {
    if (!formData.extension.trim()) return;
    try {
      await navigator.clipboard.writeText(formData.extension);
      toast({
        title: '复制成功',
        description: 'JSON已复制到剪贴板'
      });
    } catch (error) {
      toast({
        title: '复制失败',
        description: '无法复制到剪贴板',
        variant: 'destructive'
      });
    }
  };

  // 清空JSON
  const clearJson = () => {
    setFormData(prev => ({
      ...prev,
      extension: ''
    }));
    toast({
      title: '已清空',
      description: 'JSON内容已清空'
    });
  };

  // 处理文件上传
  const handleFileUpload = async (event, type) => {
    const file = event.target.files[0];
    if (!file) return;
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const allowedVideoTypes = ['video/mp4', 'video/quicktime'];
    if (type === 'image' && !allowedImageTypes.includes(file.type)) {
      toast({
        title: '文件类型不支持',
        description: '请上传图片文件 (JPEG, PNG, GIF)',
        variant: 'destructive'
      });
      return;
    }
    if (type === 'video' && !allowedVideoTypes.includes(file.type)) {
      toast({
        title: '文件类型不支持',
        description: '请上传视频文件 (MP4)',
        variant: 'destructive'
      });
      return;
    }
    if (type === 'image') setUploadingImage(true);
    if (type === 'video') setUploadingVideo(true);
    try {
      const tcb = await $w.cloud.getCloudInstance();
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileName = `poi_${type}s/${timestamp}_${randomStr}_${file.name}`;
      const uploadResult = await tcb.uploadFile({
        cloudPath: fileName,
        filePath: file
      });
      const fileID = uploadResult.fileID;
      const tempFileURLResult = await tcb.getTempFileURL({
        fileList: [fileID]
      });
      const previewUrl = tempFileURLResult.fileList[0].tempFileURL;
      setFormData(prev => ({
        ...prev,
        [type === 'image' ? 'imageFileId' : 'videoFileId']: fileID
      }));
      if (type === 'image') {
        setImagePreviewUrl(previewUrl);
      } else {
        setVideoPreviewUrl(previewUrl);
      }
      toast({
        title: '上传成功',
        description: `${type === 'image' ? '图片' : '视频'}文件已上传`
      });
    } catch (error) {
      toast({
        title: '上传失败',
        description: error.message || '请检查网络连接',
        variant: 'destructive'
      });
    } finally {
      if (type === 'image') {
        setUploadingImage(false);
        if (imageInputRef.current) imageInputRef.current.value = '';
      }
      if (type === 'video') {
        setUploadingVideo(false);
        if (videoInputRef.current) videoInputRef.current.value = '';
      }
    }
  };

  // 清除文件
  const clearFile = type => {
    if (type === 'image') {
      setFormData(prev => ({
        ...prev,
        imageFileId: ''
      }));
      setImagePreviewUrl('');
    } else {
      setFormData(prev => ({
        ...prev,
        videoFileId: ''
      }));
      setVideoPreviewUrl('');
    }
    toast({
      title: '已清除',
      description: `${type === 'image' ? '图片' : '视频'}文件已清除`
    });
  };

  // 处理表单提交
  const handleSaveClick = async () => {
    if (!formData.name) {
      toast({
        title: '表单验证失败',
        description: '请输入POI名称',
        variant: 'destructive'
      });
      return;
    }
    if (!formData.latitude || !formData.longitude) {
      toast({
        title: '表单验证失败',
        description: '请选择坐标位置',
        variant: 'destructive'
      });
      return;
    }
    if (formData.extension.trim() && !validateJson(formData.extension)) {
      toast({
        title: 'JSON格式错误',
        description: '请检查拓展配置的JSON格式',
        variant: 'destructive'
      });
      return;
    }
    setLoading(true);
    try {
      const poiData = {
        name: formData.name,
        description: formData.description,
        latitude: parseFloat(formData.latitude) || 0,
        longitude: parseFloat(formData.longitude) || 0,
        height: parseFloat(formData.height) || 0,
        imageFileId: formData.imageFileId,
        videoFileId: formData.videoFileId,
        fontFamily: formData.fontFamily,
        fontSize: parseInt(formData.fontSize) || 14,
        fontColor: formData.fontColor,
        extension: formData.extension,
        updatedAt: new Date().getTime()
      };
      if (poi?._id) {
        await $w.cloud.callDataSource({
          dataSourceName: 'signage_data',
          methodName: 'wedaUpdateV2',
          params: {
            filter: {
              where: {
                _id: {
                  $eq: poi._id
                }
              }
            },
            data: poiData
          }
        });
        toast({
          title: 'POI更新成功',
          description: `POI "${formData.name}" 已更新`
        });
      } else {
        poiData.createdAt = new Date().getTime();
        await $w.cloud.callDataSource({
          dataSourceName: 'signage_data',
          methodName: 'wedaCreateV2',
          params: {
            data: poiData
          }
        });
        toast({
          title: 'POI创建成功',
          description: `POI "${formData.name}" 已创建`
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

  // 渲染基础信息标签页
  const renderBasicTab = () => <div className="space-y-4">
      <div>
        <Label htmlFor="name" className="font-medium">POI名称 *</Label>
        <Input id="name" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} placeholder="请输入POI名称" className="mt-1" required />
      </div>

      <div>
        <Label htmlFor="description" className="font-medium">描述</Label>
        <Textarea id="description" value={formData.description} onChange={e => handleInputChange('description', e.target.value)} placeholder="请输入POI描述" className="mt-1 h-20" />
      </div>

      {/* 坐标信息 - 直接显示地图 */}
      <div className="bg-muted/30 rounded-lg p-4 border border-border">
        <div className="flex items-center justify-between mb-4">
          <Label className="font-medium">地理坐标</Label>
          <div className="flex items-center space-x-2 text-primary text-sm">
            <Navigation className="h-4 w-4" />
            <span>左键点击地图拾取坐标</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="latitude" className="text-muted-foreground">纬度</Label>
            <Input id="latitude" value={formData.latitude} onChange={e => handleInputChange('latitude', e.target.value)} placeholder="例如：39.90923" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="longitude" className="text-muted-foreground">经度</Label>
            <Input id="longitude" value={formData.longitude} onChange={e => handleInputChange('longitude', e.target.value)} placeholder="例如：116.397428" className="mt-1" />
          </div>
        </div>

        {/* 地图拾取区域 */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/50 border-b border-border p-3">
            <p className="text-muted-foreground text-sm">
              <strong>操作说明：</strong>左键点击地图拾取坐标
            </p>
          </div>
          <div ref={mapContainerRef} className="w-full h-64 bg-muted">
            {!mapLoaded && <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                地图加载中...
              </div>}
          </div>
        </div>

        {formData.latitude && formData.longitude && <div className="mt-3 p-3 bg-primary/10 border border-primary/20 rounded">
            <div className="flex items-center space-x-2 text-primary text-sm">
              <MapPin className="h-4 w-4" />
              <span>当前坐标：纬度 {formData.latitude}，经度 {formData.longitude}</span>
            </div>
          </div>}
      </div>

      <div>
        <Label htmlFor="height" className="font-medium">高度 (米)</Label>
        <Input id="height" type="number" value={formData.height} onChange={e => handleInputChange('height', e.target.value)} placeholder="请输入高度" className="mt-1" />
      </div>
    </div>;

  // 渲染媒体上传标签页
  const renderMediaTab = () => <div className="space-y-6">
      {/* 图片上传 */}
      <div className="bg-muted/30 rounded-lg p-4 border border-border">
        <Label className="mb-4 block font-medium">图片上传</Label>
        <div className="space-y-3">
          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'image')} />
          
          {formData.imageFileId ? <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Image className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">图片已上传</p>
                    <p className="text-xs text-muted-foreground">文件ID: {formData.imageFileId.substring(0, 20)}...</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} className="px-3">
                    <Upload className="h-3 w-3 mr-1" />
                    更换
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => clearFile('image')} className="px-3 hover:text-destructive">
                    <X className="h-3 w-3 mr-1" />
                    清除
                  </Button>
                </div>
              </div>
              {imagePreviewUrl && <div className="border border-border rounded-lg p-2 bg-muted/50">
                  <img src={imagePreviewUrl} alt="预览" className="w-full h-32 object-cover rounded" />
                </div>}
            </div> : <div className="text-center border-2 border-dashed border-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer bg-muted/20" onClick={() => imageInputRef.current?.click()}>
              <div className="space-y-3">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Image className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <div>
                  <p className="text-foreground font-medium">{uploadingImage ? '上传中...' : '点击上传图片'}</p>
                  <p className="text-muted-foreground text-sm mt-1">支持 JPG, PNG, GIF 格式</p>
                </div>
                {uploadingImage && <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full animate-pulse"></div>
                  </div>}
              </div>
            </div>}
        </div>
      </div>

      {/* 视频上传 */}
      <div className="bg-muted/30 rounded-lg p-4 border border-border">
        <Label className="mb-4 block font-medium">视频上传</Label>
        <div className="space-y-3">
          <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={e => handleFileUpload(e, 'video')} />
          
          {formData.videoFileId ? <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Video className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">视频已上传</p>
                    <p className="text-xs text-muted-foreground">文件ID: {formData.videoFileId.substring(0, 20)}...</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => videoInputRef.current?.click()} className="px-3">
                    <Upload className="h-3 w-3 mr-1" />
                    更换
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => clearFile('video')} className="px-3 hover:text-destructive">
                    <X className="h-3 w-3 mr-1" />
                    清除
                  </Button>
                </div>
              </div>
              {videoPreviewUrl && <div className="border border-border rounded-lg p-2 bg-muted/50">
                  <video src={videoPreviewUrl} controls className="w-full h-32 object-cover rounded" />
                </div>}
            </div> : <div className="text-center border-2 border-dashed border-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer bg-muted/20" onClick={() => videoInputRef.current?.click()}>
              <div className="space-y-3">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center">
                    <Video className="h-8 w-8 text-purple-500" />
                  </div>
                </div>
                <div>
                  <p className="text-foreground font-medium">{uploadingVideo ? '上传中...' : '点击上传视频'}</p>
                  <p className="text-muted-foreground text-sm mt-1">支持 MP4, MOV, AVI 格式</p>
                </div>
                {uploadingVideo && <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full animate-pulse"></div>
                  </div>}
              </div>
            </div>}
        </div>
      </div>
    </div>;

  // 渲染样式配置标签页
  const renderStyleTab = () => <div className="space-y-6">
      {/* 字体配置 */}
      <div className="bg-muted/30 rounded-lg p-4 border border-border">
        <Label className="mb-4 block flex items-center font-medium">
          <Type className="h-4 w-4 mr-2" />
          字体配置
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="fontFamily" className="text-muted-foreground">字体</Label>
            <Select value={formData.fontFamily} onValueChange={value => handleInputChange('fontFamily', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="选择字体" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Arial">Arial</SelectItem>
                <SelectItem value="Microsoft YaHei">微软雅黑</SelectItem>
                <SelectItem value="SimHei">黑体</SelectItem>
                <SelectItem value="SimSun">宋体</SelectItem>
                <SelectItem value="KaiTi">楷体</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="fontSize" className="text-muted-foreground">字号</Label>
            <Input id="fontSize" type="number" value={formData.fontSize} onChange={e => handleInputChange('fontSize', e.target.value)} placeholder="字号大小" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="fontColor" className="text-muted-foreground">字体颜色</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Input id="fontColor" type="color" value={formData.fontColor} onChange={e => handleInputChange('fontColor', e.target.value)} className="h-10 w-16 p-1 cursor-pointer" />
              <Input value={formData.fontColor} onChange={e => handleInputChange('fontColor', e.target.value)} placeholder="#000000" className="flex-1" />
            </div>
          </div>
        </div>
      </div>

      {/* 字体效果预览 */}
      <div className="bg-muted/30 rounded-lg p-4 border border-border">
        <Label className="mb-4 block flex items-center font-medium">
          <Eye className="h-4 w-4 mr-2" />
          字体效果预览
        </Label>
        <div className="bg-muted/50 rounded-lg p-6 border border-border">
          <div className="text-center p-4 rounded-lg" style={{
          fontFamily: formData.fontFamily,
          fontSize: `${formData.fontSize}px`,
          color: formData.fontColor,
          backgroundColor: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
            <p className="font-semibold mb-2">{formData.name || 'POI名称预览'}</p>
            <p className="text-xs opacity-70 mt-2">字体: {formData.fontFamily} | 字号: {formData.fontSize}px | 颜色: {formData.fontColor}</p>
          </div>
        </div>
      </div>
    </div>;

  // 渲染拓展配置标签页
  const renderExtensionTab = () => <div className="space-y-6">
      <div className="bg-muted/30 rounded-lg p-4 border border-border">
        <Label className="mb-4 block flex items-center font-medium">
          <Code className="h-4 w-4 mr-2" />
          拓展配置
        </Label>
        
        {/* JSON操作工具栏 */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button type="button" onClick={formatJson} variant="outline" size="sm" className="h-8">
            <Code className="h-3 w-3 mr-1" />
            格式化
          </Button>
          <Button type="button" onClick={compressJson} variant="outline" size="sm" className="h-8">
            <RotateCcw className="h-3 w-3 mr-1" />
            压缩
          </Button>
          <Button type="button" onClick={copyJson} variant="outline" size="sm" className="h-8">
            <Copy className="h-3 w-3 mr-1" />
            复制
          </Button>
          <Button type="button" onClick={clearJson} variant="outline" size="sm" className="h-8 hover:text-destructive">
            <X className="h-3 w-3 mr-1" />
            清空
          </Button>
        </div>

        {/* JSON验证状态 */}
        <div className="flex items-center space-x-2 mb-3">
          {formData.extension.trim() ? jsonValid ? <div className="flex items-center space-x-1 text-green-500 text-sm">
                <CheckCircle className="h-4 w-4" />
                <span>JSON格式正确</span>
              </div> : <div className="flex items-center space-x-1 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>JSON格式错误</span>
              </div> : <div className="text-muted-foreground text-sm">请输入JSON配置</div>}
        </div>

        <div>
          <Label htmlFor="extension" className="text-muted-foreground">拓展字段配置</Label>
          <Textarea ref={extensionTextareaRef} id="extension" value={formData.extension} onChange={e => handleExtensionChange(e.target.value)} placeholder='{"customField1": "value1", "customField2": "value2"}' className={`mt-1 h-40 font-mono text-sm ${jsonError ? 'border-destructive' : jsonValid ? 'border-green-500' : ''}`} style={{
          fontFamily: 'Monaco, Menlo, Consolas, monospace',
          fontSize: '13px',
          lineHeight: '1.4'
        }} />
          {jsonError && <p className="text-destructive text-xs mt-1 flex items-center space-x-1">
              <AlertCircle className="h-3 w-3" />
              <span>{jsonError}</span>
            </p>}
          <p className="text-xs text-muted-foreground mt-2">
            支持JSON格式的自定义配置，可用于存储额外的POI配置信息。支持格式化、压缩、复制等操作。
          </p>
        </div>
      </div>

      {/* JSON示例 */}
      <div className="bg-muted/30 rounded-lg p-4 border border-border">
        <Label className="text-muted-foreground mb-2 block">JSON配置示例</Label>
        <pre className="text-xs text-muted-foreground bg-muted/50 p-3 rounded border border-border overflow-x-auto">
          {`{
  "displayOrder": 1,
  "interactionType": "click",
  "animation": {
    "type": "fadeIn",
    "duration": 0.5
  },
  "customProperties": {
    "category": "landmark",
    "importance": "high"
  }
}`}
        </pre>
      </div>
    </div>;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[70vh] bg-background border border-border shadow-xl rounded-lg flex flex-col p-0 overflow-hidden" onPointerDownOutside={e => e.preventDefault()}>
        <DialogHeader className="flex-shrink-0 p-6 border-b border-border bg-card">
          <DialogTitle className="flex items-center text-xl font-bold text-foreground">
            <MapPin className="h-5 w-5 mr-2 text-primary" />
            {poi ? '编辑POI' : '新建POI'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 bg-background/50">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="flex w-full bg-background border-b border-border rounded-none p-0 h-12 justify-start px-6 gap-6">
              <TabsTrigger value="basic" className="h-full rounded-none border-b-2 border-transparent px-0 data-[state=active]:border-[#1890FF] data-[state=active]:bg-background data-[state=active]:text-[#1890FF] data-[state=active]:shadow-none transition-all text-sm font-medium text-muted-foreground hover:text-foreground">
                <MapPin className="h-4 w-4 mr-2" />
                基础信息
              </TabsTrigger>
              <TabsTrigger value="media" className="h-full rounded-none border-b-2 border-transparent px-0 data-[state=active]:border-[#1890FF] data-[state=active]:bg-background data-[state=active]:text-[#1890FF] data-[state=active]:shadow-none transition-all text-sm font-medium text-muted-foreground hover:text-foreground">
                <Upload className="h-4 w-4 mr-2" />
                媒体上传
              </TabsTrigger>
              <TabsTrigger value="style" className="h-full rounded-none border-b-2 border-transparent px-0 data-[state=active]:border-[#1890FF] data-[state=active]:bg-background data-[state=active]:text-[#1890FF] data-[state=active]:shadow-none transition-all text-sm font-medium text-muted-foreground hover:text-foreground">
                <Palette className="h-4 w-4 mr-2" />
                样式配置
              </TabsTrigger>
              <TabsTrigger value="extension" className="h-full rounded-none border-b-2 border-transparent px-0 data-[state=active]:border-[#1890FF] data-[state=active]:bg-background data-[state=active]:text-[#1890FF] data-[state=active]:shadow-none transition-all text-sm font-medium text-muted-foreground hover:text-foreground">
                <Code className="h-4 w-4 mr-2" />
                拓展配置
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="space-y-6">
                <TabsContent value="basic" className="space-y-6 mt-0">
                  {renderBasicTab()}
                </TabsContent>
                <TabsContent value="media" className="space-y-6 mt-0">
                  {renderMediaTab()}
                </TabsContent>
                <TabsContent value="style" className="space-y-6 mt-0">
                  {renderStyleTab()}
                </TabsContent>
                <TabsContent value="extension" className="space-y-6 mt-0">
                  {renderExtensionTab()}
                </TabsContent>
              </div>
            </div>
          </Tabs>

          {/* 保存按钮区域 - 固定在底部 */}
          <div className="flex-shrink-0 border-t border-border bg-card p-4">
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={onCancel} className="border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground">
                <X className="w-4 h-4 mr-2" /> 取消
              </Button>
              <Button onClick={handleSaveClick} disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                <CheckCircle className="w-4 h-4 mr-2" /> {loading ? '保存中...' : poi ? '更新POI' : '创建POI'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}