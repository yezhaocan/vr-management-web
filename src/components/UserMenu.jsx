// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Avatar, AvatarFallback, useToast } from '@/components/ui';
// @ts-ignore;
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';

export function UserMenu({
  $w
}) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const {
    toast
  } = useToast();
  useEffect(() => {
    loadUserInfo();
  }, []);
  const loadUserInfo = async () => {
    try {
      const tcb = await $w.cloud.getCloudInstance();
      const auth = tcb.auth();
      const loginState = auth.hasLoginState();
      if (loginState && loginState.user) {
        setUser({
          name: loginState.user.username || loginState.user.email || '用户',
          avatar: loginState.user.avatar || null
        });
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = async () => {
    try {
      const tcb = await $w.cloud.getCloudInstance();
      const auth = tcb.auth();
      await auth.signOut();
      toast({
        title: '退出成功',
        description: '您已成功退出登录',
        duration: 2000
      });

      // 跳转到登录页
      setTimeout(() => {
        $w.utils.redirectTo({
          pageId: 'login',
          params: {}
        });
      }, 1000);
    } catch (error) {
      console.error('退出登录失败:', error);
      toast({
        title: '退出失败',
        description: '请重试',
        variant: 'destructive'
      });
    }
  };
  if (loading) {
    return <div className="w-10 h-10 rounded-full bg-gray-700 animate-pulse"></div>;
  }
  if (!user) {
    return null;
  }
  return <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-800">
          <Avatar className="w-8 h-8">
            {user.avatar ? <img src={user.avatar} alt={user.name} /> : <AvatarFallback className="bg-blue-600 text-white text-sm">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>}
          </Avatar>
          <span className="text-white text-sm hidden md:block">{user.name}</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700">
        <DropdownMenuItem className="text-gray-300 hover:bg-gray-700">
          <User className="w-4 h-4 mr-2" />
          <span>个人资料</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="text-gray-300 hover:bg-gray-700">
          <Settings className="w-4 h-4 mr-2" />
          <span>设置</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="text-red-400 hover:bg-gray-700 hover:text-red-300" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          <span>退出登录</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>;
}