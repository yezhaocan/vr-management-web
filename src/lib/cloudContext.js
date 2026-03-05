
// 使用平台内置的云开发能力，不再依赖 @cloudbase/js-sdk
import { createContext } from 'react';

// 创建空的云开发上下文，实际功能将通过 $w.cloud 使用
export const CloudContext = createContext(null);
