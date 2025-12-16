// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Input, Label, Button, useToast } from '@/components/ui';
// @ts-ignore;
import { Plus } from 'lucide-react';

export function WaypointForm({
  newWaypoint,
  onWaypointChange,
  onAddWaypoint,
  scenicCenter
}) {
  const {
    toast
  } = useToast();

  // 坐标精度验证函数 - 确保8位小数精度
  const validateCoordinate = (value, type) => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      throw new Error(`无效的${type}坐标值`);
    }

    // 验证坐标范围
    if (type === '纬度' && (num < -90 || num > 90)) {
      throw new Error('纬度范围应在-90到90之间');
    }
    if (type === '经度' && (num < -180 || num > 180)) {
      throw new Error('经度范围应在-180到180之间');
    }

    // 返回8位小数精度
    return parseFloat(num.toFixed(8));
  };

  // 处理坐标输入变化
  const handleCoordinateChange = (field, value) => {
    try {
      if (value === '') {
        onWaypointChange(field, value);
        return;
      }
      const validatedValue = validateCoordinate(value, field === 'lat' ? '纬度' : '经度');
      onWaypointChange(field, validatedValue);
    } catch (error) {
      toast({
        title: '坐标验证失败',
        description: error.message,
        variant: 'destructive'
      });
      // 保持原值不变
      onWaypointChange(field, newWaypoint[field]);
    }
  };

  // 处理添加航点 - 验证所有数据
  const handleAddWaypoint = () => {
    try {
      if (!newWaypoint.name.trim()) {
        toast({
          title: '验证失败',
          description: '请输入航点名称',
          variant: 'destructive'
        });
        return;
      }

      // 验证坐标精度
      const validatedLat = validateCoordinate(newWaypoint.lat, '纬度');
      const validatedLng = validateCoordinate(newWaypoint.lng, '经度');

      // 验证其他数值字段
      const flightSpeed = parseFloat(newWaypoint.flightSpeed);
      const hoverDuration = parseFloat(newWaypoint.hoverDuration);
      const altitude = parseFloat(newWaypoint.altitude);
      if (isNaN(flightSpeed) || flightSpeed <= 0) {
        throw new Error('飞行速度必须为大于0的数字');
      }
      if (isNaN(hoverDuration) || hoverDuration < 0) {
        throw new Error('悬停时长必须为非负数');
      }
      if (isNaN(altitude) || altitude <= 0) {
        throw new Error('高度必须为大于0的数字');
      }

      // 创建验证后的航点数据
      const validatedWaypoint = {
        ...newWaypoint,
        lat: validatedLat,
        lng: validatedLng,
        flightSpeed: flightSpeed,
        hoverDuration: hoverDuration,
        altitude: altitude
      };

      // 调用添加航点函数
      onAddWaypoint(validatedWaypoint);
      toast({
        title: '航点添加成功',
        description: `航点"${newWaypoint.name}"已添加，坐标精度: 8位小数`,
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: '数据验证失败',
        description: error.message,
        variant: 'destructive'
      });
    }
  };
  return <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-600 shadow-lg rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-blue-400 text-sm font-semibold">添加新航点</CardTitle>
        <p className="text-gray-400 text-xs">坐标精度: 8位小数</p>
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
            <Input type="number" min="0.1" step="0.1" value={newWaypoint.flightSpeed} onChange={e => onWaypointChange('flightSpeed', e.target.value)} className="bg-gray-700 border-gray-600 text-white text-sm" />
          </div>
          <div>
            <Label className="text-gray-300 text-xs font-medium">悬停时长(秒)</Label>
            <Input type="number" min="0" step="0.1" value={newWaypoint.hoverDuration} onChange={e => onWaypointChange('hoverDuration', e.target.value)} className="bg-gray-700 border-gray-600 text-white text-sm" />
          </div>
        </div>
        
        {/* 第三行：纬度，经度，高度 */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-gray-300 text-xs font-medium">纬度</Label>
            <Input type="number" step="0.00000001" value={newWaypoint.lat} onChange={e => handleCoordinateChange('lat', e.target.value)} className="bg-gray-700 border-gray-600 text-white text-sm" title="支持8位小数精度" />
          </div>
          <div>
            <Label className="text-gray-300 text-xs font-medium">经度</Label>
            <Input type="number" step="0.00000001" value={newWaypoint.lng} onChange={e => handleCoordinateChange('lng', e.target.value)} className="bg-gray-700 border-gray-600 text-white text-sm" title="支持8位小数精度" />
          </div>
          <div>
            <Label className="text-gray-300 text-xs font-medium">高度(米)</Label>
            <Input type="number" min="1" step="1" value={newWaypoint.altitude} onChange={e => onWaypointChange('altitude', e.target.value)} className="bg-gray-700 border-gray-600 text-white text-sm" />
          </div>
        </div>
        <Button onClick={handleAddWaypoint} className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
          <Plus className="w-4 h-4 mr-1" /> 添加航点
        </Button>
      </CardContent>
    </Card>;
}