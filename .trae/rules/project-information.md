项目结构说明

**注意**：
1. 用户的工作空间为根目录（/），以下文件夹与文件介绍的全部是相对于根目录的放置情况；
2. 以下的结构仅用于说明，实际项目结构可能会有所不同，但创建新文件夹与文件时请严格遵循这个目录结构；
3. 修改文件时，关注组件、文件之间的引用关系，避免出现空引用的情况。
4. 创建新文件不能创建TypeScript文件（.ts或.tsx），只能创建JavaScript文件（.js或.jsx）。

├── .ai/                 # 生成中间文件的目录
├── .datasources/        # 数据源 Root
│   └── ${name}/             # 数据源名称
│       ├── schema.json         # 数据模型定义
│       └── data.json           # 示例数据
├── .functions/          # 云函数 Root
│   └── ${name}/             # 单个云函数目录
├── src/                 # 前端源代码目录
│   ├── components/          # 组件 Root
│   │   ├── ui/                 # shadcn/ui 组件库目录，只读
│   │   └── ${componentName}.jsx          # 自定义组件，可读写
│   ├── lib/
│   │   └── utils.js        # 工具方法，可读写
│   ├── pages/               # 各个页面 Root
│   │   └── ${pageId}.jsx            # 应用页面，可读写
│   ├── App.jsx        # 应用入口，使用 react-router-dom 渲染 pages/*.jsx 页面，不可读写
│   └── index.css            # 全局样式，默认包含 `:root`、`.dark` 时 css 变量定义，可读写
├── lowcode.json         # 只读，全局配置，main 表示默认页面Id
└── tailwind.config.ts   # Tailwind 配置，可读写

可以在 `components` 目录下生成自定义组件，然后在 pages 或其他 components 中使用，例如 `compontns/List.jsx`（使用 `import { List } from  "@/components/List.jsx"` 的方式引用，而非 `import { List } from "@/components"`）。**不要**操作`components/ui`目录，这是预置**只读**shadcn/ui 组件。