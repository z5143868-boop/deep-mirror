# Vercel 部署指南

## 📋 部署前准备

### 1. 检查清单

- ✅ 项目构建成功（`npm run build`）
- ✅ 环境变量已配置（`.env.local` 中有 `ANTHROPIC_API_KEY`）
- ✅ Git 仓库已初始化并推送到 GitHub
- ⚠️ PWA 图标已准备（可选，不影响核心功能）

### 2. 获取 Anthropic API Key

1. 访问 [console.anthropic.com](https://console.anthropic.com)
2. 登录或注册账号
3. 进入 API Keys 页面
4. 创建新的 API Key
5. 复制 Key（格式：`sk-ant-api03-...`）

---

## 🚀 方法 1: Vercel CLI 部署（推荐）

### 步骤 1: 安装 Vercel CLI

```bash
npm install -g vercel
```

### 步骤 2: 登录 Vercel

```bash
vercel login
```

选择登录方式（GitHub / Email）并完成认证。

### 步骤 3: 初始化项目

```bash
cd /workspaces/deep-mirror
vercel
```

按照提示操作：
- `Set up and deploy "~/workspaces/deep-mirror"?` → **Yes**
- `Which scope do you want to deploy to?` → 选择你的账号
- `Link to existing project?` → **No**
- `What's your project's name?` → **deep-mirror**（或自定义）
- `In which directory is your code located?` → **./（直接回车）**
- `Want to modify these settings?` → **No**

### 步骤 4: 配置环境变量

在 Vercel 部署后，访问项目设置：

1. 打开 [vercel.com/dashboard](https://vercel.com/dashboard)
2. 选择 `deep-mirror` 项目
3. 进入 **Settings** → **Environment Variables**
4. 添加环境变量：
   - **Key**: `ANTHROPIC_API_KEY`
   - **Value**: `sk-ant-api03-...`（你的 API Key）
   - **Environments**: 勾选 `Production`, `Preview`, `Development`
5. 点击 **Save**

### 步骤 5: 重新部署

```bash
vercel --prod
```

这会将项目部署到生产环境，并应用刚配置的环境变量。

---

## 🌐 方法 2: GitHub 自动部署

### 步骤 1: 推送代码到 GitHub

```bash
# 初始化 Git（如果还没有）
git init

# 添加所有文件
git add .

# 创建提交
git commit -m "Initial commit: Deep Mirror 心理测试应用"

# 关联远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/YOUR_USERNAME/deep-mirror.git

# 推送到 GitHub
git push -u origin main
```

### 步骤 2: 导入到 Vercel

1. 访问 [vercel.com/new](https://vercel.com/new)
2. 点击 **Import Git Repository**
3. 选择 **GitHub** 并授权 Vercel 访问
4. 选择 `deep-mirror` 仓库
5. 配置项目：
   - **Framework Preset**: Next.js（自动检测）
   - **Root Directory**: `./`（默认）
   - **Build Command**: `npm run build`（默认）
   - **Output Directory**: `.next`（默认）

### 步骤 3: 添加环境变量

在部署前，点击 **Environment Variables** 展开：

- **Name**: `ANTHROPIC_API_KEY`
- **Value**: 粘贴你的 API Key
- 确保勾选 **Production**, **Preview**, **Development**

### 步骤 4: 部署

点击 **Deploy** 按钮，Vercel 会：
1. 克隆代码
2. 安装依赖
3. 运行构建
4. 部署到全球 CDN

部署完成后，你会看到：
- 🎉 **Production URL**: `https://deep-mirror-xxx.vercel.app`

---

## ✅ 部署后验证

### 1. 测试核心功能

访问部署的 URL，测试：
- ✅ Stage 0 信息采集
- ✅ Stage 1-3 AI 生成题目
- ✅ 洞察反馈显示
- ✅ 最终报告生成
- ✅ 报告长图下载

### 2. 测试 PWA 功能

在手机浏览器中：
1. 访问部署的 URL
2. 点击浏览器菜单
3. 选择"添加到主屏幕"
4. 从主屏幕启动，测试全屏模式

### 3. 检查 API 调用

打开浏览器开发者工具：
- **Network** → 查看 `/api/generate` 请求是否成功（200）
- **Console** → 确保没有错误信息

---

## 🔧 常见问题

### Q1: 部署失败，显示 "Module not found"

**解决方案**：
```bash
# 删除 node_modules 和 lock 文件
rm -rf node_modules package-lock.json

# 重新安装
npm install

# 重新部署
vercel --prod
```

### Q2: API 返回 401 Unauthorized

**原因**：环境变量未正确配置

**解决方案**：
1. 访问 Vercel Dashboard → Settings → Environment Variables
2. 确认 `ANTHROPIC_API_KEY` 已添加
3. 重新部署：`vercel --prod`

### Q3: 页面显示 500 错误

**排查步骤**：
1. 访问 Vercel Dashboard → Deployments → 点击最新部署
2. 查看 **Function Logs** 或 **Build Logs**
3. 查找错误信息并修复
4. 重新部署

### Q4: PWA 无法添加到主屏幕

**检查项**：
- ✅ 确认使用 HTTPS（Vercel 自动启用）
- ✅ 检查 `/manifest.json` 是否可访问
- ✅ 确认图标路径正确（可暂时忽略图标错误）

---

## 🎯 自定义域名（可选）

1. 进入 Vercel Dashboard → Settings → Domains
2. 点击 **Add Domain**
3. 输入你的域名（如 `deep-mirror.com`）
4. 按照提示配置 DNS：
   - 添加 A 记录或 CNAME 记录
   - 等待 DNS 生效（5-60 分钟）
5. Vercel 会自动配置 HTTPS

---

## 📊 监控和分析

### 部署监控

- **Analytics**: Vercel Dashboard → Analytics（查看访问量）
- **Speed Insights**: 查看页面加载速度
- **Logs**: 查看实时日志和错误

### 推荐集成

- **Sentry**: 错误监控
- **Google Analytics**: 用户行为分析
- **Umami**: 轻量级隐私友好的分析工具

---

## 🔄 更新部署

### CLI 方式

```bash
# 更新代码
git pull origin main

# 部署到预览环境
vercel

# 部署到生产环境
vercel --prod
```

### GitHub 方式

```bash
# 提交更改
git add .
git commit -m "Update: 描述你的更改"
git push origin main
```

Vercel 会自动检测到推送并重新部署。

---

## 📞 获取帮助

- **Vercel 文档**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js 文档**: [nextjs.org/docs](https://nextjs.org/docs)
- **Anthropic 文档**: [docs.anthropic.com](https://docs.anthropic.com)

---

**祝部署顺利！🚀**
