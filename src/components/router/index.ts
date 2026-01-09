// 路由组件导出 - 提供与 react-router-dom 兼容的 API
export { NativeRouter as BrowserRouter } from './NativeRouter';
export { Routes, Route, Navigate } from './Routes';
export { useNavigate, useLocation, useParams } from './NativeRouter';

// 为了兼容性，也导出原名称
export { NativeRouter } from './NativeRouter';

// 类型导出
export type { RouteProps } from './Routes';