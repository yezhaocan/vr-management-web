// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Button } from '@/components/ui';
// @ts-ignore;
import { Home, Navigation, MapPin, Video, Lightbulb, Settings, LogOut, User, PlayCircle, Smartphone, Monitor } from 'lucide-react';

export function Sidebar(props) {
  const {
    activeMenu,
    onMenuChange,
    onLogout,
    $w
  } = props;

  // 安全获取用户信息 - 使用腾讯云认证的真实用户信息
  const currentUser = $w?.auth?.currentUser || {};
  const userName = currentUser.name || '用户';
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
  }];
  return <div className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col h-full">
      {/* 系统名称 */}
      <div className="p-4 border-b border-slate-700 bg-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 shadow-lg flex items-center justify-center">
            <Monitor className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg tracking-tight">
              VR观光管理平台
            </h1>
          </div>
        </div>
      </div>

      {/* 用户信息 - 使用腾讯云认证的真实数据 */}
      <div className="p-4 border-b border-slate-700 bg-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
            {userAvatar ? <img src={userAvatar} alt={userName} className="w-10 h-10 rounded-full object-cover" /> : <User className="w-5 h-5 text-white" />}
          </div>
          <div>
            <div className="text-sm font-medium text-white">{userName}</div>
            <div className="text-xs text-slate-300">{userNickName}</div>
          </div>
        </div>
      </div>

      {/* 菜单列表 */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map(item => {
        const Icon = item.icon;
        const isActive = activeMenu === item.id;
        return <Button key={item.id} variant="ghost" className={`w-full justify-start text-left transition-all duration-200 rounded-xl border border-transparent ${isActive ? 'bg-blue-600 text-white shadow-lg border-blue-400' : 'text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-600'}`} onClick={() => onMenuChange(item.id)}>
              <div className={`w-1 h-8 rounded-full mr-3 transition-all duration-200 ${isActive ? 'bg-blue-300' : 'bg-transparent'}`}></div>
              <Icon className={`w-5 h-5 mr-3 transition-colors duration-200 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="font-medium">{item.label}</span>
            </Button>;
      })}
      </nav>

      {/* 退出登录 */}
      <div className="p-4 border-t border-slate-700 bg-slate-800">
        <Button variant="ghost" className="w-full justify-start text-left text-slate-300 hover:bg-red-600 hover:text-red-100 border border-transparent rounded-xl transition-all duration-200" onClick={onLogout}>
          <div className="w-1 h-8 rounded-full mr-3 bg-transparent"></div>
          <LogOut className="w-5 h-5 mr-3" />
          <span className="font-medium">退出登录</span>
        </Button>
      </div>
    </div>;
}