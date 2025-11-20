// @ts-ignore;
import React, { useState, useRef, useEffect } from 'react';
// @ts-ignore;
import { Button, useToast } from '@/components/ui';
// @ts-ignore;
import { Volume2, Download, Upload, Play, Square } from 'lucide-react';

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
  const [audioElement, setAudioElement] = useState(null);
  const {
    toast
  } = useToast();
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  // 初始化语音列表
  useEffect(() => {
    // 确保语音列表加载完成
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    };
    loadVoices();
  }, []);

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

  // 使用Web Speech API进行语音合成（优化版本）
  const handleSpeechSynthesis = async () => {
    if (!text || text.trim() === '') {
      toast({
        title: '提示',
        description: '请先输入文字稿内容',
        variant: 'destructive'
      });
      return;
    }

    // 检查浏览器支持
    if (!window.SpeechSynthesisUtterance || !window.speechSynthesis) {
      toast({
        title: '浏览器不支持',
        description: '您的浏览器不支持语音合成功能',
        variant: 'destructive'
      });
      return;
    }

    // 检查MediaRecorder支持
    if (!window.MediaRecorder) {
      toast({
        title: '浏览器不支持',
        description: '您的浏览器不支持音频录制功能',
        variant: 'destructive'
      });
      return;
    }
    try {
      setIsSynthesizing(true);

      // 停止当前播放
      stopAudio();

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
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // 处理数据可用事件
      mediaRecorder.ondataavailable = event => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // 处理录制停止事件
      mediaRecorder.onstop = async () => {
        try {
          if (audioChunksRef.current.length === 0) {
            throw new Error('录制数据为空');
          }
          const audioBlob = new Blob(audioChunksRef.current, {
            type: 'audio/webm;codecs=opus'
          });

          // 创建音频URL并设置状态
          const audioUrl = URL.createObjectURL(audioBlob);
          setAudioBlob(audioBlob);
          setSynthesizedAudio(audioUrl);

          // 创建音频元素用于播放
          const audio = new Audio(audioUrl);
          setAudioElement(audio);

          // 上传到云存储
          await uploadAudioToCloud(audioBlob, 'synthesized');
          toast({
            title: '语音合成成功',
            description: '语音已合成并上传到云存储',
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
          setIsSynthesizing(false);
        }
      };

      // 开始录制
      mediaRecorder.start(100); // 每100ms收集一次数据

      // 等待一小段时间确保录制开始
      await new Promise(resolve => setTimeout(resolve, 100));

      // 创建语音合成实例
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.8; // 稍慢的语速，提高清晰度
      utterance.pitch = 1;
      utterance.volume = 1;

      // 获取可用的语音
      const voices = window.speechSynthesis.getVoices();
      let selectedVoice = voices.find(v => v.lang === 'zh-CN');

      // 根据选择的语音类型选择语音
      if (voice === '男声') {
        selectedVoice = voices.find(v => v.name.includes('Male') || v.name.includes('男') || v.lang === 'zh-CN');
      } else if (voice === '童声') {
        selectedVoice = voices.find(v => v.name.includes('Child') || v.name.includes('Kid') || v.name.includes('童'));
      } else if (voice === '老人声') {
        selectedVoice = voices.find(v => v.name.includes('Senior') || v.name.includes('Old') || v.name.includes('老'));
      } else {
        // 默认使用女声
        selectedVoice = voices.find(v => v.name.includes('Female') || v.name.includes('女') || v.lang === 'zh-CN');
      }
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      // 语音合成事件处理
      utterance.onend = () => {
        setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
        }, 500); // 给录制留一点缓冲时间
      };
      utterance.onerror = error => {
        console.error('语音合成错误:', error);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
        setIsSynthesizing(false);
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
      setIsSynthesizing(false);
      toast({
        title: '语音合成失败',
        description: error.message || '请检查麦克风权限和浏览器支持',
        variant: 'destructive'
      });
    }
  };

  // 上传音频到云存储
  const uploadAudioToCloud = async (audioBlob, source) => {
    try {
      const tcb = await $w.cloud.getCloudInstance();

      // 生成文件名
      const timestamp = Date.now();
      const fileExtension = source === 'synthesized' ? 'webm' : 'webm';
      const fileName = `audio/${waypointName || 'voice'}_${timestamp}.${fileExtension}`;

      // 上传到云存储
      const uploadResult = await tcb.uploadFile({
        cloudPath: fileName,
        filePath: audioBlob
      });

      // 获取文件ID
      const newFileId = uploadResult.fileID;
      setFileId(newFileId);
      setFileSize(audioBlob.size);

      // 获取临时访问URL
      const tempUrlResult = await tcb.getTempFileURL({
        fileList: [newFileId]
      });

      // 回调通知父组件
      if (onSynthesisComplete) {
        onSynthesisComplete(newFileId, tempUrlResult.fileList[0].tempFileURL);
      }
      return newFileId;
    } catch (error) {
      console.error('音频上传失败:', error);
      throw error;
    }
  };

  // 下载合成的音频文件
  const handleDownloadAudio = () => {
    if (!audioBlob) return;
    try {
      const link = document.createElement('a');
      link.href = synthesizedAudio;
      link.download = `语音讲解_${waypointName || 'audio'}_${Date.now()}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: '下载成功',
        description: '音频文件已开始下载',
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

  // 手动上传音频文件
  const handleManualUpload = async event => {
    const file = event.target.files[0];
    if (!file) return;

    // 支持多种音频格式
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
      await uploadAudioToCloud(file, 'manual');
      toast({
        title: '音频文件上传成功',
        description: `文件已上传到云存储`,
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
      // 清空文件输入
      event.target.value = '';
    }
  };
  return <div className="space-y-4">
      {/* 隐藏的音频元素用于播放 */}
      <audio ref={audioRef} className="hidden" />
      
      {/* 语音合成和播放控制区域 */}
      <div className="grid grid-cols-4 gap-3">
        {/* 语音合成按钮 */}
        <Button onClick={handleSpeechSynthesis} disabled={isSynthesizing || !text} className="col-span-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white">
          {isSynthesizing ? <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              合成中
            </> : <>
              <Volume2 className="w-4 h-4 mr-2" />
              语音合成
            </>}
        </Button>
        
        {/* 播放/停止按钮 */}
        {synthesizedAudio && <Button onClick={isPlaying ? stopAudio : playAudio} className={`col-span-1 ${isPlaying ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'} text-white`}>
            {isPlaying ? <>
                <Square className="w-4 h-4 mr-2" />
                停止
              </> : <>
                <Play className="w-4 h-4 mr-2" />
                播放
              </>}
          </Button>}
        
        {/* 下载按钮 */}
        {synthesizedAudio && <Button onClick={handleDownloadAudio} className="col-span-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white">
            <Download className="w-4 h-4 mr-2" />
            下载
          </Button>}
        
        {/* 占位空间 */}
        {!synthesizedAudio && <div className="col-span-2"></div>}
      </div>

      {/* 手动上传音频文件 */}
      <div className="relative">
        <input type="file" accept="audio/*,.webm,.mp3,.wav,.ogg,.m4a" onChange={handleManualUpload} className="hidden" id="manual-audio-upload" disabled={isSynthesizing} />
        <label htmlFor="manual-audio-upload" className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer group ${isSynthesizing ? 'border-gray-400/50 bg-gray-900/10 cursor-not-allowed' : 'border-blue-400/50 bg-blue-900/10 hover:bg-blue-900/20'}`}>
          <div className="flex flex-col items-center justify-center">
            <Upload className={`w-6 h-6 mb-1 transition-colors ${isSynthesizing ? 'text-gray-400' : 'text-blue-400 group-hover:text-blue-300'}`} />
            <span className={`font-medium text-sm ${isSynthesizing ? 'text-gray-400' : 'text-blue-300'}`}>
              {isSynthesizing ? '处理中...' : '上传音频文件'}
            </span>
            <span className={`text-xs mt-1 ${isSynthesizing ? 'text-gray-400/70' : 'text-blue-400/70'}`}>
              支持webm、mp3、wav等格式
            </span>
          </div>
        </label>
      </div>
      
      {/* 文件信息显示 */}
      {fileId && <div className="p-3 bg-green-900/10 border border-green-500/20 rounded-lg">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-green-400 text-sm font-medium">文件ID:</span>
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