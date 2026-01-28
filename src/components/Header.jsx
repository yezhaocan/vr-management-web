import React from 'react';
import { UserMenu } from '@/components/UserMenu';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui';
import { Bell, HelpCircle, LayoutGrid } from 'lucide-react';

export function Header({ $w, title, subtitle }) {
  return (
    <div className="w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 transition-colors duration-300">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* 左侧：品牌标识与页面标题区 */}
          <div className="flex items-center space-x-4">
            {/* 品牌标识 */}
            <div className="flex items-center space-x-2 mr-4 border-r border-border/50 pr-4">
               <img 
                 src="https://636c-cloud1-1grrg77xa07045b0-1362525855.cos.ap-shanghai.myqcloud.com/vr-logo.png?q-sign-algorithm=sha1&q-ak=AKIDIa8WpUzOYYD_uH2dewDnAgKZtae2_38jpdeQe6B8iZZh0lcZFn6CRU4L_0gCS5Lv&q-sign-time=1769587841;1769591441&q-key-time=1769587841;1769591441&q-header-list=host&q-url-param-list=&q-signature=7d8427b8fab12cec77ba30adc519b505922e2f2e&x-cos-security-token=rorEQMA0Vl9s5hs4mcYSyJljb7AJ5FUa8a8a3c0fe28418b6b9d5a3b140a55802IDqf_zbL9NOHOApYfgGtCH_S1ScGPIAW8Qp5uTLf4SKcY3iP_5YKoZNq66GQOdtpIkcdKjdGXpZMNfyGSgD5Y-labiyqINnTrtWaAPL8mnr95d4Kve7qi0uSqLMuSVrJpOAL6HygavsChfqUlsaCdA4kHOJlxNVScqpZxH7PsPdJ17KgLNqrGKa1wTbAnP5kh9neQjiW0yi7gB9ivabotsDXj5RtT4lypqpxIVlIvk1W2PKARMWPd5lQ4i4ND8k2LMXtKBRtT2DKlrqlDp-xXA" 
                 alt="VR观光管理系统" 
                 className="h-8 w-auto object-contain" 
               />
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
