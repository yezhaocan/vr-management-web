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
  const [uploadingSubtitle, setUploadingSubtitle] = useState(false);
  const {
    toast
  } = useToast();
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
      // 获取文件ID
      const fileId = uploadResult.fileID;
      // 更新航点配置
      onVoiceConfigChange('subtitleFileId', fileId);
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
    toast({
      title: '字幕文件已移除',
      description: '字幕文件已从配置中移除',
      variant: 'default'
    });
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
              <VoiceSynthesisComponent text={voiceGuide.text} voice={voiceGuide.voice} onSynthesisComplete={onSynthesisComplete} $w={$w} waypointName={waypoint.name} currentFileId={voiceGuide.audioFileId} />
            </div>

            {/* 字幕文件上传区域 */}
            <div className="space-y-3 pt-6 border-t border-border">
              <Label className="text-foreground text-sm font-medium flex items-center">
                <FileText className="h-4 w-4 mr-2 text-primary" />
                字幕文件（可选）
              </Label>
              
              {/* 字幕文件预览 */}
              {voiceGuide.subtitleFileId && <div className="relative">
                  <div className="flex items-center space-x-3 p-3 bg-primary/5 rounded-lg border border-primary/20 transition-all hover:shadow-sm">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-foreground text-sm font-medium block">字幕文件已关联</span>
                      <p className="text-muted-foreground text-xs mt-0.5 truncate">ID: {voiceGuide.subtitleFileId}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleRemoveSubtitle} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>}

              {/* 字幕文件上传控件 */}
              <div className="relative group">
                <input type="file" accept=".srt,.vtt,.ass,.ssa,.txt,.sub" onChange={handleSubtitleUpload} className="hidden" id="subtitle-file-upload" disabled={uploadingSubtitle} />
                <label htmlFor="subtitle-file-upload" className={`flex flex-col items-center justify-center w-full h-24 border border-dashed rounded-lg transition-all duration-300 cursor-pointer ${uploadingSubtitle ? 'border-border bg-muted/50 cursor-not-allowed' : 'border-border bg-card hover:border-primary/50 hover:bg-accent/5 hover:shadow-sm'}`}>
                  <div className="flex flex-col items-center justify-center text-center p-4">
                    <Upload className={`w-5 h-5 mb-2 transition-transform duration-300 ${uploadingSubtitle ? 'text-muted-foreground' : 'text-primary group-hover:scale-110'}`} />
                    <span className={`font-medium text-sm ${uploadingSubtitle ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {uploadingSubtitle ? '上传中...' : '点击或拖拽上传字幕文件'}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      支持 srt, vtt, ass, ssa, txt
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>}
      </CardContent>
    </Card>
  </div>;
}