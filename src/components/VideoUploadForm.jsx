import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Tabs, TabsContent, TabsList, TabsTrigger, useToast, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, RadioGroup, RadioGroupItem, Card, CardContent, CardHeader, CardTitle, CardDescription, Separator } from '@/components/ui';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Save, Image, Video as VideoIcon, RotateCcw, RotateCw, Volume2, VolumeX } from 'lucide-react';

import { VideoBasicInfo } from '@/components/VideoBasicInfo';
import { VideoFileUpload, VideoUrlInput } from '@/components/VideoFileUpload';
import { BroadcastManager } from '@/components/BroadcastManager';
import { BackgroundMusicUploader } from '@/components/BackgroundMusicUploader';

// 表单验证规则
const validationRules = {
  name: {
    required: "请输入录像名称",
    minLength: {
      value: 1,
      message: "录像名称不能为空"
    }
  },
  duration: {
    pattern: {
      value: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/,
      message: "时长格式不正确"
    }
  },
  videoAngle: {
    valueAsNumber: true,
    min: {
      value: -360,
      message: "角度不能小于-360"
    },
    max: {
      value: 360,
      message: "角度不能大于360"
    }
  }
};

const defaultFormValues = {
  name: '',
  description: '',
  thumbnailFileId: '',
  videoFileId: '',
  videoUrl: '',
  startTime: undefined,
  endTime: undefined,
  duration: '00:00:00',
  broadcasts: [],
  backgroundMusicFileId: '',
  backgroundImageId: '',
  status: 'active',
  isUpside: true,
  videoAngle: 0,
  isPlayOriginalSound: true
};

