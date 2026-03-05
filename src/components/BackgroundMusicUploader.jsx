import React, { useState } from 'react';
import { Button, Label } from '@/components/ui';
import { Upload, Music, CheckCircle, X } from 'lucide-react';

export function BackgroundMusicUploader({
  backgroundMusicFileId,
  onBackgroundMusicFileIdChange,
  $w
}) {
  const [uploadingMusic, setUploadingMusic] = useState(false);
  const handleMusicUpload = async file => {
    if (!file) return;
    setUploadingMusic(true);
    try {
      const tcb = await $w.cloud.getCloudInstance();
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileName = `video_background_music/music_${timestamp}_${randomStr}.mp3`;
      const uploadResult = await tcb.uploadFile({
        cloudPath: fileName,
        filePath: file
      });
      const fileId = uploadResult.fileID;
      onBackgroundMusicFileIdChange(fileId);
    } catch (error) {
      console.error('背景音乐上传失败:', error);
    } finally {
      setUploadingMusic(false);
    }
  };
  const clearMusic = () => {
    onBackgroundMusicFileIdChange('');
  };
  return (
    <div className="bg-muted/30 rounded-xl p-6 border-2 border-border hover:border-purple-500/50 transition-colors">
        {backgroundMusicFileId ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-lg">背景音乐已上传</p>
                  <p className="text-muted-foreground text-sm">文件ID: {backgroundMusicFileId.substring(0, 20)}...</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => document.getElementById('backgroundMusicUpload').click()} 
                  className="border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  更换
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={clearMusic} 
                  className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <X className="h-4 w-4 mr-2" />
                  清除
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center cursor-pointer group" onClick={() => document.getElementById('backgroundMusicUpload').click()}>
            <input id="backgroundMusicUpload" type="file" accept="audio/*" className="hidden" onChange={e => handleMusicUpload(e.target.files[0])} />
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="w-24 h-24 bg-purple-50 dark:bg-purple-500/20 rounded-2xl flex items-center justify-center group-hover:bg-purple-100 dark:group-hover:bg-purple-500/30 transition-colors">
                  <Music className="h-10 w-10 text-purple-500 dark:text-purple-400" />
                </div>
              </div>
              <div>
                <p className="text-foreground font-medium text-xl">
                  {uploadingMusic ? '上传中...' : '点击上传背景音乐'}
                </p>
                <p className="text-muted-foreground text-sm mt-2">支持 MP3, WAV 等音频格式</p>
              </div>
              {uploadingMusic && (
                <div className="w-full bg-muted rounded-full h-3">
                  <div className="bg-purple-500 h-3 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
  );
}