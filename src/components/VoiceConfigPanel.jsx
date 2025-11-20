// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Textarea, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch } from '@/components/ui';

// @ts-ignore;
import { VoiceSynthesisComponent } from './VoiceSynthesisComponent';
export function VoiceConfigPanel({
  waypoint,
  onVoiceConfigChange,
  onSynthesisComplete,
  $w
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
    subtitleFileId: '',
    subtitleUrl: ''
  };

  // 处理语音合成完成回调
  const handleSynthesisComplete = fileData => {
    if (onSynthesisComplete) {
      onSynthesisComplete({
        ...voiceGuide,
        ...fileData
      });
    }
  };
  return <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-600 shadow-lg rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-blue-400 text-sm font-semibold">配置 {waypoint.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch checked={voiceGuide.enabled} onCheckedChange={checked => onVoiceConfigChange('enabled', checked)} />
          <Label className="text-white">启用语音讲解</Label>
        </div>

        {voiceGuide.enabled && <div className="space-y-4">
            <div>
              <Label className="text-gray-300 text-xs font-medium">文字稿</Label>
              <Textarea placeholder="请输入语音讲解文字" value={voiceGuide.text} onChange={e => onVoiceConfigChange('text', e.target.value)} rows={3} className="bg-gray-700 border-gray-600 text-white text-sm" />
            </div>

            {/* 三个配置项放在同一行 */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-gray-300 text-xs font-medium">人物形象</Label>
                <Select value={voiceGuide.character} onValueChange={value => onVoiceConfigChange('character', value)}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600 text-white">
                    <SelectItem value="导游" className="text-white hover:bg-gray-700">导游</SelectItem>
                    <SelectItem value="讲解员" className="text-white hover:bg-gray-700">讲解员</SelectItem>
                    <SelectItem value="卡通人物" className="text-white hover:bg-gray-700">卡通人物</SelectItem>
                    <SelectItem value="历史人物" className="text-white hover:bg-gray-700">历史人物</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300 text-xs font-medium">人物音色</Label>
                <Select value={voiceGuide.voice} onValueChange={value => onVoiceConfigChange('voice', value)}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600 text-white">
                    <SelectItem value="男声" className="text-white hover:bg-gray-700">男声</SelectItem>
                    <SelectItem value="女声" className="text-white hover:bg-gray-700">女声</SelectItem>
                    <SelectItem value="童声" className="text-white hover:bg-gray-700">童声</SelectItem>
                    <SelectItem value="老人声" className="text-white hover:bg-gray-700">老人声</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300 text-xs font-medium">播放时机</Label>
                <Select value={voiceGuide.triggerType} onValueChange={value => onVoiceConfigChange('triggerType', value)}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600 text-white">
                    <SelectItem value="time" className="text-white hover:bg-gray-700">飞行时间</SelectItem>
                    <SelectItem value="position" className="text-white hover:bg-gray-700">飞行位置</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 语音合成组件 - 传递当前航点的文件ID */}
            <VoiceSynthesisComponent text={voiceGuide.text} voice={voiceGuide.voice} onSynthesisComplete={handleSynthesisComplete} $w={$w} waypointName={waypoint.name} currentFileId={voiceGuide.audioFileId} />
          </div>}
      </CardContent>
    </Card>;
}