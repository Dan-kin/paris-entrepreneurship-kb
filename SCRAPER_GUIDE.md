# 网站分类文章采集工具使用指南

## 功能概述

这是一个强大的文章采集和处理工具，可以：

1. **按分类采集文章** - 从目标网站自动抓取指定分类的文章
2. **AI提取要点** - 使用AI分析文章，提取核心要点和关键信息
3. **AI重新撰写** - 基于要点重新撰写，确保内容质量和可读性
4. **中文翻译** - 自动将外文内容翻译为简体中文
5. **生成Markdown** - 生成符合项目格式的Markdown文件，可直接使用

## 目录结构

```
src/
├── scraper.py              # 网页抓取模块
├── ai_processor.py         # AI处理模块（提取、改写、翻译）
├── content_generator.py    # 内容生成模块
└── article_scraper.py      # 主程序入口
```

## 安装依赖

### 1. 安装Python包

```bash
pip install -r requirements.txt
```

所需依赖：
- `PyYAML` - YAML处理
- `requests` - HTTP请求
- `beautifulsoup4` - HTML解析
- `lxml` - XML/HTML解析器
- `openai` - OpenAI API客户端
- `anthropic` - Anthropic Claude API客户端

### 2. 配置API密钥

复制环境变量示例文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的API密钥：

```bash
# 使用OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# 或使用Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key
```

**注意**：只需要配置你使用的AI提供商的密钥。

## 配置文件

### 创建配置文件

复制示例配置：

```bash
cp scraper_config.example.json scraper_config.json
```

### 配置说明

```json
{
  "website": {
    "base_url": "https://example.com",        // 目标网站基础URL
    "max_pages": 2,                            // 每个分类最多抓取的页数
    "categories": [                            // 要抓取的分类列表
      {
        "name": "创业故事",                    // 分类名称
        "url": "https://example.com/startup"  // 分类URL
      }
    ],
    "selectors": {                             // CSS选择器配置
      "article_link": "article h2 a",          // 文章链接选择器
      "article_title": "h1.title",             // 标题选择器
      "article_content": "article .content",   // 内容选择器
      "article_author": ".author",             // 作者选择器（可选）
      "article_date": "time"                   // 日期选择器（可选）
    },
    "headers": {                               // HTTP请求头（可选）
      "User-Agent": "Mozilla/5.0..."
    }
  },
  "ai": {
    "provider": "openai",                      // AI提供商: "openai" 或 "anthropic"
    "model": "gpt-4o",                        // 模型名称（可选）
    "skip_translation": false                  // 是否跳过翻译
  },
  "output_dir": "content/stories"             // 输出目录
}
```

### 如何找到正确的CSS选择器

使用浏览器开发者工具（F12）：

1. **找文章链接选择器**：
   - 打开分类页面
   - 右键点击文章标题 → "检查元素"
   - 找到包含文章链接的元素
   - 记录其CSS选择器（如 `article h2 a` 或 `.post-title a`）

2. **找内容选择器**：
   - 打开一篇文章
   - 找到文章正文的容器元素
   - 记录选择器（如 `article .content` 或 `.post-content`）

3. **测试选择器**：
   在浏览器控制台输入：
   ```javascript
   document.querySelectorAll('你的选择器')
   ```
   应该能选中目标元素

## 使用方法

### 方式1：按配置文件中的所有分类采集

```bash
python src/article_scraper.py -c scraper_config.json -n 10
```

参数说明：
- `-c, --config`: 配置文件路径（必需）
- `-n, --num-articles`: 每个分类采集的最大文章数（默认10）
- `-v, --verbose`: 显示详细日志

### 方式2：从指定URL采集

```bash
python src/article_scraper.py \
  -c scraper_config.json \
  -u "https://example.com/tech-news" \
  --category "科技新闻" \
  -n 5
```

参数说明：
- `-u, --url`: 直接指定URL
- `--category`: 分类名称（默认"其他"）

### 方式3：使用环境变量

```bash
# 设置API密钥（如果没有.env文件）
export OPENAI_API_KEY="sk-your-key"

# 运行采集
python src/article_scraper.py -c scraper_config.json
```

## 工作流程

工具的完整处理流程：

```
1. 网页抓取
   ├── 访问分类页面
   ├── 提取文章链接列表
   └── 逐个访问文章页面获取内容

2. AI处理（每篇文章）
   ├── 提取要点：分析文章核心信息
   ├── 重新撰写：基于要点生成新文章
   └── 翻译：翻译为中文（如需要）

3. 生成Markdown
   ├── 创建Front Matter（元数据）
   ├── 格式化内容
   ├── 自动提取标签
   └── 保存为.md文件
```

## 输出格式

生成的Markdown文件格式：

