// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Avatar, AvatarFallback, useToast, DropdownMenuSeparator } from '@/components/ui';
// @ts-ignore;
import { User, LogOut, Settings, ChevronDown, UserCircle } from 'lucide-react';

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
          avatar: loginState.user.avatar || null,
          role: '管理员' // 模拟角色
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
      auth.currentUser && await auth.signOut();
      toast({
        title: '退出成功',
        description: '您已成功退出登录',
        duration: 2000
      });

      // 跳转到登录页
      window.location.href = '/login'
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
    return <div className="w-10 h-10 rounded-full bg-muted animate-pulse"></div>;
  }
  if (!user) {
    return null;
  }
  return <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center space-x-3 px-2 py-1.5 h-auto hover:bg-accent hover:text-accent-foreground transition-all duration-200 rounded-full md:rounded-lg md:px-3 md:py-2 border border-transparent hover:border-border/50"
        >
          <Avatar className="w-8 h-8 border border-border/50 shadow-sm transition-transform duration-200 group-hover:scale-105">
            {user.avatar ? <img src={user.avatar} alt={user.name} /> : <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>}
          </Avatar>
          <div className="flex-col items-start hidden md:flex text-left">
            <span className="text-sm font-medium leading-none text-foreground">{user.name}</span>
            <span className="text-xs text-muted-foreground mt-0.5">{user.role}</span>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">admin@example.com</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer transition-colors focus:bg-accent focus:text-accent-foreground">
          <User className="w-4 h-4 mr-2" />
          <span>个人资料</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer transition-colors focus:bg-accent focus:text-accent-foreground">
          <Settings className="w-4 h-4 mr-2" />
          <span>账户设置</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer transition-colors" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          <span>退出登录</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>;
}