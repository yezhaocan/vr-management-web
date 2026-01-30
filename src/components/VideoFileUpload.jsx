import React from 'react';
import { Button, Label, Input } from '@/components/ui';
import { Upload, CheckCircle, X, Image, Video, Link } from 'lucide-react';

export function VideoFileUpload({
  type,
  label,
  accept,
  icon: Icon,
  required = false,
  fileId,
  uploading,
  onFileUpload,
  onClearFile
}) {
  const handleFileSelect = e => {
    const file = e.target.files[0];
    if (file) {
      onFileUpload(file, type);
    }
  };
  return (
    <div className="space-y-4">
      <Label className="text-lg font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      
      <div className="bg-muted/30 rounded-xl p-6 border-2 border-border hover:border-primary/50 transition-colors">
        {fileId ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-lg">文件已上传</p>
                  <p className="text-muted-foreground text-sm">文件ID: {fileId.substring(0, 20)}...</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => document.getElementById(`${type}File`).click()} 
                  className="border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  更换
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onClearFile(type)} 
                  className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <X className="h-4 w-4 mr-2" />
                  清除
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center cursor-pointer group" onClick={() => document.getElementById(`${type}File`).click()}>
            <input id={`${type}File`} type="file" accept={accept} className="hidden" onChange={handleFileSelect} />
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="w-24 h-24 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 transition-colors">
                  <Icon className="h-10 w-10 text-blue-500 dark:text-blue-400" />
                </div>
              </div>
              <div>
                <p className="text-foreground font-medium text-xl">
                  {uploading ? '上传中...' : `点击上传${label}`}
                </p>
                <p className="text-muted-foreground text-sm mt-2">
                  {type === 'thumbnail' ? '支持 JPG, PNG 格式' : '支持 MP4, MOV, AVI 格式'}
                </p>
              </div>
              {uploading && (
                <div className="w-full bg-muted rounded-full h-3">
                  <div className="bg-primary h-3 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function VideoUrlInput({
  videoUrl,
  onVideoUrlChange,
  onClearVideoFile
}) {
  return (
    <div className="space-y-4">
      <Label className="text-lg font-medium">视频地址 *</Label>
      
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
              value={videoUrl} 
              onChange={e => {
                onVideoUrlChange(e.target.value);
                onClearVideoFile();
              }} 
              placeholder="请输入视频地址，例如：https://example.com/video.mp4" 
              className="bg-background border-border p-3 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}