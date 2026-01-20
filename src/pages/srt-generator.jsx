import React, { useState } from 'react';
import { Button } from "@/components/ui";
import { Textarea } from "@/components/ui";
import { Input } from "@/components/ui";
import { Label } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { generateSRT, generateAlignedSrt } from "@/lib/subtitle-alignment";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const SrtGeneratorPage = () => {
  const [text, setText] = useState('');
  const [duration, setDuration] = useState('');
  const [result, setResult] = useState('');
  const [mode, setMode] = useState('simple'); // 'simple' | 'advanced'
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!text) {
      toast.error("请输入有效的文本");
      return;
    }

    try {
      if (mode === 'simple') {
        const dur = parseFloat(duration);
        if (isNaN(dur)) {
          toast.error("请输入有效的音频时长");
          return;
        }
        const srt = generateSRT(text, dur);
        setResult(srt);
        toast.success("生成成功");
      } else {
        // Advanced mode: TTS + ASR + Alignment
        setLoading(true);
        const srt = await generateAlignedSrt(text);
        setResult(srt);
        toast.success("智能生成成功");
      }
    } catch (error) {
      console.error(error);
      toast.error(`生成失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitle.srt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>SRT 字幕生成器</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 mb-4">
            <Button 
              variant={mode === 'simple' ? "default" : "outline"}
              onClick={() => setMode('simple')}
            >
              简单模式 (手动时长)
            </Button>
            <Button 
              variant={mode === 'advanced' ? "default" : "outline"}
              onClick={() => setMode('advanced')}
            >
              高级模式 (自动语音识别)
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="text">输入文本 {mode === 'advanced' && '(将自动进行 TTS 和 ASR)'}</Label>
            <Textarea 
              id="text"
              placeholder="请输入需要生成字幕的文本内容..."
              className="h-40"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          
          {mode === 'simple' && (
            <div className="space-y-2">
              <Label htmlFor="duration">音频总时长 (秒)</Label>
              <Input 
                id="duration"
                type="number"
                step="0.1"
                placeholder="例如: 12.5"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          )}

          <div className="flex gap-4">
            <Button onClick={handleGenerate} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? '处理中...' : '生成 SRT'}
            </Button>
            {result && (
              <Button variant="outline" onClick={handleDownload}>下载 .srt 文件</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>生成结果预览</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
              {result}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SrtGeneratorPage;
