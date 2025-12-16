// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Card, CardContent, Button, Badge } from '@/components/ui';
// @ts-ignore;
import { Trash2, Volume2, VolumeX, Move, Lock } from 'lucide-react';

export function WaypointList({
  waypoints,
  onDeleteWaypoint,
  onSelectWaypoint,
  selectedVoiceIndex,
  locked = true // 新增：锁定列表功能
}) {
  // 检查是否有语音讲解录音
  const hasVoiceRecording = waypoint => {
    return waypoint.voiceGuide && waypoint.voiceGuide.enabled && waypoint.voiceGuide.audioFileId && waypoint.voiceGuide.audioFileId.trim() !== '';
  };
  return <div className="flex-1 overflow-y-auto">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-blue-400 text-sm font-semibold">已添加航点 ({waypoints.length})</h4>
        {locked && <div className="flex items-center space-x-1 text-gray-400 text-xs">
            <Lock className="h-3 w-3" />
            <span>列表已锁定</span>
          </div>}
      </div>
      <div className="space-y-2">
        {waypoints.map((waypoint, index) => <Card key={waypoint.id} className="bg-gray-800/50 backdrop-blur-sm border border-gray-600 shadow-lg rounded-xl cursor-pointer transition-all hover:bg-gray-700/50" onClick={() => onSelectWaypoint(index)}>
            <CardContent className="p-3">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-3">
                  {/* 航点序号 - 固定位置 */}
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{waypoint.name}</p>
                    <p className="text-gray-400 text-xs">{waypoint.lat.toFixed(4)}, {waypoint.lng.toFixed(4)}</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  {/* 删除按钮 */}
                  <Button variant="ghost" size="sm" onClick={e => {
                e.stopPropagation();
                onDeleteWaypoint(index);
              }} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              <div className="text-xs text-gray-500">
                速度: {waypoint.flightSpeed}m/s | 悬停: {waypoint.hoverDuration}s | 高度: {waypoint.altitude}m
              </div>
              
              {/* 语音讲解录音标识 */}
              {hasVoiceRecording(waypoint) ? <div className="mt-2 p-2 bg-green-900/10 border border-green-500/20 rounded">
                  <div className="flex items-center space-x-2">
                    <Volume2 className="w-3 h-3 text-green-400" />
                    <span className="text-green-400 text-xs font-medium">已生成语音讲解</span>
                    <span className="text-gray-400 text-xs truncate" title={waypoint.voiceGuide.audioFileId}>
                      ID: {waypoint.voiceGuide.audioFileId.substring(0, 8)}...
                    </span>
                  </div>
                </div> : waypoint.voiceGuide && waypoint.voiceGuide.enabled ? <div className="mt-2 p-2 bg-yellow-900/10 border border-yellow-500/20 rounded">
                  <div className="flex items-center space-x-2">
                    <VolumeX className="w-3 h-3 text-yellow-400" />
                    <span className="text-yellow-400 text-xs">语音讲解已启用，但未生成录音</span>
                  </div>
                </div> : null}
              
              {selectedVoiceIndex === index && <Badge variant="default" className="mt-2 bg-blue-500 text-white text-xs">
                  当前选中
                </Badge>}
            </CardContent>
          </Card>)}
      </div>
      
      {/* 空状态提示 */}
      {waypoints.length === 0 && <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <Move className="w-6 h-6 text-gray-500" />
          </div>
          <p className="text-gray-400 text-sm">暂无航点，请在地图上添加航点</p>
        </div>}
      
      {/* 连线提示 */}
      {waypoints.length >= 2 && <div className="mt-3 p-2 bg-blue-900/10 border border-blue-500/20 rounded">
          <p className="text-blue-400 text-xs">
            ✓ 航点已自动连线，点击地图上的连线可高亮显示航段
          </p>
        </div>}
    </div>;
}