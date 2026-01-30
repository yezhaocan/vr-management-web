项目结构及编码规则

一、核心约束

1. 工作空间为根目录（/），创建新文件夹/文件需严格遵循指定目录结构
2. 修改文件时需关注组件、文件间引用关系，避免空引用/无效引用。
3. 仅允许创建JavaScript文件（.js/.jsx），禁止创建TypeScript文件（.ts/.tsx）。
4. 编码仅可使用指定npm包，禁止使用清单外第三方包，优先用原生JS/框架内置API：

react、react-dom、react-router-dom、recharts、react-hook-form、date-fns、lucide-react、clsx、tailwind-merge、mobx、@cloudbase/js-sdk、@cloudbase/weda-cloud-sdk、@cloudbase/weda-client、@zxing/library、@cloudbase/lowcode-render

5. 自定义组件需放在src/components/，引用时用完整路径（例：import { List } from "@/components/List.jsx"），禁止简写。
6. 禁止操作src/components/ui/目录（预置只读shadcn/ui组件库）。

二、核心目录及文件说明（相对根目录）
- .ai/：生成中间文件的专用目录
- .datasources/${name}/：数据源目
  - schema.json：数据模型定义
  - data.json：示例数据
- .functions/${name}/：单个云函数存放目录
- src/：前端源代码根目录
  - components/：组件根目录（自定义组件可读写，ui/目录只读）
  - lib/utils.js：可读写工具方法文件
  - pages/${pageId}.jsx：可读写应用页面
  - App.jsx：不可读写应用入口（用react-router-dom渲染页面）
  - index.css：可读写全局样式（含默认css变量定义）
  - lowcode.json：只读全局配置，main字段指定默认页面Id
  - tailwind.config.ts：可读写Tailwind配置文件