export function VideoUploadForm({
  video,
  $w,
  onSave,
  onCancel,
  open,
  onOpenChange
}) {
  const {
    toast
  } = useToast();
  
  const form = useForm({
    defaultValues: defaultFormValues,
    mode: 'onChange'
  });

  const [loading, setLoading] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [videoUploadType, setVideoUploadType] = useState('upload');
  const [pendingBackgroundImage, setPendingBackgroundImage] = useState(null);

  // 自定义验证函数
  const validateFormData = (data) => {
    const errors = {};
    
    // 验证录像名称
    if (!data.name || data.name.trim().length === 0) {
      errors.name = "请输入录像名称";
    }
    
    // 验证视频文件或URL（至少需要一个）
    if (!data.videoFileId && !data.videoUrl) {
      errors.videoFileId = "请上传录像文件或输入视频地址";
    }
    
    // 验证开始时间和结束时间
    if (data.startTime && data.endTime && data.startTime > data.endTime) {
      errors.startTime = "开始时间不能晚于结束时间";
    }
    
    // 验证时长格式
    if (data.duration && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(data.duration)) {
      errors.duration = "时长格式不正确";
    }
    
    // 验证视频角度
    const angle = parseFloat(data.videoAngle);
    if (!isNaN(angle) && (angle < -360 || angle > 360)) {
      errors.videoAngle = "角度范围应在-360°到360°之间";
    }
    
    return errors;
  };
  const resetAllStates = () => {
    form.reset(defaultFormValues);
    setActiveTab('basic');
    setVideoUploadType('upload');
    setLoading(false);
    setUploadingThumbnail(false);
    setUploadingVideo(false);
    setPendingBackgroundImage(null);
  };

  // 将时间戳转换为Date对象
  const timestampToDate = timestamp => {
    if (!timestamp) return undefined;
    return new Date(timestamp);
  };

  // 计算时长（秒数转换为HH:MM:SS格式）
  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '00:00:00';
    
    // startTime 和 endTime 应该是 Date 对象
    const start = startTime instanceof Date ? startTime.getTime() : 0;
    const end = endTime instanceof Date ? endTime.getTime() : 0;
    
    if (!start || !end || end <= start) return '00:00:00';
    const durationSeconds = Math.floor((end - start) / 1000);
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor(durationSeconds % 3600 / 60);
    const seconds = durationSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // 手动设置时长
  const handleDurationChange = durationStr => {
    form.setValue('duration', durationStr);
  };

  // 根据开始时间和结束时间自动计算时长
  const updateDuration = () => {
    const startTime = form.getValues('startTime');
    const endTime = form.getValues('endTime');
    const duration = calculateDuration(startTime, endTime);
    form.setValue('duration', duration);
  };

  // 处理背景图片上传（仅暂存，不立即上传）
  const handleBackgroundImageUpload = file => {
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
    
    // 暂存文件
    setPendingBackgroundImage(file);
    // 注意：这里不设置 backgroundImageId，因为文件还没上传
    // 但我们需要确保如果之前有 ID（编辑模式或之前已上传），逻辑上应该被替换
    // 不过由于我们有 pendingBackgroundImage，提交时会优先使用它
  };

  // 移除背景图
  const handleRemoveBackgroundImage = () => {
    setPendingBackgroundImage(null);
    form.setValue('backgroundImageId', '');
  };

  useEffect(() => {
    if (!open) {
      resetAllStates();
      return;
    }

    const initializeFormData = async () => {
      if (video) {
        let broadcasts = [];
        try {
          if (video.broadcasts) {
            if (typeof video.broadcasts === 'string') {
              broadcasts = JSON.parse(video.broadcasts);
            } else if (Array.isArray(video.broadcasts)) {
              broadcasts = video.broadcasts;
            }
          }
        } catch (error) {
          console.error('解析播报数据失败:', error);
          broadcasts = [];
        }

        // 计算时长
        let durationValue = '00:00:00';
        if (video.startTime && video.endTime) {
          const durationSeconds = Math.floor((video.endTime - video.startTime) / 1000);
          const hours = Math.floor(durationSeconds / 3600);
          const minutes = Math.floor(durationSeconds % 3600 / 60);
          const seconds = durationSeconds % 60;
          durationValue = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
        
        const isUpsideValue = video.isUpside !== undefined ? Boolean(video.isUpside) : true;
        const videoAngleValue = video.videoAngle !== undefined ? Number(video.videoAngle) : 0;
        const isPlayOriginalSoundValue = video.isPlayOriginalSound !== undefined ? Boolean(video.isPlayOriginalSound) : true;
        
        form.reset({
          name: video.name || '',
          description: video.description || '',
          thumbnailFileId: video.imageFileId || '',
          videoFileId: video.videoFileId || '',
          videoUrl: video.videoUrl || '',
          startTime: timestampToDate(video.startTime),
          endTime: timestampToDate(video.endTime),
          duration: durationValue,
          broadcasts: broadcasts,
          backgroundMusicFileId: video.backgroundMusicFileId || '',
          backgroundImageId: video.backgroundImageId || '',
          status: video.status || 'active',
          isUpside: isUpsideValue,
          videoAngle: videoAngleValue,
          isPlayOriginalSound: isPlayOriginalSoundValue
        });
        setVideoUploadType(video.videoUrl ? 'url' : 'upload');
      } else {
        resetAllStates();
      }
    };
    
    initializeFormData();
  }, [video, open, form]);

  // 监听开始时间和结束时间变化，自动更新时长
  const startTime = form.watch('startTime');
  const endTime = form.watch('endTime');
  useEffect(() => {
    if (startTime && endTime) {
      updateDuration();
    }
  }, [startTime, endTime]);

  const handleInputChange = (field, value) => {
    form.setValue(field, value);
    
    // 清除相关字段的验证错误
    if (field === 'videoUrl' && value) {
      form.clearErrors('videoFileId');
    }
    if (field === 'name' && value) {
      form.clearErrors('name');
    }
    if (field === 'startTime' || field === 'endTime') {
      form.clearErrors('startTime');
    }
    if (field === 'videoAngle') {
      form.clearErrors('videoAngle');
    }
    if (field === 'duration') {
      form.clearErrors('duration');
    }
  };

  const handleFileUpload = async (file, type) => {
    try {
      if (!file) return;
      if (type === 'thumbnail') setUploadingThumbnail(true);
      if (type === 'video') setUploadingVideo(true);
      const tcb = await $w.cloud.getCloudInstance();
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileName = `video_record/${type === 'thumbnail' ? 'thumbnails' : 'videos'}/${timestamp}_${randomStr}_${file.name}`;
      const uploadResult = await tcb.uploadFile({
        cloudPath: fileName,
        filePath: file
      });
      const fileID = uploadResult.fileID;
      if (type === 'thumbnail') {
        form.setValue('thumbnailFileId', fileID);
      } else {
        form.setValue('videoFileId', fileID);
        form.setValue('videoUrl', '');
        setVideoUploadType('upload');
        // 清除视频文件的验证错误
        form.clearErrors('videoFileId');
      }
      toast({
        title: '上传成功',
        description: `${type === 'thumbnail' ? '缩略图' : '录像'}文件已上传`
      });
    } catch (error) {
      toast({
        title: '上传失败',
        description: error.message || '请检查网络连接',
        variant: 'destructive'
      });
    } finally {
      if (type === 'thumbnail') setUploadingThumbnail(false);
      if (type === 'video') setUploadingVideo(false);
    }
  };

  const clearFile = type => {
    if (type === 'thumbnail') {
      form.setValue('thumbnailFileId', '');
    } else {
      form.setValue('videoFileId', '');
      form.setValue('videoUrl', '');
    }
  };

  const handleBroadcastsChange = broadcasts => {
    form.setValue('broadcasts', broadcasts);
  };

  const handleBackgroundMusicFileIdChange = fileId => {
    form.setValue('backgroundMusicFileId', fileId);
  };

  const onSubmit = async (values) => {
    // 执行自定义验证
    const validationErrors = validateFormData(values);
    
    // 如果有验证错误，设置表单错误并返回
    if (Object.keys(validationErrors).length > 0) {
      Object.keys(validationErrors).forEach(field => {
        form.setError(field, { message: validationErrors[field] });
      });
      return;
    }
    
    setLoading(true);
    try {
      // ----------------------------------------------------------------
      // 处理背景图片上传
      // ----------------------------------------------------------------
      let finalBackgroundImageId = values.backgroundImageId;
      if (pendingBackgroundImage) {
        // 如果有暂存的背景图片，先上传
        try {
          toast({
            title: '正在上传背景图片',
            description: '请稍候...',
          });
          const tcb = await $w.cloud.getCloudInstance();
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(2, 8);
          const fileName = `video_record/backgrounds/${timestamp}_${randomStr}_${pendingBackgroundImage.name}`;
          const uploadResult = await tcb.uploadFile({
            cloudPath: fileName,
            filePath: pendingBackgroundImage
          });
          finalBackgroundImageId = uploadResult.fileID;
        } catch (error) {
          console.error('背景图片上传失败:', error);
          throw new Error('背景图片上传失败，请重试');
        }
      }

      // ----------------------------------------------------------------
      // 处理播报中的临时文件上传
      // ----------------------------------------------------------------
      let processedBroadcasts = [];
      if (values.broadcasts && values.broadcasts.length > 0) {
        // 检查是否有临时文件需要上传
        const hasTempFiles = values.broadcasts.some(b => b.tempFiles);
        if (hasTempFiles) {
           toast({
             title: '正在上传播报文件',
             description: '正在将语音和字幕文件上传到云存储，请稍候...',
           });
        }

        // 定义文件上传帮助函数
        const uploadBroadcastFile = async (file, folder, defaultExt) => {
          const tcb = await $w.cloud.getCloudInstance();
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(2, 8);
          
          // 确定文件扩展名
          let ext = defaultExt;
          if (file.name) {
            const parts = file.name.split('.');
            if (parts.length > 1) ext = parts.pop();
          } else if (file.type) {
             const typeParts = file.type.split('/');
             if (typeParts.length > 1) ext = typeParts[1];
             if (ext === 'plain') ext = 'srt'; // 特殊处理 text/plain
             if (file.type === 'audio/wav') ext = 'wav';
          }

          const fileName = `${folder}/${timestamp}_${randomStr}.${ext}`;
          
          const uploadResult = await tcb.uploadFile({
            cloudPath: fileName,
            filePath: file
          });
          return uploadResult.fileID;
        };

        // 并行处理所有播报项
        processedBroadcasts = await Promise.all(values.broadcasts.map(async (broadcast) => {
          const newBroadcast = { ...broadcast };
          
          // 如果有临时文件，则上传
          if (newBroadcast.tempFiles) {
            try {
              // 检查并上传音频
              if (newBroadcast.tempFiles.audio && !newBroadcast.audioFileId.startsWith('cloud://') && newBroadcast.audioFileId.startsWith('temp_')) {
                newBroadcast.audioFileId = await uploadBroadcastFile(
                  newBroadcast.tempFiles.audio, 
                  'video_broadcasts/audio', 
                  'wav'
                );
              }
              
              // 检查并上传字幕
              if (newBroadcast.tempFiles.subtitle && !newBroadcast.subtitleFileId.startsWith('cloud://') && newBroadcast.subtitleFileId.startsWith('temp_')) {
                newBroadcast.subtitleFileId = await uploadBroadcastFile(
                  newBroadcast.tempFiles.subtitle, 
                  'video_broadcasts/subtitle', 
                  'srt'
                );
              }
              
              // 清理临时文件对象
              delete newBroadcast.tempFiles;
              
            } catch (err) {
              console.error(`播报文件上传失败 (ID: ${broadcast.id}):`, err);
              throw new Error(`播报文件上传失败: ${err.message}`);
            }
          }
          
          return newBroadcast;
        }));
      } else {
        processedBroadcasts = [];
      }

      const videoData = {
        name: values.name,
        description: values.description,
        imageFileId: values.thumbnailFileId,
        videoFileId: values.videoFileId,
        videoUrl: values.videoUrl,
        startTime: values.startTime ? values.startTime.getTime() : null,
        endTime: values.endTime ? values.endTime.getTime() : null,
        broadcasts: processedBroadcasts.length > 0 ? processedBroadcasts : null,
        backgroundMusicFileId: values.backgroundMusicFileId || null,
        backgroundImageId: finalBackgroundImageId || null,
        // 保存背景图片ID
        status: values.status,
        isUpside: values.isUpside === true || values.isUpside === 'true' || values.isUpside === 1,
        videoAngle: Number(values.videoAngle) || 0,
        isPlayOriginalSound: values.isPlayOriginalSound === true || values.isPlayOriginalSound === 'true' || values.isPlayOriginalSound === 1,
        uploadTime: new Date().getTime(),
        updatedAt: new Date().getTime()
      };
      console.log('保存的数据:', videoData);
      
      if (video && video._id) {
        const result = await $w.cloud.callDataSource({
          dataSourceName: 'video_record',
          methodName: 'wedaUpdateV2',
          params: {
            filter: {
              where: {
                _id: {
                  $eq: video._id
                }
              }
            },
            data: videoData
          }
        });
        console.log('更新结果:', result);
        toast({
          title: '录像更新成功',
          description: `录像 "${values.name}" 已更新`
        });
      } else {
        videoData.createdAt = new Date().getTime();
        const result = await $w.cloud.callDataSource({
          dataSourceName: 'video_record',
          methodName: 'wedaCreateV2',
          params: {
            data: videoData
          }
        });
        console.log('创建结果:', result);
        toast({
          title: '录像创建成功',
          description: `录像 "${values.name}" 已创建`
        });
      }
      onSave && onSave();
    } catch (error) {
      console.error('保存失败:', error);
      toast({
        title: '操作失败',
        description: error.message || '请检查网络连接',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[900px] h-[85vh] flex flex-col p-0 gap-0 bg-background text-foreground border-border"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-6 py-4 border-b border-border flex-none">
          <DialogTitle className="text-xl font-bold">
            {video ? '编辑录像' : '创建录像'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30">
              <TabsList className="grid w-full grid-cols-4 h-11 bg-muted text-muted-foreground">
                <TabsTrigger value="basic" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all">
                  基础信息
                </TabsTrigger>
                <TabsTrigger value="video" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all">
                  录像管理
                </TabsTrigger>
                <TabsTrigger value="broadcast" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all">
                  播报管理
                </TabsTrigger>
                <TabsTrigger value="music" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all">
                  背景音乐
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto bg-muted/10">
              <form onSubmit={form.handleSubmit(onSubmit)} className="p-6">
                <TabsContent value="basic" className="mt-0 space-y-6">
                  <Card className="border-border shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">基本信息</CardTitle>
                      <CardDescription>设置录像的名称、描述及时长等基本属性</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <VideoBasicInfo 
                        formData={form.watch()} 
                        handleInputChange={handleInputChange} 
                        handleDurationChange={handleDurationChange} 
                        updateDuration={updateDuration} 
                        $w={$w}
                        onBackgroundImageUpload={handleBackgroundImageUpload} 
                        onRemoveBackgroundImage={handleRemoveBackgroundImage} 
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="video" className="mt-0 space-y-6">
                  <Card className="border-border shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">媒体文件</CardTitle>
                      <CardDescription>上传缩略图和录像文件</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <VideoFileUpload 
                        type="thumbnail" 
                        label="缩略图" 
                        accept="image/*" 
                        icon={Image} 
                        fileId={form.watch('thumbnailFileId')} 
                        uploading={uploadingThumbnail} 
                        onFileUpload={handleFileUpload} 
                        onClearFile={clearFile} 
                      />

                      <Separator className="my-6" />

                      <div className="space-y-4">
                        <Label className="text-base font-medium">录像源</Label>
                        <div className="flex space-x-4">
                          <Button 
                            type="button" 
                            onClick={() => setVideoUploadType('upload')} 
                            variant={videoUploadType === 'upload' ? 'default' : 'outline'} 
                            className="flex-1"
                          >
                            上传文件
                          </Button>
                          <Button 
                            type="button" 
                            onClick={() => setVideoUploadType('url')} 
                            variant={videoUploadType === 'url' ? 'default' : 'outline'} 
                            className="flex-1"
                          >
                            输入地址
                          </Button>
                        </div>

                        <div className="pt-2">
                          {videoUploadType === 'upload' ? (
                            <VideoFileUpload 
                              type="video" 
                              label="录像文件" 
                              accept="video/*" 
                              icon={VideoIcon} 
                              required={true} 
                              fileId={form.watch('videoFileId')} 
                              uploading={uploadingVideo} 
                              onFileUpload={handleFileUpload} 
                              onClearFile={clearFile} 
                            />
                          ) : (
                            <VideoUrlInput 
                              videoUrl={form.watch('videoUrl')} 
                              onVideoUrlChange={value => handleInputChange('videoUrl', value)} 
                              onClearVideoFile={() => handleInputChange('videoFileId', '')} 
                            />
                          )}
                          <FormMessage>{form.formState.errors.videoFileId?.message}</FormMessage>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">播放设置</CardTitle>
                      <CardDescription>配置视频的播放方向、角度和音频选项</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* 视频朝向 */}
                        <FormField
                          control={form.control}
                          name="isUpside"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="font-medium flex items-center">
                                <RotateCcw className="h-4 w-4 mr-2 text-primary" />
                                视频朝向
                              </FormLabel>
                              <Select 
                                onValueChange={(value) => field.onChange(value === 'true')}
                                value={field.value ? 'true' : 'false'}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="选择视频朝向" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="true">
                                    <div className="flex items-center">
                                      <RotateCcw className="h-4 w-4 mr-2 text-green-600 dark:text-green-500" />
                                      正 (正常播放)
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="false">
                                    <div className="flex items-center">
                                      <RotateCw className="h-4 w-4 mr-2 text-red-600 dark:text-red-500" />
                                      反 (倒置播放)
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>选择视频播放时的朝向</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* 视频角度 */}
                        <FormField
                          control={form.control}
                          name="videoAngle"
                          rules={validationRules.videoAngle}
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="font-medium flex items-center">
                                <RotateCw className="h-4 w-4 mr-2 text-primary" />
                                视频朝向初始角度 (°)
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field}
                                  placeholder="0.00" 
                                  step="0.01" 
                                  min="-360" 
                                  max="360" 
                                  className="w-full" 
                                />
                              </FormControl>
                              <FormDescription>范围：-360° 到 360°</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      {/* 是否播放视频原声字段 */}
                      <FormField
                        control={form.control}
                        name="isPlayOriginalSound"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="font-medium flex items-center">
                              <Volume2 className="h-4 w-4 mr-2 text-primary" />
                              是否播放视频原声
                            </FormLabel>
                            <FormControl>
                              <RadioGroup 
                                onValueChange={(value) => field.onChange(value === 'true')}
                                value={field.value ? 'true' : 'false'}
                                className="flex space-x-6"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="true" id="play-sound-true" />
                                  <Label htmlFor="play-sound-true" className="flex items-center cursor-pointer font-normal">
                                    <Volume2 className="h-4 w-4 mr-2 text-green-600 dark:text-green-500" />
                                    是
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="false" id="play-sound-false" />
                                  <Label htmlFor="play-sound-false" className="flex items-center cursor-pointer font-normal">
                                    <VolumeX className="h-4 w-4 mr-2 text-red-600 dark:text-red-500" />
                                    否
                                  </Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormDescription>选择"否"时将静音播放</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="broadcast" className="mt-0 space-y-6">
                  <Card className="border-border shadow-sm">
                    <CardContent className="pt-6">
                      <BroadcastManager 
                        broadcasts={form.watch('broadcasts')} 
                        onBroadcastsChange={handleBroadcastsChange} 
                        $w={$w} 
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="music" className="mt-0 space-y-6">
                  <Card className="border-border shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">背景音乐</CardTitle>
                      <CardDescription>上传和管理背景音乐文件</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <BackgroundMusicUploader 
                        backgroundMusicFileId={form.watch('backgroundMusicFileId')} 
                        onBackgroundMusicFileIdChange={handleBackgroundMusicFileIdChange} 
                        $w={$w} 
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </form>
            </div>

            <div className="flex-none flex justify-end items-center space-x-4 px-6 py-4 border-t border-border bg-muted/20">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
              >
                取消
              </Button>
              <Button 
                type="button" 
                onClick={form.handleSubmit(onSubmit)} 
                disabled={loading} 
                className="min-w-[100px]"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? '保存中...' : video ? '更新录像' : '创建录像'}
              </Button>
            </div>
          </Tabs>
        </Form>
      </DialogContent>
    </Dialog>
  );
}