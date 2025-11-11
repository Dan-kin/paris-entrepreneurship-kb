"""
内容生成模块
将处理后的文章生成符合项目格式的Markdown文件
"""
import os
import yaml
import re
from datetime import datetime
from typing import Dict, List
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


class ContentGenerator:
    """内容生成器"""

    def __init__(self, output_dir: str = "content/stories"):
        """
        初始化内容生成器

        Args:
            output_dir: 输出目录
        """
        self.output_dir = output_dir
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        logger.info(f"输出目录: {output_dir}")

    def _sanitize_filename(self, text: str) -> str:
        """
        清理文件名

        Args:
            text: 原始文本

        Returns:
            安全的文件名
        """
        # 移除特殊字符，保留中文、字母、数字和连字符
        filename = re.sub(r'[^\w\s-]', '', text)
        filename = re.sub(r'[-\s]+', '-', filename)
        filename = filename.strip('-')[:50]  # 限制长度
        return filename or 'article'

    def _extract_tags(self, article: Dict) -> List[str]:
        """
        从文章中提取标签

        Args:
            article: 文章数据

        Returns:
            标签列表
        """
        tags = []

        # 从分类添加标签
        if article.get('category'):
            tags.append(article['category'])

        # 可以根据内容自动提取更多标签
        # 这里简单实现，可以扩展
        content = article.get('content_zh', '') or article.get('content', '')

        # 常见创业主题关键词
        keywords = {
            '融资': ['融资', '投资', 'VC', '天使轮', 'A轮'],
            'SaaS': ['SaaS', 'Software as a Service'],
            '人工智能': ['AI', '人工智能', '机器学习', 'ML'],
            '电商': ['电商', 'e-commerce', '跨境'],
            '创始人': ['创始人', 'CEO', 'founder'],
            '团队管理': ['团队', '招聘', '管理'],
            '产品': ['产品', 'PMF', 'product-market fit'],
        }

        for tag, keywords_list in keywords.items():
            if any(keyword in content for keyword in keywords_list):
                if tag not in tags:
                    tags.append(tag)

        return tags[:5]  # 最多5个标签

    def _generate_excerpt(self, content: str, max_length: int = 150) -> str:
        """
        生成文章摘要

        Args:
            content: 文章内容
            max_length: 最大长度

        Returns:
            摘要文本
        """
        # 移除Markdown标记
        text = re.sub(r'[#*`\[\]()]', '', content)
        # 取第一段或前N个字符
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        if lines:
            excerpt = lines[0]
            if len(excerpt) > max_length:
                excerpt = excerpt[:max_length] + '...'
            return excerpt
        return ""

    def _get_next_id(self) -> int:
        """
        获取下一个文章ID

        Returns:
            文章ID
        """
        if not os.path.exists(self.output_dir):
            return 1

        max_id = 0
        for filename in os.listdir(self.output_dir):
            if filename.endswith('.md'):
                try:
                    with open(os.path.join(self.output_dir, filename), 'r', encoding='utf-8') as f:
                        content = f.read()
                        # 尝试从front matter中提取ID
                        match = re.search(r'^id:\s*(\d+)', content, re.MULTILINE)
                        if match:
                            article_id = int(match.group(1))
                            max_id = max(max_id, article_id)
                except Exception:
                    pass

        return max_id + 1

    def generate_markdown(self, article: Dict, article_id: Optional[int] = None) -> str:
        """
        生成Markdown文件内容

        Args:
            article: 文章数据
            article_id: 文章ID（可选，自动生成）

        Returns:
            Markdown文件内容
        """
        if article_id is None:
            article_id = self._get_next_id()

        # 准备front matter数据
        front_matter = {
            'id': article_id,
            'title': article.get('title_zh') or article.get('title', '无标题'),
            'entrepreneur': article.get('author', '未知'),
            'company': '',  # 可以从内容中提取
            'industry': article.get('category', '其他'),
            'founded_year': datetime.now().year,
            'location': '巴黎',
            'tags': self._extract_tags(article),
            'excerpt': self._generate_excerpt(
                article.get('content_zh') or article.get('content', '')
            ),
            'date': datetime.now().strftime('%Y-%m-%d'),
            'published': True,
            'source_url': article.get('url', ''),
        }

        # 生成front matter YAML
        yaml_content = yaml.dump(
            front_matter,
            allow_unicode=True,
            default_flow_style=False,
            sort_keys=False
        )

        # 文章内容
        content = article.get('content_zh') or article.get('rewritten_content') or article.get('content', '')

        # 组合Markdown
        markdown = f"""---
{yaml_content.strip()}
---

{content}

---

**原文来源**: [{article.get('title', '原文链接')}]({article.get('url', '#')})

**处理说明**: 本文由AI自动采集、提取要点并翻译生成。
"""

        return markdown

    def save_article(self, article: Dict, article_id: Optional[int] = None) -> str:
        """
        保存文章为Markdown文件

        Args:
            article: 文章数据
            article_id: 文章ID（可选）

        Returns:
            保存的文件路径
        """
        markdown = self.generate_markdown(article, article_id)

        # 生成文件名
        title = article.get('title_zh') or article.get('title', 'article')
        date_str = datetime.now().strftime('%Y-%m-%d')
        filename = f"{date_str}-{self._sanitize_filename(title)}.md"
        filepath = os.path.join(self.output_dir, filename)

        # 保存文件
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(markdown)

        logger.info(f"文章已保存: {filepath}")
        return filepath

    def save_articles(self, articles: List[Dict]) -> List[str]:
        """
        批量保存文章

        Args:
            articles: 文章列表

        Returns:
            保存的文件路径列表
        """
        filepaths = []
        for i, article in enumerate(articles, 1):
            logger.info(f"保存文章 {i}/{len(articles)}")
            try:
                filepath = self.save_article(article)
                filepaths.append(filepath)
            except Exception as e:
                logger.error(f"保存文章失败: {e}")

        logger.info(f"共保存 {len(filepaths)} 篇文章")
        return filepaths

    def generate_summary(self, articles: List[Dict]) -> Dict:
        """
        生成采集摘要统计

        Args:
            articles: 文章列表

        Returns:
            统计信息
        """
        summary = {
            'total': len(articles),
            'categories': {},
            'tags': {},
        }

        for article in articles:
            # 统计分类
            category = article.get('category', '其他')
            summary['categories'][category] = summary['categories'].get(category, 0) + 1

            # 统计标签
            for tag in self._extract_tags(article):
                summary['tags'][tag] = summary['tags'].get(tag, 0) + 1

        return summary
