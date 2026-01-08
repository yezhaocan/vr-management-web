// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Input, Textarea, Label } from '@/components/ui';

export function BasicInfoPanel({
  formData,
  onInputChange
}) {
  return <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-foreground text-sm font-medium">航线名称</Label>
        <Input placeholder="请输入航线名称" value={formData.name} onChange={e => onInputChange('name', e.target.value)} className="bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-colors h-10" />
      </div>

      <div className="space-y-2">
        <Label className="text-foreground text-sm font-medium">航线描述</Label>
        <Textarea placeholder="请输入航线描述" value={formData.description} onChange={e => onInputChange('description', e.target.value)} rows={4} className="bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-colors min-h-[120px] resize-y" />
      </div>

      <div className="space-y-2">
        <Label className="text-foreground text-sm font-medium">预计飞行时长（分钟）</Label>
        <Input type="number" placeholder="例如：15" value={formData.estimated_duration} onChange={e => onInputChange('estimated_duration', e.target.value)} className="bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-colors h-10" />
      </div>
    </div>;
}