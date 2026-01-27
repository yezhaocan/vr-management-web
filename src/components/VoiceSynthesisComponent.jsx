import React, { useState, useRef, useEffect } from 'react';
// @ts-ignore;
import { Button, useToast, Progress, Input, Label } from '@/components/ui';
// @ts-ignore;
import { Volume2, Upload, Play, Square, Loader2, FileAudio, FileText, X, Copy, ExternalLink } from 'lucide-react';
// @ts-ignore;
import { generateAlignedSrt } from '../lib/subtitle-alignment';

export function VoiceSynthesisComponent({
  text,
  onSynthesisComplete,
  onVoiceConfigChange,
  $w,
  waypointName,
  currentAudioFileId = null,
  currentSubtitleFileId = null,
  tempFileStorage = new Map() // 新增：临时文件存储
}) {
  // 音频相关状态
  const [audioState, setAudioState] = useState({
    fileId: currentAudioFileId,
    synthesizedUrl: null,
    fileSize: 0,
    isPlaying: false
  });

  // 字幕相关状态
  const [subtitleState, setSubtitleState] = useState({
    fileId: currentSubtitleFileId,
    content: null,
    fileSize: 0
  });

  // 操作状态
  const [operationState, setOperationState] = useState({
    isSynthesizing: false,
    uploadProgress: 0,
    uploadingSubtitle: false
  }); 

  const {
    toast
  } = useToast();
  const audioRef = useRef(null);

  // 监听 props 变化，同步内部状态变更（合并所有相关的状态更新）
  useEffect(() => {
    // 更新文件ID状态
    setAudioState(prev => ({ ...prev, fileId: currentAudioFileId }));
    setSubtitleState(prev => ({ ...prev, fileId: currentSubtitleFileId }));
    
    // 处理临时生成的音频文件
    if (currentAudioFileId && currentAudioFileId.startsWith('temp_')) {
      const tempAudioData = tempFileStorage.get(currentAudioFileId);
      
      if (tempAudioData && tempAudioData.blob) {
        // 恢复临时生成的音频文件显示
        const audioUrl = URL.createObjectURL(tempAudioData.blob);
        setAudioState(prev => {
          // 清理之前的 URL（避免内存泄漏）
          if (prev.synthesizedUrl && prev.synthesizedUrl.startsWith('blob:') && prev.synthesizedUrl !== audioUrl) {
            URL.revokeObjectURL(prev.synthesizedUrl);
          }
          
          return {
            ...prev,
            synthesizedUrl: audioUrl,
            fileSize: tempAudioData.blob.size
          };
        });
        
        // 确保音频元素正确设置
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.src = audioUrl;
            audioRef.current.load(); // 强制重新加载音频
          }
        }, 0);
      } else {
        console.warn('Temporary audio data not found for:', currentAudioFileId);
      }
    } else if (!currentAudioFileId) {
      // 清除音频相关状态
      setAudioState(prev => {
        // 清理之前的 URL（避免内存泄漏）
        if (prev.synthesizedUrl && prev.synthesizedUrl.startsWith('blob:')) {
          URL.revokeObjectURL(prev.synthesizedUrl);
        }
        
        return {
          ...prev,
          synthesizedUrl: null,
          fileSize: 0,
          isPlaying: false
        };
      });
      
      if (audioRef.current) {
        audioRef.current.src = '';
      }
    }
    
    // 处理临时生成的字幕文件
    if (currentSubtitleFileId && currentSubtitleFileId.startsWith('temp_')) {
      const tempSubtitleData = tempFileStorage.get(currentSubtitleFileId);
      
      if (tempSubtitleData && tempSubtitleData.blob) {
        // 恢复临时生成的字幕文件显示
        setSubtitleState(prev => ({
          ...prev,
          fileSize: tempSubtitleData.blob.size
        }));
        tempSubtitleData.blob.text().then(srtText => {
          setSubtitleState(prev => ({ ...prev, content: srtText }));
        }).catch(error => {
          console.error('Failed to read subtitle blob:', error);
        });
      } else {
        console.warn('Temporary subtitle data not found for:', currentSubtitleFileId);
      }
    } else if (!currentSubtitleFileId) {
      // 清除字幕相关状态（当没有字幕文件时）
      setSubtitleState(prev => ({
        ...prev,
        content: null,
        fileSize: 0
      }));
    }
  }, [currentAudioFileId, currentSubtitleFileId, tempFileStorage]);

  // 当航点名称变化时，停止播放（表示切换了航点）
  useEffect(() => {
    if (audioState.isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setAudioState(prev => ({ ...prev, isPlaying: false }));
    }
  }, [waypointName]);

  // 组件卸载时清理 Blob URL
  useEffect(() => {
    return () => {
      // 清理当前的 Blob URL
      if (audioState.synthesizedUrl && audioState.synthesizedUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioState.synthesizedUrl);
      }
    };
  }, []); // 空依赖数组，只在组件卸载时执行

  // 播放音频
  const playAudio = () => {
    if (audioRef.current && audioState.synthesizedUrl) {
      // 确保音频源正确设置
      if (audioRef.current.src !== audioState.synthesizedUrl) {
        audioRef.current.src = audioState.synthesizedUrl;
        audioRef.current.load();
      }
      
      audioRef.current.play().then(() => {
        setAudioState(prev => ({ ...prev, isPlaying: true }));
        audioRef.current.onended = () => setAudioState(prev => ({ ...prev, isPlaying: false }));
      }).catch(error => {
        console.error('播放音频失败:', error);
        toast({
          title: '播放失败',
          description: '音频播放出现问题，请重新生成',
          variant: 'destructive'
        });
      });
    }
  };

  // 停止播放音频
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setAudioState(prev => ({ ...prev, isPlaying: false }));
    }
  };

  // 使用后端 API 进行语音合成和 SRT 生成（仅生成，不上传）
  const handleSpeechSynthesis = async () => {
    if (!text || text.trim() === '') {
      toast({
        title: '提示',
        description: '请先输入文字稿内容',
        variant: 'destructive'
      });
      return;
    }

    try {
      setOperationState(prev => ({ ...prev, isSynthesizing: true, uploadProgress: 30 }));

      // 停止当前播放
      stopAudio();

      // 调用后端接口生成语音和 SRT
      const { srt, audioBlob } = await generateAlignedSrt(text);
      setOperationState(prev => ({ ...prev, uploadProgress: 100 }));

      // 创建音频URL并设置状态
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioState(prev => ({
        ...prev,
        synthesizedUrl: audioUrl,
        fileSize: audioBlob.size
      }));
      setSubtitleState(prev => ({ ...prev, content: srt }));

      // 创建音频元素用于播放 - 确保正确设置
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.load(); // 强制重新加载
      }

      // 生成临时标识符（用于保存时识别）
      const timestamp = Date.now();
      const tempAudioId = `temp_audio_${timestamp}`;
      const tempSubtitleId = `temp_subtitle_${timestamp}`;
      
      // 批量更新状态
      setAudioState(prev => ({ ...prev, fileId: tempAudioId }));
      setSubtitleState(prev => ({ ...prev, fileId: tempSubtitleId }));

      // 创建字幕 Blob
      const srtBlob = new Blob([srt], { type: 'text/plain' });
      setSubtitleState(prev => ({ ...prev, fileSize: srtBlob.size }));

      // 回调通知父组件（传递 Blob 数据而非文件 ID）
      if (onSynthesisComplete) {
        onSynthesisComplete(tempAudioId, audioUrl, tempSubtitleId, {
          audioBlob: audioBlob,
          subtitleBlob: srtBlob,
          waypointName: waypointName
        });
      }

      toast({
        title: '合成成功',
        description: '语音和字幕已生成，将在保存航线时上传到云存储',
        variant: 'default'
      });

    } catch (error) {
      console.error('语音合成失败:', error);
      toast({
        title: '语音合成失败',
        description: error.message || '请检查网络连接',
        variant: 'destructive'
      });
    } finally {
      setOperationState(prev => ({ ...prev, isSynthesizing: false, uploadProgress: 0 }));
    }
  };

  // 通用文件上传函数
  const uploadFileToCloud = async (fileBlob, cloudPath) => {
    try {
      const tcb = await $w.cloud.getCloudInstance();
      const uploadResult = await tcb.uploadFile({
        cloudPath: cloudPath,
        filePath: fileBlob
      });
      return uploadResult.fileID;
    } catch (error) {
      console.error(`上传文件失败 [${cloudPath}]:`, error);
      throw error;
    }
  };

  // 下载合成的 SRT 字幕文件 (不再下载音频)
  const handleDownloadSrt = () => {
    if (!subtitleState.content) return;
    try {
      const link = document.createElement('a');
      const blob = new Blob([subtitleState.content], { type: 'text/plain' });
      link.href = URL.createObjectURL(blob);
      link.download = `语音讲解字幕_${waypointName || 'subtitle'}_${Date.now()}.srt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('下载失败:', error);
    }
  };

  // 手动上传音频文件
  const handleManualUpload = async event => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ['audio/webm', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg'];
    const fileType = file.type.toLowerCase();
    if (!allowedTypes.includes(fileType)) {
      toast({
        title: '文件类型错误',
        description: '请上传支持的音频文件格式',
        variant: 'destructive'
      });
      return;
    }
    try {
      setOperationState(prev => ({ ...prev, isSynthesizing: true }));
      
      // 直接上传到云存储（手动上传立即上传）
      const newAudioFileId = await uploadFileToCloud(file, `audio/${waypointName || 'manual'}_${Date.now()}.${file.name.split('.').pop()}`);
      
      // 获取临时链接
      const tcb = await $w.cloud.getCloudInstance();
      const tempUrlResult = await tcb.getTempFileURL({
        fileList: [newAudioFileId]
      });
      
      setAudioState(prev => ({ ...prev, fileId: newAudioFileId }));
      
      // 如果之前有合成的音频，清除它
      setAudioState(prev => ({ ...prev, synthesizedUrl: null }));
      setSubtitleState(prev => ({ ...prev, content: null }));
      
      if (onSynthesisComplete) {
        onSynthesisComplete(newAudioFileId, tempUrlResult.fileList[0].tempFileURL, subtitleState.fileId); // 保持现有字幕
      }
      
      toast({
        title: '上传成功',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: '文件上传失败',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setOperationState(prev => ({ ...prev, isSynthesizing: false }));
      event.target.value = '';
    }
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
      setOperationState(prev => ({ ...prev, uploadingSubtitle: true }));
      
      // 直接上传到云存储（手动上传立即上传）
      const tcb = await $w.cloud.getCloudInstance();
      // 生成文件名
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'srt';
      const fileName = `subtitle/subtitle_${timestamp}_${Math.random().toString(36).substring(2, 8)}.${fileExtension}`;
      // 上传到云存储
      const uploadResult = await tcb.uploadFile({
        cloudPath: fileName,
        filePath: file
      });
      // 获取文件ID
      const newSubtitleFileId = uploadResult.fileID;
      // 更新状态
      setSubtitleState(prev => ({
        ...prev,
        fileId: newSubtitleFileId,
        fileSize: file.size
      }));
      
      // 更新航点配置
      if (onVoiceConfigChange) {
        onVoiceConfigChange('subtitleFileId', newSubtitleFileId);
      }
      
      toast({
        title: '字幕文件上传成功',
        description: `文件已上传到云存储，ID: ${newSubtitleFileId.substring(0, 12)}...`,
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: '文件上传失败',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setOperationState(prev => ({ ...prev, uploadingSubtitle: false }));
      // 清空文件输入
      event.target.value = '';
    }
  };

  // 复制文件ID到剪贴板
  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: '复制成功',
        description: `${type}已复制到剪贴板`,
        variant: 'default'
      });
    } catch (error) {
      console.error('复制失败:', error);
      toast({
        title: '复制失败',
        description: '无法复制到剪贴板',
        variant: 'destructive'
      });
    }
  };

  // 获取文件显示名称
  const getFileDisplayName = (fileId) => {
    if (!fileId) return '';
    if (fileId.startsWith('temp_')) {
      return '临时文件 (未保存)';
    }
    // 提取文件名部分
    const parts = fileId.split('/');
    return parts[parts.length - 1] || fileId;
  };

  // 获取文件链接（如果是云存储文件）
  const getFileLink = (fileId) => {
    if (!fileId || fileId.startsWith('temp_')) return null;
    // 构建云存储文件链接
    return `https://console.cloud.tencent.com/tcb/storage/file`;
  };
  const handleRemoveAudio = () => {
    // 清理 Blob URL
    if (audioState.synthesizedUrl && audioState.synthesizedUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioState.synthesizedUrl);
    }
    
    // 重置本地状态
    setAudioState({
      fileId: '',
      synthesizedUrl: null,
      fileSize: 0,
      isPlaying: false
    });
    setSubtitleState(prev => ({ ...prev, content: null }));
    
    // 清理音频元素
    if (audioRef.current) {
      audioRef.current.src = '';
      audioRef.current.load();
    }
    
    // 更新父组件状态
    if (onVoiceConfigChange) {
      onVoiceConfigChange('audioFileId', '');
      onVoiceConfigChange('audioUrl', '');
    }
    
    toast({
      title: '音频文件已移除',
      description: '音频文件已从配置中移除',
      variant: 'default'
    });
  };

  // 移除字幕文件
  const handleRemoveSubtitle = () => {
    setSubtitleState({
      fileId: '',
      content: null,
      fileSize: 0
    });
    
    if (onVoiceConfigChange) {
      onVoiceConfigChange('subtitleFileId', '');
    }
    
    toast({
      title: '字幕文件已移除',
      description: '字幕文件已从配置中移除',
      variant: 'default'
    });
  };

  return <div className="space-y-4">
      {/* 隐藏的音频元素用于播放 */}
      <audio ref={audioRef} className="hidden" />
      
      {/* 语音合成和播放控制区域 */}
      <div className="grid grid-cols-4 gap-3">
        {/* 智能生成按钮 */}
        <div className="col-span-1">
          <Button 
            onClick={handleSpeechSynthesis} 
            disabled={operationState.isSynthesizing || !text} 
            className="w-full text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          >
            {operationState.isSynthesizing ? <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {operationState.uploadProgress > 40 ? '上传中' : '生成中'}
              </> : <>
                <Volume2 className="w-4 h-4 mr-2" />
                智能生成
              </>}
          </Button>
        </div>
        
        {/* 播放/停止按钮 (仅对智能生成的音频有效) */}
        {audioState.synthesizedUrl && <Button onClick={audioState.isPlaying ? stopAudio : playAudio} className={`col-span-1 ${audioState.isPlaying ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'} text-white`}>
            {audioState.isPlaying ? <>
                <Square className="w-4 h-4 mr-2" />
                停止播放
              </> : <>
                <Play className="w-4 h-4 mr-2" />
                播放语音
              </>}
          </Button>}
        
        {/* 下载字幕按钮 (仅智能生成模式下显示) */}
        {subtitleState.content && (
          <Button onClick={handleDownloadSrt} className="col-span-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white">
            <FileText className="w-4 h-4 mr-2" />
            下载SRT字幕
          </Button>
        )}
        
        {/* 占位空间 */}
        {!audioState.synthesizedUrl && <div className="col-span-2"></div>}
      </div>

      {/* 进度条 */}
      {operationState.isSynthesizing && (
        <div className="space-y-1">
          <Progress value={operationState.uploadProgress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {operationState.uploadProgress < 40 ? '正在生成语音和字幕...' : '正在上传文件到云存储...'}
          </p>
        </div>
      )}

      {/* 音频文件管理区域 */}
      <div className="space-y-4">
        {/* 音频文件预览 */}
        {audioState.fileId && (
          <div className="relative">
            <div className="flex items-center space-x-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20 transition-all hover:shadow-sm">
              <div className="p-2 bg-green-500/10 rounded-full">
                <FileAudio className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-foreground text-sm font-medium block">
                  音频文件已关联
                </span>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-muted-foreground text-xs truncate">
                    {getFileDisplayName(audioState.fileId)}
                  </span>
                  {audioState.fileSize > 0 && (
                    <span className="text-muted-foreground text-xs">
                      • {(audioState.fileSize / 1024).toFixed(2)} KB
                    </span>
                  )}
                </div>
                {/* 文件ID和操作按钮 */}
                <div className="flex items-center space-x-2 mt-2">
                  <div className="flex items-center space-x-1 bg-muted/50 rounded px-2 py-1 min-w-0 flex-1">
                    <span className="text-xs text-muted-foreground font-mono truncate">
                      ID: {audioState.fileId}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(audioState.fileId, '音频文件ID')}
                    className="h-6 px-2 text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  {getFileLink(audioState.fileId) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(getFileLink(audioState.fileId), '_blank')}
                      className="h-6 px-2 text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleRemoveAudio} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* 手动上传音频文件 - 仅在没有音频文件时显示 */}
        {!audioState.fileId && (
          <div className="relative">
            <input type="file" accept="audio/*,.webm,.mp3,.wav,.ogg,.m4a" onChange={handleManualUpload} className="hidden" id="manual-audio-upload" disabled={operationState.isSynthesizing} />
            <label htmlFor="manual-audio-upload" className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer group ${operationState.isSynthesizing ? 'border-gray-400/50 bg-gray-900/10 cursor-not-allowed' : 'border-blue-400/50 bg-blue-900/10 hover:bg-blue-900/20'}`}>
              <div className="flex flex-col items-center justify-center">
                <Upload className={`w-6 h-6 mb-1 transition-colors ${operationState.isSynthesizing ? 'text-gray-400' : 'text-blue-400 group-hover:text-blue-300'}`} />
                <span className={`font-medium text-sm ${operationState.isSynthesizing ? 'text-gray-400' : 'text-blue-300'}`}>
                  {operationState.isSynthesizing ? '处理中...' : '手动上传音频文件'}
                </span>
                <div className="flex items-center mt-1 space-x-2">
                   <span className={`text-xs ${operationState.isSynthesizing ? 'text-gray-400/70' : 'text-blue-400/70'}`}>
                    支持webm、mp3、wav等格式
                  </span>
                </div>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* 字幕文件管理区域 */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-foreground text-sm font-medium">字幕文件（可选）</span>
        </div>
        
        {/* 字幕文件预览 */}
        {subtitleState.fileId && (
          <div className="relative">
            <div className="flex items-center space-x-3 p-3 bg-primary/5 rounded-lg border border-primary/20 transition-all hover:shadow-sm">
              <div className="p-2 bg-primary/10 rounded-full">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-foreground text-sm font-medium block">
                  字幕文件已关联
                </span>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-muted-foreground text-xs truncate">
                    {getFileDisplayName(subtitleState.fileId)}
                  </span>
                  {subtitleState.fileSize > 0 && (
                    <span className="text-muted-foreground text-xs">
                      • {(subtitleState.fileSize / 1024).toFixed(2)} KB
                    </span>
                  )}
                </div>
                {/* 文件ID和操作按钮 */}
                <div className="flex items-center space-x-2 mt-2">
                  <div className="flex items-center space-x-1 bg-muted/50 rounded px-2 py-1 min-w-0 flex-1">
                    <span className="text-xs text-muted-foreground font-mono truncate">
                      ID: {subtitleState.fileId}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(subtitleState.fileId, '字幕文件ID')}
                    className="h-6 px-2 text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  {getFileLink(subtitleState.fileId) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(getFileLink(subtitleState.fileId), '_blank')}
                      className="h-6 px-2 text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleRemoveSubtitle} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* 字幕文件上传控件 - 仅在没有字幕文件时显示 */}
        {!subtitleState.fileId && (
          <div className="relative group">
            <input type="file" accept=".srt,.vtt,.ass,.ssa,.txt,.sub" onChange={handleSubtitleUpload} className="hidden" id="subtitle-file-upload" disabled={operationState.uploadingSubtitle} />
            <label htmlFor="subtitle-file-upload" className={`flex flex-col items-center justify-center w-full h-20 border border-dashed rounded-lg transition-all duration-300 cursor-pointer ${operationState.uploadingSubtitle ? 'border-border bg-muted/50 cursor-not-allowed' : 'border-border bg-card hover:border-primary/50 hover:bg-accent/5 hover:shadow-sm'}`}>
              <div className="flex flex-col items-center justify-center text-center p-4">
                <Upload className={`w-5 h-5 mb-2 transition-transform duration-300 ${operationState.uploadingSubtitle ? 'text-muted-foreground' : 'text-primary group-hover:scale-110'}`} />
                <span className={`font-medium text-sm ${operationState.uploadingSubtitle ? 'text-muted-foreground' : 'text-foreground'}`}>
                  {operationState.uploadingSubtitle ? '上传中...' : '点击或拖拽上传字幕文件'}
                </span>
                <div className="flex items-center mt-1 space-x-2">
                  <span className="text-xs text-muted-foreground">
                    支持 srt, vtt, ass, ssa, txt
                  </span>
                </div>
              </div>
            </label>
          </div>
        )}
      </div>
    </div>;
}