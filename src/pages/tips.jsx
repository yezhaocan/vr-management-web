// @ts-ignore;
import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore;
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, useToast, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
// @ts-ignore;
import { Plus, Search, Edit, Trash2, Upload, Image, RefreshCw, X, CheckCircle, Clock, Calendar, FileText, Tag } from 'lucide-react';

// @ts-ignore;
import { AuthGuard } from '@/components/AuthGuard';
// @ts-ignore;
import { UserMenu } from '@/components/UserMenu';

// 自定义滚动条样式组件
function CustomScrollbarStyles() {
  return <style jsx global>{`
    .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(75, 85, 99, 0.3);
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(156, 163, 175, 0.6);
      border-radius: 4px;
      transition: background 0.2s ease;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(209, 213, 219, 0.8);
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:active {
      background: rgba(255, 255, 255, 0.9);
    }
  `}</style>;
}

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
  const [durationError, setDurationError] = useState('');
  const formRef = useRef(null);

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
    return existingTips.filter(t => t._id !== tip?._id).map(t => t.type).filter(Boolean);
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

  // 处理持续时长输入
  const handleDurationChange = value => {
    setDurationError('');
    if (value === '') {
      handleInputChange('duration', 0);
      return;
    }
    const numValue = Number(value);
    if (isNaN(numValue)) {
      setDurationError('请输入有效的数字');
      return;
    }
    if (numValue < 0) {
      setDurationError('持续时长不能小于0');
      return;
    }
    if (numValue > 86400) {
      setDurationError('持续时长不能超过86400秒（24小时）');
      toast({
        title: '输入限制',
        description: '持续时长不能超过86400秒（24小时）',
        variant: 'default'
      });
      handleInputChange('duration', 86400);
      return;
    }
    handleInputChange('duration', Math.floor(numValue));
  };

  // 处理文件上传
  const handleFileUpload = async file => {
    try {
      if (!file) return;
      toast({
        title: '文件上传中',
        description: '图片文件正在上传...'
      });
      setUploadingImage(true);
      const tcb = await $w.cloud.getCloudInstance();
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileName = `tips/images/${timestamp}_${randomStr}_${file.name}`;
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
        imageFileId: fileID
      }));
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

  // 表单提交验证
  const validateForm = () => {
    setDurationError('');
    if (!formData.name.trim()) {
      toast({
        title: '表单验证失败',
        description: '请输入Tips名称',
        variant: 'destructive'
      });
      return false;
    }
    if (!formData.type) {
      toast({
        title: '表单验证失败',
        description: '请选择页面类型',
        variant: 'destructive'
      });
      return false;
    }
    if (!formData.description.trim()) {
      toast({
        title: '表单验证失败',
        description: '请输入Tips描述',
        variant: 'destructive'
      });
      return false;
    }
    const duration = Number(formData.duration);
    if (isNaN(duration) || duration < 0 || duration > 86400) {
      setDurationError('持续时长必须在0-86400秒之间');
      toast({
        title: '表单验证失败',
        description: '持续时长格式不正确',
        variant: 'destructive'
      });
      return false;
    }
    const usedTypes = getUsedPageTypes();
    if (usedTypes.includes(formData.type)) {
      toast({
        title: '页面类型已被使用',
        description: '该页面类型已被其他Tips使用，请选择其他类型',
        variant: 'destructive'
      });
      return false;
    }
    return true;
  };

  // 修复：统一表单提交处理
  const handleSubmit = async e => {
    // 防止默认表单提交行为
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    // 先进行表单验证
    if (!validateForm()) {
      return;
    }
    setLoading(true);
    try {
      // 修复：确保数据类型正确，添加更严格的数据验证
      const durationValue = Number(formData.duration);
      const tipData = {
        name: formData.name.trim(),
        type: formData.type,
        description: formData.description.trim(),
        imageFileId: formData.imageFileId || '',
        duration: isNaN(durationValue) ? 0 : Math.max(0, Math.min(86400, durationValue)),
        // 确保在有效范围内
        status: 'active',
        updatedAt: new Date().getTime()
      };
      console.log('准备保存的数据:', tipData);
      console.log('duration字段类型:', typeof tipData.duration, '值:', tipData.duration);
      if (tip?._id) {
        // 更新Tips
        const result = await $w.cloud.callDataSource({
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
        console.log('更新结果:', result);
        toast({
          title: 'Tips更新成功',
          description: `Tips "${formData.name}" 已更新，持续时长: ${tipData.duration}秒`
        });
      } else {
        // 新增Tips
        tipData.createdAt = new Date().getTime();
        const result = await $w.cloud.callDataSource({
          dataSourceName: 'tips',
          methodName: 'wedaCreateV2',
          params: {
            data: tipData
          }
        });
        console.log('创建结果:', result);
        toast({
          title: 'Tips创建成功',
          description: `Tips "${formData.name}" 已创建，持续时长: ${tipData.duration}秒`
        });
      }
      onSave && onSave();
    } catch (error) {
      console.error('保存失败:', error);
      console.error('错误详情:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
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
        <Label className="mb-3 block">图片上传（可选）</Label>
        <div className="bg-muted/30 rounded-lg p-4 border border-border">
          {formData.imageFileId ? <div className="space-y-4">
              <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">图片已上传</p>
                      <p className="text-muted-foreground text-xs">文件ID: {formData.imageFileId.substring(0, 15)}...</p>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('imageFile').click()} className="px-3">
                    <Upload className="h-3 w-3 mr-1" />
                    更换
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={clearFile} className="px-3 hover:text-destructive">
                    <X className="h-3 w-3 mr-1" />
                    清除
                  </Button>
                </div>
              </div>
              {imagePreviewUrl && <div className="border border-border rounded-lg p-2 bg-muted/50">
                  <img src={imagePreviewUrl} alt="预览" className="w-full h-32 object-cover rounded" />
                  <p className="text-xs text-muted-foreground mt-1 text-center">预览链接有效期1天</p>
                </div>}
            </div> : <div className="text-center cursor-pointer group" onClick={() => document.getElementById('imageFile').click()}>
              <input id="imageFile" type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e.target.files[0])} />
              <div className="space-y-3">
                <div className="flex justify-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Image className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <p className="text-foreground font-medium text-sm">
                    {uploadingImage ? '上传中...' : '点击上传图片'}
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">支持 JPG, PNG 格式（可选）</p>
                </div>
                {uploadingImage && <div className="w-full bg-muted rounded-full h-1.5">
                    <div className="bg-primary h-1.5 rounded-full animate-pulse"></div>
                  </div>}
              </div>
            </div>}
        </div>
      </div>;
  };
  const availablePageTypes = getAvailablePageTypes();
  return <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {tip ? '编辑Tips' : '新建Tips'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 py-4">
              {/* 基础信息 */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Tips名称 *</Label>
                  <Input id="name" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} placeholder="请输入Tips名称" className="mt-1" required />
                </div>

                <div>
                  <Label htmlFor="type">页面类型 *</Label>
                  <Select value={formData.type} onValueChange={value => handleInputChange('type', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="请选择页面类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePageTypes.map(pageType => <SelectItem key={pageType.value} value={pageType.value} disabled={pageType.disabled} className="data-[disabled]:opacity-50">
                          {pageType.label}
                          {pageType.disabled && <span className="ml-2 text-muted-foreground text-xs">(已使用)</span>}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">描述 *</Label>
                  <Textarea id="description" value={formData.description} onChange={e => handleInputChange('description', e.target.value)} placeholder="请输入Tips描述内容" className="mt-1 h-24" required />
                </div>

                <div>
                  <Label htmlFor="duration">持续时长</Label>
                  <div className="relative mt-1">
                    <Input id="duration" type="number" min="0" max="86400" value={formData.duration} onChange={e => handleDurationChange(e.target.value)} placeholder="0" className={`pr-12 ${durationError ? 'border-destructive' : ''}`} />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-muted-foreground text-sm">s</span>
                    </div>
                  </div>
                  {durationError && <p className="text-destructive text-xs mt-1">{durationError}</p>}
                  <div className="flex items-center mt-1 text-muted-foreground text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>范围: 0-86400秒 (0-24小时)</span>
                  </div>
                </div>
              </div>

              {/* 图片上传区域 */}
              <ImageUploadSection />

              <div className="flex justify-end space-x-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={onCancel}>
                  取消
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? '保存中...' : tip ? '更新Tips' : '创建Tips'}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>;
}

// 自定义Tag组件
function CustomTag({
  type,
  label
}) {
  const getBackgroundColor = () => {
    // 使用Tailwind CSS变量或类名可能更好，但为了保持逻辑简单，这里使用CSS变量的颜色值或者直接映射到Tailwind颜色
    const colors = {
      'homePage': 'bg-blue-500',
      'realTimeWaitingPage': 'bg-green-500',
      'realFlightExperience': 'bg-purple-500',
      'limitWaitingPage': 'bg-amber-500',
      'limitedExperience': 'bg-pink-500',
      'videoRecordingExperience': 'bg-red-500'
    };
    return colors[type] || 'bg-gray-500';
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium text-white ${getBackgroundColor()} shadow-sm`}>
      <Tag className="h-3 w-3 mr-1" />
      {label}
    </span>;
}

// 持续时长显示组件
function DurationDisplay({
  duration
}) {
  if (!duration || duration === 0) {
    return <span className="text-muted-foreground text-xs">未设置</span>;
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
  return <div className="flex items-center text-muted-foreground text-xs">
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

  // 加载Tips列表
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
      console.log('加载的Tips数据:', tipsWithUrls);
      // 检查每个tip的duration字段
      tipsWithUrls.forEach((tip, index) => {
        console.log(`Tip ${index}: duration=${tip.duration}, 类型: ${typeof tip.duration}`);
      });
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

  // 获取类型徽章
  const getTypeBadge = type => {
    return <CustomTag type={type} label={getPageTypeLabel(type)} />;
  };

  // 处理删除Tips
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
    setEditingTip(null);
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
      <div style={style} className="w-full h-full space-y-6">
        {/* 头部操作区 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1 w-full sm:w-auto flex items-center gap-4">
             <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="搜索Tips名称或描述..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  className="pl-10 bg-background border-input w-full hover:border-primary transition-colors duration-200" 
                />
             </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={loadTipsList} variant="outline" className="shadow-sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
            <Button onClick={handleNewTips} className="shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              新建TIPS
            </Button>
          </div>
        </div>

        {/* Tips列表 */}
        {loading ? <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">加载中...</span>
          </div> : filteredTipsList.length === 0 ? <div className="flex flex-col justify-center items-center py-12 border rounded-lg bg-card text-card-foreground">
            <div className="text-muted-foreground mb-4">
              <Image className="h-16 w-16 mx-auto opacity-30" />
            </div>
            <h3 className="text-lg font-medium text-muted-foreground mb-2">暂无Tips记录</h3>
            <p className="text-muted-foreground mb-4">创建第一个Tips记录开始管理</p>
            <Button onClick={handleNewTips}>
              <Plus className="h-4 w-4 mr-2" />
              新建Tips
            </Button>
          </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTipsList.map(tip => <Card key={tip._id} className="bg-card text-card-foreground border-border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden p-3 group">
                <div className="flex flex-col md:flex-row h-full rounded-lg overflow-hidden bg-muted/20 border border-border/50 group-hover:border-border transition-colors">
                  {/* 左侧：图片区域 (35%) */}
                  <div className="w-full md:w-[35%] h-40 md:h-auto relative bg-muted flex-shrink-0">
                    {tip.imageUrl ? 
                      <img 
                        src={tip.imageUrl} 
                        alt={tip.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      /> : 
                      <div className="w-full h-full flex items-center justify-center bg-muted/50">
                        <Image className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                    }
                    <div className="absolute top-2 left-2 z-10">
                      {getTypeBadge(tip.type)}
                    </div>
                  </div>

                  {/* 右侧：内容区域 (65%) */}
                  <div className="flex-1 p-4 flex flex-col justify-between w-full md:w-[65%]">
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground line-clamp-1 mb-1.5 group-hover:text-primary transition-colors">{tip.name}</h3>
                        <div className="flex items-center text-[10px] text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1 opacity-70" />
                          <span>{tip.createdAt ? new Date(tip.createdAt).toLocaleDateString() : '未知时间'}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <FileText className="h-3 w-3 mr-1 mt-0.5 text-muted-foreground opacity-70 flex-shrink-0" />
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {tip.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center pt-0.5">
                        <div className="flex items-center bg-muted/40 px-2 py-1 rounded text-[10px] text-muted-foreground">
                           <DurationDisplay duration={tip.duration} />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 mt-3 pt-3 border-t border-border/50">
                      <Button variant="ghost" size="sm" onClick={() => handleEditTips(tip)} className="h-7 px-2 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                        <Edit className="h-3 w-3 mr-1" />
                        编辑
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setTipToDelete(tip);
                        setDeleteConfirmOpen(true);
                      }} className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 className="h-3 w-3 mr-1" />
                        删除
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>)}
          </div>}

        {/* Tips表单弹窗 */}
        <TipsForm tip={editingTip} $w={$w} onSave={handleFormSuccess} onCancel={handleFormCancel} open={showForm} onOpenChange={setShowForm} existingTips={tipsList} />

        {/* 删除确认弹窗 */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
            <DialogHeader>
              <DialogTitle>确认删除</DialogTitle>
            </DialogHeader>
            <div className="text-muted-foreground mb-4">
              确定要删除Tips "{tipToDelete?.name}" 吗？此操作不可恢复。
            </div>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                取消
              </Button>
              <Button onClick={() => {
              handleDelete(tipToDelete);
              setDeleteConfirmOpen(false);
            }} variant="destructive">
                确认删除
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>;
}