import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Tabs, TabsContent, TabsList, TabsTrigger, useToast, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, RadioGroup, RadioGroupItem, Card, CardContent, CardHeader, CardTitle, CardDescription, Separator } from '@/components/ui';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Save, Image, Video as VideoIcon, RotateCcw, RotateCw, Volume2, VolumeX, Upload, CheckCircle, X, Link } from 'lucide-react';

import { VideoBasicInfo } from '@/components/VideoBasicInfo';
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
  const [pendingThumbnailFile, setPendingThumbnailFile] = useState(null);
  const [pendingVideoFile, setPendingVideoFile] = useState(null);

  // 自定义验证函数
  const validateFormData = (data) => {
    const errors = {};

    // 验证录像名称（必填）
    if (!data.name || data.name.trim().length === 0) {
      errors.name = "请输入录像名称";
    }

    // 验证描述（必填）
    if (!data.description || data.description.trim().length === 0) {
      errors.description = "请输入录像描述";
    }

    // 验证视频文件或URL（至少需要一个，必填）
    if (!data.videoFileId && !data.videoUrl && !pendingVideoFile) {
      errors.videoFileId = "请上传录像文件或输入视频地址";
    }

    // 验证背景图片（必填）
    if (!data.backgroundImageId && !pendingBackgroundImage) {
      errors.backgroundImageId = "请上传背景图片";
    }

    // 验证开始时间（必填）
    if (!data.startTime) {
      errors.startTime = "请选择开始时间";
    }

    // 验证结束时间（必填）
    if (!data.endTime) {
      errors.endTime = "请选择结束时间";
    }

    // 验证开始时间和结束时间的逻辑关系
    if (data.startTime && data.endTime && data.startTime >= data.endTime) {
      errors.endTime = "结束时间必须晚于开始时间";
    }

    // 验证时长格式（必填）
    if (!data.duration || data.duration === '00:00:00') {
      errors.duration = "请输入有效的录像时长";
    } else if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(data.duration)) {
      errors.duration = "时长格式不正确，应为HH:MM:SS格式";
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
    setPendingThumbnailFile(null);
    setPendingVideoFile(null);
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

  // 处理缩略图文件选择（仅暂存，不立即上传）
  const handleThumbnailFileSelect = file => {
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
    setPendingThumbnailFile(file);
  };

  // 移除缩略图
  const handleRemoveThumbnail = () => {
    setPendingThumbnailFile(null);
    form.setValue('thumbnailFileId', '');
  };

  // 处理视频文件选择（仅暂存，不立即上传）
  const handleVideoFileSelect = file => {
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('video/')) {
      toast({
        title: '文件类型错误',
        description: '请上传视频文件',
        variant: 'destructive'
      });
      return;
    }
    
    // 暂存文件
    setPendingVideoFile(file);
    // 清除视频URL和之前的文件ID
    form.setValue('videoUrl', '');
    form.setValue('videoFileId', '');
    setVideoUploadType('upload');
    // 清除视频文件的验证错误
    form.clearErrors('videoFileId');
  };

  // 移除视频文件
  const handleRemoveVideo = () => {
    setPendingVideoFile(null);
    form.setValue('videoFileId', '');
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
    // 清除背景图片的验证错误
    form.clearErrors('backgroundImageId');
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
      // 清除暂存的视频文件
      setPendingVideoFile(null);
    }
    if (field === 'name' && value) {
      form.clearErrors('name');
    }
    if (field === 'description' && value) {
      form.clearErrors('description');
    }
    if (field === 'startTime') {
      form.clearErrors('startTime');
      if (value) {
        form.clearErrors('endTime'); // 清除结束时间的关联错误
      }
    }
    if (field === 'endTime') {
      form.clearErrors('endTime');
      if (value) {
        form.clearErrors('startTime'); // 清除开始时间的关联错误
      }
    }
    if (field === 'videoAngle') {
      form.clearErrors('videoAngle');
    }
    if (field === 'duration') {
      form.clearErrors('duration');
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

      // 如果有基础信息相关的错误，切换到基础信息标签页
      const basicInfoFields = ['name', 'description', 'backgroundImageId', 'startTime', 'endTime', 'duration', 'videoFileId', 'videoUrl'];
      const hasBasicInfoError = Object.keys(validationErrors).some(field => basicInfoFields.includes(field));
      if (hasBasicInfoError && activeTab !== 'basic') {
        setActiveTab('basic');
      }

      // 显示错误提示
      toast({
        title: '表单验证失败',
        description: '请检查并填写所有必填项',
        variant: 'destructive'
      });

      return;
    }
    
    setLoading(true);
    try {
      // ----------------------------------------------------------------
      // 处理缩略图上传
      // ----------------------------------------------------------------
      let finalThumbnailFileId = values.thumbnailFileId;
      if (pendingThumbnailFile) {
        try {
          toast({
            title: '正在上传缩略图',
            description: '请稍候...',
          });
          const tcb = await $w.cloud.getCloudInstance();
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(2, 8);
          const fileName = `video_record/thumbnails/${timestamp}_${randomStr}_${pendingThumbnailFile.name}`;
          const uploadResult = await tcb.uploadFile({
            cloudPath: fileName,
            filePath: pendingThumbnailFile
          });
          finalThumbnailFileId = uploadResult.fileID;
        } catch (error) {
          console.error('缩略图上传失败:', error);
          throw new Error('缩略图上传失败，请重试');
        }
      }

      // ----------------------------------------------------------------
      // 处理视频文件上传
      // ----------------------------------------------------------------
      let finalVideoFileId = values.videoFileId;
      if (pendingVideoFile) {
        try {
          toast({
            title: '正在上传视频文件',
            description: '请稍候...',
          });
          const tcb = await $w.cloud.getCloudInstance();
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(2, 8);
          const fileName = `video_record/videos/${timestamp}_${randomStr}_${pendingVideoFile.name}`;
          const uploadResult = await tcb.uploadFile({
            cloudPath: fileName,
            filePath: pendingVideoFile
          });
          finalVideoFileId = uploadResult.fileID;
        } catch (error) {
          console.error('视频文件上传失败:', error);
          throw new Error('视频文件上传失败，请重试');
        }
      }

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
        imageFileId: finalThumbnailFileId,
        videoFileId: finalVideoFileId,
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
        className="sm:max-w-[1296px] max-w-[95vw] h-[90vh] max-h-[95vh] flex flex-col p-0 gap-0 bg-background text-foreground border-border"
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
              <TabsList className="grid w-full grid-cols-2 h-11 bg-muted text-muted-foreground">
                <TabsTrigger value="basic" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all">
                  基础信息
                </TabsTrigger>
                <TabsTrigger value="broadcast" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all">
                  播报管理
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto bg-muted/10">
              <form onSubmit={form.handleSubmit(onSubmit)} className="p-6">
                <TabsContent value="basic" className="mt-0 space-y-8">
                  {/* 基本信息区域 */}
                  <div className="space-y-6">
                    <VideoBasicInfo 
                      formData={form.watch()} 
                      handleInputChange={handleInputChange} 
                      handleDurationChange={handleDurationChange} 
                      updateDuration={updateDuration} 
                      $w={$w}
                      onBackgroundImageUpload={handleBackgroundImageUpload} 
                      onRemoveBackgroundImage={handleRemoveBackgroundImage} 
                    />
                  </div>

                  {/* 媒体文件区域 */}
                  <div className="space-y-6">
                    
                    <div className="space-y-6">
                      {/* 缩略图上传 */}
                      <div className="space-y-4">
                        <Label className="font-medium text-base">
                          缩略图
                        </Label>

                        <div className="bg-muted/30 rounded-xl p-6 border-2 border-border hover:border-primary/50 transition-colors">
                          {form.watch('thumbnailFileId') || pendingThumbnailFile ? (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center">
                                    <Image className="h-6 w-6 text-green-600 dark:text-green-400" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-lg">
                                      {pendingThumbnailFile ? '文件已选择' : '文件已上传'}
                                    </p>
                                    <p className="text-muted-foreground text-sm">
                                      {pendingThumbnailFile 
                                        ? `文件名: ${pendingThumbnailFile.name}`
                                        : `文件ID: ${form.watch('thumbnailFileId')?.substring(0, 20)}...`
                                      }
                                    </p>
                                  </div>
                                </div>
                                <div className="flex space-x-3">
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => document.getElementById('thumbnailFile').click()} 
                                    className="border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                  >
                                    <Upload className="h-4 w-4 mr-2" />
                                    更换
                                  </Button>
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={handleRemoveThumbnail} 
                                    className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    清除
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center cursor-pointer group" onClick={() => document.getElementById('thumbnailFile').click()}>
                              <div className="space-y-6">
                                <div className="flex justify-center">
                                  <div className="w-24 h-24 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 transition-colors">
                                    <Image className="h-10 w-10 text-blue-500 dark:text-blue-400" />
                                  </div>
                                </div>
                                <div>
                                  <p className="text-foreground font-medium text-xl">
                                    点击上传缩略图
                                  </p>
                                  <p className="text-muted-foreground text-sm mt-2">
                                    支持 JPG, PNG 格式
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <input 
                          id="thumbnailFile" 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleThumbnailFileSelect(e.target.files[0])} 
                        />
                      </div>

                      <Separator className="my-6" />

                      <div className="space-y-4">
                        <Label className="font-medium text-base">
                          录像源
                          <span className="required-marker ml-1">*</span>
                        </Label>
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
                            <div className="space-y-4">
                              <Label className="font-medium text-base">
                                录像文件
                                <span className="required-marker ml-1">*</span>
                              </Label>
                              
                              <div className="bg-muted/30 rounded-xl p-6 border-2 border-border hover:border-primary/50 transition-colors">
                                {form.watch('videoFileId') || pendingVideoFile ? (
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center">
                                          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                          <p className="font-medium text-lg">
                                            {pendingVideoFile ? '文件已选择' : '文件已上传'}
                                          </p>
                                          <p className="text-muted-foreground text-sm">
                                            {pendingVideoFile 
                                              ? `文件名: ${pendingVideoFile.name}`
                                              : `文件ID: ${form.watch('videoFileId')?.substring(0, 20)}...`
                                            }
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex space-x-3">
                                        <Button 
                                          type="button" 
                                          variant="outline" 
                                          size="sm" 
                                          onClick={() => document.getElementById('videoFile').click()} 
                                          className="border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                        >
                                          <Upload className="h-4 w-4 mr-2" />
                                          更换
                                        </Button>
                                        <Button 
                                          type="button" 
                                          variant="outline" 
                                          size="sm" 
                                          onClick={handleRemoveVideo} 
                                          className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                                        >
                                          <X className="h-4 w-4 mr-2" />
                                          清除
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center cursor-pointer group" onClick={() => document.getElementById('videoFile').click()}>
                                    <div className="space-y-6">
                                      <div className="flex justify-center">
                                        <div className="w-24 h-24 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 transition-colors">
                                          <VideoIcon className="h-10 w-10 text-blue-500 dark:text-blue-400" />
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-foreground font-medium text-xl">
                                          点击上传录像文件
                                        </p>
                                        <p className="text-muted-foreground text-sm mt-2">
                                          支持 MP4, MOV, AVI 格式
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <input 
                                id="videoFile" 
                                type="file" 
                                accept="video/*" 
                                className="hidden" 
                                onChange={(e) => handleVideoFileSelect(e.target.files[0])} 
                              />
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <Label className="font-medium text-base">
                                视频地址
                                <span className="required-marker ml-1">*</span>
                              </Label>
                              
                              <div className="bg-muted/30 rounded-xl p-6 border-2 border-border hover:border-primary/50 transition-colors">
                                <div className="space-y-6">
                                  <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/20 rounded-full flex items-center justify-center">
                                      <Link className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-lg">输入视频地址</p>
                                      <p className="text-muted-foreground text-sm">支持在线视频链接</p>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <Input 
                                      value={form.watch('videoUrl')} 
                                      onChange={e => handleInputChange('videoUrl', e.target.value)} 
                                      placeholder="请输入视频地址，例如：https://example.com/video.mp4" 
                                      className="bg-background border-border p-3 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" 
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          <FormMessage>{form.formState.errors.videoFileId?.message}</FormMessage>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 播放设置区域 */}
                  <div className="space-y-6">
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* 视频朝向 */}
                        <FormField
                          control={form.control}
                          name="isUpside"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="font-medium text-base flex items-center">
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
                              <FormLabel className="font-medium text-base flex items-center">
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
                            <FormLabel className="font-medium text-base flex items-center">
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
                    </div>
                  </div>

                  {/* 背景音乐区域 */}
                  <div className="space-y-6">
                    <BackgroundMusicUploader 
                      backgroundMusicFileId={form.watch('backgroundMusicFileId')} 
                      onBackgroundMusicFileIdChange={handleBackgroundMusicFileIdChange} 
                      $w={$w} 
                    />
                  </div>
                </TabsContent>

                <TabsContent value="broadcast" className="mt-0 space-y-6">
                  <div className="bg-background rounded-lg border border-border shadow-sm">
                    <div className="p-6">
                      <BroadcastManager 
                        broadcasts={form.watch('broadcasts')} 
                        onBroadcastsChange={handleBroadcastsChange} 
                        $w={$w} 
                      />
                    </div>
                  </div>
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