# 移个朋友·巴黎创业 知识库

> 分享在巴黎创业的故事、经验和资源

## 📖 项目简介

这是一个开放的知识库项目，致力于收集和分享在巴黎创业的华人故事、经验和资源。我们希望通过这个平台，帮助更多有志在法国创业的朋友，了解真实的创业历程，获取有价值的信息和资源。

## 🚀 在线访问

- **网站首页**: https://paris-entrepreneurship.netlify.app
- **管理后台**: https://paris-entrepreneurship.netlify.app/admin

## ✨ 功能特点

- ✅ **无需数据库**: 纯静态网站，基于 Markdown 文件
- ✅ **可视化管理**: Decap CMS 后台，无需编写代码即可管理内容
- ✅ **自动部署**: GitHub Actions 自动构建和部署到 Netlify
- ✅ **响应式设计**: 完美支持移动端和桌面端
- ✅ **搜索和过滤**: 支持关键词搜索和标签过滤
- ✅ **自动更新检测**: 内容更新时自动提示用户刷新
- ✅ **图片管理**: 支持图片上传和自动处理

## 📁 项目结构

```
paris-entrepreneurship/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions 自动部署配置
├── content/                    # 内容目录（Markdown 文件）
│   ├── stories/               # 创业故事
│   ├── resources/             # 创业资源
│   ├── settings/              # 网站设置
│   │   └── site.yml          # 网站基本信息
│   └── uploads/               # 上传的图片
├── public/                     # 公共资源
│   └── admin/                 # CMS 后台
│       ├── config.yml         # Decap CMS 配置
│       └── index.html         # CMS 入口页面
├── src/                        # 源代码
│   ├── build.py               # Python 构建脚本
│   ├── index.html             # 网站首页
│   ├── styles.css             # 样式表
│   ├── script.js              # 交互脚本
│   └── update-detector.js     # 自动更新检测
├── dist/                       # 构建输出目录（自动生成）
└── netlify.toml               # Netlify 部署配置
```

## 🛠️ 本地开发

### 1. 克隆仓库

```bash
git clone https://github.com/Dan-kin/paris-entrepreneurship-kb.git
cd paris-entrepreneurship-kb
```

### 2. 安装依赖

```bash
pip install PyYAML
```

### 3. 运行构建

```bash
python src/build.py
```

### 4. 预览网站

使用任何本地 HTTP 服务器预览 `dist` 目录：

```bash
# 使用 Python
cd dist
python -m http.server 8000

# 或使用 Node.js
npx serve dist
```

然后在浏览器中访问 `http://localhost:8000`

## 📝 添加内容

### 方式一：使用 CMS 后台（推荐）

1. 访问 https://paris-entrepreneurship.netlify.app/admin
2. 使用 GitHub 账号登录
3. 在可视化界面中添加/编辑内容
4. 点击发布，GitHub Actions 会自动部署

### 方式二：直接编辑 Markdown 文件

#### 添加创业故事

在 `content/stories/` 目录下创建新的 Markdown 文件：

```markdown
---
id: 2
title: 您的故事标题
entrepreneur: 创业者姓名
company: 公司名称
industry: 行业
founded_year: 2023
location: 巴黎
cover_image: /uploads/your-image.jpg
tags:
  - 标签1
  - 标签2
excerpt: 简短的故事摘要
date: 2024-11-10
published: true
---

## 故事内容

这里写您的完整创业故事...
```

#### 添加创业资源

在 `content/resources/` 目录下创建新的 Markdown 文件：

```markdown
---
id: 2
title: 资源标题
resource_type: 孵化器
description: 资源描述
url: https://example.com
contact: contact@example.com
date: 2024-11-10
published: true
---

## 资源详情

资源的详细介绍...
```

## 🔧 配置

### 网站设置

编辑 `content/settings/site.yml`：

```yaml
site_title: "移个朋友·巴黎创业"
site_subtitle: "巴黎创业故事与资源知识库"
site_description: "分享在巴黎创业的故事、经验和资源"
contact_email: "your-email@example.com"
social_media:
  wechat: "your-wechat-id"
  weibo: "your-weibo-id"
  xiaohongshu: "your-xiaohongshu-id"
```

### GitHub Actions 配置

在 GitHub 仓库的 Settings → Secrets and variables → Actions 中添加：

- `NETLIFY_AUTH_TOKEN`: Netlify 访问令牌
- `NETLIFY_SITE_ID`: Netlify 站点 ID

获取方式：
1. 登录 [Netlify](https://app.netlify.com)
2. User Settings → Applications → Personal access tokens → 生成新 token
3. Site Settings → Site details → Site ID

## 🚀 部署

### 自动部署

推送代码到 GitHub main 分支，GitHub Actions 会自动：
1. 构建网站
2. 验证构建结果
3. 部署到 Netlify

### 手动部署

```bash
# 1. 构建
python src/build.py

# 2. 使用 Netlify CLI 部署
netlify deploy --prod --dir=dist
```

## 🤝 贡献指南

我们欢迎任何形式的贡献！

### 如何贡献

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

### 贡献内容

- 分享您的创业故事
- 推荐有价值的创业资源
- 完善和更新现有内容
- 改进网站功能和设计
- 修复 Bug
- 改进文档

## 📄 开源协议

本项目采用 MIT 协议开源。

## 📧 联系我们

如有任何问题或建议，欢迎通过以下方式联系：

- GitHub Issues: https://github.com/Dan-kin/paris-entrepreneurship-kb/issues
- Email: contact@example.com

## 🙏 致谢

感谢所有为本项目做出贡献的创业者和开发者！

---

**让我们一起记录和分享在巴黎的创业故事！** 🚀
