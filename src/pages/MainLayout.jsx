import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { menuItems } from '@/configs/menus';
import { useNavigate, useLocation } from 'react-router-dom';

export const MainLayout = ({ children, $w }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // 获取当前激活的菜单 ID
  const activeMenuId = React.useMemo(() => {
    const currentPath = location.pathname;
    const item = menuItems.find(item => item.path === currentPath);
    return item?.id || '';
  }, [location.pathname]);

  // 获取当前页面标题
  const currentTitle = React.useMemo(() => {
    const item = menuItems.find(item => item.id === activeMenuId);
    return item?.label || '管理控制台';
  }, [activeMenuId]);

  return (
    <div className="abc min-h-screen bg-background flex flex-col transition-colors duration-300">
      {/* 1. 头部组件：固定在顶部，宽度100% */}
      <div className="w-full fixed top-0 left-0 right-0 z-50">
        <Header 
          $w={$w} 
          title={currentTitle} 
          subtitle="智慧景区无人机管理系统"
        />
      </div>

      {/* 下方布局：两栏结构 - 增加顶部padding以避开fixed header */}
      <div className="flex flex-1 overflow-hidden w-full pt-16">
        
        {/* 左侧菜单栏 */}
        <aside 
          className={cn(
            "fixed left-0 top-16 bottom-0 z-40 bg-card border-r border-border transition-all duration-300 ease-in-out flex flex-col shadow-sm",
            sidebarOpen ? "w-60" : "w-16",
            "hidden md:flex" 
          )}
        >
          {/* 菜单内容区域 */}
          <div className="flex-1 py-6 overflow-y-auto custom-scrollbar">
            <nav className="space-y-1.5 px-3">
              {menuItems.map((item) => (
                <NavItem 
                  key={item.id}
                  icon={item.icon} 
                  label={item.label} 
                  isOpen={sidebarOpen} 
                  active={activeMenuId === item.id}
                  onClick={() => navigate(item.path)}
                />
              ))}
            </nav>
          </div>

          {/* 底部折叠按钮 */}
          <div className="p-4 border-t border-border/60">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full flex justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </Button>
          </div>
        </aside>

        {/* 右侧主内容区域 */}
        <main 
          className={cn(
            "flex-1 bg-background/50 transition-all duration-300 ease-in-out overflow-auto",
            sidebarOpen ? "md:ml-60" : "md:ml-16"
          )}
        >
          <div className="main-content-area">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// 辅助组件：菜单项
function NavItem({ 
  icon, 
  label, 
  isOpen, 
  active = false,
  onClick 
}) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      onClick={onClick}
      className={cn(
        "w-full justify-start h-11 px-3 mb-1 group transition-all",
        !isOpen && "justify-center px-0",
        active ? "bg-primary/10 text-primary font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
      )}
    >
      <span className={cn(
        "flex-shrink-0 transition-transform group-hover:scale-110", 
        active ? "text-primary" : "text-muted-foreground group-hover:text-primary"
      )}>
        {icon}
      </span>
      {isOpen && <span className="ml-3 truncate text-sm">{label}</span>}
      {isOpen && active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(24,144,255,0.6)]" />}
    </Button>
  );
}
