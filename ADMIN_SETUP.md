# Admin 管理页面设置指南

本项目已配置 Netlify CMS 作为内容管理系统，允许通过图形界面管理网站内容。

## 访问 Admin 页面

访问地址：https://paris-entrepreneurship.netlify.app/admin/

## 设置步骤

### 1. 在 Netlify 上启用 Identity 服务

1. 登录到 Netlify Dashboard
2. 选择你的站点 `paris-entrepreneurship`
3. 进入 **Site settings** → **Identity**
4. 点击 **Enable Identity** 按钮

### 2. 配置 Git Gateway

1. 在 Identity 设置页面，找到 **Services** 部分
2. 点击 **Enable Git Gateway**
3. 这将允许 CMS 直接编辑 GitHub 仓库

### 3. 邀请用户

1. 在 Identity 选项卡中，点击 **Invite users**
2. 输入你的邮箱地址
3. 你会收到一封邀请邮件
4. 点击邮件中的链接设置密码

### 4. 首次登录

1. 访问 https://paris-entrepreneurship.netlify.app/admin/
2. 使用你的邮箱和密码登录
3. 现在你可以编辑网站内容了！

## 可管理的内容

### 首页设置
- 网站标题和副标题
- 状态信息
- 最后更新日期
- 页脚文本

### ChatGPT 研究页面
- 主标题和作者信息
- 6个主题卡片
- 各个详情页的内容：
  - 全球普及规模
  - 工作 vs 个人使用
  - 热门对话主题
  - 交互方式
  - 人口统计洞察
  - 写作主导工作

## 内容文件位置

所有可编辑的内容都存储在 `content/` 目录下的 JSON 文件中：
- `homepage.json` - 首页内容
- `research_main.json` - 研究页面主信息
- `topic_cards.json` - 主题卡片
- `detail_global.json` - 全球普及详情
- `detail_usage.json` - 工作vs个人使用详情
- `detail_topics.json` - 热门主题详情
- `detail_interaction.json` - 交互方式详情
- `detail_demographics.json` - 人口统计详情
- `detail_writing.json` - 写作主导详情

## 编辑工作流

1. 登录到 admin 页面
2. 选择要编辑的内容类型
3. 修改内容
4. 点击 **Save** 保存草稿
5. 点击 **Publish** 发布更改
6. CMS 会自动创建 Git commit 并推送到仓库
7. Netlify 会自动构建和部署更新

## 注意事项

- 所有更改都会自动提交到 Git 仓库
- 每次发布都会触发 Netlify 的自动部署
- 建议在编辑重要内容前先备份
- 如果遇到问题，可以通过 Git 历史恢复

## 本地开发

如果要在本地测试 CMS：

1. 在 `admin/config.yml` 中取消注释 `local_backend: true`
2. 安装 Netlify CMS Proxy: `npx netlify-cms-proxy-server`
3. 在另一个终端启动本地服务器
4. 访问 `http://localhost:8080/admin/`
