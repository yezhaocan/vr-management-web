// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, useToast, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Label, Textarea } from '@/components/ui';
// @ts-ignore;
import { Plus, Search, MapPin, Edit, Trash2, Upload, Image as ImageIcon, X } from 'lucide-react';

import { ScenicMap } from '@/components/ScenicMap';
import { AuthGuard } from '@/components/AuthGuard';
// 背景图片预览组件
const BackgroundImagePreview = ({
  fileID
}) => {
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    const loadImage = async () => {
      try {
        setLoading(true);
        setError(false);
        const tcb = await $w.cloud.getCloudInstance();
        const app = tcb.app;
        const result = await app.getTempFileURL({
          fileList: [fileID]
        });
        setImageUrl(result.fileList[0].tempFileURL);
      } catch (err) {
        console.error('加载背景图片失败:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    if (fileID) {
      loadImage();
    }
  }, [fileID]);
  if (loading) {
    return <div className="w-full h-32 bg-gray-700 rounded-lg flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>;
  }
  if (error || !imageUrl) {
    return <div className="w-full h-32 bg-gray-700 rounded-lg flex items-center justify-center">
        <ImageIcon className="h-8 w-8 text-gray-500" />
      </div>;
  }
  return <div className="w-full h-32 rounded-lg overflow-hidden">
      <img src={imageUrl} alt="景区背景" className="w-full h-full object-cover" />
    </div>;
};
export default function ScenicManagementPage(props) {
  const {
    $w,
    style
  } = props;
  const {
    toast
  } = useToast();
  const [scenicSpots, setScenicSpots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSpot, setEditingSpot] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    latitude: '',
    longitude: '',
    backgroundImage: ''
  });
  const [backgroundImageFile, setBackgroundImageFile] = useState(null);
  const [backgroundImagePreview, setBackgroundImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  useEffect(() => {
    loadScenicSpots();
  }, []);

  // 加载景区列表
  const loadScenicSpots = async () => {
    try {
      setLoading(true);
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
          pageSize: 100,
          pageNumber: 1,
          orderBy: [{
            createTime: 'desc'
          }],
          getCount: true
        }
      });
      setScenicSpots(result.records || []);
    } catch (error) {
      toast({
        title: '加载失败',
        description: error.message || '请检查网络连接',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // 上传背景图片到云存储
  const uploadBackgroundImage = async file => {
    try {
      setUploadingImage(true);
      const tcb = await $w.cloud.getCloudInstance();
      const app = tcb.app;

      // 生成唯一文件名
      const fileExt = file.name.split('.').pop();
      const fileName = `scenic_background_${Date.now()}.${fileExt}`;

      // 上传到云存储
      const uploadResult = await app.uploadFile({
        cloudPath: `scenic-backgrounds/${fileName}`,
        fileContent: file
      });

      // 获取文件下载链接
      const fileUrl = await app.getTempFileURL({
        fileList: [uploadResult.fileID]
      });
      return {
        fileID: uploadResult.fileID,
        tempFileURL: fileUrl.fileList[0].tempFileURL
      };
    } catch (error) {
      console.error('上传图片失败:', error);
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  // 处理背景图片选择
  const handleBackgroundImageSelect = event => {
    const file = event.target.files[0];
    if (file) {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        toast({
          title: '文件类型错误',
          description: '请选择图片文件',
          variant: 'destructive'
        });
        return;
      }

      // 检查文件大小（限制为5MB）
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: '文件过大',
          description: '图片大小不能超过5MB',
          variant: 'destructive'
        });
        return;
      }
      setBackgroundImageFile(file);

      // 创建预览
      const reader = new FileReader();
      reader.onload = e => {
        setBackgroundImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 清除背景图片
  const clearBackgroundImage = () => {
    setBackgroundImageFile(null);
    setBackgroundImagePreview('');
    setFormData(prev => ({
      ...prev,
      backgroundImage: ''
    }));
  };

  // 保存景区信息
  const handleSave = async () => {
    try {
      let backgroundImageId = formData.backgroundImage;

      // 如果有新的背景图片需要上传
      if (backgroundImageFile) {
        const uploadResult = await uploadBackgroundImage(backgroundImageFile);
        backgroundImageId = uploadResult.fileID;
      }
      const saveData = {
        name: formData.name,
        description: formData.description,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        backgroundImage: backgroundImageId
      };
      if (editingSpot) {
        // 更新现有景区
        await $w.cloud.callDataSource({
          dataSourceName: 'scenic_spot',
          methodName: 'wedaUpdateV2',
          params: {
            filter: {
              where: {
                _id: {
                  $eq: editingSpot._id
                }
              }
            },
            data: saveData
          }
        });
        toast({
          title: '更新成功',
          description: `景区 "${formData.name}" 已更新`
        });
      } else {
        // 创建新景区
        await $w.cloud.callDataSource({
          dataSourceName: 'scenic_spot',
          methodName: 'wedaCreateV2',
          params: {
            data: saveData
          }
        });
        toast({
          title: '创建成功',
          description: `景区 "${formData.name}" 已创建`
        });
      }
      handleFormClose();
      loadScenicSpots();
    } catch (error) {
      toast({
        title: '保存失败',
        description: error.message || '请检查网络连接',
        variant: 'destructive'
      });
    }
  };

  // 删除景区
  const handleDelete = async spot => {
    try {
      await $w.cloud.callDataSource({
        dataSourceName: 'scenic_spot',
        methodName: 'wedaDeleteV2',
        params: {
          filter: {
            where: {
              _id: {
                $eq: spot._id
              }
            }
          }
        }
      });
      toast({
        title: '删除成功',
        description: `景区 "${spot.name}" 已删除`
      });
      loadScenicSpots();
    } catch (error) {
      toast({
        title: '删除失败',
        description: error.message || '请检查网络连接',
        variant: 'destructive'
      });
    }
  };

  // 打开编辑表单
  const handleEdit = spot => {
    setEditingSpot(spot);
    setFormData({
      name: spot.name || '',
      description: spot.description || '',
      latitude: spot.latitude?.toString() || '',
      longitude: spot.longitude?.toString() || '',
      backgroundImage: spot.backgroundImage || ''
    });
    setBackgroundImagePreview('');
    setBackgroundImageFile(null);
    setShowForm(true);
  };

  // 关闭表单
  const handleFormClose = () => {
    setShowForm(false);
    setEditingSpot(null);
    setFormData({
      name: '',
      description: '',
      latitude: '',
      longitude: '',
      backgroundImage: ''
    });
    setBackgroundImageFile(null);
    setBackgroundImagePreview('');
  };

  // 获取背景图片URL
  const getBackgroundImageUrl = async fileID => {
    try {
      const tcb = await $w.cloud.getCloudInstance();
      const app = tcb.app;
      const result = await app.getTempFileURL({
        fileList: [fileID]
      });
      return result.fileList[0].tempFileURL;
    } catch (error) {
      console.error('获取图片URL失败:', error);
      return '';
    }
  };

  // 过滤景区列表
  const filteredSpots = scenicSpots.filter(spot => spot.name?.toLowerCase().includes(searchTerm.toLowerCase()) || spot.description?.toLowerCase().includes(searchTerm.toLowerCase()));
  return <AuthGuard $w={$w}>
      <div style={style} className="min-h-screen bg-gray-900">
        <div className="p-6 space-y-6">
          {/* 头部操作区 */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-white">景区管理</h1>
              <p className="text-gray-400">管理景区信息、位置坐标和背景图片</p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={loadScenicSpots} variant="outline" className="border-gray-600 text-gray-300">
                <Search className="h-4 w-4 mr-2" />
                刷新
              </Button>
              <Button onClick={() => setShowForm(true)} className="bg-blue-500 hover:bg-blue-600">
                <Plus className="h-4 w-4 mr-2" />
                新建景区
              </Button>
            </div>
          </div>

          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="搜索景区名称或描述..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>

          {/* 景区列表 */}
          {loading ? <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-300">加载中...</span>
            </div> : filteredSpots.length === 0 ? <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <MapPin className="h-16 w-16 mx-auto opacity-30" />
              </div>
              <h3 className="text-lg font-medium text-gray-300 mb-2">暂无景区</h3>
              <p className="text-gray-500 mb-4">创建第一个景区开始管理</p>
              <Button onClick={() => setShowForm(true)} className="bg-blue-500 hover:bg-blue-600">
                <Plus className="h-4 w-4 mr-2" />
                新建景区
              </Button>
            </div> : <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredSpots.map(spot => <Card key={spot._id} className="bg-gray-800/50 border-gray-700 hover:border-blue-500/30 transition-all duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-white text-lg">{spot.name}</CardTitle>
                        <CardDescription className="text-gray-400">
                          {spot.latitude?.toFixed(6)}, {spot.longitude?.toFixed(6)}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(spot)} className="text-blue-400 hover:bg-blue-400/10">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(spot)} className="text-red-400 hover:bg-red-400/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {/* 背景图片预览 */}
                    {spot.backgroundImage && <BackgroundImagePreview fileID={spot.backgroundImage} />}
                    
                    <div className="mt-3">
                      <p className="text-gray-400 text-sm line-clamp-2">{spot.description || '暂无描述'}</p>
                    </div>
                    
                    <div className="mt-4">
                      <ScenicMap latitude={spot.latitude} longitude={spot.longitude} name={spot.name} />
                    </div>
                  </CardContent>
                </Card>)}
            </div>}

          {/* 景区表单弹窗 */}
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingSpot ? '编辑景区' : '新建景区'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* 基本信息 */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-gray-300">景区名称</Label>
                    <Input id="name" value={formData.name} onChange={e => setFormData(prev => ({
                    ...prev,
                    name: e.target.value
                  }))} placeholder="请输入景区名称" className="bg-gray-800 border-gray-600 text-white placeholder-gray-400" />
                  </div>
                  
                  <div>
                    <Label htmlFor="description" className="text-gray-300">景区描述</Label>
                    <Textarea id="description" value={formData.description} onChange={e => setFormData(prev => ({
                    ...prev,
                    description: e.target.value
                  }))} placeholder="请输入景区描述" rows={3} className="bg-gray-800 border-gray-600 text-white placeholder-gray-400" />
                  </div>
                </div>

                {/* 位置信息 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude" className="text-gray-300">纬度</Label>
                    <Input id="latitude" type="number" step="any" value={formData.latitude} onChange={e => setFormData(prev => ({
                    ...prev,
                    latitude: e.target.value
                  }))} placeholder="请输入纬度" className="bg-gray-800 border-gray-600 text-white placeholder-gray-400" />
                  </div>
                  
                  <div>
                    <Label htmlFor="longitude" className="text-gray-300">经度</Label>
                    <Input id="longitude" type="number" step="any" value={formData.longitude} onChange={e => setFormData(prev => ({
                    ...prev,
                    longitude: e.target.value
                  }))} placeholder="请输入经度" className="bg-gray-800 border-gray-600 text-white placeholder-gray-400" />
                  </div>
                </div>

                {/* 背景图片上传 */}
                <div className="space-y-4">
                  <Label className="text-gray-300">背景图片</Label>
                  
                  {/* 图片预览区域 */}
                  {(backgroundImagePreview || editingSpot?.backgroundImage) && <div className="relative">
                      <img src={backgroundImagePreview || (editingSpot?.backgroundImage ? `https://placeholder.com/400x200?text=Background+Image` : '')} alt="背景图片预览" className="w-full h-48 object-cover rounded-lg border border-gray-600" />
                      <Button variant="destructive" size="sm" onClick={clearBackgroundImage} className="absolute top-2 right-2">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>}
                  
                  {/* 上传按钮 */}
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <input type="file" accept="image/*" onChange={handleBackgroundImageSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={uploadingImage} />
                      <Button variant="outline" disabled={uploadingImage} className="border-gray-600 text-gray-300 hover:bg-gray-700">
                        {uploadingImage ? <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                            上传中...
                          </> : <>
                            <Upload className="h-4 w-4 mr-2" />
                            选择图片
                          </>}
                      </Button>
                    </div>
                    
                    {backgroundImageFile && <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <ImageIcon className="h-4 w-4" />
                        <span>{backgroundImageFile.name}</span>
                      </div>}
                  </div>
                  
                  <p className="text-xs text-gray-500">支持 JPG、PNG、GIF 格式，文件大小不超过 5MB</p>
                </div>

                {/* 操作按钮 */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                  <Button variant="outline" onClick={handleFormClose} className="border-gray-600 text-gray-300 hover:bg-gray-700">
                    取消
                  </Button>
                  <Button onClick={handleSave} disabled={!formData.name || !formData.latitude || !formData.longitude || uploadingImage} className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50">
                    {editingSpot ? '更新' : '创建'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AuthGuard>;
}