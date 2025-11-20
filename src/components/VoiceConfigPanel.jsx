// @ts-ignore;
import React, { useState } from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Textarea, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Button, useToast } from '@/components/ui';
// @ts-ignore;
import { Upload, FileText, X } from 'lucide-react';

// @ts-ignore;
import { VoiceSynthesisComponent } from './VoiceSynthesisComponent';
export function VoiceConfigPanel({
  waypoint,
  onVoiceConfigChange,
  onSynthesisComplete,
  $w
}) {
  const {
    toast
  } = useToast();
  const [uploadingSubtitle, setUploadingSubtitle] = useState(false);
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

  // 检查文件是否为字幕文件
  const isSubtitleFile = file => {
    if (!file) return false;

    // 获取文件扩展名（小写）
    const extension = file.name.toLowerCase().split('.').pop();

    // 支持的字幕文件扩展名
    const subtitleExtensions = ['srt', 'vtt', 'ass', 'ssa', 'txt', 'sub'];

    // 检查文件类型或扩展名
    const fileType = file.type.toLowerCase();
    const isTextType = fileType.startsWith('text/') || fileType.includes('subtitle');
    const isSubtitleExtension = subtitleExtensions.includes(extension);
    return isTextType || isSubtitleExtension;
  };

  // 上传字幕文件到云存储
  const handleSubtitleUpload = async event => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 校验字幕文件类型
    if (!isSubtitleFile(file)) {
      toast({
        title: '文件类型错误',
        description: '请上传字幕文件（支持srt、vtt、ass、ssa、txt等格式）',
        variant: 'destructive'
      });
      return;
    }
    try {
      setUploadingSubtitle(true);
      const tcb = await $w.cloud.getCloudInstance();
      // 生成文件名
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'srt';
      const fileName = `airline_subtitles/subtitle_${timestamp}_${Math.random().toString(36).substring(2, 8)}.${fileExtension}`;
      // 上传到云存储
      const uploadResult = await tcb.uploadFile({
        cloudPath: fileName,
        filePath: file
      });
      // 获取文件ID和临时访问URL
      const fileId = uploadResult.fileID;
      const tempUrlResult = await tcb.getTempFileURL({
        fileList: [fileId]
      });
      // 更新语音配置
      onVoiceConfigChange('subtitleFileId', fileId);
      onVoiceConfigChange('subtitleUrl', tempUrlResult.fileList[0].tempFileURL);
      toast({
        title: '字幕文件上传成功',
        description: `文件已上传到云存储，ID: ${fileId.substring(0, 12)}...`,
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: '文件上传失败',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUploadingSubtitle(false);
      // 清空文件输入
      event.target.value = '';
    }
  };

  // 移除字幕文件
  const handleRemoveSubtitle = () => {
    onVoiceConfigChange('subtitleFileId', '');
    onVoiceConfigChange('subtitleUrl', '');
    toast({
      title: '字幕文件已移除',
      description: '字幕文件已从配置中移除',
      variant: 'default'
    });
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
            <VoiceSynthesisComponent text={voiceGuide.text} voice={voiceGuide.voice} onSynthesisComplete={onSynthesisComplete} $w={$w} waypointName={waypoint.name} currentFileId={voiceGuide.audioFileId} />

            {/* 字幕文件上传区域（新增） */}
            <div className="space-y-3 pt-4 border-t border-gray-600">
              <Label className="text-gray-300 text-xs font-medium">字幕文件（可选）</Label>
              
              {/* 字幕文件预览 */}
              {voiceGuide.subtitleFileId && <div className="relative">
                  <div className="flex items-center space-x-2 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <FileText className="h-4 w-4 text-purple-400" />
                    <div className="flex-1">
                      <span className="text-purple-400 text-sm font-medium">字幕文件已准备</span>
                      <p className="text-purple-400/70 text-xs mt-1">文件ID: {voiceGuide.subtitleFileId.substring(0, 20)}...</p>
                    </div>
                    <Button type="button" onClick={handleRemoveSubtitle} className="px-2 py-1 border border-red-400 text-red-400 hover:bg-red-400/10 bg-transparent">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>}

              {/* 字幕文件上传控件 */}
              <div className="relative">
                <input type="file" accept=".srt,.vtt,.ass,.ssa,.txt,.sub" onChange={handleSubtitleUpload} className="hidden" id="subtitle-file-upload" disabled={uploadingSubtitle} />
                <label htmlFor="subtitle-file-upload" className={`flex flex-col items-center justify-center w-full h-16 border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer group ${uploadingSubtitle ? 'border-gray-400/50 bg-gray-900/10 cursor-not-allowed' : 'border-purple-400/50 bg-purple-900/10 hover:bg-purple-900/20'}`}>
                  <div className="flex flex-col items-center justify-center">
                    <Upload className={`w-5 h-5 mb-1 transition-colors ${uploadingSubtitle ? 'text-gray-400' : 'text-purple-400 group-hover:text-purple-300'}`} />
                    <span className={`font-medium text-sm ${uploadingSubtitle ? 'text-gray-400' : 'text-purple-300'}`}>
                      {uploadingSubtitle ? '上传中...' : '选择字幕文件上传'}
                    </span>
                    <span className={`text-xs mt-1 ${uploadingSubtitle ? 'text-gray-400/70' : 'text-purple-400/70'}`}>
                      支持srt、vtt、ass、ssa、txt等格式
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>}
      </CardContent>
    </Card>;
}