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
  return <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
      {routes.map(route => {
      const routeHasVoiceGuide = checkRouteVoiceGuide(route);
      const routeHasBackgroundMusic = route.cloudStorageId && route.cloudStorageId.trim() !== '';
      return <Card key={route._id} className="bg-gray-700/30 backdrop-blur-sm border border-gray-600 shadow-lg rounded-2xl hover:border-gray-500 transition-all duration-300 hover:shadow-xl">
            <CardContent className="p-6">
              {/* 航线名称和状态标签 */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{route.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                      {route.waypointCount || 0}个航点
                    </Badge>
                    {routeHasVoiceGuide && <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                        <Volume2 className="w-3 h-3 mr-1" /> 语音讲解
                      </Badge>}
                    {routeHasBackgroundMusic && <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                        <Music className="w-3 h-3 mr-1" /> 背景音乐
                      </Badge>}
                  </div>
                </div>
              </div>

              {/* 航线描述 */}
              {route.description && <div className="mb-4">
                  <p className="text-gray-400 text-sm line-clamp-3">{route.description}</p>
                </div>}

              {/* 航线详细信息 */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <span>航点数量</span>
                  </div>
                  <span className="text-white font-medium">{route.waypointCount || 0}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Clock className="w-4 h-4 text-green-400" />
                    <span>预计时长</span>
                  </div>
                  <span className="text-white font-medium">{route.estimated_duration || 0}分钟</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span>创建时间</span>
                  </div>
                  <span className="text-white font-medium">
                    {route.createdAt ? new Date(route.createdAt).toLocaleDateString() : '未知'}
                  </span>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex space-x-3">
                <Button onClick={() => onEdit(route)} className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium">
                  <Edit className="w-4 h-4 mr-2" /> 编辑
                </Button>
                <Button onClick={() => onDelete(route)} variant="outline" className="border-red-500 text-red-400 hover:bg-red-500/10 hover:text-red-300">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>;
    })}
    </div>;
}