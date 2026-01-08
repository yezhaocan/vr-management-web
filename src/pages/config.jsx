// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, useToast, Textarea, Label } from '@/components/ui';
// @ts-ignore;
import { Save, CheckCircle, XCircle, Settings, FileJson, AlertCircle, Info } from 'lucide-react';

import { AuthGuard } from '@/components/AuthGuard';
import { UserMenu } from '@/components/UserMenu';
export default function ConfigPage(props) {
  const {
    $w,
    style
  } = props;
  const {
    toast
  } = useToast();
  const [configData, setConfigData] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [jsonValid, setJsonValid] = useState(true);
  const [existingConfig, setExistingConfig] = useState(null);

  // 加载配置数据
  const loadConfig = async () => {
    setLoading(true);
    try {
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'global_config',
        methodName: 'wedaGetRecordsV2',
        params: {
          select: {
            $master: true
          },
          orderBy: [{
            createdAt: 'desc'
          }],
          pageSize: 1,
          pageNumber: 1
        }
      });
      if (result.records && result.records.length > 0) {
        const config = result.records[0];
        setExistingConfig(config);
        setConfigData(config.config ? JSON.stringify(config.config, null, 2) : '{}');
      } else {
        setConfigData('{}');
        setExistingConfig(null);
      }
    } catch (error) {
      toast({
        title: '加载配置失败',
        description: error.message || '请检查网络连接',
        variant: 'destructive'
      });
      setConfigData('{}');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadConfig();
  }, []);

  // JSON格式校验
  const validateJSON = jsonString => {
    try {
      if (jsonString.trim() === '') {
        setJsonValid(true);
        return null;
      }
      const parsed = JSON.parse(jsonString);
      setJsonValid(true);
      return parsed;
    } catch (error) {
      setJsonValid(false);
      return null;
    }
  };
  const handleConfigChange = e => {
    const value = e.target.value;
    setConfigData(value);
    validateJSON(value);
  };

  // 保存配置
  const saveConfig = async () => {
    const parsedConfig = validateJSON(configData);
    if (!jsonValid) {
      toast({
        title: 'JSON格式错误',
        description: '请检查JSON格式是否正确',
        variant: 'destructive'
      });
      return;
    }
    setSaving(true);
    try {
      const configToSave = parsedConfig || {};
      if (existingConfig) {
        // 更新现有配置
        await $w.cloud.callDataSource({
          dataSourceName: 'global_config',
          methodName: 'wedaUpdateV2',
          params: {
            filter: {
              where: {
                _id: {
                  $eq: existingConfig._id
                }
              }
            },
            data: {
              config: configToSave,
              updatedAt: new Date().getTime()
            }
          }
        });
        toast({
          title: '配置更新成功',
          description: '全局配置已更新'
        });
      } else {
        // 新增配置
        await $w.cloud.callDataSource({
          dataSourceName: 'global_config',
          methodName: 'wedaCreateV2',
          params: {
            data: {
              config: configToSave,
              createdAt: new Date().getTime(),
              updatedAt: new Date().getTime()
            }
          }
        });
        toast({
          title: '配置保存成功',
          description: '全局配置已保存'
        });
      }
      // 重新加载配置
      loadConfig();
    } catch (error) {
      toast({
        title: '保存失败',
        description: error.message || '请检查网络连接',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };
  return <AuthGuard $w={$w}>
    <div style={style} className="w-full h-full space-y-6">
      <div className="w-full mx-auto space-y-6">
        
        {/* 使用说明 - 移动到顶部 */}
        <Card className="bg-card text-card-foreground border-border shadow-sm w-full">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="h-5 w-5 mr-2 text-primary" />
              使用说明
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground space-y-2 text-sm">
              <p className="flex items-start"><span className="mr-2 text-primary">•</span>配置数据以JSON格式存储，支持嵌套对象和数组</p>
              <p className="flex items-start"><span className="mr-2 text-primary">•</span>系统会自动获取第一条配置记录，如果没有记录则创建新记录</p>
              <p className="flex items-start"><span className="mr-2 text-primary">•</span>每次保存都会更新同一条记录，确保配置的唯一性</p>
              <p className="flex items-start"><span className="mr-2 text-destructive">•</span>JSON格式错误时无法保存，请确保格式正确</p>
            </div>
          </CardContent>
        </Card>

        {/* 配置编辑卡片 - 移动到下方 */}
        <Card className="bg-card text-card-foreground border-border shadow-sm w-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Settings className="h-5 w-5 mr-2 text-primary" />
                <span>配置编辑器</span>
              </div>
              <div className="flex items-center space-x-2">
                {jsonValid ? <div className="flex items-center text-green-500 text-sm font-normal bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md border border-green-200 dark:border-green-800">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  JSON格式正确
                </div> : <div className="flex items-center text-destructive text-sm font-normal bg-destructive/10 px-2 py-1 rounded-md border border-destructive/20">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  JSON格式错误
                </div>}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="config-json" className="mb-2 flex items-center">
                  <FileJson className="h-4 w-4 mr-2 text-muted-foreground" />
                  配置数据 (JSON格式)
                </Label>
                <Textarea id="config-json" value={configData} onChange={handleConfigChange} placeholder='{
  "system": {
    "name": "无人机管理系统",
    "version": "1.0.0"
  },
  "settings": {
    "autoSave": true,
    "notifications": true
  }
}' className="font-mono text-sm h-80 resize-none bg-muted/50 border-input w-full" />
                <div className="text-xs text-muted-foreground mt-2 flex items-center justify-end">
                  <Info className="h-3 w-3 mr-1" />
                  {existingConfig ? `最后更新: ${existingConfig.updatedAt ? new Date(existingConfig.updatedAt).toLocaleString() : '未知'}` : '暂无配置数据'}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveConfig} disabled={saving || !jsonValid} className="shadow-sm">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? '保存中...' : existingConfig ? '更新配置' : '保存配置'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </AuthGuard>;
}