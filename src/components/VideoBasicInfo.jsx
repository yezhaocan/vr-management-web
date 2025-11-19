// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Input, Label, Textarea, Button } from '@/components/ui';
// @ts-ignore;
import { Clock } from 'lucide-react';

export function VideoBasicInfo({
  formData,
  handleInputChange,
  handleDurationChange,
  updateDuration
}) {
  // 检查是否应该显示时长字段（有开始时间和结束时间）
  const shouldShowDuration = formData.startTime && formData.endTime;
  return <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-white text-lg font-medium">录像名称 *</Label>
          <Input id="name" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} placeholder="请输入录像名称" className="bg-gray-800 border-gray-700 text-white mt-2 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
        </div>

        <div>
          <Label htmlFor="description" className="text-white text-lg font-medium">描述</Label>
          <Textarea id="description" value={formData.description} onChange={e => handleInputChange('description', e.target.value)} placeholder="请输入录像描述" className="bg-gray-800 border-gray-700 text-white mt-2 p-3 rounded-lg h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="startTime" className="text-white text-lg font-medium">开始时间</Label>
            <Input id="startTime" type="datetime-local" value={formData.startTime} onChange={e => handleInputChange('startTime', e.target.value)} className="bg-gray-800 border-gray-700 text-white mt-2 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div>
            <Label htmlFor="endTime" className="text-white text-lg font-medium">结束时间</Label>
            <Input id="endTime" type="datetime-local" value={formData.endTime} onChange={e => handleInputChange('endTime', e.target.value)} className="bg-gray-800 border-gray-700 text-white mt-2 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
        </div>

        {/* 时长字段 - 只在有开始时间和结束时间时显示 */}
        {shouldShowDuration && <div className="pt-4 border-t border-gray-600">
            <div className="space-y-3">
              <Label className="text-white text-lg font-medium flex items-center">
                <Clock className="h-5 w-5 mr-2 text-orange-400" />
                录像时长 (HH:MM:SS)
              </Label>
              <div className="flex items-center space-x-4">
                <Input type="text" value={formData.duration} onChange={e => handleDurationChange(e.target.value)} placeholder="01:10:00" pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$" className="bg-gray-800 border-gray-700 text-white p-3 rounded-lg w-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <Button type="button" onClick={updateDuration} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm">
                  自动计算
                </Button>
              </div>
              <p className="text-gray-400 text-sm">
                格式：HH:MM:SS（如01:10:00表示1小时10分钟），点击"自动计算"可根据开始和结束时间计算时长
              </p>
            </div>
          </div>}
      </div>
    </div>;
}