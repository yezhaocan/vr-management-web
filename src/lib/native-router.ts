// 原生路由系统 - 替代 react-router-dom
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

// 路由状态接口
export interface RouteState {
  pathname: string;
  search: string;
  hash: string;
  state?: any;
}

// 路由上下文类型
export interface RouterContextType {
  location: RouteState;
  navigate: (to: string, options?: { replace?: boolean; state?: any }) => void;
  back: () => void;
  forward: () => void;
  go: (delta: number) => void;
}

// 创建路由上下文
export const RouterContext = createContext<RouterContextType | null>(null);

// 解析 URL 路径
export function parseLocation(): RouteState {
  const { pathname, search, hash } = window.location;
  return {
    pathname,
    search,
    hash,
    state: window.history.state
  };
}

// 路由匹配函数
export function matchPath(pattern: string, pathname: string): { isMatch: boolean; params: Record<string, string> } {
  // 简单的路径匹配，支持参数
  const patternParts = pattern.split('/');
  const pathnameParts = pathname.split('/');
  
  if (patternParts.length !== pathnameParts.length) {
    return { isMatch: false, params: {} };
  }
  
  const params: Record<string, string> = {};
  
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathnamePart = pathnameParts[i];
    
    if (patternPart.startsWith(':')) {
      // 参数匹配
      const paramName = patternPart.slice(1);
      params[paramName] = pathnamePart;
    } else if (patternPart !== pathnamePart) {
      // 精确匹配失败
      return { isMatch: false, params: {} };
    }
  }
  
  return { isMatch: true, params };
}

// 路由导航类
export class NativeRouter {
  private listeners: Set<() => void> = new Set();
  
  constructor() {
    // 监听浏览器前进后退
    window.addEventListener('popstate', this.handlePopState);
  }
  
  private handlePopState = () => {
    this.notifyListeners();
  };
  
  // 添加监听器
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  // 通知所有监听器
  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
  
  // 导航到新路径
  navigate(to: string, options: { replace?: boolean; state?: any } = {}) {
    const { replace = false, state = null } = options;
    
    if (replace) {
      window.history.replaceState(state, '', to);
    } else {
      window.history.pushState(state, '', to);
    }
    
    this.notifyListeners();
  }
  
  // 后退
  back() {
    window.history.back();
  }
  
  // 前进
  forward() {
    window.history.forward();
  }
  
  // 跳转指定步数
  go(delta: number) {
    window.history.go(delta);
  }
  
  // 获取当前位置
  getLocation(): RouteState {
    return parseLocation();
  }
  
  // 销毁
  destroy() {
    window.removeEventListener('popstate', this.handlePopState);
    this.listeners.clear();
  }
}

// 全局路由实例
export const nativeRouter = new NativeRouter();

// 保持与原有 history 库的兼容性
if (typeof window !== 'undefined') {
  (window as any)._WEAPPS_HISTORY = {
    push: (path: string, state?: any) => nativeRouter.navigate(path, { state }),
    replace: (path: string, state?: any) => nativeRouter.navigate(path, { replace: true, state }),
    go: (delta: number) => nativeRouter.go(delta),
    back: () => nativeRouter.back(),
    forward: () => nativeRouter.forward(),
    location: nativeRouter.getLocation(),
    listen: (listener: () => void) => nativeRouter.subscribe(listener)
  };
}