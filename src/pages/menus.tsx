import React from 'react';
import { 
  LayoutDashboard, 
  Plane, 
  Map as MapIcon, 
  ClipboardList, 
  MapPin, 
  Video, 
  Settings, 
  ShieldAlert, 
  Lightbulb, 
  Image 
} from 'lucide-react';

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

export const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: '系统概览',
    icon: <LayoutDashboard size={20} />,
    path: '/dashboard'
  },
  {
    id: 'scenic-management',
    label: '景区管理',
    icon: <Image size={20} />,
    path: '/scenic-management'
  },
  {
    id: 'drone',
    label: '无人机管理',
    icon: <Plane size={20} />,
    path: '/drone'
  },
  {
    id: 'route',
    label: '航线规划',
    icon: <MapIcon size={20} />,
    path: '/route'
  },
  {
    id: 'flight-task',
    label: '飞行任务',
    icon: <ClipboardList size={20} />,
    path: '/flight-task'
  },
  {
    id: 'poi',
    label: 'POI管理',
    icon: <MapPin size={20} />,
    path: '/poi'
  },
  {
    id: 'video-record',
    label: '录像管理',
    icon: <Video size={20} />,
    path: '/video-record'
  },
  {
    id: 'config',
    label: '系统配置',
    icon: <Settings size={20} />,
    path: '/config'
  },
  {
    id: 'tips',
    label: 'Tips管理',
    icon: <Lightbulb size={20} />,
    path: '/tips'
  }
];
