import React from 'react';
import { useFormContext } from 'react-hook-form';
import {
  Input,
  Label,
  Textarea,
  Button,
  useToast,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui';
import { DatePicker } from '@/components/newUi/date-picker';
import { Clock, Upload, X, CheckCircle } from 'lucide-react';

export function VideoBasicInfo({
  updateDuration,
  $w,
  onBackgroundImageUpload,
  onRemoveBackgroundImage,
}) {
  const { control, watch, setValue, clearErrors, formState } = useFormContext();
  const { toast } = useToast();
  const [backgroundImage, setBackgroundImage] = React.useState(null);
  const [backgroundPreview, setBackgroundPreview] = React.useState('');
  const [uploading, setUploading] = React.useState(false);

  const backgroundImageId = watch('backgroundImageId');
  const startTime = watch('startTime');
  const endTime = watch('endTime');

  // 加载背景图预览
  const loadBackgroundImagePreview = async (fileId) => {
    if (!fileId) return;
    try {
      const tcb = await $w.cloud.getCloudInstance();
      const fileUrl = await tcb.getTempFileURL({
        fileList: [fileId],
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
    if (backgroundImageId) {
      loadBackgroundImagePreview(backgroundImageId);
    } else {
      // 如果没有 ID，但可能有本地预览（在表单提交失败后保持），这里需要小心不要覆盖
      // 实际上，VideoUploadForm 重置时会清空一切，或者回显时会设置 ID。
      // 如果是用户刚选的，没有 ID，但有 preview。
      // 这里的逻辑是：如果 backgroundImageId 变化了，且有值，加载远程。
      // 如果变成了空，清空预览（除非是正在选择新图片... 这里有点冲突）
      // 现在的逻辑：backgroundImageId 是 form watch 的。
      // 当我们选择新图片时，VideoUploadForm 可能会清空 backgroundImageId (或者保持旧的直到上传？)
      // 让我们假设 parent 处理 clear 逻辑。
      if (!backgroundPreview || !backgroundPreview.startsWith('blob:')) {
        setBackgroundPreview('');
      }
    }
  }, [backgroundImageId]);

  // 清理临时文件的 ObjectURL
  React.useEffect(() => {
    return () => {
      if (backgroundPreview && backgroundPreview.startsWith('blob:')) {
        URL.revokeObjectURL(backgroundPreview);
      }
    };
  }, [backgroundPreview]);

  // 处理背景图上传
  const handleBackgroundImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast({
        title: '文件类型错误',
        description: '请上传图片文件',
        variant: 'destructive',
      });
      return;
    }

    // 验证文件大小 (例如 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: '文件过大',
        description: '图片大小不能超过 5MB',
        variant: 'destructive',
      });
      return;
    }

    try {
      // 释放旧的预览图
      if (backgroundPreview && backgroundPreview.startsWith('blob:')) {
        URL.revokeObjectURL(backgroundPreview);
      }

      // 创建新预览
      const objectUrl = URL.createObjectURL(file);
      setBackgroundPreview(objectUrl);
      setBackgroundImage(file);

      // 清除背景图片的验证错误
      clearErrors('backgroundImageId');

      // 调用父组件处理函数
      if (onBackgroundImageUpload) {
        onBackgroundImageUpload(file);
      }

      toast({
        title: '图片已选择',
        description: '背景图片已暂存，将在创建录像时上传',
        duration: 2000,
      });
    } catch (error) {
      console.error('处理图片失败:', error);
      toast({
        title: '图片处理失败',
        description: '请重新选择图片',
        variant: 'destructive',
      });
    }
  };

  // 移除背景图
  const handleRemoveBackgroundImage = () => {
    if (backgroundPreview && backgroundPreview.startsWith('blob:')) {
      URL.revokeObjectURL(backgroundPreview);
    }
    setBackgroundImage(null);
    setBackgroundPreview('');

    // 调用父组件移除函数
    if (onRemoveBackgroundImage) {
      onRemoveBackgroundImage();
    }
    toast({
      title: '背景图片已移除',
      description: '背景图片已从配置中移除',
      variant: 'default',
    });
  };

  // 检查是否应该显示时长字段（有开始时间和结束时间）
  const shouldShowDuration = startTime && endTime;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-medium text-base">
                录像名称
                <span className="required-marker ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="请输入录像名称" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-medium text-base">
                描述
                <span className="required-marker ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Textarea placeholder="请输入录像描述" className="h-32" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 背景图片上传 */}
        <div className="space-y-4">
          <Label className="font-medium text-base">
            背景图片
            <span className="required-marker ml-1">*</span>
          </Label>

          <div className="bg-muted/30 rounded-xl p-6 border-2 border-border hover:border-primary/50 transition-colors">
            {backgroundPreview || backgroundImageId ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center">
                      <Upload className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-lg">
                        {backgroundPreview && backgroundPreview.startsWith('blob:')
                          ? '图片已选择'
                          : '图片已上传'}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {backgroundImage ? `文件名: ${backgroundImage.name}` : '背景图片已设置'}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('background-upload').click()}
                      className="border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      更换
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveBackgroundImage}
                      className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <X className="h-4 w-4 mr-2" />
                      清除
                    </Button>
                  </div>
                </div>

                {/* 背景图预览 */}
                {backgroundPreview && (
                  <div className="mt-4">
                    <div className="text-sm text-muted-foreground mb-2">预览</div>
                    <div className="relative bg-muted/50 rounded-lg overflow-hidden border border-border">
                      <img
                        src={backgroundPreview}
                        alt="背景图预览"
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                className="text-center cursor-pointer group"
                onClick={() => document.getElementById('background-upload').click()}
              >
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <div className="w-24 h-24 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 transition-colors">
                      <Upload className="h-10 w-10 text-blue-500 dark:text-blue-400" />
                    </div>
                  </div>
                  <div>
                    <p className="text-foreground font-medium text-xl">点击上传背景图片</p>
                    <p className="text-muted-foreground text-sm mt-2">支持 JPG, PNG, GIF 格式</p>
                  </div>
                  {uploading && (
                    <div className="w-full bg-muted rounded-full h-3">
                      <div className="bg-primary h-3 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <input
            type="file"
            id="background-upload"
            accept="image/*"
            onChange={handleBackgroundImageUpload}
            className="hidden"
          />
          {formState.errors.backgroundImageId && (
            <p className="text-sm font-medium text-destructive">
              {formState.errors.backgroundImageId.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium text-base">
                  开始时间
                  <span className="required-marker ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <DatePicker
                    selected={field.value}
                    onChange={field.onChange}
                    placeholder="选择开始时间"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium text-base">
                  结束时间
                  <span className="required-marker ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <DatePicker
                    selected={field.value}
                    onChange={field.onChange}
                    placeholder="选择结束时间"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 时长字段 - 只在有开始时间和结束时间时显示 */}
        {shouldShowDuration && (
          <div className="pt-4 border-t border-border">
            <FormField
              control={control}
              name="duration"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="font-medium text-base flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-orange-500" />
                    录像时长 (HH:MM:SS)
                    <span className="required-marker ml-1">*</span>
                  </FormLabel>
                  <div className="flex items-center space-x-4">
                    <FormControl>
                      <Input placeholder="01:10:00" className="w-32" {...field} />
                    </FormControl>
                    <Button
                      type="button"
                      onClick={updateDuration}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      自动计算
                    </Button>
                  </div>
                  <FormDescription>
                    格式：HH:MM:SS（如01:10:00表示1小时10分钟），点击"自动计算"可根据开始和结束时间计算时长
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
}
