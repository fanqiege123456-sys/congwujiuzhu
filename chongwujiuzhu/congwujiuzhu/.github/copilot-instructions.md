# Copilot 使用说明（针对本仓库）

目的：帮助 AI 编码代理快速上手本项目，关注架构要点、运行/调试命令、项目约定与常见改动点。

- **项目类型**：TypeScript + Vite 前端工程，包含 Web (React/Vite) 和微信小程序风格的页面实现。主要代码位置：`components/`、`pages/`、`services/`。
- **运行命令**：参见 `package.json`。
  - 本地开发（Vite dev server）：`npm install` 然后 `npm run dev`（默认端口 `3000`）
  - 打包：`npm run build`（执行 `tsc && vite build`）
  - 预览：`npm run preview`

- **环境变量 / AI Key**：
  - AI 使用 `@google/genai`，在 `services/geminiService.ts` 通过 `process.env.API_KEY` 读取。Vite 配置在 `vite.config.ts` 中将 `GEMINI_API_KEY` 注入为 `process.env.API_KEY` / `process.env.GEMINI_API_KEY`。
  - 请按 `README.md` 要求将 `GEMINI_API_KEY` 写入 `.env.local` 或相应环境。

- **后端 / API**：
  - 基础 API 地址在 `services/apiService.ts` 中定义为 `https://cadmin.yibibao.com`。所有网络调用均通过 `apiGet`/`apiPost`/`apiPut` 等封装函数（使用 `wx.request`）。
  - 上传文件使用 `uploadFile(filePath)`，会调用 `${API_BASE_URL}/api/uploads` 并返回文件 URL。

- **AI 集成要点**（容易出错的地方）:
  - `services/geminiService.ts` 使用 `new GoogleGenAI({ apiKey: process.env.API_KEY })`；确保本地 dev 时 Vite 注入的 `GEMINI_API_KEY` 可用，否则 AI 请求会失败。
  - 对带图像的生成请求，函数接受 Base64 字符串（会尝试剥离 `data:*;base64,` 前缀）。

- **运行时环境差异**：
  - 代码同时包含对 `wx` 全局对象的调用（如 `wx.request`、`wx.navigateTo`、`wx.getStorageSync`），以及在 web 环境的降级实现（如 `storageService` 会回退到 `localStorage`）。
  - 修改跨环境逻辑时请检查 `services/storageService.ts` 和页面中对 `wx` 的直接使用。

- **页面与组件约定**：
  - 小程序页面位于 `pages/*`，包含 `.ts`（逻辑）、`.wxml`（模板）、`.wxss`（样式）。例如主页逻辑在 `pages/index/index.ts`。
  - React/通用组件放在 `components/`（例如 `MapView.tsx`、`PetDetail.tsx`），注意这些组件可能在 web 预览与小程序适配中承担不同职责。

- **数据流与状态**：
  - 全局数据通过 `getApp().globalData` 与页面之间共享（常见于小程序风格代码）。筛选与同步逻辑在 `services/storageService.ts`（如 `syncPetsFromServer()`）中实现。

- **修改/新增注意点与示例**：
  - 增加后端接口：首选在 `services/apiService.ts` 中添加封装函数，并在调用处替换直接 `wx.request`。示例：新增 `apiDelete(path)` 风格与现有 `apiGet` 保持一致。
  - 增加 AI 用例：在 `services/geminiService.ts` 中复用 `analyzePetReport` 的 prompt 格式，注意返回值为纯文本 `response.text`。
  - 上传文件：调用 `uploadFile(filePath)` 并使用返回的 URL 填充表单字段，再调用 `apiPost('/api/pets', payload)`。

- **调试建议**：
  - 本地 Web调试：`npm run dev`，打开浏览器访问 `http://localhost:3000`。Vite 控制台会暴露 ENV 变量注入情况。
  - 小程序端调试：仓库中为小程序代码结构（`.wxml/.wxss`），将编译/打包产物导入微信开发者工具（具体打包脚本留存于项目 CI 或外部工具，不在 `package.json` 中）。

- **不要假设**：
  - 虽然有 React 组件，但并非全部页面都以 React 为主；在修改界面相关功能前请先确认目标是 `pages/`（小程序）还是 `components/`（Web/共享组件）。

如果以上有不清楚或需要补充的地方，请告诉我想要更详细的哪个部分（例如：AI prompt 模板、常用 API 列表、页面导航映射等），我会迭代更新本文件。
