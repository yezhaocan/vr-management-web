// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge } from '@/components/ui';
// @ts-ignore;
import { Edit, Trash2, Image, FileText, Play, Music, Megaphone, Calendar, Clock } from 'lucide-react';

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
  return <Card className="bg-gray-800/50 border-gray-700 hover:border-blue-500/30 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10 h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-white text-lg truncate">{video.name}</CardTitle>
            <CardDescription className="text-gray-400 flex items-center space-x-2 mt-1">
              <Calendar className="h-3 w-3" />
              <span>{video.uploadTime ? new Date(video.uploadTime).toLocaleDateString() : '未知时间'}</span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 flex-1 flex flex-col">
        {/* 缩略图区域 - 正方形展示 */}
        {video.imageUrl && <div className="mb-4 relative">
            <div className="aspect-square w-full bg-gray-700/30 rounded-lg border border-gray-600 overflow-hidden">
              <img src={video.imageUrl} alt={video.name} className="w-full h-full object-cover" onError={e => {
            // 如果图片加载失败，显示占位符
            e.target.style.display = 'none';
            const placeholder = e.target.parentNode;
            placeholder.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-700/50"><Image className="h-8 w-8 text-gray-500" /></div>';
          }} />
            </div>
          </div>}

        {/* 标记字段区域 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* 录像标记 */}
          <Badge variant={hasVideo ? "default" : "secondary"} className="flex items-center text-xs">
            <Play className="h-3 w-3 mr-1" />
            {hasVideo ? video.videoFileId ? "有录像文件" : "有录像地址" : "无录像"}
          </Badge>
          
          {/* 背景音乐标记 */}
          <Badge variant={hasBackgroundMusic ? "default" : "secondary"} className="flex items-center text-xs">
            <Music className="h-3 w-3 mr-1" />
            {hasBackgroundMusic ? "有背景音乐" : "无背景音乐"}
          </Badge>
          
          {/* 播报标记 */}
          <Badge variant={hasBroadcasts ? "default" : "secondary"} className="flex items-center text-xs">
            <Megaphone className="h-3 w-3 mr-1" />
            {hasBroadcasts ? `有播报(${video.broadcasts.length})` : "无播报"}
          </Badge>
        </div>

        {/* 录像信息区域 */}
        <div className="space-y-3 flex-1">
          {/* 时长信息 - 只在有开始时间和结束时间时显示 */}
          {shouldShowDuration && <div className="flex items-center space-x-2 bg-gray-700/30 rounded-lg p-2">
              <Clock className="h-3 w-3 text-blue-400" />
              <div className="min-w-0">
                <div className="text-gray-400 text-xs">录像时长</div>
                <div className="text-white text-sm">{displayDuration}</div>
              </div>
            </div>}

          {/* 文件信息 */}
          <div className="grid grid-cols-1 gap-2">
            {video.videoFileId && <div className="flex items-center space-x-2 bg-gray-700/30 rounded-lg p-2">
                <Play className="h-3 w-3 text-purple-400" />
                <div className="min-w-0">
                  <div className="text-gray-400 text-xs">录像文件</div>
                  <div className="text-white text-sm truncate">已上传</div>
                </div>
              </div>}
          </div>
        </div>

        {/* 描述信息 */}
        {video.description && <div className="mt-4 pt-3 border-t border-gray-700">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="h-3 w-3 text-purple-400" />
              <span className="text-gray-400 text-sm font-medium">描述</span>
            </div>
            <p className="text-gray-300 text-sm line-clamp-3 bg-gray-900/20 rounded p-2">{video.description}</p>
          </div>}

        {/* 操作按钮 */}
        <div className="flex justify-end items-center mt-4 pt-3 border-t border-gray-700">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(video)} className="text-blue-400 border-blue-400/60 hover:bg-blue-400/10 hover:text-blue-300 hover:border-blue-400/80 transition-colors text-xs px-3 py-1">
              <Edit className="h-3 w-3 mr-1" />
              编辑
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDelete(video)} className="text-red-400 border-red-400/60 hover:bg-red-400/10 hover:text-red-300 hover:border-red-400/80 transition-colors text-xs px-3 py-1">
              <Trash2 className="h-3 w-3 mr-1" />
              删除
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>;
}