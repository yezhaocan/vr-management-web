// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Button } from '@/components/ui';
// @ts-ignore;
import { Home, Navigation, MapPin, Video, Lightbulb, Settings, LogOut, User, Shield, PlayCircle, Smartphone } from 'lucide-react';

export function SuperAdminSidebar(props) {
  const {
    activeMenu,
    onMenuChange,
    onLogout,
    $w
  } = props;

  // 安全获取用户信息
  const currentUser = $w?.auth?.currentUser || {};
  const userName = currentUser.name || '超级管理员';
  const userNickName = currentUser.nickName || '';
  const userAvatar = currentUser.avatarUrl || null;
  const menuItems = [{
    id: 'dashboard',
    label: '运行观测',
    icon: Home
  }, {
    id: 'scenic-management',
    label: '景区管理',
    icon: MapPin
  }, {
    id: 'drone',
    label: '无人机管理',
    icon: Smartphone
  }, {
    id: 'route',
    label: '航线管理',
    icon: Navigation
  }, {
    id: 'flight-task',
    label: '飞行任务',
    icon: PlayCircle
  }, {
    id: 'video-record',
    label: '录像管理',
    icon: Video
  }, {
    id: 'poi',
    label: 'POI管理',
    icon: MapPin
  }, {
    id: 'tips',
    label: 'Tips管理',
    icon: Lightbulb
  }, {
    id: 'config',
    label: '系统配置',
    icon: Settings
  }, {
    id: 'superadmin',
    label: '超级管理',
    icon: Shield
  }];
  return <div className="w-64 bg-gray-900 border-r border-gray-700 flex flex-col h-full">
      {/* 系统名称 */}
      <div className="p-4 border-b border-gray-700 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <div className="w-6 h-6 rounded bg-white/80"></div>
          </div>
          <div>
            <h1 className="text-white font-bold text-xl tracking-tight">VR观光运营平台</h1>
            <p className="text-purple-200 text-xs font-light">Virtual Reality Tourism Platform</p>
          </div>
        </div>
      </div>

      {/* 用户信息 */}
      <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-purple-600/20 to-blue-600/20">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
            {userAvatar ? <img src={userAvatar} alt={userName} className="w-12 h-12 rounded-full object-cover" /> : <Shield className="w-6 h-6 text-white" />}
          </div>
          <div>
            <div className="text-sm font-medium text-white">{userName}</div>
            <div className="text-xs text-purple-300">{userNickName}</div>
          </div>
        </div>
      </div>

      {/* 菜单列表 */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map(item => {
        const Icon = item.icon;
        const isActive = activeMenu === item.id;
        return <Button key={item.id} variant="ghost" className={`w-full justify-start text-left ${isActive ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`} onClick={() => onMenuChange(item.id)}>
              <Icon className="w-4 h-4 mr-3" />
              {item.label}
            </Button>;
      })}
      </nav>

      {/* 退出登录 */}
      <div className="p-4 border-t border-gray-700">
        <Button variant="ghost" className="w-full justify-start text-left text-gray-300 hover:bg-gray-800 hover:text-white" onClick={onLogout}>
          <LogOut className="w-4 h-4 mr-3" />
          退出登录
        </Button>
      </div>
    </div>;
}