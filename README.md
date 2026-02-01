# 深度之镜 (The Deep Mirror)

> 比你自己更懂你的 AI 深度自我察觉工具

基于荣格心理学和行为经济学的深度心理测试应用，通过 AI 生成个性化场景，帮助用户进行深度自我觉察。

## ✨ 核心特性

- 🧠 **深度心理测试**：Stage 0-4 递进式测试系统
- 🤖 **AI 智能生成**：基于用户画像动态生成场景化题目
- 📱 **移动端优先**：PWA 支持，可添加到主屏幕
- 🎨 **精美 UI**：极致的移动端沉浸体验
- 💾 **数据持久化**：LocalStorage 自动保存进度
- 📊 **深度报告**：生成完整的心理分析报告
- 🖼️ **报告分享**：一键生成报告长图

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件：

```bash
ANTHROPIC_API_KEY=your_api_key_here
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 📦 部署到 Vercel

### 方法 1: 使用 Vercel CLI（推荐）

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 部署到预览环境
vercel

# 部署到生产环境
vercel --prod
```

### 方法 2: 通过 GitHub 自动部署

1. 将代码推送到 GitHub
2. 访问 [vercel.com](https://vercel.com)
3. 点击 "Import Project"
4. 选择你的 GitHub 仓库
5. 配置环境变量 `ANTHROPIC_API_KEY`
6. 点击 "Deploy"

## 🔧 技术栈

- **框架**: Next.js 15.5.11 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **动画**: Framer Motion
- **AI**: Anthropic Claude API
- **图片生成**: html-to-image
- **部署**: Vercel

## 📱 PWA 配置

应用已配置为 PWA，支持：
- ✅ 添加到主屏幕
- ✅ 离线访问（Service Worker）
- ✅ 全屏模式（无浏览器地址栏）
- ✅ 刘海屏适配
- ✅ 原生 App 手感

## 🎯 测试流程

1. **Stage 0**: 信息采集 - 收集用户基础画像
2. **Stage 1**: 表层行为 - 测试应激反应模式
3. **Stage 2**: 深层动力 - 挖掘价值观和核心驱动力
4. **Stage 3**: 阴影与防御 - 压力测试和防御机制
5. **Stage 4**: 完整报告 - 生成深度心理分析报告

## 📝 环境变量说明

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `ANTHROPIC_API_KEY` | Anthropic Claude API 密钥 | ✅ |

## 🛠️ 开发命令

```bash
# 开发环境
npm run dev

# 生产构建
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint
```

## 📄 License

MIT License

## 👨‍💻 作者

基于 AI 辅助开发完成

---

**这是一面镜子，不是一碗鸡汤。**
