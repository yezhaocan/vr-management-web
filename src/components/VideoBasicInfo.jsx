// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Input, Label, Textarea, Button, useToast } from '@/components/ui';
// @ts-ignore;
import { Clock, Upload, X } from 'lucide-react';

export function VideoBasicInfo({
  formData,
  handleInputChange,
  handleDurationChange,
  updateDuration,
  $w,
  onBackgroundImageUpload,
  onRemoveBackgroundImage
}) {
  const {
    toast
  } = useToast();
  const [backgroundImage, setBackgroundImage] = React.useState(null);
  const [backgroundPreview, setBackgroundPreview] = React.useState('');
  const [uploading, setUploading] = React.useState(false);

  // 加载背景图预览
  const loadBackgroundImagePreview = async fileId => {
    if (!fileId) return;
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

  // 初始化时加载背景图预览
  React.useEffect(() => {
    if (formData.backgroundImageId) {
      loadBackgroundImagePreview(formData.backgroundImageId);
    }
  }, [formData.backgroundImageId]);

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

      // 调用父组件上传函数
      if (onBackgroundImageUpload) {
        await onBackgroundImageUpload(file);
      }
      toast({
        title: '图片已选择',
        description: '背景图片已上传并保存',
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

    // 调用父组件移除函数
    if (onRemoveBackgroundImage) {
      onRemoveBackgroundImage();
    }
    toast({
      title: '背景图片已移除',
      description: '背景图片已从配置中移除',
      variant: 'default'
    });
  };

  // 检查是否应该显示时长字段（有开始时间和结束时间）
  const shouldShowDuration = formData.startTime && formData.endTime;
  return <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="font-medium">录像名称 *</Label>
          <Input id="name" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} placeholder="请输入录像名称" className="mt-2" required />
        </div>

        <div>
          <Label htmlFor="description" className="font-medium">描述</Label>
          <Textarea id="description" value={formData.description} onChange={e => handleInputChange('description', e.target.value)} placeholder="请输入录像描述" className="mt-2 h-32" />
        </div>

        {/* 背景图片上传 */}
        <div>
          <Label className="font-medium">背景图片</Label>
          <div className="mt-2 space-y-3">
            {/* 背景图预览 */}
            {backgroundPreview && <div className="relative">
                <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">背景图预览</div>
                <div className="relative bg-slate-100 dark:bg-slate-800/50 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img src={backgroundPreview} alt="背景图预览" className="w-full h-32 object-cover" />
                  <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6 shadow-sm" onClick={handleRemoveBackgroundImage}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>}

            {/* 上传控件 */}
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-4 text-center hover:border-primary dark:hover:border-primary transition-colors bg-slate-50 dark:bg-slate-800/20 group cursor-pointer">
              <input type="file" id="background-upload" accept="image/*" onChange={handleBackgroundImageUpload} className="hidden" />
              <label htmlFor="background-upload" className="cursor-pointer w-full h-full block">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <Upload className="h-6 w-6 text-slate-400 dark:text-slate-500 group-hover:text-primary transition-colors" />
                  <div>
                    <div className="font-medium text-sm text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">点击上传背景图</div>
                    <div className="text-slate-500 dark:text-slate-500 text-xs">支持 JPG、PNG、GIF 等格式</div>
                  </div>
                  {uploading && <div className="text-primary text-sm flex items-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-1"></div>
                      上传中...
                    </div>}
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="startTime" className="font-medium">开始时间</Label>
            <Input id="startTime" type="datetime-local" value={formData.startTime} onChange={e => handleInputChange('startTime', e.target.value)} className="mt-2" />
          </div>
          <div>
            <Label htmlFor="endTime" className="font-medium">结束时间</Label>
            <Input id="endTime" type="datetime-local" value={formData.endTime} onChange={e => handleInputChange('endTime', e.target.value)} className="mt-2" />
          </div>
        </div>

        {/* 时长字段 - 只在有开始时间和结束时间时显示 */}
        {shouldShowDuration && <div className="pt-4 border-t border-border">
            <div className="space-y-3">
              <Label className="font-medium flex items-center">
                <Clock className="h-5 w-5 mr-2 text-orange-500" />
                录像时长 (HH:MM:SS)
              </Label>
              <div className="flex items-center space-x-4">
                <Input type="text" value={formData.duration} onChange={e => handleDurationChange(e.target.value)} placeholder="01:10:00" pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$" className="w-32" />
                <Button type="button" onClick={updateDuration} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                  自动计算
                </Button>
              </div>
              <p className="text-muted-foreground text-sm">
                格式：HH:MM:SS（如01:10:00表示1小时10分钟），点击"自动计算"可根据开始和结束时间计算时长
              </p>
            </div>
          </div>}
      </div>
    </div>;
}