import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Input,
  Label,
  Textarea,
  Card,
  CardContent,
  Badge,
  useToast,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Button,
} from '@/components/ui';
import {
  Upload,
  Megaphone,
  Clock,
  Plus,
  Trash2,
  CheckCircle,
  Play,
  Download,
  Volume2,
  FileText,
  Wand2,
  FileDown,
  PlayCircle,
  ArrowRight,
} from 'lucide-react';
import { generateAlignedSrt } from '@/lib/subtitle-alignment';

// 表单验证规则
const validationRules = {
  triggerTime: {
    required: '请输入触发时间',
    min: {
      value: 0,
      message: '触发时间必须大于等于0',
    },
    valueAsNumber: true,
  },
  text: {
    required: '请输入播报内容',
    minLength: {
      value: 1,
      message: '播报内容不能为空',
    },
  },
  audioFileId: {
    required: '请上传音频文件',
  },
};

export function BroadcastManager({ broadcasts, onBroadcastsChange, $w }) {
  const [tempFiles, setTempFiles] = useState({
    audio: null,
    subtitle: null,
  });
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingSubtitle, setUploadingSubtitle] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSrt, setGeneratedSrt] = useState('');
  const [synthesizedAudio, setSynthesizedAudio] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [showDownloadButton, setShowDownloadButton] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      triggerTime: '',
      text: '',
      audioFileId: '',
      audioUrl: '',
      subtitleFileId: '',
      subtitleUrl: '',
    },
    mode: 'onChange',
  });

  // 添加播报
  const onAddBroadcast = (data) => {
    // 手动验证
    const errors = {};

    // 验证触发时间
    const triggerTime = parseFloat(data.triggerTime);
    if (!data.triggerTime || isNaN(triggerTime) || triggerTime < 0) {
      errors.triggerTime = '触发时间必须大于等于0';
    }

    // 验证文字稿
    if (!data.text || data.text.trim().length === 0) {
      errors.text = '请输入播报内容';
    }

    // 验证音频文件
    if (!data.audioFileId || data.audioFileId.trim().length === 0) {
      errors.audioFileId = '请上传音频文件';
    }

    // 如果有错误，设置表单错误并返回
    if (Object.keys(errors).length > 0) {
      Object.keys(errors).forEach((field) => {
        form.setError(field, { message: errors[field] });
      });
      return;
    }

    // 构建播报对象
    const broadcast = {
      id: Date.now(),
      triggerTime: parseInt(data.triggerTime),
      text: data.text,
      audioFileId: data.audioFileId,
      subtitleFileId: data.subtitleFileId || '',
      // 附加临时文件数据，供父组件在最终提交时上传
      tempFiles: {
        audio: tempFiles.audio,
        subtitle: tempFiles.subtitle,
      },
    };

    onBroadcastsChange([...broadcasts, broadcast]);

    // 重置状态
    form.reset({
      triggerTime: '',
      text: '',
      audioFileId: '',
      audioUrl: '',
      subtitleFileId: '',
      subtitleUrl: '',
    });
    setTempFiles({ audio: null, subtitle: null });
    setSynthesizedAudio(null);
    setAudioBlob(null);
    setShowDownloadButton(false);
    setGeneratedSrt('');

    toast({
      title: '播报添加成功',
      description: `第${broadcast.triggerTime}秒播报已添加 (等待最终保存时上传)`,
    });
  };

  // 删除播报
  const deleteBroadcast = (index) => {
    const updatedBroadcasts = broadcasts.filter((_, i) => i !== index);
    onBroadcastsChange(updatedBroadcasts);
    toast({
      title: '播报已删除',
      description: '播报点已从列表中移除',
    });
  };

  // 智能生成功能
  const handleSmartGenerate = async () => {
    const text = form.getValues('text');
    if (!text || text.trim() === '') {
      toast({
        title: '文字稿为空',
        description: '请先输入要生成的文字稿',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsGenerating(true);

      // 清理之前的状态
      setSynthesizedAudio(null);
      setAudioBlob(null);
      setGeneratedSrt('');
      setShowDownloadButton(false);

      // 调用智能生成接口
      const { srt, audioBlob } = await generateAlignedSrt(text);

      // 创建音频URL用于预览
      const audioUrl = URL.createObjectURL(audioBlob);

      setAudioBlob(audioBlob);
      setSynthesizedAudio(audioUrl);
      setGeneratedSrt(srt);
      setShowDownloadButton(true);

      // 生成临时文件ID
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const tempAudioId = `temp_audio_${timestamp}_${randomStr}`;
      const tempSubtitleId = `temp_subtitle_${timestamp}_${randomStr}`;

      // 创建字幕 Blob
      const srtBlob = new Blob([srt], { type: 'text/plain' });
      const srtUrl = URL.createObjectURL(srtBlob);

      // 更新临时文件状态
      setTempFiles({
        audio: audioBlob,
        subtitle: srtBlob,
      });

      // 更新表单状态
      form.setValue('audioFileId', tempAudioId);
      form.setValue('audioUrl', audioUrl);
      form.setValue('subtitleFileId', tempSubtitleId);
      form.setValue('subtitleUrl', srtUrl);

      // 清除音频文件的验证错误
      form.clearErrors('audioFileId');

      toast({
        title: '智能生成成功',
        description: '音频和字幕已生成，将在最终保存时上传',
        variant: 'default',
      });
    } catch (error) {
      console.error('智能生成失败:', error);
      toast({
        title: '生成失败',
        description: error.message || '请重试',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 预览音频
  const handlePreviewAudio = () => {
    if (synthesizedAudio) {
      const audio = new Audio(synthesizedAudio);
      audio.play().catch((e) => {
        toast({
          title: '播放失败',
          description: '无法播放音频',
          variant: 'destructive',
        });
      });
    }
  };

  // 下载 SRT
  const handleDownloadSrt = () => {
    if (!generatedSrt) return;
    try {
      const blob = new Blob([generatedSrt], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `subtitle_${form.getValues('triggerTime') || 'generated'}_${Date.now()}.srt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: '下载成功',
        description: 'SRT字幕文件已下载',
        variant: 'default',
      });
    } catch (error) {
      console.error('SRT下载失败:', error);
      toast({
        title: '下载失败',
        description: '文件下载过程中出现错误',
        variant: 'destructive',
      });
    }
  };

  // 下载合成的音频文件
  const handleDownloadAudio = () => {
    if (!audioBlob) return;
    try {
      const link = document.createElement('a');
      link.href = synthesizedAudio;
      link.download = `播报音频_${form.getValues('triggerTime') || '未命名'}_${Date.now()}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: '下载成功',
        description: '音频文件已开始下载，请上传到云存储',
        variant: 'default',
      });
    } catch (error) {
      console.error('下载失败:', error);
      toast({
        title: '下载失败',
        description: '文件下载过程中出现错误',
        variant: 'destructive',
      });
    }
  };

  // 检查文件是否为音频文件（忽略大小写，支持WEBM）
  const isAudioFile = (file) => {
    if (!file) return false;
    const extension = file.name.toLowerCase().split('.').pop();
    const audioExtensions = ['webm', 'mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'mpeg'];
    const fileType = file.type.toLowerCase();
    const isAudioType = fileType.startsWith('audio/');
    const isAudioExtension = audioExtensions.includes(extension);
    return isAudioType || isAudioExtension;
  };

  // 检查文件是否为字幕文件
  const isSubtitleFile = (file) => {
    if (!file) return false;
    const extension = file.name.toLowerCase().split('.').pop();
    const subtitleExtensions = ['srt', 'vtt', 'ass', 'ssa', 'txt', 'sub'];
    const fileType = file.type.toLowerCase();
    const isTextType = fileType.startsWith('text/') || fileType.includes('subtitle');
    const isSubtitleExtension = subtitleExtensions.includes(extension);
    return isTextType || isSubtitleExtension;
  };

  // 上传音频文件到本地暂存（统一处理合成音频和本地文件）
  const handleAudioUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isAudioFile(file)) {
      toast({
        title: '文件类型错误',
        description: '请上传音频文件（支持webm、mp3、wav、ogg、m4a等格式）',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploadingAudio(true);

      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const tempId = `temp_audio_manual_${timestamp}_${randomStr}`;
      const tempUrl = URL.createObjectURL(file);

      setTempFiles((prev) => ({
        ...prev,
        audio: file,
      }));

      form.setValue('audioFileId', tempId);
      form.setValue('audioUrl', tempUrl);

      // 清除音频文件的验证错误
      form.clearErrors('audioFileId');

      setSynthesizedAudio(null);
      setAudioBlob(null);
      setShowDownloadButton(false);

      toast({
        title: '音频文件已选择',
        description: '将在最终保存时上传',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: '文件处理失败',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploadingAudio(false);
      event.target.value = '';
    }
  };

  // 上传字幕文件到本地暂存
  const handleSubtitleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isSubtitleFile(file)) {
      toast({
        title: '文件类型错误',
        description: '请上传字幕文件（支持srt、vtt、ass、ssa、txt等格式）',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploadingSubtitle(true);

      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const tempId = `temp_subtitle_manual_${timestamp}_${randomStr}`;
      const tempUrl = URL.createObjectURL(file);

      setTempFiles((prev) => ({
        ...prev,
        subtitle: file,
      }));

      form.setValue('subtitleFileId', tempId);
      form.setValue('subtitleUrl', tempUrl);

      toast({
        title: '字幕文件已选择',
        description: '将在最终保存时上传',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: '文件处理失败',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploadingSubtitle(false);
      event.target.value = '';
    }
  };

  // 移除音频文件
  const handleRemoveAudio = () => {
    form.setValue('audioFileId', '');
    form.setValue('audioUrl', '');
    setTempFiles((prev) => ({
      ...prev,
      audio: null,
    }));

    setSynthesizedAudio(null);
    setAudioBlob(null);
    setShowDownloadButton(false);

    toast({
      title: '音频文件已移除',
      description: '音频文件已从配置中移除',
      variant: 'default',
    });
  };

  // 移除字幕文件
  const handleRemoveSubtitle = () => {
    form.setValue('subtitleFileId', '');
    form.setValue('subtitleUrl', '');
    setTempFiles((prev) => ({
      ...prev,
      subtitle: null,
    }));
    toast({
      title: '字幕文件已移除',
      description: '字幕文件已从配置中移除',
      variant: 'default',
    });
  };

  const audioFileId = form.watch('audioFileId');
  const subtitleFileId = form.watch('subtitleFileId');

  return (
    <div className="h-full flex flex-col">
      {/* 标题区域 */}
      <div className="flex items-center mb-6">
        <h3 className="text-xl font-semibold text-foreground flex items-center">
          <Megaphone className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-2" />
          播报管理
        </h3>
      </div>

      {/* 穿梭框布局 - 5-2-5 网格 */}
      <div className="flex-1 grid grid-cols-12 gap-4 items-start">
        {/* 左侧：配置区域 (5/12) */}
        <div className="col-span-5">
          <Card className="h-full border-2 border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-semibold text-lg text-foreground">配置播报</h4>
              </div>

              <Form {...form}>
                <div className="space-y-5">
                  {/* 触发时间 */}
                  <FormField
                    control={form.control}
                    name="triggerTime"
                    rules={validationRules.triggerTime}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">触发时间（秒）</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="10"
                            min="0"
                            {...field}
                            className="border-2"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 文字稿 */}
                  <FormField
                    control={form.control}
                    name="text"
                    rules={validationRules.text}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">播报内容</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="输入播报文字"
                            className="h-24 resize-none border-2"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 智能生成 */}
                  <Button
                    type="button"
                    onClick={handleSmartGenerate}
                    disabled={isGenerating}
                    variant="default"
                    className="w-full font-medium bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                        生成中...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        智能生成
                      </>
                    )}
                  </Button>

                  {/* 生成后操作 */}
                  {showDownloadButton && (
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        type="button"
                        onClick={handlePreviewAudio}
                        variant="outline"
                        size="sm"
                        className="border-2 border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                      >
                        <PlayCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        onClick={handleDownloadAudio}
                        variant="outline"
                        size="sm"
                        className="border-2 border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        onClick={handleDownloadSrt}
                        variant="outline"
                        size="sm"
                        className="border-2 border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950"
                      >
                        <FileDown className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* 音频上传 */}
                  <FormField
                    control={form.control}
                    name="audioFileId"
                    rules={validationRules.audioFileId}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">音频文件</FormLabel>
                        {!audioFileId ? (
                          <div className="relative">
                            <input
                              type="file"
                              accept="audio/*,.webm,.mp3,.wav,.ogg,.m4a,.aac,.flac,.mpeg"
                              onChange={handleAudioUpload}
                              className="hidden"
                              id="audio-file-upload"
                              disabled={uploadingAudio}
                            />
                            <label
                              htmlFor="audio-file-upload"
                              className="flex items-center justify-center w-full h-14 border-2 border-dashed border-muted-foreground/40 rounded-lg cursor-pointer hover:border-muted-foreground/60 transition-all"
                            >
                              <Upload className="w-5 h-5 mr-2 text-muted-foreground" />
                              <span className="text-sm font-medium text-muted-foreground">
                                {uploadingAudio ? '处理中...' : '选择音频文件'}
                              </span>
                            </label>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-3 bg-muted rounded-lg border-2 border-green-600">
                            <div className="flex items-center">
                              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                              <span className="text-sm font-medium">音频已准备</span>
                            </div>
                            <Button
                              type="button"
                              onClick={handleRemoveAudio}
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        <FormControl>
                          <Input type="hidden" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 字幕上传（可选） */}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      字幕文件（可选）
                    </Label>
                    {!subtitleFileId ? (
                      <div className="relative mt-2">
                        <input
                          type="file"
                          accept=".srt,.vtt,.ass,.ssa,.txt,.sub"
                          onChange={handleSubtitleUpload}
                          className="hidden"
                          id="subtitle-file-upload"
                          disabled={uploadingSubtitle}
                        />
                        <label
                          htmlFor="subtitle-file-upload"
                          className="flex items-center justify-center w-full h-12 border-2 border-muted-foreground/40 rounded-lg cursor-pointer hover:border-muted-foreground/60 transition-all"
                        >
                          <Upload className="w-4 h-4 mr-2 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {uploadingSubtitle ? '处理中...' : '选择字幕文件'}
                          </span>
                        </label>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg border-2 border-blue-500 mt-2">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 mr-2 text-blue-500" />
                          <span className="text-sm font-medium">字幕已准备</span>
                        </div>
                        <Button
                          type="button"
                          onClick={handleRemoveSubtitle}
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* 中间：穿梭操作区域 (2/12) */}
        <div className="col-span-2 flex items-center justify-center h-full">
          <div className="flex flex-col items-center space-y-2">
            <Button
              type="button"
              onClick={form.handleSubmit(onAddBroadcast)}
              variant="default"
              size="lg"
              className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-orange-500 hover:bg-orange-600 border-4 border-background"
            >
              <ArrowRight className="h-6 w-6 text-white" />
            </Button>
            <span className="text-xs font-medium text-center text-muted-foreground uppercase tracking-wider">
              添加
            </span>
          </div>
        </div>

        {/* 右侧：播报列表区域 (5/12) */}
        <div className="col-span-5">
          <Card className="h-full border-2 border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-semibold text-lg text-foreground">播报列表</h4>
                <Badge className="px-3 py-1 font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                  {broadcasts.length} 个播报点
                </Badge>
              </div>

              {broadcasts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
                  <Megaphone className="h-16 w-16 mb-4 opacity-40" />
                  <p className="font-medium">暂无播报配置</p>
                  <p className="text-sm mt-2">从左侧添加播报点</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[calc(100vh-240px)] overflow-y-auto pr-2">
                  {broadcasts.map((broadcast, index) => (
                    <Card
                      key={broadcast.id}
                      className="border-l-4 border-l-orange-500 border-2 hover:shadow-md transition-shadow duration-200"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="flex items-center space-x-2 mt-1">
                              <Clock className="h-5 w-5 text-orange-500" />
                              <span className="font-bold text-base text-foreground">
                                {broadcast.triggerTime}s
                              </span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm leading-relaxed text-foreground">
                                {broadcast.text}
                              </p>

                              <div className="flex items-center space-x-3 mt-3">
                                {broadcast.audioFileId && (
                                  <div className="flex items-center px-2 py-1 rounded bg-green-100 dark:bg-green-500/20">
                                    <Volume2 className="h-3 w-3 mr-1 text-green-600" />
                                    <span className="text-xs font-medium text-green-600">音频</span>
                                  </div>
                                )}
                                {broadcast.subtitleFileId && (
                                  <div className="flex items-center px-2 py-1 rounded bg-blue-100 dark:bg-blue-500/20">
                                    <FileText className="h-3 w-3 mr-1 text-blue-600" />
                                    <span className="text-xs font-medium text-blue-600">字幕</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            {/* 预览按钮 */}
                            {broadcast.tempFiles?.audio && (
                              <Button
                                type="button"
                                onClick={() => {
                                  const audioUrl = URL.createObjectURL(broadcast.tempFiles.audio);
                                  const audio = new Audio(audioUrl);
                                  audio.play().catch((e) => {
                                    toast({
                                      title: '播放失败',
                                      description: '无法播放音频',
                                      variant: 'destructive',
                                    });
                                  });
                                }}
                                variant="outline"
                                size="sm"
                                className="border-2 border-orange-500 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950"
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}

                            <Button
                              type="button"
                              onClick={() => deleteBroadcast(index)}
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
