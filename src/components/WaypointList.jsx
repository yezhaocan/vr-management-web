// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Card, CardContent, Button, Badge } from '@/components/ui';
// @ts-ignore;
import { Trash2, Volume2, VolumeX, FileText } from 'lucide-react';

export function WaypointList({
  waypoints,
  onDeleteWaypoint,
  onSelectWaypoint,
  selectedVoiceIndex
}) {
  return <div className="flex-1 overflow-y-auto">
      <h4 className="text-blue-400 text-sm font-semibold mb-3">已添加航点 ({waypoints.length})</h4>
      <div className="space-y-2">
        {waypoints.map((waypoint, index) => {
        // 检查是否有语音讲解录音
        const hasVoiceRecording = waypoint.voiceGuide && waypoint.voiceGuide.enabled && waypoint.voiceGuide.audioFileId && waypoint.voiceGuide.audioFileId.trim() !== '';

        // 检查是否有字幕文件
        const hasSubtitleFile = waypoint.voiceGuide && waypoint.voiceGuide.enabled && waypoint.voiceGuide.subtitleFileId && waypoint.voiceGuide.subtitleFileId.trim() !== '';
        return <Card key={waypoint.id} className="bg-gray-800/50 backdrop-blur-sm border border-gray-600 shadow-lg rounded-xl cursor-pointer transition-all hover:bg-gray-700/50" onClick={() => onSelectWaypoint(index)}>
              <CardContent className="p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-white font-medium text-sm">{waypoint.name}</p>
                    <p className="text-gray-400 text-xs">{waypoint.lat.toFixed(4)}, {waypoint.lng.toFixed(4)}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={e => {
                e.stopPropagation();
                onDeleteWaypoint(index);
              }} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <div className="text-xs text-gray-500">
                  速度: {waypoint.flightSpeed}m/s | 悬停: {waypoint.hoverDuration}s | 高度: {waypoint.altitude}m
                </div>
                
                {/* 语音讲解录音标识 */}
                {hasVoiceRecording ? <div className="mt-2 p-2 bg-green-900/10 border border-green-500/20 rounded">
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
                
                {/* 字幕文件标识 */}
                {hasSubtitleFile && <div className="mt-2 p-2 bg-purple-900/10 border border-purple-500/20 rounded">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-3 h-3 text-purple-400" />
                      <span className="text-purple-400 text-xs font-medium">已上传字幕文件</span>
                      <span className="text-gray-400 text-xs truncate" title={waypoint.voiceGuide.subtitleFileId}>
                        ID: {waypoint.voiceGuide.subtitleFileId.substring(0, 8)}...
                      </span>
                    </div>
                  </div>}
                
                {selectedVoiceIndex === index && <Badge variant="default" className="mt-2 bg-blue-500 text-white text-xs">
                    当前选中
                  </Badge>}
              </CardContent>
            </Card>;
      })}
      </div>
    </div>;
}