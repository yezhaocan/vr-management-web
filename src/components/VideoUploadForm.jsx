// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Tabs, TabsContent, TabsList, TabsTrigger, useToast, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, RadioGroup, RadioGroupItem } from '@/components/ui';
// @ts-ignore;
import { Save, Image, Video as VideoIcon, RotateCcw, RotateCw, Volume2, VolumeX } from 'lucide-react';

// @ts-ignore;
import { VideoBasicInfo } from '@/components/VideoBasicInfo';
// @ts-ignore;
import { VideoFileUpload, VideoUrlInput } from '@/components/VideoFileUpload';
// @ts-ignore;
import { BroadcastManager } from '@/components/BroadcastManager';
// @ts-ignore;
import { BackgroundMusicUploader } from '@/components/BackgroundMusicUploader';
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
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    thumbnailFileId: '',
    videoFileId: '',
    videoUrl: '',
    startTime: undefined,
    endTime: undefined,
    duration: '00:00:00',
    // 新增：时长字段，格式HH:MM:SS
    broadcasts: [],
    backgroundMusicFileId: '',
    backgroundImageId: '',
    // 新增：背景图片文件ID
    status: 'active',
    isUpside: true,
    videoAngle: 0,
    isPlayOriginalSound: true
  });
  const [loading, setLoading] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [videoUploadType, setVideoUploadType] = useState('upload');

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
    setFormData(prev => ({
      ...prev,
      duration: durationStr
    }));
  };

  // 根据开始时间和结束时间自动计算时长
  const updateDuration = () => {
    const duration = calculateDuration(formData.startTime, formData.endTime);
    setFormData(prev => ({
      ...prev,
      duration
    }));
  };

  // 处理背景图片上传
  const handleBackgroundImageUpload = async file => {
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
      const tcb = await $w.cloud.getCloudInstance();
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileName = `video_record/backgrounds/${timestamp}_${randomStr}_${file.name}`;
      const uploadResult = await tcb.uploadFile({
        cloudPath: fileName,
        filePath: file
      });
      const fileID = uploadResult.fileID;
      setFormData(prev => ({
        ...prev,
        backgroundImageId: fileID
      }));
      toast({
        title: '背景图片上传成功',
        description: '背景图片已上传到云存储',
        duration: 2000
      });
    } catch (error) {
      console.error('处理背景图片失败:', error);
      toast({
        title: '背景图片上传失败',
        description: '请重新选择图片',
        variant: 'destructive'
      });
    }
  };

  // 移除背景图
  const handleRemoveBackgroundImage = () => {
    setFormData(prev => ({
      ...prev,
      backgroundImageId: ''
    }));
  };
  useEffect(() => {
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
        console.log('原始视频数据:', video);
        console.log('isUpside 值:', video.isUpside, '类型:', typeof video.isUpside);
        console.log('videoAngle 值:', video.videoAngle, '类型:', typeof video.videoAngle);
        console.log('isPlayOriginalSound 值:', video.isPlayOriginalSound, '类型:', typeof video.isPlayOriginalSound);
        console.log('计算时长:', durationValue);
        const isUpsideValue = video.isUpside !== undefined ? Boolean(video.isUpside) : true;
        const videoAngleValue = video.videoAngle !== undefined ? Number(video.videoAngle) : 0;
        const isPlayOriginalSoundValue = video.isPlayOriginalSound !== undefined ? Boolean(video.isPlayOriginalSound) : true;
        setFormData({
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
          // 初始化背景图片ID
          status: video.status || 'active',
          isUpside: isUpsideValue,
          videoAngle: videoAngleValue,
          isPlayOriginalSound: isPlayOriginalSoundValue
        });
        setVideoUploadType(video.videoUrl ? 'url' : 'upload');
      } else {
        setFormData({
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
          // 初始化背景图片ID
          status: 'active',
          isUpside: true,
          videoAngle: 0,
          isPlayOriginalSound: true
        });
      }
    };
    if (open) {
      initializeFormData();
    }
  }, [video, open]);

  // 监听开始时间和结束时间变化，自动更新时长
  useEffect(() => {
    if (formData.startTime && formData.endTime) {
      updateDuration();
    }
  }, [formData.startTime, formData.endTime]);
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
        setFormData(prev => ({
          ...prev,
          thumbnailFileId: fileID
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          videoFileId: fileID,
          videoUrl: ''
        }));
        setVideoUploadType('upload');
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
      setFormData(prev => ({
        ...prev,
        thumbnailFileId: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        videoFileId: '',
        videoUrl: ''
      }));
    }
  };
  const handleBroadcastsChange = broadcasts => {
    setFormData(prev => ({
      ...prev,
      broadcasts
    }));
  };
  const handleBackgroundMusicFileIdChange = fileId => {
    setFormData(prev => ({
      ...prev,
      backgroundMusicFileId: fileId
    }));
  };
  const handleSubmit = async e => {
    e.preventDefault();
    if (!formData.name) {
      toast({
        title: '表单验证失败',
        description: '请输入录像名称',
        variant: 'destructive'
      });
      return;
    }
    if (!formData.videoFileId && !formData.videoUrl) {
      toast({
        title: '表单验证失败',
        description: '请上传录像文件或输入视频地址',
        variant: 'destructive'
      });
      return;
    }

    // 验证开始时间不能晚于结束时间
    if (formData.startTime && formData.endTime) {
        if (formData.startTime.getTime() > formData.endTime.getTime()) {
            toast({
                title: '表单验证失败',
                description: '开始时间不能晚于结束时间',
                variant: 'destructive'
            });
            return;
        }
    }

    // 验证时长格式
    const durationRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    if (!durationRegex.test(formData.duration)) {
      toast({
        title: '表单验证失败',
        description: '时长格式不正确，请使用HH:MM:SS格式（如01:10:00）',
        variant: 'destructive'
      });
      return;
    }
    setLoading(true);
    try {
      const videoData = {
        name: formData.name,
        description: formData.description,
        imageFileId: formData.thumbnailFileId,
        videoFileId: formData.videoFileId,
        videoUrl: formData.videoUrl,
        startTime: formData.startTime ? formData.startTime.getTime() : null,
        endTime: formData.endTime ? formData.endTime.getTime() : null,
        broadcasts: formData.broadcasts.length > 0 ? formData.broadcasts : null,
        backgroundMusicFileId: formData.backgroundMusicFileId || null,
        backgroundImageId: formData.backgroundImageId || null,
        // 保存背景图片ID
        status: formData.status,
        isUpside: formData.isUpside === true || formData.isUpside === 'true' || formData.isUpside === 1,
        videoAngle: Number(formData.videoAngle) || 0,
        isPlayOriginalSound: formData.isPlayOriginalSound === true || formData.isPlayOriginalSound === 'true' || formData.isPlayOriginalSound === 1,
        uploadTime: new Date().getTime(),
        updatedAt: new Date().getTime()
      };
      console.log('保存的数据:', videoData);
      console.log('背景图片ID:', videoData.backgroundImageId);
      console.log('时长:', formData.duration);
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
          description: `录像 "${formData.name}" 已更新`
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
          description: `录像 "${formData.name}" 已创建`
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
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col overflow-hidden bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 border border-slate-200 dark:border-slate-800 p-0 gap-0 shadow-2xl">
        <DialogHeader className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex-none bg-white dark:bg-slate-900">
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-50">
            {video ? '编辑录像' : '创建录像'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full justify-start rounded-none border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 p-0 h-auto flex-none">
            <TabsTrigger value="basic" className="rounded-none border-b-2 border-transparent px-6 py-3 text-slate-600 dark:text-slate-400 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary dark:data-[state=active]:text-primary hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
              基础信息
            </TabsTrigger>
            <TabsTrigger value="video" className="rounded-none border-b-2 border-transparent px-6 py-3 text-slate-600 dark:text-slate-400 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary dark:data-[state=active]:text-primary hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
              录像管理
            </TabsTrigger>
            <TabsTrigger value="broadcast" className="rounded-none border-b-2 border-transparent px-6 py-3 text-slate-600 dark:text-slate-400 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary dark:data-[state=active]:text-primary hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
              播报管理
            </TabsTrigger>
            <TabsTrigger value="music" className="rounded-none border-b-2 border-transparent px-6 py-3 text-slate-600 dark:text-slate-400 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary dark:data-[state=active]:text-primary hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
              背景音乐
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden min-h-0 bg-white dark:bg-slate-900">
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <TabsContent value="basic" className="space-y-8 mt-0">
              <VideoBasicInfo formData={formData} handleInputChange={handleInputChange} handleDurationChange={handleDurationChange} updateDuration={updateDuration} $w={$w}
            // 传递背景图片上传相关函数
            onBackgroundImageUpload={handleBackgroundImageUpload} onRemoveBackgroundImage={handleRemoveBackgroundImage} />
            </TabsContent>

            <TabsContent value="video" className="space-y-8 mt-0">
              <VideoFileUpload type="thumbnail" label="缩略图" accept="image/*" icon={Image} fileId={formData.thumbnailFileId} uploading={uploadingThumbnail} onFileUpload={handleFileUpload} onClearFile={clearFile} />

              <div className="space-y-6">
                <div className="flex space-x-4 mb-6">
                  <Button type="button" onClick={() => setVideoUploadType('upload')} variant={videoUploadType === 'upload' ? 'default' : 'outline'} className="flex-1">
                    上传文件
                  </Button>
                  <Button type="button" onClick={() => setVideoUploadType('url')} variant={videoUploadType === 'url' ? 'default' : 'outline'} className="flex-1">
                    输入地址
                  </Button>
                </div>

                {videoUploadType === 'upload' ? <VideoFileUpload type="video" label="录像文件" accept="video/*" icon={VideoIcon} required={true} fileId={formData.videoFileId} uploading={uploadingVideo} onFileUpload={handleFileUpload} onClearFile={clearFile} /> : <VideoUrlInput videoUrl={formData.videoUrl} onVideoUrlChange={value => handleInputChange('videoUrl', value)} onClearVideoFile={() => handleInputChange('videoFileId', '')} />}
              
                {/* 视频朝向和视频角度字段 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                  {/* 视频朝向 */}
                  <div className="space-y-3">
                    <Label className="font-medium flex items-center text-slate-900 dark:text-slate-50">
                      <RotateCcw className="h-4 w-4 mr-2 text-primary" />
                      视频朝向
                    </Label>
                    <Select value={formData.isUpside ? 'true' : 'false'} onValueChange={value => handleInputChange('isUpside', value === 'true')}>
                      <SelectTrigger className="w-full bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-50">
                        <SelectValue placeholder="选择视频朝向" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                        <SelectItem value="true" className="focus:bg-slate-100 dark:focus:bg-slate-700">
                          <div className="flex items-center text-slate-900 dark:text-slate-50">
                            <RotateCcw className="h-4 w-4 mr-2 text-green-600 dark:text-green-500" />
                            正
                          </div>
                        </SelectItem>
                        <SelectItem value="false" className="focus:bg-slate-100 dark:focus:bg-slate-700">
                          <div className="flex items-center text-slate-900 dark:text-slate-50">
                            <RotateCw className="h-4 w-4 mr-2 text-red-600 dark:text-red-500" />
                            反
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">选择视频播放时的朝向：正为正常播放，反为倒置播放</p>
                  </div>

                  {/* 视频角度 */}
                  <div className="space-y-3">
                    <Label className="font-medium flex items-center text-slate-900 dark:text-slate-50">
                      <RotateCw className="h-4 w-4 mr-2 text-primary" />
                      视频朝向初始角度 (°)
                    </Label>
                    <Input type="number" value={formData.videoAngle} onChange={e => handleInputChange('videoAngle', e.target.value)} placeholder="0.00" step="0.01" min="-360" max="360" className="w-full bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-50" />
                    <p className="text-slate-500 dark:text-slate-400 text-sm">输入视频旋转角度，支持2位小数，范围：-360° 到 360°</p>
                  </div>
                </div>

                {/* 是否播放视频原声字段 */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                  <div className="space-y-3">
                    <Label className="font-medium flex items-center text-slate-900 dark:text-slate-50">
                      <Volume2 className="h-4 w-4 mr-2 text-primary" />
                      是否播放视频原声
                    </Label>
                    <RadioGroup value={formData.isPlayOriginalSound ? 'true' : 'false'} onValueChange={value => handleInputChange('isPlayOriginalSound', value === 'true')} className="flex space-x-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="play-sound-true" className="border-slate-400 text-primary" />
                        <Label htmlFor="play-sound-true" className="flex items-center cursor-pointer text-slate-900 dark:text-slate-50">
                          <Volume2 className="h-4 w-4 mr-2 text-green-600 dark:text-green-500" />
                          是
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="play-sound-false" className="border-slate-400 text-primary" />
                        <Label htmlFor="play-sound-false" className="flex items-center cursor-pointer text-slate-900 dark:text-slate-50">
                          <VolumeX className="h-4 w-4 mr-2 text-red-600 dark:text-red-500" />
                          否
                        </Label>
                      </div>
                    </RadioGroup>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">选择是否播放视频的原始声音，选择"否"时将静音播放</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="broadcast" className="space-y-8 mt-0">
              <BroadcastManager broadcasts={formData.broadcasts} onBroadcastsChange={handleBroadcastsChange} $w={$w} />
            </TabsContent>

            <TabsContent value="music" className="space-y-8 mt-0">
              <BackgroundMusicUploader backgroundMusicFileId={formData.backgroundMusicFileId} onBackgroundMusicFileIdChange={handleBackgroundMusicFileIdChange} $w={$w} />
            </TabsContent>

            </div>
            <div className="flex-none flex justify-end space-x-4 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <Button type="button" variant="outline" onClick={onCancel} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                取消
              </Button>
              <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                <Save className="h-4 w-4 mr-2" />
                {loading ? '保存中...' : video ? '更新录像' : '创建录像'}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>;
}
