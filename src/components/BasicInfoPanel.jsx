// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Input, Textarea, Label } from '@/components/ui';

export function BasicInfoPanel({
  formData,
  onInputChange
}) {
  return <div className="space-y-6">
      <div>
        <Label className="text-white text-sm font-medium mb-2 block">航线名称</Label>
        <Input placeholder="请输入航线名称" value={formData.name} onChange={e => onInputChange('name', e.target.value)} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20" />
      </div>

      <div>
        <Label className="text-white text-sm font-medium mb-2 block">航线描述</Label>
        <Textarea placeholder="请输入航线描述" value={formData.description} onChange={e => onInputChange('description', e.target.value)} rows={4} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20" />
      </div>

      <div>
        <Label className="text-white text-sm font-medium mb-2 block">预计飞行时长（分钟）</Label>
        <Input type="number" placeholder="例如：15" value={formData.estimated_duration} onChange={e => onInputChange('estimated_duration', e.target.value)} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20" />
      </div>
    </div>;
}