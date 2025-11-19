// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Input, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, useToast, Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui';
// @ts-ignore;
import { Save, RefreshCw, Settings, Shield, Database, Cloud, Bell } from 'lucide-react';

// 替换 antd 的 Modal 和 message
const Modal = ({
  title,
  open,
  onOk,
  onCancel,
  okText,
  cancelText,
  okButtonProps,
  cancelButtonProps,
  className,
  children
}) => {
  if (!open) return null;
  return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 ${className || ''}`}>
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-medium text-white">{title}</h3>
        </div>
        <div className="p-6">
          {children}
        </div>
        <div className="p-6 border-t border-gray-700 flex justify-end space-x-3">
          <button onClick={onCancel} className={`px-4 py-2 border border-gray-600 text-gray-300 rounded hover:bg-gray-700/50 transition-colors ${cancelButtonProps?.className || ''}`}>
            {cancelText || '取消'}
          </button>
          <button onClick={onOk} className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors ${okButtonProps?.className || ''}`}>
            {okText || '确认'}
          </button>
        </div>
      </div>
    </div>;
};

// 简单的消息提示函数
const message = {
  info: content => {
    console.log('Info:', content);
    // 在实际应用中，这里可以替换为 toast 或其他通知组件
  },
  success: content => {
    console.log('Success:', content);
    // 在实际应用中，这里可以替换为 toast 或其他通知组件
  },
  error: content => {
    console.log('Error:', content);
    // 在实际应用中，这里可以替换为 toast 或其他通知组件
  }
};
export default function Config(props) {
  const {
    $w,
    style
  } = props;
  const {
    toast
  } = useToast();
  const [configData, setConfigData] = useState({
    appName: '无人机巡检系统',
    version: '1.0.0',
    maxFlightTime: 30,
    maxFlightDistance: 5000,
    videoQuality: 'high',
    storageLocation: 'cloud',
    notificationEnabled: true,
    autoSaveInterval: 5,
    backupEnabled: true,
    backupInterval: 24
  });
  const [loading, setLoading] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [pendingConfig, setPendingConfig] = useState(null);

  // 加载配置数据
  const loadConfig = async () => {
    setLoading(true);
    try {
      // 这里可以调用云函数或数据模型获取配置
      // 暂时使用默认配置
      setConfigData(prevConfig => ({
        ...prevConfig
      }));
      setIsModified(false);
    } catch (error) {
      toast({
        title: '加载失败',
        description: error.message || '请检查网络连接',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadConfig();
  }, []);

  // 处理配置变更
  const handleConfigChange = (key, value) => {
    setConfigData(prev => ({
      ...prev,
      [key]: value
    }));
    setIsModified(true);
  };

  // 显示确认弹窗
  const showConfirmModal = () => {
    if (!isModified) {
      message.info('配置未发生变化');
      return;
    }
    setPendingConfig(configData);
    setConfirmModalVisible(true);
  };

  // 确认保存配置
  const handleConfirmSave = async () => {
    setConfirmModalVisible(false);
    setLoading(true);
    try {
      // 模拟保存配置到数据库
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsModified(false);
      message.success('配置保存成功');
      toast({
        title: '保存成功',
        description: '系统配置已更新'
      });
    } catch (error) {
      message.error('保存失败');
      toast({
        title: '保存失败',
        description: error.message || '请检查网络连接',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // 取消保存
  const handleCancelSave = () => {
    setConfirmModalVisible(false);
    setPendingConfig(null);
    message.info('已取消保存');
  };

  // 获取配置变更摘要
  const getConfigChanges = () => {
    if (!pendingConfig) return [];
    const changes = [];
    // 这里可以添加具体的变更检测逻辑
    changes.push('系统基础配置');
    if (pendingConfig.maxFlightTime !== configData.maxFlightTime) {
      changes.push(`最大飞行时间: ${configData.maxFlightTime} → ${pendingConfig.maxFlightTime}分钟`);
    }
    if (pendingConfig.videoQuality !== configData.videoQuality) {
      changes.push(`视频质量: ${configData.videoQuality} → ${pendingConfig.videoQuality}`);
    }
    if (pendingConfig.notificationEnabled !== configData.notificationEnabled) {
      changes.push(`通知设置: ${configData.notificationEnabled ? '开启' : '关闭'} → ${pendingConfig.notificationEnabled ? '开启' : '关闭'}`);
    }
    return changes.length > 0 ? changes : ['配置已更新'];
  };
  const configChanges = getConfigChanges();
  return <div style={style} className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center">
              <Settings className="h-8 w-8 mr-3 text-blue-400" />
              系统配置
            </h1>
            <p className="text-gray-400 mt-2">管理系统各项参数和设置</p>
          </div>
          <div className="flex space-x-3">
            <Button onClick={loadConfig} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700/50">
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
            <Button onClick={showConfirmModal} disabled={!isModified || loading} className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed">
              <Save className="h-4 w-4 mr-2" />
              保存配置
            </Button>
          </div>
        </div>

        {/* 配置表单 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 基础设置 */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Settings className="h-5 w-5 mr-2 text-blue-400" />
                基础设置
              </CardTitle>
              <CardDescription className="text-gray-400">系统基础参数配置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-gray-300 text-sm font-medium">应用名称</label>
                <Input value={configData.appName} onChange={e => handleConfigChange('appName', e.target.value)} className="bg-gray-700 border-gray-600 text-white mt-1" />
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium">版本号</label>
                <Input value={configData.version} onChange={e => handleConfigChange('version', e.target.value)} className="bg-gray-700 border-gray-600 text-white mt-1" />
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium">最大飞行时间(分钟)</label>
                <Input type="number" value={configData.maxFlightTime} onChange={e => handleConfigChange('maxFlightTime', parseInt(e.target.value) || 0)} className="bg-gray-700 border-gray-600 text-white mt-1" />
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium">最大飞行距离(米)</label>
                <Input type="number" value={configData.maxFlightDistance} onChange={e => handleConfigChange('maxFlightDistance', parseInt(e.target.value) || 0)} className="bg-gray-700 border-gray-600 text-white mt-1" />
              </div>
            </CardContent>
          </Card>

          {/* 媒体设置 */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Cloud className="h-5 w-5 mr-2 text-green-400" />
                媒体设置
              </CardTitle>
              <CardDescription className="text-gray-400">视频和存储配置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-gray-300 text-sm font-medium">视频质量</label>
                <Select value={configData.videoQuality} onValueChange={value => handleConfigChange('videoQuality', value)}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                    <SelectValue placeholder="选择视频质量" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">低质量</SelectItem>
                    <SelectItem value="medium">中等质量</SelectItem>
                    <SelectItem value="high">高质量</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium">存储位置</label>
                <Select value={configData.storageLocation} onValueChange={value => handleConfigChange('storageLocation', value)}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                    <SelectValue placeholder="选择存储位置" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">本地存储</SelectItem>
                    <SelectItem value="cloud">云端存储</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 通知设置 */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Bell className="h-5 w-5 mr-2 text-yellow-400" />
                通知设置
              </CardTitle>
              <CardDescription className="text-gray-400">系统通知和提醒配置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-gray-300 text-sm font-medium">启用通知</label>
                <Button variant={configData.notificationEnabled ? "default" : "outline"} onClick={() => handleConfigChange('notificationEnabled', !configData.notificationEnabled)} className={configData.notificationEnabled ? "bg-green-500 hover:bg-green-600" : "border-gray-600 text-gray-300"}>
                  {configData.notificationEnabled ? '已启用' : '已禁用'}
                </Button>
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium">自动保存间隔(分钟)</label>
                <Input type="number" value={configData.autoSaveInterval} onChange={e => handleConfigChange('autoSaveInterval', parseInt(e.target.value) || 0)} className="bg-gray-700 border-gray-600 text-white mt-1" />
              </div>
            </CardContent>
          </Card>

          {/* 备份设置 */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Database className="h-5 w-5 mr-2 text-purple-400" />
                备份设置
              </CardTitle>
              <CardDescription className="text-gray-400">数据备份和恢复配置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-gray-300 text-sm font-medium">启用自动备份</label>
                <Button variant={configData.backupEnabled ? "default" : "outline"} onClick={() => handleConfigChange('backupEnabled', !configData.backupEnabled)} className={configData.backupEnabled ? "bg-green-500 hover:bg-green-600" : "border-gray-600 text-gray-300"}>
                  {configData.backupEnabled ? '已启用' : '已禁用'}
                </Button>
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium">备份间隔(小时)</label>
                <Input type="number" value={configData.backupInterval} onChange={e => handleConfigChange('backupInterval', parseInt(e.target.value) || 0)} className="bg-gray-700 border-gray-600 text-white mt-1" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 自定义确认弹窗 */}
        <Modal title="确认配置更新" open={confirmModalVisible} onOk={handleConfirmSave} onCancel={handleCancelSave} okText="确认保存" cancelText="取消" okButtonProps={{
        className: 'bg-blue-500 hover:bg-blue-600 border-blue-500'
      }} cancelButtonProps={{
        className: 'border-gray-600 text-gray-300 hover:bg-gray-700/50'
      }} className="[&_.ant-modal-content]:bg-gray-800 [&_.ant-modal-header]:bg-gray-800 [&_.ant-modal-title]:text-white [&_.ant-modal-close]:text-gray-400">
          <div className="text-gray-300 space-y-4">
            <p>您确定要更新以下系统配置吗？</p>
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">配置变更摘要：</h4>
              <ul className="space-y-1 text-sm">
                {configChanges.map((change, index) => <li key={index} className="flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                    {change}
                  </li>)}
              </ul>
            </div>
            <p className="text-yellow-400 text-sm">注意：配置更新后可能需要重启相关服务才能生效。</p>
          </div>
        </Modal>
      </div>
    </div>;
}