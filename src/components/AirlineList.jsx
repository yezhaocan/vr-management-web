// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui';
// @ts-ignore;
import { Edit, Trash2, Music, Volume2, MapPin, Clock, Calendar } from 'lucide-react';

export function AirlineList({
  routes,
  onEdit,
  onDelete,
  hasVoiceGuide
}) {
  if (!routes || routes.length === 0) {
    return <div className="text-center py-12">
        <div className="text-gray-500 text-lg">暂无航线数据</div>
        <div className="text-gray-400 text-sm mt-2">点击"创建航线"开始添加第一条航线</div>
      </div>;
  }

  // 检查单个航线是否有语音讲解
  const checkRouteVoiceGuide = route => {
    if (!route.waypoints || !Array.isArray(route.waypoints)) return false;
    return route.waypoints.some(waypoint => waypoint.voiceGuide && waypoint.voiceGuide.enabled === true);
  };
  return <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {routes.map(route => {
        const routeHasVoiceGuide = checkRouteVoiceGuide(route);
        const routeHasBackgroundMusic = route.cloudStorageId && route.cloudStorageId.trim() !== '';
        return <Card key={route._id} className="bg-card border border-border shadow-sm hover:shadow-md hover:border-primary transition-all duration-200">
              <CardContent className="p-5 flex flex-col h-full">
                {/* 航线名称和状态标签 */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground truncate mb-2">{route.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      {routeHasVoiceGuide && <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                          <Volume2 className="w-3 h-3 mr-1" /> 语音
                        </Badge>}
                      {routeHasBackgroundMusic && <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                          <Music className="w-3 h-3 mr-1" /> 音乐
                        </Badge>}
                    </div>
                  </div>
                </div>

                {/* 航线详细信息 - 紧凑布局 */}
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-4 text-sm">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{route.waypointCount || 0} 个航点</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{route.estimated_duration || 0} 分钟</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-muted-foreground col-span-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{route.createdAt ? new Date(route.createdAt).toLocaleDateString() : '未知'}</span>
                  </div>
                </div>

                {/* 操作按钮 - 底部对齐 */}
                <div className="mt-auto pt-4 border-t border-border flex gap-3">
                  <Button onClick={() => onEdit(route)} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-9">
                    <Edit className="w-3.5 h-3.5 mr-2" /> 编辑
                  </Button>
                  <Button onClick={() => onDelete(route)} variant="outline" className="h-9 px-3 text-destructive border-destructive/50 hover:bg-destructive/10 hover:border-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>;
      })}
      </div>
    </div>;
}