```markdown
---
id: 1
title: 文章标题
entrepreneur: 作者名
company: 公司名称
industry: 行业分类
founded_year: 2024
location: 巴黎
tags:
  - 标签1
  - 标签2
excerpt: 文章摘要...
date: 2024-11-11
published: true
source_url: https://原文链接
---

## 文章内容

重新撰写和翻译后的文章内容...

---

**原文来源**: [原文标题](原文URL)

**处理说明**: 本文由AI自动采集、提取要点并翻译生成。
```

## 实战示例

### 示例1：采集TechCrunch创业故事

**配置文件** (`techcrunch_config.json`):

```json
{
  "website": {
    "base_url": "https://techcrunch.com",
    "max_pages": 3,
    "categories": [
      {
        "name": "Startups",
        "url": "https://techcrunch.com/category/startups/"
      }
    ],
    "selectors": {
      "article_link": "h2.post-block__title a",
      "article_title": "h1.article__title",
      "article_content": "div.article-content",
      "article_author": "a.article__author-link",
      "article_date": "time.article__date"
    }
  },
  "ai": {
    "provider": "openai",
    "model": "gpt-4o"
  },
  "output_dir": "content/stories"
}
```

**运行命令**:

```bash
python src/article_scraper.py -c techcrunch_config.json -n 15
```

### 示例2：采集Medium创业文章

**配置文件** (`medium_config.json`):

```json
{
  "website": {
    "base_url": "https://medium.com",
    "max_pages": 2,
    "categories": [
      {
        "name": "Entrepreneurship",
        "url": "https://medium.com/tag/entrepreneurship"
      }
    ],
    "selectors": {
      "article_link": "article h2 a, div[data-test-id='post-preview-title'] a",
      "article_title": "h1[data-testid='post-title']",
      "article_content": "article section",
      "article_author": "a[data-testid='post-author-name']"
    }
  },
  "ai": {
    "provider": "anthropic",
    "model": "claude-3-5-sonnet-20241022"
  },
  "output_dir": "content/stories"
}
```

### 示例3：快速测试单个URL

```bash
python src/article_scraper.py \
  -c scraper_config.json \
  -u "https://example.com/single-article" \
  --category "测试" \
  -n 1
```

## 常见问题

### 1. API调用失败

**错误**: `API调用失败: Unauthorized`

**解决**:
- 检查 `.env` 文件中的API密钥是否正确
- 确认API密钥有足够的额度
- 检查网络连接

### 2. 无法抓取文章

**错误**: `抓取失败` 或 `发现 0 篇文章`

**解决**:
- 检查CSS选择器是否正确
- 使用浏览器开发者工具验证选择器
- 检查目标网站是否需要登录或有反爬虫机制
- 尝试添加适当的HTTP头部

### 3. 内容提取不完整

**解决**:
- 调整 `article_content` 选择器
- 某些网站使用动态加载，可能需要特殊处理
- 检查是否有多个内容区域

### 4. 翻译质量不佳

**解决**:
- 尝试更换AI模型（如从GPT-4o切换到Claude）
- 调整 `temperature` 参数（在代码中）
- 检查原文内容是否完整

## 高级用法

### 自定义AI处理逻辑

编辑 `src/ai_processor.py`，修改提示词：

```python
# 修改重写提示词
system_prompt_rewrite = """你的自定义提示词..."""
```

### 批量处理多个网站

创建脚本 `batch_scrape.sh`:

```bash
#!/bin/bash
python src/article_scraper.py -c config1.json -n 10
python src/article_scraper.py -c config2.json -n 10
python src/article_scraper.py -c config3.json -n 10
```

### 定时采集

使用cron定时运行：

```bash
# 每天凌晨2点采集
0 2 * * * cd /path/to/project && python src/article_scraper.py -c scraper_config.json -n 5
```

## 最佳实践

1. **礼貌采集**：工具已内置延迟，避免对目标网站造成负担
2. **测试配置**：先用 `-n 1` 测试配置是否正确
3. **检查输出**：采集后检查生成的Markdown文件质量
4. **API成本**：注意AI API调用成本，合理设置文章数量
5. **备份原文**：工具会在文章中保留原文链接
6. **遵守robots.txt**：尊重网站的爬虫协议

## 技术栈

- **Python 3.11+**
- **BeautifulSoup4** - HTML解析
- **Requests** - HTTP客户端
- **OpenAI/Anthropic API** - AI处理
- **PyYAML** - YAML处理

## 开发和扩展

### 添加新的AI提供商

在 `src/ai_processor.py` 中添加新的提供商支持：

```python
elif self.provider == 'your-provider':
    # 实现你的API调用逻辑
    pass
```

### 自定义内容格式

修改 `src/content_generator.py` 中的 `generate_markdown` 方法。

## 故障排除

启用详细日志：

```bash
python src/article_scraper.py -c scraper_config.json -v
```

这会显示每个步骤的详细信息，便于调试。

## 许可证

本工具遵循项目的MIT许可证。

## 支持

如有问题或建议，请提交Issue到项目仓库。

---

**Happy Scraping!** 🚀
