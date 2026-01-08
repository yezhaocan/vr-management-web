import React from 'react';
import { UserMenu } from '@/components/UserMenu';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { MapPin, Bell, HelpCircle, LayoutGrid } from 'lucide-react';

export function Header({ $w, title, subtitle }) {
  return (
    <div className="w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 transition-colors duration-300">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* 左侧：品牌标识与页面标题区 */}
          <div className="flex items-center space-x-4">
            {/* 品牌标识 */}
            <div className="flex items-center space-x-2 mr-4 border-r border-border/50 pr-4">
               <div className="p-1.5 bg-primary rounded-lg">
                  <MapPin className="h-5 w-5 text-primary-foreground" />
               </div>
               <span className="text-lg font-bold text-foreground hidden md:block">VR观光管理系统</span>
            </div>

            {/* 页面标题 - 已隐藏 */}
            <div className="flex flex-col">
            </div>
          </div>

          {/* 右侧：工具栏与用户信息 */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            
            {/* 常用工具按钮区 */}
            <div className="flex items-center space-x-1 mr-2 border-r border-border/50 pr-4">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                <LayoutGrid className="h-5 w-5" />
                <span className="sr-only">应用中心</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                <Bell className="h-5 w-5" />
                <span className="sr-only">通知</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                <HelpCircle className="h-5 w-5" />
                <span className="sr-only">帮助</span>
              </Button>
            </div>

            {/* 主题切换 */}
            <ThemeToggle />

            {/* 用户菜单 */}
            <UserMenu $w={$w} />
          </div>
        </div>
      </div>
    </div>
  );
}
