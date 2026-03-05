import React from 'react';
import { Button, Badge } from '@/components/ui';
import { EnhancedCard } from '@/components/EnhancedCard';
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
    return <Badge variant={variants[status]} className="absolute top-2 right-2 z-10">{labels[status]}</Badge>;
  };

  if (videos.length === 0) {
    return <div className="col-span-full text-center py-12">
        <FileVideo className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium text-muted-foreground">暂无录像</h3>
        <p className="text-muted-foreground mt-2">请上传第一个录像文件</p>
      </div>;
  }

  return <div className="grid grid-cols-1 gap-6">
      {videos.map(video => (
        <EnhancedCard
          key={video.id}
          title={video.name}
          description={video.description}
          imageSrc={video.thumbnail}
          footer={
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => onPlayVideo(video)} title="播放">
                <PlayCircle className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => onEditVideo(video)} title="编辑">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDeleteVideo(video)} title="删除">
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          }
        >
          {/* Status Badge Overlaid on Image/Content */}
          {getStatusBadge(video.status)}

          <div className="grid grid-cols-2 gap-4 text-sm mt-2">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-muted-foreground">时长:</span>
              <span className="text-foreground">{video.duration}</span>
            </div>
            <div className="flex items-center space-x-2">
              <FileVideo className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">大小:</span>
              <span className="text-foreground">{video.size}</span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground mt-2">
            上传时间: {video.uploadTime}
          </div>

          <div className="flex space-x-4 mt-2 text-xs text-muted-foreground">
            <span>观看: {video.views}次</span>
            <span>点赞: {video.likes}</span>
          </div>
        </EnhancedCard>
      ))}
    </div>;
}