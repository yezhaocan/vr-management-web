// @ts-ignore;
import React, { useState } from 'react';
// @ts-ignore;
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label } from '@/components/ui';
// @ts-ignore;
import { Upload, Plus } from 'lucide-react';

export function VideoUploader({
  onUpload,
  loading
}) {
  const [newVideo, setNewVideo] = useState({
    name: '',
    description: '',
    duration: ''
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const handleUpload = () => {
    if (!newVideo.name) {
      return;
    }
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          const newVideoItem = {
            id: Date.now(),
            ...newVideo,
            size: '0GB',
            uploadTime: new Date().toLocaleString(),
            status: 'processed',
            thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500',
            views: 0,
            likes: 0
          };
          onUpload(newVideoItem);
          setNewVideo({
            name: '',
            description: '',
            duration: ''
          });
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };
  return <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">上传新录像</CardTitle>
        <CardDescription className="text-gray-400">
          上传飞行录像文件
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-gray-300">录像名称 *</Label>
          <Input value={newVideo.name} onChange={e => setNewVideo(prev => ({
          ...prev,
          name: e.target.value
        }))} placeholder="请输入录像名称" className="bg-gray-800 border-gray-600 text-white" />
        </div>

        <div className="space-y-2">
          <Label className="text-gray-300">描述</Label>
          <textarea value={newVideo.description} onChange={e => setNewVideo(prev => ({
          ...prev,
          description: e.target.value
        }))} placeholder="请输入录像描述..." className="w-full h-16 bg-gray-800 border border-gray-600 rounded-lg p-2 text-white text-sm" />
        </div>

        <div className="space-y-2">
          <Label className="text-gray-300">时长</Label>
          <Input value={newVideo.duration} onChange={e => setNewVideo(prev => ({
          ...prev,
          duration: e.target.value
        }))} placeholder="例如: 45:30" className="bg-gray-800 border-gray-600 text-white" />
        </div>

        {uploadProgress > 0 && uploadProgress < 100 && <div className="space-y-2">
            <Label className="text-gray-300">上传进度</Label>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{
            width: `${uploadProgress}%`
          }}></div>
            </div>
            <p className="text-xs text-gray-400 text-center">{uploadProgress}%</p>
          </div>}

        <Button className="w-full bg-green-500 hover:bg-green-600" onClick={handleUpload} disabled={uploadProgress > 0 && uploadProgress < 100}>
          <Upload className="h-4 w-4 mr-2" />
          {uploadProgress > 0 && uploadProgress < 100 ? '上传中...' : '开始上传'}
        </Button>
      </CardContent>
    </Card>;
}