// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Input, Label, Button } from '@/components/ui';
// @ts-ignore;
import { Plus } from 'lucide-react';

export function WaypointForm({
  newWaypoint,
  onWaypointChange,
  onAddWaypoint,
  scenicCenter
}) {
  return <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-600 shadow-lg rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-blue-400 text-sm font-semibold">添加新航点</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 第一行：航点名称 */}
        <div>
          <Label className="text-gray-300 text-xs font-medium">航点名称</Label>
          <Input placeholder="航点名称" value={newWaypoint.name} onChange={e => onWaypointChange('name', e.target.value)} className="bg-gray-700 border-gray-600 text-white text-sm" />
        </div>
        
        {/* 第二行：飞行速度（单位m/s）默认5，悬停时长（秒）默认0 */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-gray-300 text-xs font-medium">飞行速度(m/s)</Label>
            <Input type="number" value={newWaypoint.flightSpeed} onChange={e => onWaypointChange('flightSpeed', e.target.value)} className="bg-gray-700 border-gray-600 text-white text-sm" />
          </div>
          <div>
            <Label className="text-gray-300 text-xs font-medium">悬停时长(秒)</Label>
            <Input type="number" value={newWaypoint.hoverDuration} onChange={e => onWaypointChange('hoverDuration', e.target.value)} className="bg-gray-700 border-gray-600 text-white text-sm" />
          </div>
        </div>
        
        {/* 第三行：纬度，经度，高度 */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-gray-300 text-xs font-medium">纬度</Label>
            <Input type="number" step="0.0001" value={newWaypoint.lat} onChange={e => onWaypointChange('lat', e.target.value)} className="bg-gray-700 border-gray-600 text-white text-sm" />
          </div>
          <div>
            <Label className="text-gray-300 text-xs font-medium">经度</Label>
            <Input type="number" step="0.0001" value={newWaypoint.lng} onChange={e => onWaypointChange('lng', e.target.value)} className="bg-gray-700 border-gray-600 text-white text-sm" />
          </div>
          <div>
            <Label className="text-gray-300 text-xs font-medium">高度(米)</Label>
            <Input type="number" value={newWaypoint.altitude} onChange={e => onWaypointChange('altitude', e.target.value)} className="bg-gray-700 border-gray-600 text-white text-sm" />
          </div>
        </div>
        <Button onClick={onAddWaypoint} className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
          <Plus className="w-4 h-4 mr-1" /> 添加航点
        </Button>
      </CardContent>
    </Card>;
}