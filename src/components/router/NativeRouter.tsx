// 原生路由组件 - 替代 react-router-dom 的 BrowserRouter
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { nativeRouter, RouteState, RouterContextType } from '@/lib/native-router';

// 路由上下文
const RouterContext = createContext<RouterContextType | null>(null);

// NativeRouter 组件 - 替代 BrowserRouter
export function NativeRouter({ children }: { children: ReactNode }) {
    const [location, setLocation] = useState<RouteState>(nativeRouter.getLocation());

    useEffect(() => {
        const unsubscribe = nativeRouter.subscribe(() => {
            setLocation(nativeRouter.getLocation());
        });

        return unsubscribe;
    }, []);

    const contextValue: RouterContextType = {
        location,
        navigate: nativeRouter.navigate.bind(nativeRouter),
        back: nativeRouter.back.bind(nativeRouter),
        forward: nativeRouter.forward.bind(nativeRouter),
        go: nativeRouter.go.bind(nativeRouter),
    };

    return (
        <RouterContext.Provider value={contextValue}>
            {children}
        </RouterContext.Provider>
    );
}

// useRouter Hook - 替代 useNavigate, useLocation 等
export function useRouter() {
    const context = useContext(RouterContext);
    if (!context) {
        throw new Error('useRouter must be used within a NativeRouter');
    }
    return context;
}

// useNavigate Hook - 兼容原有代码
export function useNavigate() {
    const { navigate } = useRouter();
    return navigate;
}

// useLocation Hook - 兼容原有代码
export function useLocation() {
    const { location } = useRouter();
    return location;
}

// useParams Hook - 从路径中提取参数
export function useParams() {
    // 这里需要根据当前路由配置来解析参数
    // 由于我们的路由配置比较简单，暂时返回空对象
    return {};
}