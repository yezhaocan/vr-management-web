// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge } from '@/components/ui';
// @ts-ignore;
import { PlayCircle, Edit, Trash2, Clock, FileVideo } from 'lucide-react';

export function VideoList({
  videos,
  onPlayVideo,
  onEditVideo,
  onDeleteVideo
}) {
  const getStatusBadge = status => {
    const variants = {
      processed: 'default',
      processing: 'secondary',
      uploading: 'destructive',
      error: 'destructive'
    };
    const labels = {
      processed: '已处理',
      processing: '处理中',
      uploading: '上传中',
      error: '错误'
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };
  if (videos.length === 0) {
    return <div className="col-span-full text-center py-12">
        <FileVideo className="h-16 w-16 mx-auto mb-4 text-gray-500" />
        <h3 className="text-lg font-medium text-gray-300">暂无录像</h3>
        <p className="text-gray-500 mt-2">请上传第一个录像文件</p>
      </div>;
  }
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map(video => <Card key={video.id} className="bg-gray-800/50 border-gray-700 hover:border-blue-500/30 transition-all duration-200">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-white text-lg truncate" title={video.name}>{video.name}</CardTitle>
                <CardDescription className="text-gray-400 line-clamp-2">{video.description}</CardDescription>
              </div>
              {getStatusBadge(video.status)}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <img src={video.thumbnail} alt={video.name} className="w-full h-32 object-cover rounded-lg" />
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-400" />
                <span className="text-gray-300">时长:</span>
                <span className="text-white">{video.duration}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileVideo className="h-4 w-4 text-green-400" />
                <span className="text-gray-300">大小:</span>
                <span className="text-white">{video.size}</span>
              </div>
            </div>

            <div className="text-xs text-gray-400">
              上传时间: {video.uploadTime}
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">观看: {video.views}次</span>
              <span className="text-gray-400">点赞: {video.likes}</span>
            </div>

            <div className="flex space-x-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1 border-gray-600 text-gray-300 hover:text-white" onClick={() => onPlayVideo(video)}>
                <PlayCircle className="h-3 w-3 mr-1" />
                播放
              </Button>
              <Button variant="outline" size="sm" className="flex-1 border-gray-600 text-gray-300 hover:text-white" onClick={() => onEditVideo(video)}>
                <Edit className="h-3 w-3 mr-1" />
                修改
              </Button>
              <Button variant="outline" size="sm" className="border-red-600 text-red-400 hover:text-red-300" onClick={() => onDeleteVideo(video)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>)}
    </div>;
}