// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, useToast, Textarea, Label } from '@/components/ui';
// @ts-ignore;
import { Save, CheckCircle, XCircle } from 'lucide-react';

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
    <div style={style} className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">全局配置</h1>
          <p className="text-gray-400">管理系统全局配置，配置数据将保存到global_config数据模型</p>
        </div>

        {/* 配置编辑卡片 */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>配置编辑器</span>
              <div className="flex items-center space-x-2">
                {jsonValid ? <div className="flex items-center text-green-400 text-sm">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  JSON格式正确
                </div> : <div className="flex items-center text-red-400 text-sm">
                  <XCircle className="h-4 w-4 mr-1" />
                  JSON格式错误
                </div>}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="config-json" className="text-white mb-2 block">配置数据 (JSON格式)</Label>
                <Textarea id="config-json" value={configData} onChange={handleConfigChange} placeholder='{
  "system": {
    "name": "无人机管理系统",
    "version": "1.0.0"
  },
  "settings": {
    "autoSave": true,
    "notifications": true
  }
}' className="bg-gray-700 border-gray-600 text-white font-mono text-sm h-96 resize-none" />
                <div className="text-xs text-gray-400 mt-2">
                  {existingConfig ? `最后更新: ${existingConfig.updatedAt ? new Date(existingConfig.updatedAt).toLocaleString() : '未知'}` : '暂无配置数据'}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveConfig} disabled={saving || !jsonValid} className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? '保存中...' : existingConfig ? '更新配置' : '保存配置'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 使用说明 */}
        <Card className="bg-gray-800 border-gray-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white">使用说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-300 space-y-2 text-sm">
              <p>• 配置数据以JSON格式存储，支持嵌套对象和数组</p>
              <p>• 系统会自动获取第一条配置记录，如果没有记录则创建新记录</p>
              <p>• 每次保存都会更新同一条记录，确保配置的唯一性</p>
              <p>• JSON格式错误时无法保存，请确保格式正确</p>
              <p>• 配置数据存储在global_config数据模型的config字段中</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </AuthGuard>;
}