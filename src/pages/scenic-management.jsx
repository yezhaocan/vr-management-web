// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { useToast, Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Textarea } from '@/components/ui';
// @ts-ignore;
import { MapPin, Edit, Save, Map, Navigation, Upload, Image, X } from 'lucide-react';

import { ScenicMap } from '@/components/ScenicMap';
import { AuthGuard } from '@/components/AuthGuard';
import { UserMenu } from '@/components/UserMenu';

// 本地存储键名
const SCENIC_SPOT_STORAGE_KEY = 'scenic_spot_data';
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

  // 保存景区数据到本地存储
  const saveScenicDataToLocal = data => {
    try {
      localStorage.setItem(SCENIC_SPOT_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('保存到本地存储失败:', error);
    }
  };

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
  useEffect(() => {
    loadScenicData();
  }, []);

  // 加载景区数据
  const loadScenicData = async () => {
    try {
      setLoading(true);

      // 先尝试从本地存储获取数据
      const localData = getScenicDataFromLocal();
      if (localData) {
        setScenicData(localData);
        setFormData({
          name: localData.name || '',
          latitude: localData.latitude || 0,
          longitude: localData.longitude || 0,
          address: localData.address || '',
          description: localData.description || ''
        });
        setSelectedPosition({
          lat: localData.latitude || 39.9042,
          lng: localData.longitude || 116.4074
        });

        // 加载背景图预览
        if (localData.backgroundImageId) {
          loadBackgroundImagePreview(localData.backgroundImageId);
        }
      }

      // 同时查询最新的景区数据
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
      if (result.records && result.records.length > 0) {
        const latestScenic = result.records[0];
        setScenicData(latestScenic);
        setFormData({
          name: latestScenic.name || '',
          latitude: latestScenic.latitude || 0,
          longitude: latestScenic.longitude || 0,
          address: latestScenic.address || '',
          description: latestScenic.description || ''
        });
        setSelectedPosition({
          lat: latestScenic.latitude || 39.9042,
          lng: latestScenic.longitude || 116.4074
        });

        // 加载背景图预览
        if (latestScenic.backgroundImageId) {
          loadBackgroundImagePreview(latestScenic.backgroundImageId);
        }

        // 保存到本地存储
        saveScenicDataToLocal(latestScenic);
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

      // 重新加载数据并更新本地存储
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
  return <AuthGuard $w={$w}>
      <div style={style} className="min-h-screen bg-gray-900">        
        <div className="p-6 space-y-6">
          {/* 页面标题和操作按钮 */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <MapPin className="h-8 w-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">景区管理</h1>
                <p className="text-gray-400">管理景区基本信息和坐标位置</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button onClick={handleSaveScenicData} disabled={saving || uploading} className="bg-blue-500 hover:bg-blue-600">
                <Save className="h-4 w-4 mr-2" />
                {saving ? '保存中...' : '保存信息'}
              </Button>
            </div>
          </div>

          {/* 主要内容区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左侧：基本信息卡片（整合背景图功能） */}
            <div className="space-y-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-blue-400" />
                    基本信息
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    直接修改景区信息，完成后点击保存按钮
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {/* 背景图预览和上传 */}
                  <div className="space-y-4">
                    <div className="text-sm text-white">背景图设置</div>
                    {backgroundPreview && <div className="relative">
                        <div className="text-sm text-gray-400 mb-2">背景图预览</div>
                        <div className="relative bg-gray-700 rounded-lg overflow-hidden border border-gray-600">
                          <img src={backgroundPreview} alt="背景图预览" className="w-full h-32 object-cover" />
                          <Button variant="destructive" size="sm" className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-700/80" onClick={handleRemoveBackgroundImage}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>}

                    {/* 上传控件 */}
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                      <input type="file" id="background-upload" accept="image/*" onChange={handleBackgroundImageUpload} className="hidden" />
                      <label htmlFor="background-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Upload className="h-6 w-6 text-gray-400" />
                          <div>
                            <div className="text-white font-medium text-sm">点击上传背景图</div>
                            <div className="text-gray-400 text-xs">支持 JPG、PNG、GIF 等格式</div>
                          </div>
                          {uploading && <div className="text-blue-400 text-sm flex items-center">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400 mr-1"></div>
                              上传中...
                            </div>}
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* 景区名称 */}
                  <div>
                    <Label htmlFor="name" className="text-white">景区名称 *</Label>
                    <Input id="name" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} placeholder="请输入景区名称" className="bg-gray-800 border-gray-600 text-white mt-1" />
                  </div>

                  {/* 坐标信息 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-white text-sm">纬度</Label>
                      <div className="flex items-center space-x-1 mt-1">
                        <Navigation className="h-3 w-3 text-blue-400" />
                        <span className="text-white text-sm">{selectedPosition?.lat.toFixed(6) || '未选择'}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-white text-sm">经度</Label>
                      <div className="flex items-center space-x-1 mt-1">
                        <Navigation className="h-3 w-3 text-blue-400" />
                        <span className="text-white text-sm">{selectedPosition?.lng.toFixed(6) || '未选择'}</span>
                      </div>
                    </div>
                  </div>

                  {/* 详细地址 */}
                  <div>
                    <Label htmlFor="address" className="text-white">详细地址</Label>
                    <Input id="address" value={formData.address} onChange={e => handleInputChange('address', e.target.value)} placeholder="请输入详细地址" className="bg-gray-800 border-gray-600 text-white mt-1" />
                  </div>

                  {/* 景区描述 */}
                  <div>
                    <Label htmlFor="description" className="text-white">景区描述</Label>
                    <Textarea id="description" value={formData.description} onChange={e => handleInputChange('description', e.target.value)} placeholder="请输入景区描述" className="bg-gray-800 border-gray-600 text-white mt-1 h-24" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 右侧：地图坐标选择 */}
            <div className="space-y-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-blue-400" />
                    地图坐标选择
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    左键点击地图选择景区坐标位置
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ScenicMap onPositionSelect={handleMapPositionSelect} initialPosition={selectedPosition} disabled={false} />
                  </div>
                  <p className="text-sm text-gray-400 mt-3">
                    提示：左键点击地图上的位置可以设置景区坐标，坐标会自动更新到表单中
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>;
}