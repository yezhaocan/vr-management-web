// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Button, Label, Input } from '@/components/ui';
// @ts-ignore;
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
  return <div className="space-y-4">
      <Label className="text-white text-lg font-medium">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </Label>
      
      <div className="bg-gray-800/50 rounded-xl p-6 border-2 border-gray-600 hover:border-blue-500/50 transition-colors">
        {fileId ? <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium text-lg">文件已上传</p>
                  <p className="text-gray-400 text-sm">文件ID: {fileId.substring(0, 20)}...</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById(`${type}File`).click()} className="border-blue-400 text-blue-400 hover:bg-blue-400/10 px-4 py-2">
                  <Upload className="h-4 w-4 mr-2" />
                  更换
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => onClearFile(type)} className="border-red-400 text-red-400 hover:bg-red-400/10 px-4 py-2">
                  <X className="h-4 w-4 mr-2" />
                  清除
                </Button>
              </div>
            </div>
          </div> : <div className="text-center cursor-pointer group" onClick={() => document.getElementById(`${type}File`).click()}>
            <input id={`${type}File`} type="file" accept={accept} className="hidden" onChange={handleFileSelect} />
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="w-24 h-24 bg-blue-500/20 rounded-2xl flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <Icon className="h-10 w-10 text-blue-400" />
                </div>
              </div>
              <div>
                <p className="text-gray-300 font-medium text-xl">
                  {uploading ? '上传中...' : `点击上传${label}`}
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  {type === 'thumbnail' ? '支持 JPG, PNG 格式' : '支持 MP4, MOV, AVI 格式'}
                </p>
              </div>
              {uploading && <div className="w-full bg-gray-700 rounded-full h-3">
                  <div className="bg-blue-500 h-3 rounded-full animate-pulse"></div>
                </div>}
            </div>
          </div>}
      </div>
    </div>;
}
export function VideoUrlInput({
  videoUrl,
  onVideoUrlChange,
  onClearVideoFile
}) {
  return <div className="space-y-4">
      <Label className="text-white text-lg font-medium">视频地址 *</Label>
      
      <div className="bg-gray-800/50 rounded-xl p-6 border-2 border-gray-600 hover:border-purple-500/50 transition-colors">
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
              <Link className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className="text-white font-medium text-lg">输入视频地址</p>
              <p className="text-gray-400 text-sm">支持在线视频链接</p>
            </div>
          </div>
          
          <div>
            <Input value={videoUrl} onChange={e => {
            onVideoUrlChange(e.target.value);
            onClearVideoFile();
          }} placeholder="请输入视频地址，例如：https://example.com/video.mp4" className="bg-gray-800 border-gray-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
          </div>
        </div>
      </div>
    </div>;
}