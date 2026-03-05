// @ts-ignore;
import {useEffect} from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Textarea, Label, Switch } from '@/components/ui';

// @ts-ignore;
import { VoiceSynthesisComponent } from './VoiceSynthesisComponent';
export function VoiceConfigPanel({
  waypoint,
  onVoiceConfigChange,
  onSynthesisComplete,
  $w,
  tempFileStorage = new Map() // 新增：临时文件存储
}) {
  if (!waypoint) {
    return <div className="text-center py-8">
        <p className="text-gray-400">请选择一个航点进行语音配置</p>
      </div>;
  }

  // 修复：确保voiceGuide字段存在且包含所有必要的子字段
  const voiceGuide = waypoint.voiceGuide || {
    enabled: false,
    text: '',
    character: '导游',
    voice: '女声',
    triggerType: 'time',
    audioFileId: '',
    audioUrl: '',
    subtitleFileId: ''
  };
  return <div className="space-y-6">
    <Card className="bg-card border-border shadow-sm rounded-lg h-full overflow-hidden">
      <CardHeader className="pb-3 border-b border-border">
        <CardTitle className="text-primary text-sm font-semibold">语音配置</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6 overflow-y-auto">
        <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border border-border">
          <Label className="text-foreground text-sm font-medium">启用语音讲解</Label>
          <Switch checked={voiceGuide.enabled} onCheckedChange={checked => onVoiceConfigChange('enabled', checked)} />
        </div>

        {voiceGuide.enabled && <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
              <Label className="text-foreground text-sm font-medium">文字稿</Label>
              <Textarea placeholder="请输入语音讲解文字（最多500字）" value={voiceGuide.text} onChange={e => onVoiceConfigChange('text', e.target.value)} rows={4} maxLength={500} className="common-input resize-y min-h-[100px]" />
              <div className="text-right text-xs text-muted-foreground">
                {voiceGuide.text.length}/500
              </div>
            </div>

            {/* 语音合成组件 - 包含语音文件上传和时长显示 */}
            <div className="pt-2 border-t border-border mt-6">
              <Label className="text-foreground text-sm font-medium mb-4 block">语音设置</Label>
              <VoiceSynthesisComponent 
                text={voiceGuide.text} 
                onSynthesisComplete={onSynthesisComplete} 
                onVoiceConfigChange={onVoiceConfigChange}
                $w={$w} 
                waypointName={waypoint.name} 
                currentAudioFileId={voiceGuide.audioFileId}
                currentSubtitleFileId={voiceGuide.subtitleFileId}
                tempFileStorage={tempFileStorage}
              />
            </div>
          </div>}
      </CardContent>
    </Card>
  </div>;
}