// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, useToast, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui';
// @ts-ignore;
import { Plus, Search, RefreshCw, Video, Megaphone, Music } from 'lucide-react';

// @ts-ignore;
import { VideoUploadForm } from '@/components/VideoUploadForm';
// @ts-ignore;
import { VideoCard } from '@/components/VideoCard';
import { AuthGuard } from '@/components/AuthGuard';
import { UserMenu } from '@/components/UserMenu';
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
      <div style={style} className="min-h-screen bg-gray-900">        
        <div className="p-6 space-y-6">
          {/* 头部操作区 */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-white">录像管理</h1>
              <p className="text-gray-400">管理无人机录像记录</p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={loadVideoList} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700/50">
                <RefreshCw className="h-4 w-4 mr-2" />
                刷新
              </Button>
              <Button onClick={handleNewVideo} className="bg-blue-500 hover:bg-blue-600">
                <Plus className="h-4 w-4 mr-2" />
                新建录像
              </Button>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">{stats.total}</div>
                  <div className="text-gray-400 text-sm">总录像数</div>
                </div>
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Video className="h-5 w-5 text-blue-400" />
                </div>
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-400">{stats.broadcastVideos}</div>
                  <div className="text-gray-400 text-sm">播报录像数</div>
                </div>
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Megaphone className="h-5 w-5 text-green-400" />
                </div>
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-purple-400">{stats.backgroundMusicVideos}</div>
                  <div className="text-gray-400 text-sm">背景音乐数</div>
                </div>
                <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Music className="h-5 w-5 text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          {/* 搜索栏 */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="搜索录像名称或描述..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>

          {/* 录像列表容器 - 添加固定高度和滚动支持 */}
          <div className="bg-gray-800/30 rounded-lg border border-gray-700 overflow-hidden">
            {loading ? <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-300">加载中...</span>
              </div> : filteredVideoList.length === 0 ? <div className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  <Video className="h-16 w-16 mx-auto opacity-30" />
                </div>
                <h3 className="text-lg font-medium text-gray-300 mb-2">暂无录像记录</h3>
                <p className="text-gray-500 mb-4">创建第一个录像记录开始管理</p>
                <Button onClick={handleNewVideo} className="bg-blue-500 hover:bg-blue-600">
                  <Plus className="h-4 w-4 mr-2" />
                  新建录像
                </Button>
              </div> : <div className="max-h-[calc(100vh-300px)] overflow-y-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredVideoList.map(video => <VideoCard key={video._id} video={video} onEdit={handleEditVideo} onDelete={handleDeleteVideo} />)}
                </div>
              </div>}
          </div>

          {/* 录像表单弹窗 */}
          <VideoUploadForm video={editingVideo} $w={$w} onSave={handleFormSuccess} onCancel={handleFormCancel} open={showForm} onOpenChange={setShowForm} />

          {/* 删除确认弹窗 */}
          <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <DialogContent className="bg-gray-900 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">确认删除</DialogTitle>
              </DialogHeader>
              <div className="text-gray-400 mb-4">
                确定要删除录像 "{videoToDelete?.name}" 吗？此操作不可恢复。
              </div>
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} className="border-gray-600 text-gray-300 hover:bg-gray-700/50">
                  取消
                </Button>
                <Button onClick={() => {
                handleDelete(videoToDelete);
                setDeleteConfirmOpen(false);
              }} className="bg-red-500 hover:bg-red-600">
                  确认删除
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AuthGuard>;
}