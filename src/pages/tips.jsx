// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, useToast, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
// @ts-ignore;
import { Plus, Search, Edit, Trash2, Upload, Image, RefreshCw, X, CheckCircle, Clock } from 'lucide-react';

// @ts-ignore;
import { AuthGuard } from '@/components/AuthGuard';
// @ts-ignore;
import { UserMenu } from '@/components/UserMenu';

// Tips表单组件
function TipsForm({
  tip,
  $w,
  onSave,
  onCancel,
  open,
  onOpenChange,
  existingTips = []
}) {
  const {
    toast
  } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    imageFileId: '',
    duration: 0
  });
  const [loading, setLoading] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // 页面类型选项
  const pageTypes = [{
    value: 'homePage',
    label: '首页'
  }, {
    value: 'realTimeWaitingPage',
    label: '实飞体验等待页'
  }, {
    value: 'realFlightExperience',
    label: '实飞体验视频页'
  }, {
    value: 'limitWaitingPage',
    label: '限定体验等待页'
  }, {
    value: 'limitedExperience',
    label: '限定体验卡片页'
  }, {
    value: 'videoRecordingExperience',
    label: '限定体验视频页'
  }];

  // 获取已使用的页面类型
  const getUsedPageTypes = () => {
    return existingTips.filter(t => t._id !== tip?._id) // 排除当前编辑的tip
    .map(t => t.type).filter(Boolean);
  };

  // 获取可用的页面类型选项
  const getAvailablePageTypes = () => {
    const usedTypes = getUsedPageTypes();
    return pageTypes.map(pageType => ({
      ...pageType,
      disabled: usedTypes.includes(pageType.value)
    }));
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

  // 编辑模式下填充表单数据
  useEffect(() => {
    const initializeFormData = async () => {
      if (tip) {
        // 获取预览链接
        let imageUrl = '';
        if (tip.imageFileId) {
          imageUrl = await getFileUrl(tip.imageFileId);
        }
        setFormData({
          name: tip.name || '',
          type: tip.type || '',
          description: tip.description || '',
          imageFileId: tip.imageFileId || '',
          duration: tip.duration || 0
        });
        setImagePreviewUrl(imageUrl);
      } else {
        // 新增模式重置表单
        setFormData({
          name: '',
          type: '',
          description: '',
          imageFileId: '',
          duration: 0
        });
        setImagePreviewUrl('');
      }
    };
    if (open) {
      initializeFormData();
    }
  }, [tip, open]);
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 处理持续时长输入 - 验证和过滤
  const handleDurationChange = value => {
    // 过滤非数字字符
    const numericValue = value.replace(/[^0-9]/g, '');

    // 转换为数字
    let duration = parseInt(numericValue) || 0;

    // 验证范围
    if (duration < 0) {
      duration = 0;
    } else if (duration > 86400) {
      duration = 86400;
      toast({
        title: '输入限制',
        description: '持续时长不能超过86400秒（24小时）',
        variant: 'default'
      });
    }
    handleInputChange('duration', duration);
  };

  // 处理文件上传 - 使用腾讯云存储标准接口
  const handleFileUpload = async file => {
    try {
      if (!file) return;
      toast({
        title: '文件上传中',
        description: '图片文件正在上传...'
      });

      // 设置上传状态
      setUploadingImage(true);

      // 使用腾讯云存储上传文件
      const tcb = await $w.cloud.getCloudInstance();

      // 生成唯一的文件名
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileName = `tips/images/${timestamp}_${randomStr}_${file.name}`;

      // 上传文件到云存储
      const uploadResult = await tcb.uploadFile({
        cloudPath: fileName,
        filePath: file
      });
      const fileID = uploadResult.fileID;

      // 获取临时链接用于预览
      const tempFileURLResult = await tcb.getTempFileURL({
        fileList: [fileID]
      });
      const previewUrl = tempFileURLResult.fileList[0].tempFileURL;

      // 更新表单数据，存储文件ID而不是URL
      setFormData(prev => ({
        ...prev,
        imageFileId: fileID
      }));

      // 设置预览链接
      setImagePreviewUrl(previewUrl);
      toast({
        title: '上传成功',
        description: '图片文件已上传，文件ID已保存'
      });
    } catch (error) {
      toast({
        title: '上传失败',
        description: error.message || '请检查网络连接',
        variant: 'destructive'
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // 清除文件
  const clearFile = () => {
    setFormData(prev => ({
      ...prev,
      imageFileId: ''
    }));
    setImagePreviewUrl('');
    toast({
      title: '已清除',
      description: '图片文件已清除'
    });
  };
  const handleSubmit = async e => {
    e.preventDefault();
    if (!formData.name) {
      toast({
        title: '表单验证失败',
        description: '请输入Tips名称',
        variant: 'destructive'
      });
      return;
    }
    if (!formData.type) {
      toast({
        title: '表单验证失败',
        description: '请选择页面类型',
        variant: 'destructive'
      });
      return;
    }

    // 检查页面类型是否已被使用
    const usedTypes = getUsedPageTypes();
    if (usedTypes.includes(formData.type)) {
      toast({
        title: '页面类型已被使用',
        description: '该页面类型已被其他Tips使用，请选择其他类型',
        variant: 'destructive'
      });
      return;
    }
    setLoading(true);
    try {
      const tipData = {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        imageFileId: formData.imageFileId,
        duration: parseInt(formData.duration) || 0,
        // 确保保存为整型
        status: 'active',
        updatedAt: new Date().getTime()
      };
      if (tip?._id) {
        // 更新Tips
        await $w.cloud.callDataSource({
          dataSourceName: 'tips',
          methodName: 'wedaUpdateV2',
          params: {
            filter: {
              where: {
                _id: {
                  $eq: tip._id
                }
              }
            },
            data: tipData
          }
        });
        toast({
          title: 'Tips更新成功',
          description: `Tips "${formData.name}" 已更新`
        });
      } else {
        // 新增Tips
        tipData.createdAt = new Date().getTime();
        await $w.cloud.callDataSource({
          dataSourceName: 'tips',
          methodName: 'wedaCreateV2',
          params: {
            data: tipData
          }
        });
        toast({
          title: 'Tips创建成功',
          description: `Tips "${formData.name}" 已创建`
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

  // 优化后的图片上传组件
  const ImageUploadSection = () => {
    return <div>
        <Label className="text-white mb-3 block">图片上传（可选）</Label>
        
        <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-600">
          {formData.imageFileId ?
        // 已上传状态
        <div className="space-y-4">
              <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">图片已上传</p>
                      <p className="text-gray-400 text-xs">文件ID: {formData.imageFileId.substring(0, 15)}...</p>
                    </div>
                  </div>
                </div>
                
                {/* 按钮组 - 确保不超出边界 */}
                <div className="flex space-x-2 justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('imageFile').click()} className="text-blue-400 border-blue-400 hover:bg-blue-400/10 px-3">
                    <Upload className="h-3 w-3 mr-1" />
                    更换
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={clearFile} className="text-red-400 border-red-400 hover:bg-red-400/10 px-3">
                    <X className="h-3 w-3 mr-1" />
                    清除
                  </Button>
                </div>
              </div>
              
              {imagePreviewUrl && <div className="border border-gray-600 rounded-lg p-2 bg-gray-900/50">
                  <img src={imagePreviewUrl} alt="预览" className="w-full h-32 object-cover rounded" />
                  <p className="text-xs text-gray-400 mt-1 text-center">预览链接有效期1天</p>
                </div>}
            </div> :
        // 未上传状态
        <div className="text-center cursor-pointer group" onClick={() => document.getElementById('imageFile').click()}>
              <input id="imageFile" type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e.target.files[0])} />
              
              <div className="space-y-3">
                <div className="flex justify-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                    <Image className="h-5 w-5 text-purple-400" />
                  </div>
                </div>
                
                <div>
                  <p className="text-gray-300 font-medium text-sm">
                    {uploadingImage ? '上传中...' : '点击上传图片'}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    支持 JPG, PNG 格式（可选）
                  </p>
                </div>
                
                {uploadingImage && <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div className="bg-purple-500 h-1.5 rounded-full animate-pulse"></div>
                  </div>}
              </div>
            </div>}
        </div>
      </div>;
  };
  const availablePageTypes = getAvailablePageTypes();
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            {tip ? '编辑Tips' : '新建Tips'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基础信息 */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-white">Tips名称 *</Label>
              <Input id="name" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} placeholder="请输入Tips名称" className="bg-gray-800 border-gray-700 text-white mt-1" required />
            </div>

            <div>
              <Label htmlFor="type" className="text-white">页面类型 *</Label>
              <Select value={formData.type} onValueChange={value => handleInputChange('type', value)}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-1">
                  <SelectValue placeholder="请选择页面类型" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {availablePageTypes.map(pageType => <SelectItem key={pageType.value} value={pageType.value} disabled={pageType.disabled} className="text-white hover:bg-gray-700 data-[disabled]:text-gray-500 data-[disabled]:cursor-not-allowed">
                      {pageType.label}
                      {pageType.disabled && <span className="ml-2 text-gray-500 text-xs">(已使用)</span>}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description" className="text-white">描述 *</Label>
              <Textarea id="description" value={formData.description} onChange={e => handleInputChange('description', e.target.value)} placeholder="请输入Tips描述内容" className="bg-gray-800 border-gray-700 text-white mt-1 h-24" required />
            </div>

            {/* 持续时长输入字段 */}
            <div>
              <Label htmlFor="duration" className="text-white">持续时长</Label>
              <div className="relative mt-1">
                <Input id="duration" type="number" min="0" max="86400" value={formData.duration} onChange={e => handleDurationChange(e.target.value)} placeholder="0" className="bg-gray-800 border-gray-700 text-white pr-12" />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-400 text-sm">s</span>
                </div>
              </div>
              <div className="flex items-center mt-1 text-gray-400 text-xs">
                <Clock className="h-3 w-3 mr-1" />
                <span>范围: 0-86400秒 (0-24小时)</span>
              </div>
            </div>
          </div>

          {/* 图片上传区域 - 简化版 */}
          <ImageUploadSection />

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} className="border-gray-600 text-gray-300 hover:bg-gray-700/50">
              取消
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-500 hover:bg-blue-600">
              {loading ? '保存中...' : tip ? '更新Tips' : '创建Tips'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>;
}

// 自定义Tag组件 - 优化可读性
function CustomTag({
  type,
  label
}) {
  // 根据页面类型设置不同的背景色
  const getBackgroundColor = () => {
    const colors = {
      'homePage': 'rgba(59, 130, 246, 0.9)',
      // 蓝色
      'realTimeWaitingPage': 'rgba(16, 185, 129, 0.9)',
      // 绿色
      'realFlightExperience': 'rgba(139, 92, 246, 0.9)',
      // 紫色
      'limitWaitingPage': 'rgba(245, 158, 11, 0.9)',
      // 橙色
      'limitedExperience': 'rgba(236, 72, 153, 0.9)',
      // 粉色
      'videoRecordingExperience': 'rgba(239, 68, 68, 0.9)' // 红色
    };
    return colors[type] || 'rgba(75, 85, 99, 0.9)'; // 默认灰色
  };
  return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-white border border-white/20" style={{
    backgroundColor: getBackgroundColor(),
    backdropFilter: 'blur(4px)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
  }}>
      {label}
    </span>;
}

// 持续时长显示组件
function DurationDisplay({
  duration
}) {
  if (!duration || duration === 0) {
    return <span className="text-gray-500 text-xs">未设置</span>;
  }
  const formatDuration = seconds => {
    if (seconds < 60) {
      return `${seconds}秒`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `${minutes}分${remainingSeconds}秒` : `${minutes}分钟`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor(seconds % 3600 / 60);
      const remainingSeconds = seconds % 60;
      if (minutes === 0 && remainingSeconds === 0) {
        return `${hours}小时`;
      } else if (remainingSeconds === 0) {
        return `${hours}小时${minutes}分钟`;
      } else {
        return `${hours}小时${minutes}分${remainingSeconds}秒`;
      }
    }
  };
  return <div className="flex items-center text-gray-400 text-xs">
      <Clock className="h-3 w-3 mr-1" />
      <span>{formatDuration(duration)}</span>
    </div>;
}
export default function TipsPage(props) {
  const {
    $w,
    style
  } = props;
  const {
    toast
  } = useToast();
  const [tipsList, setTipsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTip, setEditingTip] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tipToDelete, setTipToDelete] = useState(null);

  // 页面类型选项
  const pageTypes = [{
    value: 'homePage',
    label: '首页'
  }, {
    value: 'realTimeWaitingPage',
    label: '实飞体验等待页'
  }, {
    value: 'realFlightExperience',
    label: '实飞体验视频页'
  }, {
    value: 'limitWaitingPage',
    label: '限定体验等待页'
  }, {
    value: 'limitedExperience',
    label: '限定体验卡片页'
  }, {
    value: 'videoRecordingExperience',
    label: '限定体验视频页'
  }];

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

  // 加载Tips列表 - 使用真实数据模型
  const loadTipsList = async () => {
    setLoading(true);
    try {
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'tips',
        methodName: 'wedaGetRecordsV2',
        params: {
          select: {
            $master: true
          },
          orderBy: [{
            createdAt: 'desc'
          }],
          pageSize: 50,
          pageNumber: 1,
          getCount: true
        }
      });

      // 为每个Tips获取预览链接
      const tipsWithUrls = await Promise.all((result.records || []).map(async tip => {
        let imageUrl = '';
        if (tip.imageFileId) {
          imageUrl = await getFileUrl(tip.imageFileId);
        }
        return {
          ...tip,
          imageUrl
        };
      }));
      setTipsList(tipsWithUrls);
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
  useEffect(() => {
    loadTipsList();
  }, []);

  // 搜索Tips
  const filteredTipsList = tipsList.filter(tip => tip.name?.toLowerCase().includes(searchTerm.toLowerCase()) || tip.description?.toLowerCase().includes(searchTerm.toLowerCase()));

  // 获取页面类型标签
  const getPageTypeLabel = type => {
    const pageType = pageTypes.find(pt => pt.value === type);
    return pageType ? pageType.label : type;
  };

  // 获取类型徽章 - 使用自定义Tag组件
  const getTypeBadge = type => {
    return <CustomTag type={type} label={getPageTypeLabel(type)} />;
  };

  // 处理删除Tips - 使用真实数据模型
  const handleDelete = async tip => {
    try {
      await $w.cloud.callDataSource({
        dataSourceName: 'tips',
        methodName: 'wedaDeleteV2',
        params: {
          filter: {
            where: {
              _id: {
                $eq: tip._id
              }
            }
          }
        }
      });
      toast({
        title: '删除成功',
        description: `Tips "${tip.name}" 已删除`
      });
      loadTipsList();
    } catch (error) {
      toast({
        title: '删除失败',
        description: error.message || '请检查网络连接',
        variant: 'destructive'
      });
    }
  };

  // 处理新建Tips按钮点击
  const handleNewTips = () => {
    setEditingTip(null); // 确保清空编辑数据
    setShowForm(true);
  };

  // 处理编辑Tips按钮点击
  const handleEditTips = tip => {
    setEditingTip(tip);
    setShowForm(true);
  };

  // 处理表单保存成功
  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingTip(null);
    loadTipsList();
  };

  // 处理表单取消
  const handleFormCancel = () => {
    setShowForm(false);
    setEditingTip(null);
  };
  return <AuthGuard $w={$w}>
      <div style={style} className="min-h-screen bg-gray-900">        
        <div className="p-6 space-y-6">
          {/* 头部操作区 */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-white">Tips管理</h1>
              <p className="text-gray-400">管理VR观光中的提示信息</p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={loadTipsList} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700/50">
                <RefreshCw className="h-4 w-4 mr-2" />
                刷新
              </Button>
              <Button onClick={handleNewTips} className="bg-blue-500 hover:bg-blue-600">
                <Plus className="h-4 w-4 mr-2" />
                新建Tips
              </Button>
            </div>
          </div>

          {/* 搜索栏 */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="搜索Tips名称或描述..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>

          {/* Tips列表 - 弱化图片作用，减小图片尺寸 */}
          {loading ? <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-300">加载中...</span>
            </div> : filteredTipsList.length === 0 ? <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <Image className="h-16 w-16 mx-auto opacity-30" />
              </div>
              <h3 className="text-lg font-medium text-gray-300 mb-2">暂无Tips记录</h3>
              <p className="text-gray-500 mb-4">创建第一个Tips记录开始管理</p>
              <Button onClick={handleNewTips} className="bg-blue-500 hover:bg-blue-600">
                <Plus className="h-4 w-4 mr-2" />
                新建Tips
              </Button>
            </div> : <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTipsList.map(tip => <Card key={tip._id} className="bg-gray-800/50 border-gray-700 hover:border-blue-500/30 transition-all duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-white text-lg">{tip.name}</CardTitle>
                        <CardDescription className="text-gray-400">
                          {tip.createdAt ? new Date(tip.createdAt).toLocaleDateString() : '未知时间'}
                        </CardDescription>
                      </div>
                      {getTypeBadge(tip.type)}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {/* 图片预览 - 弱化图片作用，减小尺寸 */}
                    {tip.imageUrl ? <div className="mb-3">
                        <img src={tip.imageUrl} alt={tip.name} className="w-20 h-20 object-cover rounded-lg float-right ml-3" />
                      </div> : <div className="mb-3 w-20 h-20 bg-gray-700 rounded-lg float-right ml-3 flex items-center justify-center">
                        <Image className="h-6 w-6 text-gray-500" />
                      </div>}

                    {/* 描述信息 - 强化文字内容 */}
                    <div className="mb-3">
                      <p className="text-gray-400 text-sm line-clamp-4">{tip.description}</p>
                    </div>

                    {/* 持续时长显示 */}
                    <div className="mb-3">
                      <DurationDisplay duration={tip.duration} />
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex justify-end space-x-2 pt-3 border-t border-gray-700 clear-both">
                      <Button variant="outline" size="sm" onClick={() => handleEditTips(tip)} className="text-blue-400 border-blue-400 hover:bg-blue-400/10">
                        <Edit className="h-3 w-3 mr-1" />
                        编辑
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                  setTipToDelete(tip);
                  setDeleteConfirmOpen(true);
                }} className="text-red-400 border-red-400 hover:bg-red-400/10">
                        <Trash2 className="h-3 w-3 mr-1" />
                        删除
                      </Button>
                    </div>
                  </CardContent>
                </Card>)}
            </div>}

          {/* Tips表单弹窗 */}
          <TipsForm tip={editingTip} $w={$w} onSave={handleFormSuccess} onCancel={handleFormCancel} open={showForm} onOpenChange={setShowForm} existingTips={tipsList} />

          {/* 删除确认弹窗 */}
          <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <DialogContent className="bg-gray-900 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">确认删除</DialogTitle>
              </DialogHeader>
              <div className="text-gray-400 mb-4">
                确定要删除Tips "{tipToDelete?.name}" 吗？此操作不可恢复。
              </div>
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} className="border-gray-600 text-gray-300 hover:bg-gray-700/50">
                  取消
                </Button>
                <Button onClick={() => {
                handleDelete(tipToDelete);
                setDeleteConfirmOpen(false);
              }} className="bg-red-500 hover:bg-red-600">
                  确认删除
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AuthGuard>;
}