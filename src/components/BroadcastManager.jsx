// @ts-ignore;
import React, { useState } from 'react';
// @ts-ignore;
import { Button, Input, Label, Textarea, Card, CardContent, Badge, useToast } from '@/components/ui';
// @ts-ignore;
import { Upload, Megaphone, Clock, Plus, Trash2, CheckCircle, Play, Download, Volume2, FileText, Wand2, FileDown, PlayCircle } from 'lucide-react';
import { generateAlignedSrt } from '@/lib/subtitle-alignment';

export function BroadcastManager({
  broadcasts,
  onBroadcastsChange,
  $w
}) {
  const [newBroadcast, setNewBroadcast] = useState({
    triggerTime: '',
    text: '',
    audioFileId: '',
    audioUrl: '',
    subtitleFileId: '',
    subtitleUrl: ''
  });
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingSubtitle, setUploadingSubtitle] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSrt, setGeneratedSrt] = useState('');
  const [synthesizedAudio, setSynthesizedAudio] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [showDownloadButton, setShowDownloadButton] = useState(false);
  const {
    toast
  } = useToast();

  // 安全处理输入变化
  const handleInputChange = (field, value) => {
    setNewBroadcast(prev => ({
      ...prev,
      [field]: value || ''
    }));
  };

  // 添加播报 - 修复：只保存subtitleFileId，不保存subtitleUrl
  const addBroadcast = () => {
    // 在保存时统一校验
    if (!newBroadcast.triggerTime || !newBroadcast.text || !newBroadcast.audioFileId) {
      toast({
        title: '配置不完整',
        description: '请填写触发时间、文字稿并上传音频文件',
        variant: 'destructive'
      });
      return;
    }
    const broadcast = {
      id: Date.now(),
      triggerTime: parseInt(newBroadcast.triggerTime),
      text: newBroadcast.text,
      audioFileId: newBroadcast.audioFileId,
      // 修复：不保存audioUrl临时链接
      subtitleFileId: newBroadcast.subtitleFileId
      // 修复：不保存subtitleUrl临时链接，只保存文件ID
    };
    onBroadcastsChange([...broadcasts, broadcast]);
    setNewBroadcast({
      triggerTime: '',
      text: '',
      audioFileId: '',
      audioUrl: '',
      subtitleFileId: '',
      subtitleUrl: ''
    });
    setSynthesizedAudio(null);
    setAudioBlob(null);
    setShowDownloadButton(false);
    toast({
      title: '播报添加成功',
      description: `第${broadcast.triggerTime}秒播报已添加`
    });
  };

  // 删除播报
  const deleteBroadcast = index => {
    const updatedBroadcasts = broadcasts.filter((_, i) => i !== index);
    onBroadcastsChange(updatedBroadcasts);
    toast({
      title: '播报已删除',
      description: '播报点已从列表中移除'
    });
  };

  // 智能生成功能
  const handleSmartGenerate = async () => {
    if (!newBroadcast.text || newBroadcast.text.trim() === '') {
      toast({
        title: '文字稿为空',
        description: '请先输入要生成的文字稿',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsGenerating(true);
      
      // 清理之前的状态
      setSynthesizedAudio(null);
      setAudioBlob(null);
      setGeneratedSrt('');
      setShowDownloadButton(false);

      // 调用智能生成接口
      const { srt, audioBlob } = await generateAlignedSrt(newBroadcast.text);
      
      // 创建音频URL用于预览
      const audioUrl = URL.createObjectURL(audioBlob);
      
      setAudioBlob(audioBlob);
      setSynthesizedAudio(audioUrl);
      setGeneratedSrt(srt);
      setShowDownloadButton(true);

      // 自动上传音频和字幕文件
      try {
        const tcb = await $w.cloud.getCloudInstance();
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);

        // 1. 上传音频文件
        const audioFileName = `video_broadcasts/generated_audio_${timestamp}_${randomStr}.wav`;
        const audioFile = new File([audioBlob], audioFileName, { type: 'audio/wav' });
        
        const audioUploadResult = await tcb.uploadFile({
          cloudPath: audioFileName,
          filePath: audioFile
        });
        
        const audioTempUrlResult = await tcb.getTempFileURL({
          fileList: [audioUploadResult.fileID]
        });

        // 2. 上传字幕文件
        const srtFileName = `video_broadcasts/generated_subtitle_${timestamp}_${randomStr}.srt`;
        const srtFile = new File([srt], srtFileName, { type: 'text/plain' });
        
        const srtUploadResult = await tcb.uploadFile({
          cloudPath: srtFileName,
          filePath: srtFile
        });

        const srtTempUrlResult = await tcb.getTempFileURL({
          fileList: [srtUploadResult.fileID]
        });

        // 3. 更新状态，自动填充
        setNewBroadcast(prev => ({
          ...prev,
          audioFileId: audioUploadResult.fileID,
          audioUrl: audioTempUrlResult.fileList[0].tempFileURL,
          subtitleFileId: srtUploadResult.fileID,
          subtitleUrl: srtTempUrlResult.fileList[0].tempFileURL
        }));

        toast({
          title: '智能生成成功',
          description: '音频和字幕已自动生成并填充',
          variant: 'default'
        });

      } catch (uploadError) {
        console.error('自动上传失败:', uploadError);
        toast({
          title: '生成成功但上传失败',
          description: '请手动下载文件后上传',
          variant: 'warning'
        });
      }

    } catch (error) {
      console.error('智能生成失败:', error);
      toast({
        title: '生成失败',
        description: error.message || '请重试',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 预览音频
  const handlePreviewAudio = () => {
    if (synthesizedAudio) {
      const audio = new Audio(synthesizedAudio);
      audio.play().catch(e => {
        toast({
          title: '播放失败',
          description: '无法播放音频',
          variant: 'destructive'
        });
      });
    }
  };

  // 下载 SRT
  const handleDownloadSrt = () => {
    if (!generatedSrt) return;
    try {
      const blob = new Blob([generatedSrt], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `subtitle_${newBroadcast.triggerTime || 'generated'}_${Date.now()}.srt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: '下载成功',
        description: 'SRT字幕文件已下载',
        variant: 'default'
      });
    } catch (error) {
      console.error('SRT下载失败:', error);
      toast({
        title: '下载失败',
        description: '文件下载过程中出现错误',
        variant: 'destructive'
      });
    }
  };

  // 下载合成的音频文件
  const handleDownloadAudio = () => {
    if (!audioBlob) return;
    try {
      const link = document.createElement('a');
      link.href = synthesizedAudio;
      link.download = `播报音频_${newBroadcast.triggerTime || '未命名'}_${Date.now()}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: '下载成功',
        description: '音频文件已开始下载，请上传到云存储',
        variant: 'default'
      });
    } catch (error) {
      console.error('下载失败:', error);
      toast({
        title: '下载失败',
        description: '文件下载过程中出现错误',
        variant: 'destructive'
      });
    }
  };

  // 检查文件是否为音频文件（忽略大小写，支持WEBM）
  const isAudioFile = file => {
    if (!file) return false;

    // 获取文件扩展名（小写）
    const extension = file.name.toLowerCase().split('.').pop();

    // 支持的音频文件扩展名
    const audioExtensions = ['webm', 'mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'mpeg'];

    // 检查文件类型或扩展名
    const fileType = file.type.toLowerCase();
    const isAudioType = fileType.startsWith('audio/');
    const isAudioExtension = audioExtensions.includes(extension);
    return isAudioType || isAudioExtension;
  };

  // 检查文件是否为字幕文件
  const isSubtitleFile = file => {
    if (!file) return false;

    // 获取文件扩展名（小写）
    const extension = file.name.toLowerCase().split('.').pop();

    // 支持的字幕文件扩展名
    const subtitleExtensions = ['srt', 'vtt', 'ass', 'ssa', 'txt', 'sub'];

    // 检查文件类型或扩展名
    const fileType = file.type.toLowerCase();
    const isTextType = fileType.startsWith('text/') || fileType.includes('subtitle');
    const isSubtitleExtension = subtitleExtensions.includes(extension);
    return isTextType || isSubtitleExtension;
  };

  // 上传音频文件到云存储（统一处理合成音频和本地文件）
  const handleAudioUpload = async event => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 使用新的音频文件校验逻辑（忽略大小写，支持WEBM）
    if (!isAudioFile(file)) {
      toast({
        title: '文件类型错误',
        description: '请上传音频文件（支持webm、mp3、wav、ogg、m4a等格式）',
        variant: 'destructive'
      });
      return;
    }
    try {
      setUploadingAudio(true);
      const tcb = await $w.cloud.getCloudInstance();
      // 生成文件名
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'webm';
      const fileName = `video_broadcasts/audio_${timestamp}_${Math.random().toString(36).substring(2, 8)}.${fileExtension}`;
      // 上传到云存储
      const uploadResult = await tcb.uploadFile({
        cloudPath: fileName,
        filePath: file
      });
      // 获取文件ID和临时访问URL
      const fileId = uploadResult.fileID;
      const tempUrlResult = await tcb.getTempFileURL({
        fileList: [fileId]
      });
      // 更新播报配置 - 只保存文件ID，临时URL仅用于预览
      setNewBroadcast(prev => ({
        ...prev,
        audioFileId: fileId,
        audioUrl: tempUrlResult.fileList[0].tempFileURL // 仅用于预览，不保存到数据库
      }));
      // 重置合成状态
      setSynthesizedAudio(null);
      setAudioBlob(null);
      setShowDownloadButton(false);
      toast({
        title: '音频文件上传成功',
        description: `文件已上传到云存储，ID: ${fileId.substring(0, 12)}...`,
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: '文件上传失败',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUploadingAudio(false);
      // 清空文件输入
      event.target.value = '';
    }
  };

  // 上传字幕文件到云存储
  const handleSubtitleUpload = async event => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 校验字幕文件类型
    if (!isSubtitleFile(file)) {
      toast({
        title: '文件类型错误',
        description: '请上传字幕文件（支持srt、vtt、ass、ssa、txt等格式）',
        variant: 'destructive'
      });
      return;
    }
    try {
      setUploadingSubtitle(true);
      const tcb = await $w.cloud.getCloudInstance();
      // 生成文件名
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'srt';
      const fileName = `video_broadcasts/subtitle_${timestamp}_${Math.random().toString(36).substring(2, 8)}.${fileExtension}`;
      // 上传到云存储
      const uploadResult = await tcb.uploadFile({
        cloudPath: fileName,
        filePath: file
      });
      // 获取文件ID和临时访问URL
      const fileId = uploadResult.fileID;
      const tempUrlResult = await tcb.getTempFileURL({
        fileList: [fileId]
      });
      // 更新播报配置 - 只保存文件ID，临时URL仅用于预览
      setNewBroadcast(prev => ({
        ...prev,
        subtitleFileId: fileId,
        subtitleUrl: tempUrlResult.fileList[0].tempFileURL // 仅用于预览，不保存到数据库
      }));
      toast({
        title: '字幕文件上传成功',
        description: `文件已上传到云存储，ID: ${fileId.substring(0, 12)}...`,
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: '文件上传失败',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUploadingSubtitle(false);
      // 清空文件输入
      event.target.value = '';
    }
  };

  // 移除字幕文件
  const handleRemoveSubtitle = () => {
    setNewBroadcast(prev => ({
      ...prev,
      subtitleFileId: '',
      subtitleUrl: ''
    }));
    toast({
      title: '字幕文件已移除',
      description: '字幕文件已从配置中移除',
      variant: 'default'
    });
  };
  return <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/20 rounded-full flex items-center justify-center">
          <Megaphone className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">播报管理</h3>
          <p className="text-slate-500 dark:text-slate-400">配置录像中的语音播报点</p>
        </div>
      </div>

      {/* 左右分栏布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左侧：添加配置输入区 */}
        <div className="space-y-6">
          <Card className="bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <h4 className="text-slate-900 dark:text-slate-50 font-medium text-lg mb-4">添加播报配置</h4>
              
              {/* 触发时间 */}
              <div className="space-y-3 mb-4">
                <Label className="text-slate-900 dark:text-slate-50 font-medium">触发时间（秒）*</Label>
                <Input type="number" value={newBroadcast.triggerTime || ''} onChange={e => handleInputChange('triggerTime', e.target.value)} placeholder="例如：10" className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-50 p-3 rounded-lg w-full" min="0" />
              </div>

              {/* 文字稿 */}
              <div className="space-y-3 mb-4">
                <Label className="text-slate-900 dark:text-slate-50 font-medium">文字稿 *</Label>
                <Textarea value={newBroadcast.text || ''} onChange={e => handleInputChange('text', e.target.value)} placeholder="请输入播报文字内容" className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-50 p-3 rounded-lg h-24 w-full" rows={4} />
              </div>

              {/* 智能生成区域 */}
              <div className="space-y-4 mb-4">
                <Label className="text-slate-900 dark:text-slate-50 font-medium">智能生成</Label>
                
                {/* 智能生成按钮 */}
                <Button 
                  type="button" 
                  onClick={handleSmartGenerate} 
                  disabled={isGenerating || !newBroadcast.text || !!newBroadcast.audioFileId} 
                  className={`w-full px-4 py-3 font-medium rounded-lg text-white ${
                    !!newBroadcast.audioFileId 
                      ? 'bg-slate-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      生成中...
                    </>
                  ) : !!newBroadcast.audioFileId ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      已检测到音频文件 (智能生成已禁用)
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      智能生成 (音频 + 字幕)
                    </>
                  )}
                </Button>

                {/* 生成后的操作按钮组 */}
                {showDownloadButton && (
                  <div className="grid grid-cols-3 gap-2">
                    {/* 预览音频 */}
                    <Button 
                      type="button" 
                      onClick={handlePreviewAudio} 
                      variant="outline"
                      className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-900/20"
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      预览音频
                    </Button>

                    {/* 下载音频 */}
                    <Button 
                      type="button" 
                      onClick={handleDownloadAudio} 
                      variant="outline"
                      className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/20"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      下载音频
                    </Button>

                    {/* 下载SRT */}
                    <Button 
                      type="button" 
                      onClick={handleDownloadSrt} 
                      variant="outline"
                      className="w-full border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-900/20"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      下载SRT
                    </Button>
                  </div>
                )}

                <p className="text-slate-500 dark:text-slate-400 text-sm text-center">
                  生成后请下载音频和字幕文件，并上传到云存储以完成配置
                </p>
              </div>

              {/* 字幕文件上传区域（新增） */}
              <div className="space-y-3 mb-4">
                <Label className="text-slate-900 dark:text-slate-50 font-medium">字幕文件（可选）</Label>
                
                {/* 字幕文件预览 */}
                {newBroadcast.subtitleFileId && <div className="relative">
                    <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-200 dark:border-blue-500/20">
                      <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <div className="flex-1">
                        <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">字幕文件已准备</span>
                        <p className="text-blue-500/70 dark:text-blue-400/70 text-xs mt-1">文件ID: {newBroadcast.subtitleFileId.substring(0, 20)}...</p>
                      </div>
                      <Button type="button" onClick={handleRemoveSubtitle} className="px-2 py-1 border border-red-200 dark:border-red-400 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 bg-transparent">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>}

                {/* 字幕文件上传控件 */}
                <div className="relative">
                  <input type="file" accept=".srt,.vtt,.ass,.ssa,.txt,.sub" onChange={handleSubtitleUpload} className="hidden" id="subtitle-file-upload" disabled={uploadingSubtitle} />
                  <label htmlFor="subtitle-file-upload" className={`flex flex-col items-center justify-center w-full h-16 border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer group ${uploadingSubtitle ? 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed' : 'border-purple-300 dark:border-purple-400/50 bg-purple-50 dark:bg-purple-900/10 hover:bg-purple-100 dark:hover:bg-purple-900/20'}`}>
                    <div className="flex flex-col items-center justify-center">
                      <Upload className={`w-5 h-5 mb-1 transition-colors ${uploadingSubtitle ? 'text-slate-400 dark:text-slate-500' : 'text-purple-500 dark:text-purple-400 group-hover:text-purple-600 dark:group-hover:text-purple-300'}`} />
                      <span className={`font-medium text-sm ${uploadingSubtitle ? 'text-slate-500 dark:text-slate-400' : 'text-purple-600 dark:text-purple-300'}`}>
                        {uploadingSubtitle ? '上传中...' : '选择字幕文件上传'}
                      </span>
                      <span className={`text-xs mt-1 ${uploadingSubtitle ? 'text-slate-400 dark:text-slate-500' : 'text-purple-500/70 dark:text-purple-400/70'}`}>
                        支持srt、vtt、ass、ssa、txt等格式
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* 音频文件上传区域 */}
              <div className="space-y-3">
                <Label className="text-slate-900 dark:text-slate-50 font-medium">上传音频文件 *</Label>
                
                {/* 统一上传按钮 */}
                <div className="relative">
                  <input type="file" accept="audio/*,.webm,.mp3,.wav,.ogg,.m4a,.aac,.flac,.mpeg" onChange={handleAudioUpload} className="hidden" id="audio-file-upload" disabled={uploadingAudio} />
                  <label htmlFor="audio-file-upload" className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer group ${uploadingAudio ? 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed' : 'border-blue-300 dark:border-blue-400/50 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20'}`}>
                    <div className="flex flex-col items-center justify-center">
                      <Upload className={`w-6 h-6 mb-1 transition-colors ${uploadingAudio ? 'text-slate-400 dark:text-slate-500' : 'text-blue-500 dark:text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300'}`} />
                      <span className={`font-medium text-sm ${uploadingAudio ? 'text-slate-500 dark:text-slate-400' : 'text-blue-600 dark:text-blue-300'}`}>
                        {uploadingAudio ? '上传中...' : '选择音频文件上传'}
                      </span>
                      <span className={`text-xs mt-1 ${uploadingAudio ? 'text-slate-400 dark:text-slate-500' : 'text-blue-500/70 dark:text-blue-400/70'}`}>
                        支持webm、mp3、wav、ogg、m4a等格式
                      </span>
                    </div>
                  </label>
                </div>

                {/* 音频文件状态显示 */}
                {newBroadcast.audioFileId && <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-500/10 rounded-lg border border-green-200 dark:border-green-500/20">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <div>
                      <span className="text-green-600 dark:text-green-400 text-sm font-medium">音频文件已准备</span>
                      <p className="text-green-500/70 dark:text-green-400/70 text-xs mt-1">文件ID: {newBroadcast.audioFileId.substring(0, 20)}...</p>
                    </div>
                  </div>}
              </div>

              {/* 添加按钮 */}
              <Button type="button" onClick={addBroadcast} className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-lg mt-4">
                <Plus className="h-4 w-4 mr-2" />
                添加播报
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：已配置播报列表区 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-slate-900 dark:text-slate-50 font-medium text-lg">已配置播报</h4>
            <Badge className="bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full">
              {broadcasts.length}个播报点
            </Badge>
          </div>

          {broadcasts.length === 0 ? <Card className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-600">
              <CardContent className="p-6 text-center">
                <Megaphone className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400">暂无播报配置</p>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">在左侧添加第一个播报点</p>
              </CardContent>
            </Card> : <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {broadcasts.map((broadcast, index) => <Card key={broadcast.id} className="bg-white dark:bg-slate-800/30 border border-slate-200 dark:border-slate-600 hover:border-blue-500/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Clock className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                          <span className="text-slate-900 dark:text-slate-50 font-medium">第 {broadcast.triggerTime} 秒</span>
                          <Button type="button" className="h-6 px-2 bg-transparent border-0 hover:bg-blue-50 dark:hover:bg-blue-500/10">
                            <Play className="h-3 w-3 text-slate-700 dark:text-slate-300" />
                          </Button>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-sm bg-slate-100 dark:bg-slate-900/20 rounded p-3 mb-2">
                          {broadcast.text}
                        </p>
                        {broadcast.audioFileId && <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 text-xs mb-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>音频文件已关联 (ID: {broadcast.audioFileId.substring(0, 12)}...)</span>
                          </div>}
                        {broadcast.subtitleFileId && <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400 text-xs">
                            <FileText className="h-3 w-3" />
                            <span>字幕文件已关联 (ID: {broadcast.subtitleFileId.substring(0, 12)}...)</span>
                          </div>}
                      </div>
                      <Button type="button" onClick={() => deleteBroadcast(index)} className="px-2 py-1 border border-red-200 dark:border-red-400 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 bg-transparent ml-2">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>)}
            </div>}
        </div>
      </div>
    </div>;
}
