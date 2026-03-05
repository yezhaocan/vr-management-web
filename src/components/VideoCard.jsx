import React from 'react';
import { Button, Badge } from '@/components/ui';
import { EnhancedCard } from '@/components/EnhancedCard';
import { Edit, Trash2, Play, Music, Megaphone, Calendar, Clock } from 'lucide-react';

export function VideoCard({
  video,
  onEdit,
  onDelete
}) {
  // 检查是否有录像文件或地址
  const hasVideo = video.videoFileId || video.videoUrl;

  // 检查是否有背景音乐
  const hasBackgroundMusic = video.backgroundMusicFileId;

  // 检查是否有播报配置
  const hasBroadcasts = video.broadcasts && video.broadcasts.length > 0;

  // 计算时长函数 - 根据开始时间和结束时间计算
  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return null;

    // 确保时间戳是有效的数字
    const start = Number(startTime);
    const end = Number(endTime);
    if (isNaN(start) || isNaN(end) || end <= start) return null;
    const durationSeconds = Math.floor((end - start) / 1000);
    if (durationSeconds <= 0) return null;
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor(durationSeconds % 3600 / 60);
    const seconds = durationSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // 获取显示的时长 - 优先使用数据库中的duration字段，如果没有则实时计算
  const getDisplayDuration = () => {
    // 如果数据库中有duration字段且不为空，直接使用
    if (video.duration && video.duration !== '00:00:00') {
      return video.duration;
    }
    // 否则根据开始时间和结束时间实时计算
    const calculatedDuration = calculateDuration(video.startTime, video.endTime);
    return calculatedDuration || '00:00:00';
  };
  const displayDuration = getDisplayDuration();

  // 检查是否应该显示时长字段（有开始时间和结束时间）
  const shouldShowDuration = video.startTime && video.endTime;

  return (
    <EnhancedCard
      title={video.name}
      description={video.description}
      imageSrc={video.imageUrl}
      footer={
        <>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => onEdit(video)} title="编辑">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(video)} title="删除">
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {/* 时间信息 */}
        <div className="flex items-center text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 mr-1" />
          <span>{video.uploadTime ? new Date(video.uploadTime).toLocaleDateString() : '未知时间'}</span>
        </div>

        {/* 状态标记 */}
        <div className="flex flex-wrap gap-2">
          <Badge variant={hasVideo ? "default" : "secondary"} className="text-xs font-normal px-2 py-0.5 h-6">
            <Play className="h-3 w-3 mr-1" />
            {hasVideo ? "有录像" : "无录像"}
          </Badge>
          
          <Badge variant={hasBackgroundMusic ? "default" : "secondary"} className="text-xs font-normal px-2 py-0.5 h-6">
            <Music className="h-3 w-3 mr-1" />
            {hasBackgroundMusic ? "有音乐" : "无音乐"}
          </Badge>
          
          <Badge variant={hasBroadcasts ? "default" : "secondary"} className="text-xs font-normal px-2 py-0.5 h-6">
            <Megaphone className="h-3 w-3 mr-1" />
            {hasBroadcasts ? `播报(${video.broadcasts.length})` : "无播报"}
          </Badge>
        </div>

        {/* 时长信息 */}
        {shouldShowDuration && (
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="h-3 w-3 mr-1 text-primary" />
            <span>时长: {displayDuration}</span>
          </div>
        )}
      </div>
    </EnhancedCard>
  );
}