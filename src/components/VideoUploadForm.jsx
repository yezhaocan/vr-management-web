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
    startTime: '',
    endTime: '',
    duration: '00:00:00',
    // 新增：时长字段，格式HH:MM:SS
    broadcasts: [],
    backgroundMusicFileId: '',
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

  // 将时间戳转换为datetime-local格式
  const timestampToDateTimeLocal = timestamp => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // 将datetime-local格式转换为时间戳
  const dateTimeLocalToTimestamp = dateTimeStr => {
    if (!dateTimeStr) return null;
    return new Date(dateTimeStr).getTime();
  };

  // 计算时长（秒数转换为HH:MM:SS格式）
  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '00:00:00';
    const start = dateTimeLocalToTimestamp(startTime);
    const end = dateTimeLocalToTimestamp(endTime);
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
          startTime: timestampToDateTimeLocal(video.startTime) || '',
          endTime: timestampToDateTimeLocal(video.endTime) || '',
          duration: durationValue,
          broadcasts: broadcasts,
          backgroundMusicFileId: video.backgroundMusicFileId || '',
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
          startTime: '',
          endTime: '',
          duration: '00:00:00',
          broadcasts: [],
          backgroundMusicFileId: '',
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
        startTime: formData.startTime ? new Date(formData.startTime).getTime() : null,
        endTime: formData.endTime ? new Date(formData.endTime).getTime() : null,
        broadcasts: formData.broadcasts.length > 0 ? formData.broadcasts : null,
        backgroundMusicFileId: formData.backgroundMusicFileId || null,
        status: formData.status,
        isUpside: formData.isUpside === true || formData.isUpside === 'true' || formData.isUpside === 1,
        videoAngle: Number(formData.videoAngle) || 0,
        isPlayOriginalSound: formData.isPlayOriginalSound === true || formData.isPlayOriginalSound === 'true' || formData.isPlayOriginalSound === 1,
        uploadTime: new Date().getTime(),
        updatedAt: new Date().getTime()
      };
      console.log('保存的数据:', videoData);
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            {video ? '编辑录像' : '创建录像'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800/50 backdrop-blur-sm border-b border-gray-600 rounded-t-xl">
            <TabsTrigger value="basic" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400">
              基础信息
            </TabsTrigger>
            <TabsTrigger value="video" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400">
              录像管理
            </TabsTrigger>
            <TabsTrigger value="broadcast" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400">
              播报管理
            </TabsTrigger>
            <TabsTrigger value="music" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400">
              背景音乐
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-8 p-8 bg-gray-800/30 backdrop-blur-sm min-h-[600px]">
            <TabsContent value="basic" className="space-y-8">
              <VideoBasicInfo formData={formData} handleInputChange={handleInputChange} handleDurationChange={handleDurationChange} updateDuration={updateDuration} />
            </TabsContent>

            <TabsContent value="video" className="space-y-8">
              <VideoFileUpload type="thumbnail" label="缩略图" accept="image/*" icon={Image} fileId={formData.thumbnailFileId} uploading={uploadingThumbnail} onFileUpload={handleFileUpload} onClearFile={clearFile} />

              <div className="space-y-6">
                <div className="flex space-x-4 mb-6">
                  <Button type="button" onClick={() => setVideoUploadType('upload')} className={`px-6 py-3 rounded-lg ${videoUploadType === 'upload' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'}`}>
                    上传文件
                  </Button>
                  <Button type="button" onClick={() => setVideoUploadType('url')} className={`px-6 py-3 rounded-lg ${videoUploadType === 'url' ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'}`}>
                    输入地址
                  </Button>
                </div>

                {videoUploadType === 'upload' ? <VideoFileUpload type="video" label="录像文件" accept="video/*" icon={VideoIcon} required={true} fileId={formData.videoFileId} uploading={uploadingVideo} onFileUpload={handleFileUpload} onClearFile={clearFile} /> : <VideoUrlInput videoUrl={formData.videoUrl} onVideoUrlChange={value => handleInputChange('videoUrl', value)} onClearVideoFile={() => handleInputChange('videoFileId', '')} />}
              
                {/* 视频朝向和视频角度字段 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-600">
                  {/* 视频朝向 */}
                  <div className="space-y-3">
                    <Label className="text-white font-medium flex items-center">
                      <RotateCcw className="h-4 w-4 mr-2 text-blue-400" />
                      视频朝向
                    </Label>
                    <Select value={formData.isUpside ? 'true' : 'false'} onValueChange={value => handleInputChange('isUpside', value === 'true')}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white p-3 rounded-lg w-full">
                        <SelectValue placeholder="选择视频朝向" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="true" className="text-white hover:bg-gray-700">
                          <div className="flex items-center">
                            <RotateCcw className="h-4 w-4 mr-2 text-green-400" />
                            正
                          </div>
                        </SelectItem>
                        <SelectItem value="false" className="text-white hover:bg-gray-700">
                          <div className="flex items-center">
                            <RotateCw className="h-4 w-4 mr-2 text-red-400" />
                            反
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-gray-400 text-sm">选择视频播放时的朝向：正为正常播放，反为倒置播放</p>
                  </div>

                  {/* 视频角度 */}
                  <div className="space-y-3">
                    <Label className="text-white font-medium flex items-center">
                      <RotateCw className="h-4 w-4 mr-2 text-purple-400" />
                      视频朝向初始角度 (°)
                    </Label>
                    <Input type="number" value={formData.videoAngle} onChange={e => handleInputChange('videoAngle', e.target.value)} placeholder="0.00" step="0.01" min="-360" max="360" className="bg-gray-700 border-gray-600 text-white p-3 rounded-lg w-full" />
                    <p className="text-gray-400 text-sm">输入视频旋转角度，支持2位小数，范围：-360° 到 360°</p>
                  </div>
                </div>

                {/* 是否播放视频原声字段 */}
                <div className="pt-6 border-t border-gray-600">
                  <div className="space-y-3">
                    <Label className="text-white font-medium flex items-center">
                      <Volume2 className="h-4 w-4 mr-2 text-yellow-400" />
                      是否播放视频原声
                    </Label>
                    <RadioGroup value={formData.isPlayOriginalSound ? 'true' : 'false'} onValueChange={value => handleInputChange('isPlayOriginalSound', value === 'true')} className="flex space-x-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="play-sound-true" className="text-blue-400 border-gray-600" />
                        <Label htmlFor="play-sound-true" className="text-white flex items-center cursor-pointer">
                          <Volume2 className="h-4 w-4 mr-2 text-green-400" />
                          是
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="play-sound-false" className="text-blue-400 border-gray-600" />
                        <Label htmlFor="play-sound-false" className="text-white flex items-center cursor-pointer">
                          <VolumeX className="h-4 w-4 mr-2 text-red-400" />
                          否
                        </Label>
                      </div>
                    </RadioGroup>
                    <p className="text-gray-400 text-sm">选择是否播放视频的原始声音，选择"否"时将静音播放</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="broadcast" className="space-y-8">
              <BroadcastManager broadcasts={formData.broadcasts} onBroadcastsChange={handleBroadcastsChange} $w={$w} />
            </TabsContent>

            <TabsContent value="music" className="space-y-8">
              <BackgroundMusicUploader backgroundMusicFileId={formData.backgroundMusicFileId} onBackgroundMusicFileIdChange={handleBackgroundMusicFileIdChange} $w={$w} />
            </TabsContent>

            <div className="flex justify-end space-x-4 pt-8 border-t border-gray-600">
              <Button type="button" onClick={onCancel} className="px-6 py-2 bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600">
                取消
              </Button>
              <Button type="submit" disabled={loading} className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white">
                <Save className="h-4 w-4 mr-2" />
                {loading ? '保存中...' : video ? '更新录像' : '创建录像'}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>;
}