// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, useToast, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input, Label } from '@/components/ui';
// @ts-ignore;
import { Plus, MapPin, Edit, Trash2, Search, Navigation, Clock, ArrowUp, Target, Eye, Image, Video } from 'lucide-react';

// @ts-ignore;
import { POIForm } from '@/components/POIForm';
import { AuthGuard } from '@/components/AuthGuard';
import { MainLayout } from './MainLayout';

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
  return <MainLayout $w={$w}>
    <AuthGuard $w={$w}>
        <div style={style} className="w-full h-full space-y-6">
        {/* 页面标题和操作栏 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1 w-full sm:w-auto flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="搜索POI名称或描述..." 
                value={searchKeyword} 
                onChange={e => setSearchKeyword(e.target.value)} 
                className="pl-10 bg-background border-input w-full hover:border-primary transition-colors duration-200" 
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button onClick={handleAddPoi} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              新增POI
            </Button>
          </div>
        </div>
        
        {/* POI列表 */}
        {loading ? <div className="flex justify-center items-center h-64">
            <div className="flex items-center space-x-3 text-primary">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span>加载中...</span>
            </div>
          </div> : filteredPoiList.length === 0 ? <div className="flex flex-col justify-center items-center h-96 border rounded-lg bg-card text-card-foreground">
            <MapPin className="h-16 w-16 mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium text-muted-foreground mb-2">暂无POI数据</p>
            <Button variant="outline" onClick={handleAddPoi}>创建第一个POI</Button>
          </div> : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredPoiList.map(poi => <Card key={poi._id} className="bg-card text-card-foreground border border-border shadow-sm hover:shadow-md hover:border-primary transition-all duration-200 group">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base font-semibold truncate">{poi.name}</CardTitle>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(poi.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button variant="ghost" size="icon" onClick={() => handleEditPoi(poi)} className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeletePoi(poi)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {poi.description && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {poi.description}
                    </p>}
                </CardHeader>
                
                <CardContent className="pt-0 space-y-3">
                  {/* 媒体预览 */}
                  {(poi.imageUrl || poi.videoUrl) && <div className="bg-muted/50 rounded-lg p-3 text-xs">
                      <div className="flex items-center space-x-2 mb-2">
                        <Eye className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium text-muted-foreground">媒体资源</span>
                      </div>
                      <div className="flex space-x-2">
                        {poi.imageUrl && <div className="flex items-center space-x-1 text-primary">
                            <Image className="h-3 w-3" />
                            <span>图片</span>
                          </div>}
                        {poi.videoUrl && <div className="flex items-center space-x-1 text-blue-500">
                            <Video className="h-3 w-3" />
                            <span>视频</span>
                          </div>}
                      </div>
                    </div>}
                  
                  {/* 坐标信息 */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-muted/30 rounded p-2 border border-border">
                      <div className="text-muted-foreground mb-1">纬度</div>
                      <div className="font-mono font-medium">{poi.latitude?.toFixed(6) || '0.000000'}</div>
                    </div>
                    <div className="bg-muted/30 rounded p-2 border border-border">
                      <div className="text-muted-foreground mb-1">经度</div>
                      <div className="font-mono font-medium">{poi.longitude?.toFixed(6) || '0.000000'}</div>
                    </div>
                  </div>
                  
                  {/* 高度信息 */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <ArrowUp className="h-3 w-3" />
                      <span>高度</span>
                    </div>
                    <span className="text-sm font-bold text-primary">{poi.height || 0}m</span>
                  </div>
                </CardContent>
              </Card>)}
          </div>}

        {/* POI表单弹窗 */}
        <POIForm poi={editingPoi} $w={$w} open={formOpen} onOpenChange={setFormOpen} onSave={handleFormSave} onCancel={() => setFormOpen(false)} />

        {/* 删除确认弹窗 */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
            <DialogHeader>
              <DialogTitle>确认删除</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                确定要删除POI "{poiToDelete?.name}" 吗？此操作不可恢复。
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-3 mt-4">
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                取消
              </Button>
              <Button variant="destructive" onClick={confirmDeletePoi}>
                确认删除
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </AuthGuard>
    </MainLayout>;
}