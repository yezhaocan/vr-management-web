import React, { useState, useRef, useEffect } from 'react';
// @ts-ignore;
import { Button, useToast, Progress, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui';
// @ts-ignore;
import { Volume2, Download, Upload, Play, Square, Loader2, FileAudio, FileText, Info } from 'lucide-react';
// @ts-ignore;
import { generateAlignedSrt } from '../pages/subtitle-alignment';

export function VoiceSynthesisComponent({
  text,
  voice,
  onSynthesisComplete,
  $w,
  waypointName,
  currentFileId = null
}) {
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fileId, setFileId] = useState(currentFileId);
  const [fileSize, setFileSize] = useState(0);
  const [synthesizedAudio, setSynthesizedAudio] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [srtContent, setSrtContent] = useState(null); // 新增：保存 SRT 字幕内容
  const [uploadProgress, setUploadProgress] = useState(0);
  // 新增：文件来源状态 'generated' | 'manual' | null
  const [sourceType, setSourceType] = useState(currentFileId ? 'manual' : null); 

  const {
    toast
  } = useToast();
  const audioRef = useRef(null);

  // 播放音频
  const playAudio = () => {
    if (audioRef.current && synthesizedAudio) {
      audioRef.current.play();
      setIsPlaying(true);
      audioRef.current.onended = () => setIsPlaying(false);
    }
  };

  // 停止播放音频
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  // 使用后端 API 进行语音合成和 SRT 生成
  const handleSpeechSynthesis = async () => {
    if (sourceType === 'manual') {
      return; // 如果已手动上传，禁止智能生成
    }

    if (!text || text.trim() === '') {
      toast({
        title: '提示',
        description: '请先输入文字稿内容',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSynthesizing(true);
      setUploadProgress(10); // 开始进度

      // 停止当前播放
      stopAudio();

      // 1. 调用后端接口生成语音和 SRT
      const { srt, audioBlob } = await generateAlignedSrt(text);
      setUploadProgress(40); // 生成完成，准备上传

      // 创建音频URL并设置状态
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioBlob(audioBlob);
      setSynthesizedAudio(audioUrl);
      setSrtContent(srt); // 保存生成的 SRT 内容
      setFileSize(audioBlob.size);
      setSourceType('generated'); // 标记为智能生成

      // 创建音频元素用于播放
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
      }

      // 2. 并发上传音频和字幕文件
      const timestamp = Date.now();
      const baseName = waypointName || 'voice';
      
      setUploadProgress(50); // 开始上传

      // 上传音频
      const audioUploadPromise = uploadFileToCloud(
        audioBlob, 
        `audio/${baseName}_${timestamp}.wav`
      );

      // 上传字幕
      const srtBlob = new Blob([srt], { type: 'text/plain' });
      const srtUploadPromise = uploadFileToCloud(
        srtBlob, 
        `subtitle/${baseName}_${timestamp}.srt`
      );

      const [audioFileId, subtitleFileId] = await Promise.all([
        audioUploadPromise,
        srtUploadPromise
      ]);

      setUploadProgress(100); // 完成
      setFileId(audioFileId);

      // 获取音频临时访问URL
      const tcb = await $w.cloud.getCloudInstance();
      const tempUrlResult = await tcb.getTempFileURL({
        fileList: [audioFileId]
      });
      const tempAudioUrl = tempUrlResult.fileList[0].tempFileURL;

      // 3. 回调通知父组件
      if (onSynthesisComplete) {
        onSynthesisComplete(audioFileId, tempAudioUrl, subtitleFileId);
      }

      toast({
        title: '合成成功',
        description: '语音和字幕已生成并保存',
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
      setIsSynthesizing(false);
      setUploadProgress(0);
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
    if (!srtContent) return;
    try {
      const link = document.createElement('a');
      const blob = new Blob([srtContent], { type: 'text/plain' });
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
      setIsSynthesizing(true);
      const fileId = await uploadFileToCloud(file, `audio/${waypointName || 'manual'}_${Date.now()}.${file.name.split('.').pop()}`);
      
      // 获取临时链接
      const tcb = await $w.cloud.getCloudInstance();
      const tempUrlResult = await tcb.getTempFileURL({
        fileList: [fileId]
      });
      
      setFileId(fileId);
      setSourceType('manual'); // 标记为手动上传
      
      // 如果之前有合成的音频，清除它
      setSynthesizedAudio(null);
      setSrtContent(null);
      
      if (onSynthesisComplete) {
        onSynthesisComplete(fileId, tempUrlResult.fileList[0].tempFileURL, null); // 手动上传没有字幕
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
      setIsSynthesizing(false);
      event.target.value = '';
    }
  };

  return <div className="space-y-4">
      {/* 隐藏的音频元素用于播放 */}
      <audio ref={audioRef} className="hidden" />
      
      {/* 语音合成和播放控制区域 */}
      <div className="grid grid-cols-4 gap-3">
        {/* 智能生成按钮 */}
        <div className="col-span-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="w-full"> {/* Span wrapper for disabled button tooltip */}
                  <Button 
                    onClick={handleSpeechSynthesis} 
                    disabled={isSynthesizing || !text || sourceType === 'manual'} 
                    className={`w-full text-white ${
                      sourceType === 'manual' 
                        ? 'bg-gray-400 hover:bg-gray-500 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                    }`}
                  >
                    {isSynthesizing ? <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        {uploadProgress > 40 ? '上传中' : '生成中'}
                      </> : <>
                        <Volume2 className="w-4 h-4 mr-2" />
                        智能生成语音
                      </>}
                  </Button>
                </span>
              </TooltipTrigger>
              {sourceType === 'manual' && (
                <TooltipContent>
                  <p>已使用手动上传文件，如需智能生成请先移除手动文件或直接重新生成</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* 播放/停止按钮 (仅对智能生成的音频有效) */}
        {synthesizedAudio && <Button onClick={isPlaying ? stopAudio : playAudio} className={`col-span-1 ${isPlaying ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'} text-white`}>
            {isPlaying ? <>
                <Square className="w-4 h-4 mr-2" />
                停止播放
              </> : <>
                <Play className="w-4 h-4 mr-2" />
                播放语音
              </>}
          </Button>}
        
        {/* 下载字幕按钮 (仅智能生成模式下显示) */}
        {srtContent && sourceType === 'generated' && (
          <Button onClick={handleDownloadSrt} className="col-span-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white">
            <FileText className="w-4 h-4 mr-2" />
            下载SRT字幕
          </Button>
        )}
        
        {/* 占位空间 */}
        {!synthesizedAudio && <div className="col-span-2"></div>}
      </div>

      {/* 进度条 */}
      {isSynthesizing && (
        <div className="space-y-1">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {uploadProgress < 40 ? '正在生成语音和字幕...' : '正在上传文件到云存储...'}
          </p>
        </div>
      )}

      {/* 状态提示：手动上传模式 */}
      {sourceType === 'manual' && (
        <div className="flex items-center p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500">
          <Info className="w-4 h-4 mr-2" />
          <span className="text-sm">已使用手动上传文件，智能生成功能已禁用</span>
        </div>
      )}

      {/* 手动上传音频文件 */}
      <div className="relative">
        <input type="file" accept="audio/*,.webm,.mp3,.wav,.ogg,.m4a" onChange={handleManualUpload} className="hidden" id="manual-audio-upload" disabled={isSynthesizing} />
        <label htmlFor="manual-audio-upload" className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer group ${isSynthesizing ? 'border-gray-400/50 bg-gray-900/10 cursor-not-allowed' : 'border-blue-400/50 bg-blue-900/10 hover:bg-blue-900/20'}`}>
          <div className="flex flex-col items-center justify-center">
            <Upload className={`w-6 h-6 mb-1 transition-colors ${isSynthesizing ? 'text-gray-400' : 'text-blue-400 group-hover:text-blue-300'}`} />
            <span className={`font-medium text-sm ${isSynthesizing ? 'text-gray-400' : 'text-blue-300'}`}>
              {isSynthesizing ? '处理中...' : '手动上传音频文件'}
            </span>
            <div className="flex items-center mt-1 space-x-2">
               <span className={`text-xs ${isSynthesizing ? 'text-gray-400/70' : 'text-blue-400/70'}`}>
                支持webm、mp3、wav等格式
              </span>
              {/* 来源标识 */}
              {sourceType === 'manual' && (
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/30">
                  当前来源
                </span>
              )}
            </div>
          </div>
        </label>
      </div>
      
      {/* 文件信息显示 */}
      {fileId && <div className="p-3 bg-green-900/10 border border-green-500/20 rounded-lg">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-green-400 text-sm font-medium flex items-center">
                {sourceType === 'generated' ? <Volume2 className="w-3 h-3 mr-1" /> : <FileAudio className="w-3 h-3 mr-1" />}
                {sourceType === 'generated' ? '智能生成音频ID:' : '手动上传音频ID:'}
              </span>
              <span className="text-gray-300 text-xs break-all">{fileId}</span>
            </div>
            {fileSize > 0 && <div className="flex items-center justify-between">
                <span className="text-green-400 text-sm font-medium">文件大小:</span>
                <span className="text-gray-300 text-xs">{(fileSize / 1024).toFixed(2)} KB</span>
              </div>}
          </div>
        </div>}
    </div>;
}