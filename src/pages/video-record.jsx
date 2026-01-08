// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, useToast, Dialog, DialogContent, DialogHeader, DialogTitle, Input } from '@/components/ui';
// @ts-ignore;
import { Plus, Search, RefreshCw, Video, Megaphone, Music } from 'lucide-react';

// @ts-ignore;
import { VideoUploadForm } from '@/components/VideoUploadForm';
// @ts-ignore;
import { VideoCard } from '@/components/VideoCard';
import { AuthGuard } from '@/components/AuthGuard';
import { UserMenu } from '@/components/UserMenu';
import { MainLayout } from '@/layouts/MainLayout';

export default function VideoRecord(props) {
  const {
    $w,
    style
  } = props;
  const {
    toast
  } = useToast();
  const [videoList, setVideoList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState(null);

  // 获取文件临时链接
  const getFileUrl = async fileId => {
    if (!fileId) return '';
    try {
      const tcb = await $w.cloud.getCloudInstance();
      const result = await tcb.getTempFileURL({
        fileList: [fileId]
      });
      if (result.fileList && result.fileList[0]) {
        return result.fileList[0].tempFileURL;
      }
      return '';
    } catch (error) {
      console.error('获取文件链接失败:', error);
      return '';
    }
  };

  // 加载录像列表 - 使用真实数据模型
  const loadVideoList = async () => {
    setLoading(true);
    try {
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'video_record',
        methodName: 'wedaGetRecordsV2',
        params: {
          select: {
            $master: true
          },
          orderBy: [{
            uploadTime: 'desc'
          }],
          pageSize: 50,
          pageNumber: 1,
          getCount: true
        }
      });

      // 为每个录像获取预览链接 - 参考Tips管理的做法
      const videosWithUrls = await Promise.all((result.records || []).map(async video => {
        let imageUrl = '';
        if (video.imageFileId) {
          imageUrl = await getFileUrl(video.imageFileId);
        }
        return {
          ...video,
          imageUrl // 统一使用imageUrl字段存储图片链接
        };
      }));
      setVideoList(videosWithUrls);
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
    loadVideoList();
  }, []);

  // 搜索录像
  const filteredVideoList = videoList.filter(video => video.name?.toLowerCase().includes(searchTerm.toLowerCase()) || video.description?.toLowerCase().includes(searchTerm.toLowerCase()));

  // 统计信息
  const stats = {
    total: videoList.length,
    broadcastVideos: videoList.filter(v => v.broadcasts && v.broadcasts.length > 0).length,
    backgroundMusicVideos: videoList.filter(v => v.backgroundMusicFileId).length
  };

  // 处理删除录像 - 使用真实数据模型
  const handleDelete = async video => {
    try {
      await $w.cloud.callDataSource({
        dataSourceName: 'video_record',
        methodName: 'wedaDeleteV2',
        params: {
          filter: {
            where: {
              _id: {
                $eq: video._id
              }
            }
          }
        }
      });
      toast({
        title: '删除成功',
        description: `录像 "${video.name}" 已删除`
      });
      loadVideoList();
    } catch (error) {
      toast({
        title: '删除失败',
        description: error.message || '请检查网络连接',
        variant: 'destructive'
      });
    }
  };

  // 处理新建录像按钮点击
  const handleNewVideo = () => {
    setEditingVideo(null); // 确保清空编辑数据
    setShowForm(true);
  };

  // 处理编辑录像按钮点击
  const handleEditVideo = video => {
    setEditingVideo(video);
    setShowForm(true);
  };

  // 处理删除录像按钮点击
  const handleDeleteVideo = video => {
    setVideoToDelete(video);
    setDeleteConfirmOpen(true);
  };

  // 处理表单保存成功
  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingVideo(null);
    loadVideoList();
  };

  // 处理表单取消
  const handleFormCancel = () => {
    setShowForm(false);
    setEditingVideo(null);
  };
  return <AuthGuard $w={$w}>
        <div style={style} className="space-y-6 animate-in fade-in duration-500">
        {/* 头部操作区 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1 w-full sm:w-auto flex items-center gap-4">
             <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="搜索录像名称或描述..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  className="pl-10 bg-background border-input w-full hover:border-primary transition-colors duration-200" 
                />
             </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={loadVideoList} variant="outline" className="shadow-sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
            <Button onClick={handleNewVideo} className="shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              新建录像
            </Button>
          </div>
        </div>

        {/* 录像列表容器 */}
          <div className="bg-transparent">
            {loading ? <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-muted-foreground">加载中...</span>
              </div> : filteredVideoList.length === 0 ? <div className="flex flex-col justify-center items-center py-12">
                <div className="text-muted-foreground mb-4">
                  <Video className="h-16 w-16 mx-auto opacity-30" />
                </div>
                <h3 className="text-lg font-medium mb-2">暂无录像记录</h3>
                <p className="text-muted-foreground mb-4">创建第一个录像记录开始管理</p>
                <Button onClick={handleNewVideo}>
                  <Plus className="h-4 w-4 mr-2" />
                  新建录像
                </Button>
              </div> : <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {filteredVideoList.map(video => <VideoCard key={video._id} video={video} onEdit={handleEditVideo} onDelete={handleDeleteVideo} />)}
              </div>}
          </div>

          {/* 录像表单弹窗 */}
          <VideoUploadForm video={editingVideo} $w={$w} onSave={handleFormSuccess} onCancel={handleFormCancel} open={showForm} onOpenChange={setShowForm} />

          {/* 删除确认弹窗 */}
          <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">确认删除</DialogTitle>
              </DialogHeader>
              <div className="text-slate-600 dark:text-slate-400 mb-4 text-sm leading-relaxed">
                确定要删除录像 "{videoToDelete?.name}" 吗？此操作不可恢复。
              </div>
              <div className="flex justify-end space-x-3 bg-slate-50 dark:bg-slate-900/50 -mx-6 -mb-6 px-6 py-4 border-t border-slate-100 dark:border-slate-800/50 mt-4">
                <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">
                  取消
                </Button>
                <Button onClick={() => {
                handleDelete(videoToDelete);
                setDeleteConfirmOpen(false);
              }} variant="destructive" className="bg-red-600 hover:bg-red-700 text-white border-none shadow-sm">
                  确认删除
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
    </AuthGuard>;
}