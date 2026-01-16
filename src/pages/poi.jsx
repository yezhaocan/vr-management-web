// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, useToast, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input, Label } from '@/components/ui';
// @ts-ignore;
import { Plus, MapPin, Edit, Trash2, Search, Navigation, Clock, ArrowUp, Target, Eye, Image, Video } from 'lucide-react';

// @ts-ignore;
import { POIForm } from '@/components/POIForm';
import { AuthGuard } from '@/components/AuthGuard';
import { UserMenu } from '@/components/UserMenu';
export default function POIManagement(props) {
  const {
    $w,
    style
  } = props;
  const {
    toast
  } = useToast();
  const [poiList, setPoiList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingPoi, setEditingPoi] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [poiToDelete, setPoiToDelete] = useState(null);

  // 加载POI列表
  const loadPoiList = async () => {
    setLoading(true);
    try {
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'signage_data',
        methodName: 'wedaGetRecordsV2',
        params: {
          select: {
            $master: true
          },
          orderBy: [{
            createdAt: 'desc'
          }],
          pageSize: 50,
          pageNumber: 1,
          getCount: true
        }
      });
      setPoiList(result.records || []);
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
    loadPoiList();
  }, []);

  // 搜索POI
  const filteredPoiList = poiList.filter(poi => poi.name?.toLowerCase().includes(searchKeyword.toLowerCase()) || poi.description?.toLowerCase().includes(searchKeyword.toLowerCase()));

  // 处理新增POI
  const handleAddPoi = () => {
    setEditingPoi(null);
    setFormOpen(true);
  };

  // 处理编辑POI
  const handleEditPoi = poi => {
    setEditingPoi(poi);
    setFormOpen(true);
  };

  // 处理删除POI
  const handleDeletePoi = poi => {
    setPoiToDelete(poi);
    setDeleteConfirmOpen(true);
  };

  // 确认删除POI
  const confirmDeletePoi = async () => {
    if (!poiToDelete) return;
    try {
      await $w.cloud.callDataSource({
        dataSourceName: 'signage_data',
        methodName: 'wedaDeleteV2',
        params: {
          filter: {
            where: {
              _id: {
                $eq: poiToDelete._id
              }
            }
          }
        }
      });
      toast({
        title: '删除成功',
        description: `POI "${poiToDelete.name}" 已删除`
      });
      setDeleteConfirmOpen(false);
      setPoiToDelete(null);
      loadPoiList();
    } catch (error) {
      toast({
        title: '删除失败',
        description: error.message || '请检查网络连接',
        variant: 'destructive'
      });
    }
  };

  // 处理表单保存
  const handleFormSave = () => {
    setFormOpen(false);
    loadPoiList();
  };

  // 格式化时间显示
  const formatTime = timestamp => {
    if (!timestamp) return '未知';
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN');
  };
  return <AuthGuard $w={$w}>
      <div style={style} className="min-h-screen bg-gray-900">        
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
          {/* 页面标题和操作栏 */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">POI管理</h1>
                <p className="text-gray-400">管理VR观光中的兴趣点信息</p>
              </div>
              
              <Button onClick={handleAddPoi} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg transition-all duration-300">
                <Plus className="h-4 w-4 mr-2" />
                新增POI
              </Button>
            </div>
            
            {/* 搜索框 */}
            <div className="max-w-md relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input placeholder="搜索POI名称或描述..." value={searchKeyword} onChange={e => setSearchKeyword(e.target.value)} className="pl-10 bg-gray-800/50 border-gray-600 text-white backdrop-blur-sm focus:border-blue-500 transition-colors" />
            </div>
          </div>

          {/* POI列表 */}
          {loading ? <div className="flex justify-center items-center h-64">
              <div className="flex items-center space-x-3 text-blue-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span>加载中...</span>
              </div>
            </div> : filteredPoiList.length === 0 ? <div className="flex justify-center items-center h-96">
              <div className="text-center text-gray-500">
                <MapPin className="h-24 w-24 mx-auto mb-6 opacity-30" />
                <p className="text-xl mb-2">暂无POI数据</p>
                <p className="text-sm">点击上方按钮创建第一个POI</p>
              </div>
            </div> : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredPoiList.map(poi => <Card key={poi._id} className="bg-gray-800/80 border-gray-700/70 backdrop-blur-sm hover:border-blue-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 group">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                          <Target className="h-6 w-6 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-lg font-semibold text-white truncate">{poi.name}</CardTitle>
                          <div className="flex items-center space-x-1 text-xs text-gray-400 mt-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(poi.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button variant="ghost" size="sm" onClick={() => handleEditPoi(poi)} className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-lg p-2">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeletePoi(poi)} className="text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg p-2">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {poi.description && <p className="text-sm text-gray-300 line-clamp-2 bg-gray-900/40 rounded-lg p-2 mt-2">
                        {poi.description}
                      </p>}
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* 媒体预览 */}
                      {(poi.imageUrl || poi.videoUrl) && <div className="bg-gray-900/40 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <Eye className="h-4 w-4 text-purple-400" />
                            <span className="text-sm font-medium text-purple-300">媒体预览</span>
                          </div>
                          <div className="flex space-x-2">
                            {poi.imageUrl && <div className="flex items-center space-x-1 text-xs text-blue-400">
                                <Image className="h-3 w-3" />
                                <span>图片</span>
                              </div>}
                            {poi.videoUrl && <div className="flex items-center space-x-1 text-xs text-green-400">
                                <Video className="h-3 w-3" />
                                <span>视频</span>
                              </div>}
                          </div>
                        </div>}
                      
                      {/* 坐标信息 */}
                      <div className="bg-gray-900/40 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Navigation className="h-4 w-4 text-blue-400" />
                          <span className="text-sm font-medium text-blue-300">地理坐标</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-center bg-gray-800/60 rounded p-2 border border-gray-700/60">
                            <div className="text-gray-400 mb-1">纬度</div>
                            <div className="font-mono text-white text-sm font-medium">{poi.latitude?.toFixed(6) || '0.000000'}</div>
                          </div>
                          <div className="text-center bg-gray-800/60 rounded p-2 border border-gray-700/60">
                            <div className="text-gray-400 mb-1">经度</div>
                            <div className="font-mono text-white text-sm font-medium">{poi.longitude?.toFixed(6) || '0.000000'}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* 高度信息 */}
                      <div className="flex items-center justify-between bg-gray-900/40 rounded-lg p-3 border border-gray-700/60">
                        <div className="flex items-center space-x-2">
                          <ArrowUp className="h-4 w-4 text-green-400" />
                          <span className="text-sm text-gray-300">高度</span>
                        </div>
                        <span className="text-lg font-bold text-green-300 bg-green-900/30 px-3 py-1 rounded-full">{poi.height || 0}m</span>
                      </div>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex justify-end items-center mt-4 pt-3 border-t border-gray-700/60">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditPoi(poi)} className="text-blue-400 border-blue-400/60 hover:bg-blue-400/10 hover:text-blue-300 text-xs px-3 py-1">
                          <Edit className="h-3 w-3 mr-1" />
                          编辑
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeletePoi(poi)} className="text-red-400 border-red-400/60 hover:bg-red-400/10 hover:text-red-300 text-xs px-3 py-1">
                          <Trash2 className="h-3 w-3 mr-1" />
                          删除
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>)}
            </div>}

          {/* POI表单弹窗 */}
          <POIForm poi={editingPoi} $w={$w} open={formOpen} onOpenChange={setFormOpen} onSave={handleFormSave} onCancel={() => setFormOpen(false)} />

          {/* 删除确认弹窗 */}
          <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <DialogContent className="bg-gray-900 border-gray-700 backdrop-blur-sm">
              <DialogHeader>
                <DialogTitle className="text-white">确认删除</DialogTitle>
                <DialogDescription className="text-gray-400">
                  确定要删除POI "{poiToDelete?.name}" 吗？此操作不可恢复。
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end space-x-3 mt-4">
                <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} className="border-gray-600 text-gray-300 hover:bg-gray-700/50">
                  取消
                </Button>
                <Button onClick={confirmDeletePoi} className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700">
                  确认删除
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AuthGuard>;
}