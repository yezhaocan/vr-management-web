// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { useToast, Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Textarea } from '@/components/ui';
// @ts-ignore;
import { MapPin, Edit, Save, Map, Navigation } from 'lucide-react';

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
  const [formData, setFormData] = useState({
    name: '',
    latitude: 0,
    longitude: 0,
    address: '',
    description: ''
  });
  const [selectedPosition, setSelectedPosition] = useState(null);

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

  // 处理地图坐标选择
  const handleMapPositionSelect = position => {
    setSelectedPosition(position);
    setFormData(prev => ({
      ...prev,
      latitude: position.lat,
      longitude: position.lng
    }));
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
      const scenicDataToSave = {
        name: formData.name,
        latitude: selectedPosition.lat,
        longitude: selectedPosition.lng,
        address: formData.address,
        description: formData.description,
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
          description: '景区信息已更新'
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
          description: '景区信息已创建'
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
              <MapPin className="h-8 w-8 text-green-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">景区管理</h1>
                <p className="text-gray-400">管理景区基本信息和坐标位置</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button onClick={handleSaveScenicData} disabled={saving} className="bg-green-500 hover:bg-green-600">
                <Save className="h-4 w-4 mr-2" />
                {saving ? '保存中...' : '保存信息'}
              </Button>
            </div>
          </div>

          {/* 主要内容区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左侧：景区信息表单 */}
            <div className="space-y-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-green-400" />
                    景区基本信息
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    直接修改景区信息，完成后点击保存按钮
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    <Textarea id="description" value={formData.description} onChange={e => handleInputChange('description', e.target.value)} placeholder="请输入景区描述" className="bg-gray-800 border-gray-600 text-white mt-1 h-20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 右侧：地图坐标选择 */}
            <div className="space-y-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Map className="h-5 w-5 mr-2 text-orange-400" />
                    地图坐标选择
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    左键点击地图选择景区坐标位置
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScenicMap onPositionSelect={handleMapPositionSelect} initialPosition={selectedPosition} disabled={false} />
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