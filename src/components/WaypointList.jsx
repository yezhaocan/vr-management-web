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
      <div className="space-y-2">
        {waypoints.map((waypoint, index) => <div key={waypoint.id} className={`flex items-center justify-between px-4 rounded-lg border cursor-pointer transition-all h-[56px] group ${selectedVoiceIndex === index ? 'bg-primary/10 border-primary' : 'bg-card border-border hover:bg-muted/50'}`} onClick={() => onSelectWaypoint(index)}>
            <div className="flex items-center space-x-3 overflow-hidden">
              {/* 航点序号 - 优化样式 - 适配深色模式 */}
              <div className="flex-shrink-0 text-xs text-muted-foreground w-4 text-center font-medium">
                {index + 1}
              </div>
              
              <div className="flex flex-col min-w-0">
                <p className="text-foreground text-sm font-medium truncate">{waypoint.name}</p>
              </div>

              {/* 语音讲解标识 - 适配深色模式 */}
              {hasVoiceRecording(waypoint) && <div className="flex items-center text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  <Volume2 className="w-3 h-3 mr-1" />
                  <span>语音</span>
                </div>}
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" onClick={e => {
            e.stopPropagation();
            onDeleteWaypoint(index);
          }} className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>)}
      </div>
      
      {/* 空状态提示 */}
      {waypoints.length === 0 && <div className="text-center py-8">
          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
            <Move className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">暂无航点，请在地图上添加航点</p>
        </div>}
    </div>;
}