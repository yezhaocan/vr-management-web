// 原生路由组件 - 替代 react-router-dom 的 Routes 和 Route
import React, { ReactNode, ReactElement } from 'react';
import { useRouter } from './NativeRouter';
import { matchPath } from '@/lib/native-router';

// Route 组件接口
export interface RouteProps {
    path: string;
    element: ReactNode;
    children?: never;
}

// Route 组件 - 替代 react-router-dom 的 Route
export function Route({ path, element }: RouteProps) {
    // Route 组件本身不渲染任何内容，只是作为配置使用
    return null;
}

// Routes 组件 - 替代 react-router-dom 的 Routes
export function Routes({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
    const { location } = useRouter();

    // 获取所有 Route 子组件
    const routes = React.Children.toArray(children).filter(
        (child): child is ReactElement<RouteProps> =>
            React.isValidElement(child) && child.type === Route
    );

    // 查找匹配的路由
    for (const route of routes) {
        const { path, element } = route.props;
        const { isMatch } = matchPath(path, location.pathname);

        if (isMatch) {
            return <>{element}</>;
        }
    }

    // 没有匹配的路由，返回 fallback 或 404 页面
    return <>{fallback || null}</>;
}

// Navigate 组件 - 替代 react-router-dom 的 Navigate
export function Navigate({ to, replace = false }: { to: string; replace?: boolean }) {
    const { navigate } = useRouter();

    React.useEffect(() => {
        navigate(to, { replace });
    }, [to, replace, navigate]);

    return null;
}