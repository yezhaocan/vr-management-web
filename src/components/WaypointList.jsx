// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Button, Badge } from '@/components/ui';
// @ts-ignore;
import { Edit, Trash2, MapPin, Volume2, Music, Clock, ArrowUpDown } from 'lucide-react';

export function WaypointList({
  waypoints,
  onEdit,
  onDelete,
  onReorder,
  hasVoiceGuide,
  hasBackgroundMusic
}) {
  if (!waypoints || waypoints.length === 0) {
    return <div className="text-center py-8">
        <div className="text-gray-500 text-lg">暂无航点数据</div>
        <div className="text-gray-400 text-sm mt-2">点击"添加航点"开始规划航线</div>
      </div>;
  }

  // 格式化经纬度坐标，精确到小数点后6位
  const formatCoordinate = coord => {
    if (coord === null || coord === undefined) return '未知';
    return parseFloat(coord).toFixed(6);
  };

  // 检查单个航点是否有语音讲解
  const checkWaypointVoiceGuide = waypoint => {
    return waypoint.voiceGuide && waypoint.voiceGuide.enabled === true;
  };
  return <div className="space-y-4">
      {waypoints.map((waypoint, index) => {
      const hasVoice = checkWaypointVoiceGuide(waypoint);
      return <div key={waypoint._id || index} className="bg-gray-800/30 backdrop-blur-sm border border-gray-600 rounded-xl p-4 hover:border-gray-500 transition-all duration-300">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-full border border-blue-500/40">
                  <span className="text-blue-400 font-bold text-sm">{index + 1}</span>
                </div>
                <div>
                  <h4 className="text-white font-medium text-lg">{waypoint.name || `航点 ${index + 1}`}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary" className="bg-gray-600/30 text-gray-300 text-xs">
                      {waypoint.altitude || 0}米
                    </Badge>
                    {hasVoice && <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                        <Volume2 className="w-3 h-3 mr-1" /> 语音讲解
                      </Badge>}
                  </div>
                </div>
              </div>

              {/* 航点描述 */}
              {waypoint.description && <p className="text-gray-400 text-sm mb-3 line-clamp-2">{waypoint.description}</p>}

              {/* 坐标信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-400">经度:</span>
                  <span className="text-white font-mono">{formatCoordinate(waypoint.longitude)}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="w-4 h-4 text-green-400" />
                  <span className="text-gray-400">纬度:</span>
                  <span className="text-white font-mono">{formatCoordinate(waypoint.latitude)}</span>
                </div>
              </div>

              {/* 其他信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-400">
                {waypoint.altitude && <div className="flex items-center space-x-2">
                    <span>海拔:</span>
                    <span className="text-white">{waypoint.altitude}米</span>
                  </div>}
                {waypoint.heading !== undefined && <div className="flex items-center space-x-2">
                    <span>朝向:</span>
                    <span className="text-white">{waypoint.heading}°</span>
                  </div>}
                {waypoint.duration && <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>停留时间:</span>
                    <span className="text-white">{waypoint.duration}秒</span>
                  </div>}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex space-x-2 ml-4">
              <Button variant="outline" size="sm" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300" onClick={() => onEdit(waypoint, index)}>
                <Edit className="w-3 h-3 mr-1" />
                编辑
              </Button>
              <Button variant="outline" size="sm" className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300" onClick={() => onDelete(index)}>
                <Trash2 className="w-3 h-3 mr-1" />
                删除
              </Button>
            </div>
          </div>

          {/* 排序控制 */}
          {onReorder && <div className="flex justify-end space-x-2 pt-2 border-t border-gray-600/50">
              {index > 0 && <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={() => onReorder(index, index - 1)}>
                  <ArrowUpDown className="w-3 h-3 mr-1" />
                  上移
                </Button>}
              {index < waypoints.length - 1 && <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={() => onReorder(index, index + 1)}>
                  <ArrowUpDown className="w-3 h-3 mr-1" />
                  下移
                </Button>}
            </div>}
        </div>;
    })}
    </div>;
}