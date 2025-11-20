// @ts-ignore;
import React, { useState } from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Button, useToast } from '@/components/ui';
// @ts-ignore;
import { Upload, FileText, Trash2, Volume2, Download, Play, X } from 'lucide-react';

export function VoiceSynthesisComponent({
  text,
  voice,
  onSynthesisComplete,
  $w,
  waypointName,
  currentFileId
}) {
  const [synthesizedAudio, setSynthesizedAudio] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [showDownloadButton, setShowDownloadButton] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingSubtitle, setUploadingSubtitle] = useState(false);
  const [subtitleFile, setSubtitleFile] = useState(null);
  const [subtitleFileId, setSubtitleFileId] = useState(currentFileId || '');
  const {
    toast
  } = useToast();

  // 语音合成功能
  const handleVoiceSynthesis = async () => {
    if (!text || text.trim() === '') {
      toast({
        title: '文字稿为空',
        description: '请先输入要合成的文字稿',
        variant: 'destructive'
      });
      return;
    }
    if (!window.SpeechSynthesisUtterance || !window.speechSynthesis) {
      toast({
        title: '浏览器不支持',
        description: '您的浏览器不支持语音合成功能',
        variant: 'destructive'
      });
      return;
    }
    if (!window.MediaRecorder) {
      toast({
        title: '浏览器不支持',
        description: '您的浏览器不支持音频录制功能',
        variant: 'destructive'
      });
      return;
    }
    try {
      setUploadingAudio(true);
      // 停止当前播放
      if (synthesizedAudio) {
        setSynthesizedAudio(null);
        setAudioBlob(null);
      }
      // 获取媒体流权限
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      // 创建MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      const audioChunks = [];
      mediaRecorder.ondataavailable = event => {
        if (event.data && event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      mediaRecorder.onstop = async () => {
        try {
          if (audioChunks.length === 0) {
            throw new Error('录制数据为空');
          }
          const audioBlob = new Blob(audioChunks, {
            type: 'audio/webm;codecs=opus'
          });
          // 创建音频URL
          const audioUrl = URL.createObjectURL(audioBlob);
          setAudioBlob(audioBlob);
          setSynthesizedAudio(audioUrl);
          setShowDownloadButton(true);
          toast({
            title: '语音合成成功',
            description: '语音已合成，请下载音频文件后上传',
            variant: 'default'
          });
        } catch (error) {
          console.error('音频处理失败:', error);
          toast({
            title: '音频处理失败',
            description: error.message,
            variant: 'destructive'
          });
        } finally {
          // 停止所有媒体流
          stream.getTracks().forEach(track => track.stop());
          setUploadingAudio(false);
        }
      };
      // 开始录制
      mediaRecorder.start(100);
      // 等待录制开始
      await new Promise(resolve => setTimeout(resolve, 100));
      // 创建语音合成实例
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;
      // 获取语音
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(v => v.lang === 'zh-CN') || voices[0];
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      // 语音合成事件处理
      utterance.onend = () => {
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        }, 500);
      };
      utterance.onerror = error => {
        console.error('语音合成错误:', error);
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
        setUploadingAudio(false);
        toast({
          title: '语音合成失败',
          description: '语音合成过程中出现错误',
          variant: 'destructive'
        });
      };
      // 开始语音合成
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('语音合成初始化失败:', error);
      setUploadingAudio(false);
      toast({
        title: '语音合成失败',
        description: error.message || '请检查麦克风权限和浏览器支持',
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
      link.download = `语音讲解_${waypointName || '未命名'}_${Date.now()}.webm`;
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

  // 检查文件是否为音频文件
  const isAudioFile = file => {
    if (!file) return false;
    const extension = file.name.toLowerCase().split('.').pop();
    const audioExtensions = ['webm', 'mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'mpeg'];
    const fileType = file.type.toLowerCase();
    const isAudioType = fileType.startsWith('audio/');
    const isAudioExtension = audioExtensions.includes(extension);
    return isAudioType || isAudioExtension;
  };

  // 检查文件是否为字幕文件
  const isSubtitleFile = file => {
    if (!file) return false;
    const extension = file.name.toLowerCase().split('.').pop();
    const subtitleExtensions = ['srt', 'vtt', 'ass', 'ssa', 'txt', 'sub'];
    const fileType = file.type.toLowerCase();
    const isTextType = fileType.startsWith('text/') || fileType.includes('subtitle');
    const isSubtitleExtension = subtitleExtensions.includes(extension);
    return isTextType || isSubtitleExtension;
  };

  // 上传音频文件到云存储
  const handleAudioUpload = async event => {
    const file = event.target.files?.[0];
    if (!file) return;
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
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'webm';
      const fileName = `airline_voice/audio_${timestamp}_${Math.random().toString(36).substring(2, 8)}.${fileExtension}`;
      const uploadResult = await tcb.uploadFile({
        cloudPath: fileName,
        filePath: file
      });
      const fileId = uploadResult.fileID;
      const tempUrlResult = await tcb.getTempFileURL({
        fileList: [fileId]
      });
      // 通知父组件音频文件已上传
      if (onSynthesisComplete) {
        onSynthesisComplete({
          audioFileId: fileId,
          audioUrl: tempUrlResult.fileList[0].tempFileURL,
          subtitleFileId: subtitleFileId,
          subtitleUrl: subtitleFileId ? await getSubtitleFileUrl(subtitleFileId) : ''
        });
      }
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
      event.target.value = '';
    }
  };

  // 上传字幕文件到云存储
  const handleSubtitleUpload = async event => {
    const file = event.target.files?.[0];
    if (!file) return;
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
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'srt';
      const fileName = `airline_voice/subtitle_${timestamp}_${Math.random().toString(36).substring(2, 8)}.${fileExtension}`;
      const uploadResult = await tcb.uploadFile({
        cloudPath: fileName,
        filePath: file
      });
      const fileId = uploadResult.fileID;
      const tempUrlResult = await tcb.getTempFileURL({
        fileList: [fileId]
      });
      setSubtitleFileId(fileId);
      setSubtitleFile(file);
      // 通知父组件字幕文件已上传
      if (onSynthesisComplete) {
        onSynthesisComplete({
          audioFileId: '',
          audioUrl: '',
          subtitleFileId: fileId,
          subtitleUrl: tempUrlResult.fileList[0].tempFileURL
        });
      }
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
      event.target.value = '';
    }
  };

  // 获取字幕文件URL
  const getSubtitleFileUrl = async fileId => {
    if (!fileId) return '';
    try {
      const tcb = await $w.cloud.getCloudInstance();
      const tempUrlResult = await tcb.getTempFileURL({
        fileList: [fileId]
      });
      return tempUrlResult.fileList[0].tempFileURL;
    } catch (error) {
      console.error('获取字幕文件URL失败:', error);
      return '';
    }
  };

  // 移除字幕文件
  const handleRemoveSubtitle = () => {
    setSubtitleFile(null);
    setSubtitleFileId('');
    // 通知父组件字幕文件已移除
    if (onSynthesisComplete) {
      onSynthesisComplete({
        audioFileId: '',
        audioUrl: '',
        subtitleFileId: '',
        subtitleUrl: ''
      });
    }
    toast({
      title: '字幕文件已移除',
      description: '字幕文件已从配置中移除',
      variant: 'default'
    });
  };
  return <Card className="bg-gray-800/30 border border-gray-600">
      <CardHeader className="pb-3">
        <CardTitle className="text-blue-400 text-sm font-semibold">语音合成与文件上传</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 语音合成区域 */}
        <div className="space-y-3">
          <Button type="button" onClick={handleVoiceSynthesis} disabled={uploadingAudio || !text} className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-lg">
            {uploadingAudio ? <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                合成中...
              </> : <>
                <Volume2 className="h-4 w-4 mr-2" />
                语音合成
              </>}
          </Button>

          {/* 下载按钮（合成后显示） */}
          {showDownloadButton && <Button type="button" onClick={handleDownloadAudio} className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg">
              <Download className="h-4 w-4 mr-2" />
              下载音频文件
            </Button>}
        </div>

        {/* 音频文件上传区域 */}
        <div className="space-y-3">
          <div className="text-gray-300 text-xs font-medium">音频文件上传</div>
          <div className="relative">
            <input type="file" accept="audio/*,.webm,.mp3,.wav,.ogg,.m4a,.aac,.flac,.mpeg" onChange={handleAudioUpload} className="hidden" id="audio-file-upload" disabled={uploadingAudio} />
            <label htmlFor="audio-file-upload" className={`flex flex-col items-center justify-center w-full h-16 border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer group ${uploadingAudio ? 'border-gray-400/50 bg-gray-900/10 cursor-not-allowed' : 'border-blue-400/50 bg-blue-900/10 hover:bg-blue-900/20'}`}>
              <div className="flex flex-col items-center justify-center">
                <Upload className={`w-5 h-5 mb-1 transition-colors ${uploadingAudio ? 'text-gray-400' : 'text-blue-400 group-hover:text-blue-300'}`} />
                <span className={`font-medium text-sm ${uploadingAudio ? 'text-gray-400' : 'text-blue-300'}`}>
                  {uploadingAudio ? '上传中...' : '选择音频文件上传'}
                </span>
                <span className={`text-xs mt-1 ${uploadingAudio ? 'text-gray-400/70' : 'text-blue-400/70'}`}>
                  支持webm、mp3、wav、ogg、m4a等格式
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* 字幕文件上传区域（新增） */}
        <div className="space-y-3">
          <div className="text-gray-300 text-xs font-medium">字幕文件上传（可选）</div>
          
          {/* 字幕文件预览 */}
          {subtitleFileId && <div className="relative">
              <div className="flex items-center space-x-2 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <FileText className="h-4 w-4 text-purple-400" />
                <div className="flex-1">
                  <span className="text-purple-400 text-sm font-medium">字幕文件已准备</span>
                  <p className="text-purple-400/70 text-xs mt-1">文件ID: {subtitleFileId.substring(0, 20)}...</p>
                </div>
                <Button type="button" onClick={handleRemoveSubtitle} className="px-2 py-1 border border-red-400 text-red-400 hover:bg-red-400/10 bg-transparent">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>}

          {/* 字幕文件上传控件 */}
          <div className="relative">
            <input type="file" accept=".srt,.vtt,.ass,.ssa,.txt,.sub" onChange={handleSubtitleUpload} className="hidden" id="subtitle-file-upload" disabled={uploadingSubtitle} />
            <label htmlFor="subtitle-file-upload" className={`flex flex-col items-center justify-center w-full h-16 border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer group ${uploadingSubtitle ? 'border-gray-400/50 bg-gray-900/10 cursor-not-allowed' : 'border-purple-400/50 bg-purple-900/10 hover:bg-purple-900/20'}`}>
              <div className="flex flex-col items-center justify-center">
                <Upload className={`w-5 h-5 mb-1 transition-colors ${uploadingSubtitle ? 'text-gray-400' : 'text-purple-400 group-hover:text-purple-300'}`} />
                <span className={`font-medium text-sm ${uploadingSubtitle ? 'text-gray-400' : 'text-purple-300'}`}>
                  {uploadingSubtitle ? '上传中...' : '选择字幕文件上传'}
                </span>
                <span className={`text-xs mt-1 ${uploadingSubtitle ? 'text-gray-400/70' : 'text-purple-400/70'}`}>
                  支持srt、vtt、ass、ssa、txt等格式
                </span>
              </div>
            </label>
          </div>
        </div>
      </CardContent>
    </Card>;
}