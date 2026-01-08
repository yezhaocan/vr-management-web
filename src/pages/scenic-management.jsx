// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { useToast, Button, Input, Label, Textarea } from '@/components/ui';
// @ts-ignore;
import { MapPin, Edit, Save, Map, Upload, Image, X } from 'lucide-react';

import { ScenicMap } from '@/components/ScenicMap';
import { AuthGuard } from '@/components/AuthGuard';
import { MainLayout } from '@/layouts/MainLayout';

export default function ScenicManagement(props) {
  const {
    $w,
    style
  } = props;
  const {
    toast
  } = useToast();
  const [scenicData, setScenicData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    latitude: 0,
    longitude: 0,
    address: '',
    description: ''
  });
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState('');

  // 页面初始化加载数据
  useEffect(() => {
    loadScenicData();
  }, []);

  // 加载景区数据
  const loadScenicData = async () => {
    try {
      setLoading(true);

      // 从云端 API 获取最新的景区数据
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'scenic_spot',
        methodName: 'wedaGetRecordsV2',
        params: {
          select: {
            $master: true
          },
          filter: {
            where: {}
          },
          pageSize: 1,
          pageNumber: 1,
          orderBy: [{
            createdAt: 'desc'
          }],
          getCount: true
        }
      });
      console.log(`🚀 ~ loadScenicData ~ result-> `, result)
      
      if (result.records && result.records.length > 0) {
        const latestScenic = result.records[0];
        setScenicData(latestScenic);
        
        // 使用 API 数据更新表单
        setFormData({
          name: latestScenic.name || '',
          latitude: latestScenic.latitude || 0,
          longitude: latestScenic.longitude || 0,
          address: latestScenic.address || '',
          description: latestScenic.description || ''
        });
        
        setSelectedPosition({
          lat: latestScenic.latitude || 40.9042,
          lng: latestScenic.longitude || 116.4074
        });

        // 加载背景图预览
        if (latestScenic.backgroundImageId) {
          loadBackgroundImagePreview(latestScenic.backgroundImageId);
        }
      } else {
        // 没有数据时设置默认值
        setSelectedPosition({
          lat: 39.9042,
          lng: 116.4074
        });
      }
    } catch (error) {
      console.error('加载景区数据失败:', error);
      toast({
        title: '数据加载失败',
        description: error.message || '请检查网络连接',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // 加载背景图预览
  const loadBackgroundImagePreview = async fileId => {
    try {
      const tcb = await $w.cloud.getCloudInstance();
      const fileUrl = await tcb.getTempFileURL({
        fileList: [fileId]
      });
      if (fileUrl && fileUrl.fileList && fileUrl.fileList[0]) {
        setBackgroundPreview(fileUrl.fileList[0].tempFileURL);
      }
    } catch (error) {
      console.error('加载背景图预览失败:', error);
    }
  };

  // 处理地图坐标选择
  const handleMapPositionSelect = position => {
    setSelectedPosition(position);
    setFormData(prev => ({
      ...prev,
      latitude: position.lat,
      longitude: position.lng
    }));
  };

  // 处理背景图上传
  const handleBackgroundImageUpload = async event => {
    const file = event.target.files[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast({
        title: '文件类型错误',
        description: '请上传图片文件',
        variant: 'destructive'
      });
      return;
    }
    try {
      setUploading(true);
      setBackgroundImage(file);

      // 创建预览
      const reader = new FileReader();
      reader.onload = e => {
        setBackgroundPreview(e.target.result);
      };
      reader.readAsDataURL(file);
      toast({
        title: '图片已选择',
        description: '点击保存按钮上传并应用背景图',
        duration: 2000
      });
    } catch (error) {
      console.error('处理图片失败:', error);
      toast({
        title: '图片处理失败',
        description: '请重新选择图片',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  // 移除背景图
  const handleRemoveBackgroundImage = () => {
    setBackgroundImage(null);
    setBackgroundPreview('');
    if (scenicData) {
      setScenicData({
        ...scenicData,
        backgroundImageId: null
      });
    }
  };

  // 保存景区数据
  const handleSaveScenicData = async () => {
    if (!formData.name.trim()) {
      toast({
        title: '验证失败',
        description: '请输入景区名称',
        variant: 'destructive'
      });
      return;
    }
    if (!selectedPosition) {
      toast({
        title: '验证失败',
        description: '请在地图上选择景区位置',
        variant: 'destructive'
      });
      return;
    }
    try {
      setSaving(true);
      let backgroundImageId = scenicData?.backgroundImageId || null;

      // 如果有新上传的背景图，先上传到云存储
      if (backgroundImage) {
        const tcb = await $w.cloud.getCloudInstance();
        const uploadResult = await tcb.uploadFile({
          cloudPath: `scenic-backgrounds/${Date.now()}-${backgroundImage.name}`,
          filePath: backgroundImage
        });
        if (uploadResult && uploadResult.fileID) {
          backgroundImageId = uploadResult.fileID;
          toast({
            title: '背景图上传成功',
            description: '图片已保存到云存储',
            duration: 2000
          });
        }
      }
      const scenicDataToSave = {
        name: formData.name,
        latitude: selectedPosition.lat,
        longitude: selectedPosition.lng,
        address: formData.address,
        description: formData.description,
        backgroundImageId: backgroundImageId,
        updatedAt: new Date().getTime()
      };
      if (scenicData) {
        // 更新现有数据
        await $w.cloud.callDataSource({
          dataSourceName: 'scenic_spot',
          methodName: 'wedaUpdateV2',
          params: {
            filter: {
              where: {
                _id: {
                  $eq: scenicData._id
                }
              }
            },
            data: scenicDataToSave
          }
        });
        toast({
          title: '更新成功',
          description: '景区信息和背景图已更新'
        });
      } else {
        // 新增数据
        scenicDataToSave.createdAt = new Date().getTime();
        await $w.cloud.callDataSource({
          dataSourceName: 'scenic_spot',
          methodName: 'wedaCreateV2',
          params: {
            data: scenicDataToSave
          }
        });
        toast({
          title: '创建成功',
          description: '景区信息和背景图已创建'
        });
      }

      // 重新加载数据
      loadScenicData();
    } catch (error) {
      console.error('保存景区数据失败:', error);
      toast({
        title: '保存失败',
        description: error.message || '请检查网络连接',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // 处理表单输入变化
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 处理坐标输入变化
  const handleCoordinateChange = (field, value) => {
    // 允许空值以便输入
    if (value === '') {
      setSelectedPosition(prev => ({ ...prev, [field]: '' }));
      setFormData(prev => ({ ...prev, [field === 'lat' ? 'latitude' : 'longitude']: '' }));
      return;
    }

    const numValue = parseFloat(value);
    // 验证是否为有效数字
    if (isNaN(numValue)) return;

    // 验证范围
    if (field === 'lat' && (numValue < -90 || numValue > 90)) return;
    if (field === 'lng' && (numValue < -180 || numValue > 180)) return;

    const newPosition = {
      ...selectedPosition,
      [field]: numValue
    };
    
    setSelectedPosition(newPosition);
    setFormData(prev => ({
      ...prev,
      [field === 'lat' ? 'latitude' : 'longitude']: numValue
    }));
  };

  return (
    <AuthGuard $w={$w}>
      <MainLayout $w={$w}>
        <style>{`
          .leaflet-control-zoom {
            border: none !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
            margin-top: 16px !important;
            margin-right: 16px !important;
          }
        `}</style>
        <div className="h-[calc(100vh-120px)] flex flex-col">
          
          {/* 平铺式布局网格 - 调整为全高 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            
            {/* 左侧主要信息区 (占据 4/12) - 添加滚动 */}
            <div className="lg:col-span-4 h-full overflow-y-auto pr-2 space-y-6 custom-scrollbar">
              
              {/* 基本信息模块 */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b border-border">
                  <Edit className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">基本信息</h3>
                </div>
                
                <div className="grid gap-5 p-1">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">景区名称</Label>
                    <Input 
                      id="name" 
                      value={formData.name} 
                      onChange={e => handleInputChange('name', e.target.value)} 
                      placeholder="输入景区名称" 
                      className="bg-card/50 focus:bg-card transition-colors" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium">详细地址</Label>
                    <Input 
                      id="address" 
                      value={formData.address} 
                      onChange={e => handleInputChange('address', e.target.value)} 
                      placeholder="输入详细地址" 
                      className="bg-card/50 focus:bg-card transition-colors" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">景区描述</Label>
                    <Textarea 
                      id="description" 
                      value={formData.description} 
                      onChange={e => handleInputChange('description', e.target.value)} 
                      placeholder="输入景区简要描述..." 
                      className="min-h-[140px] resize-y bg-card/50 focus:bg-card transition-colors" 
                    />
                  </div>
                </div>
              </div>

              {/* 背景图片模块 */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b border-border">
                  <Image className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">背景图片</h3>
                </div>

                <div className="bg-card/30 rounded-xl border-2 border-dashed border-border p-6 transition-all hover:border-primary/50 hover:bg-card/50">
                  {backgroundPreview ? (
                    <div className="relative group rounded-lg overflow-hidden shadow-sm">
                      <img src={backgroundPreview} alt="Preview" className="w-full h-48 object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={handleRemoveBackgroundImage}
                          className="shadow-lg"
                        >
                          <X className="h-4 w-4 mr-2" />
                          移除图片
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => document.getElementById('background-upload').click()}
                      className="flex flex-col items-center justify-center py-8 cursor-pointer text-muted-foreground hover:text-primary transition-colors"
                    >
                      <div className="p-4 bg-background rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="h-8 w-8" />
                      </div>
                      <span className="font-medium">点击上传图片</span>
                      <span className="text-xs mt-1 opacity-70">支持 JPG, PNG (最大 5MB)</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    id="background-upload" 
                    accept="image/*" 
                    onChange={handleBackgroundImageUpload} 
                    className="hidden" 
                  />
                </div>
              </div>
            </div>

            {/* 右侧地图区域 (占据 8/12) - 撑满高度 */}
            <div className="lg:col-span-8 h-full flex flex-col pb-6">
              <div className="flex items-center justify-between pb-2 mb-2">
                <div className="flex items-center space-x-2">
                  <Map className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">地理位置</h3>
                </div>
                {selectedPosition && (
                  <div className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                    {selectedPosition.lat && typeof selectedPosition.lat === 'number' ? selectedPosition.lat.toFixed(6) : '0.000000'}, {selectedPosition.lng && typeof selectedPosition.lng === 'number' ? selectedPosition.lng.toFixed(6) : '0.000000'}
                  </div>
                )}
              </div>
              
              {/* 地图容器 - 自动撑满剩余空间，无边框，添加相对定位以容纳浮动提示 */}
              <div className="flex-1 rounded-xl overflow-hidden bg-card relative group min-h-0">
                <ScenicMap 
                  onPositionSelect={handleMapPositionSelect} 
                  initialPosition={selectedPosition} 
                  disabled={false} 
                  className="h-full w-full absolute inset-0"
                />
                
                {/* 悬浮提示信息 - 左上角，半透明背景，主题适配 */}
                <div className="absolute top-4 left-4 z-[400] max-w-[90%] sm:max-w-md animate-in fade-in slide-in-from-top-2 duration-300 pointer-events-none">
                  <div className="bg-background/80 backdrop-blur-md border border-border/50 rounded-lg p-3 shadow-sm flex items-center gap-3">
                    <div className="p-1.5 bg-primary/10 rounded-full">
                       <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        点击地图任意位置或拖动标记点来精确设置坐标
                      </p>
                    </div>
                  </div>
                </div>

                {/* 悬浮坐标输入面板 - 底部左侧，半透明背景 */}
                <div className="absolute bottom-4 left-4 z-[400] bg-background/90 backdrop-blur-md border border-border rounded-lg p-3 shadow-lg flex flex-col sm:flex-row gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="lat-input" className="text-xs font-medium whitespace-nowrap">纬度</Label>
                    <Input 
                      id="lat-input"
                      type="number"
                      step="0.000001"
                      min="-90"
                      max="90"
                      value={selectedPosition?.lat || ''}
                      onChange={e => handleCoordinateChange('lat', e.target.value)}
                      className="h-8 w-32 bg-background/50 text-xs font-mono"
                      placeholder="0.000000"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="lng-input" className="text-xs font-medium whitespace-nowrap">经度</Label>
                    <Input 
                      id="lng-input"
                      type="number"
                      step="0.000001"
                      min="-180"
                      max="180"
                      value={selectedPosition?.lng || ''}
                      onChange={e => handleCoordinateChange('lng', e.target.value)}
                      className="h-8 w-32 bg-background/50 text-xs font-mono"
                      placeholder="0.000000"
                    />
                  </div>
                </div>
              </div>

              {/* 底部功能按钮区域 - 独占一行，居中，宽度100% */}
              <div className="mt-auto pt-4 w-full flex flex-col sm:flex-row justify-center items-center gap-2">
                <Button 
                  onClick={handleSaveScenicData} 
                  disabled={saving || uploading} 
                  className="w-full sm:w-auto min-w-[200px] bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm h-10 px-8"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? '保存中...' : '保存更改'}
                </Button>
              </div>
            </div>

          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
