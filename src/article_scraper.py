#!/usr/bin/env python3
"""
网站分类文章采集工具
功能：从网站按分类采集文章 -> AI提取要点并改写 -> 翻译为中文 -> 生成Markdown
"""
import argparse
import json
import logging
import sys
from pathlib import Path
from typing import Dict, List

from scraper import WebScraper
from ai_processor import AIProcessor
from content_generator import ContentGenerator

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ArticleScraper:
    """文章采集主控制器"""

    def __init__(self, config: Dict):
        """
        初始化采集器

        Args:
            config: 配置字典
        """
        self.config = config

        # 初始化各个模块
        self.scraper = WebScraper(
            base_url=config['website']['base_url'],
            headers=config['website'].get('headers')
        )

        self.ai_processor = AIProcessor(
            provider=config['ai'].get('provider', 'openai'),
            api_key=config['ai'].get('api_key'),
            model=config['ai'].get('model')
        )

        self.content_generator = ContentGenerator(
            output_dir=config.get('output_dir', 'content/stories')
        )

        logger.info("文章采集器初始化完成")

    def scrape_by_category(self, category_name: str, category_url: str,
                          max_articles: int = 10) -> List[Dict]:
        """
        按分类采集文章

        Args:
            category_name: 分类名称
            category_url: 分类URL
            max_articles: 最大文章数

        Returns:
            文章列表
        """
        logger.info(f"\n{'='*60}")
        logger.info(f"开始采集分类: {category_name}")
        logger.info(f"{'='*60}\n")

        # 1. 抓取文章
        selectors = self.config['website']['selectors']
        articles = self.scraper.scrape_category(
            category_name=category_name,
            category_url=category_url,
            article_selector=selectors['article_link'],
            title_selector=selectors['article_title'],
            content_selector=selectors['article_content'],
            author_selector=selectors.get('article_author'),
            date_selector=selectors.get('article_date'),
            max_articles=max_articles,
            max_pages=self.config['website'].get('max_pages', 1)
        )

        if not articles:
            logger.warning(f"分类 {category_name} 没有采集到文章")
            return []

        # 2. AI处理每篇文章
        processed_articles = []
        for i, article in enumerate(articles, 1):
            logger.info(f"\n处理文章 {i}/{len(articles)}: {article.get('title', '')[:50]}...")

            try:
                # AI提取要点、重写、翻译
                processed = self.ai_processor.process_article(
                    article,
                    skip_translation=self.config['ai'].get('skip_translation', False)
                )
                processed_articles.append(processed)

            except Exception as e:
                logger.error(f"AI处理失败: {e}")
                # 即使失败也保存原文
                article['title_zh'] = article.get('title', '')
                article['content_zh'] = article.get('content', '')
                processed_articles.append(article)

        return processed_articles

    def scrape_all_categories(self, max_articles_per_category: int = 10) -> Dict:
        """
        采集所有配置的分类

        Args:
            max_articles_per_category: 每个分类最大文章数

        Returns:
            采集结果统计
        """
        categories = self.config['website'].get('categories', [])
        if not categories:
            logger.error("配置中没有定义分类")
            return {}

        all_articles = []

        for category in categories:
            articles = self.scrape_by_category(
                category['name'],
                category['url'],
                max_articles_per_category
            )
            all_articles.extend(articles)

        # 保存所有文章
        logger.info(f"\n{'='*60}")
        logger.info(f"开始保存文章...")
        logger.info(f"{'='*60}\n")

        saved_files = self.content_generator.save_articles(all_articles)

        # 生成统计
        summary = self.content_generator.generate_summary(all_articles)
        summary['saved_files'] = len(saved_files)

        return summary

    def scrape_from_url(self, url: str, category: str = "其他",
                       max_articles: int = 10) -> Dict:
        """
        从单个URL采集文章

        Args:
            url: 目标URL
            category: 分类名称
            max_articles: 最大文章数

        Returns:
            采集结果统计
        """
        articles = self.scrape_by_category(category, url, max_articles)

        if not articles:
            return {'total': 0}

        # 保存文章
        saved_files = self.content_generator.save_articles(articles)

        # 生成统计
        summary = self.content_generator.generate_summary(articles)
        summary['saved_files'] = len(saved_files)

        return summary


def load_config(config_file: str) -> Dict:
    """
    加载配置文件

    Args:
        config_file: 配置文件路径

    Returns:
        配置字典
    """
    try:
        with open(config_file, 'r', encoding='utf-8') as f:
            config = json.load(f)
        logger.info(f"配置加载成功: {config_file}")
        return config
    except Exception as e:
        logger.error(f"配置加载失败: {e}")
        sys.exit(1)


def print_summary(summary: Dict):
    """
    打印采集摘要

    Args:
        summary: 统计信息
    """
    print("\n" + "="*60)
    print("采集完成！统计信息：")
    print("="*60)
    print(f"总文章数: {summary.get('total', 0)}")
    print(f"已保存文件: {summary.get('saved_files', 0)}")

    if summary.get('categories'):
        print("\n分类统计:")
        for category, count in summary['categories'].items():
            print(f"  - {category}: {count} 篇")

    if summary.get('tags'):
        print("\n标签统计:")
        for tag, count in sorted(summary['tags'].items(), key=lambda x: x[1], reverse=True)[:10]:
            print(f"  - {tag}: {count} 篇")

    print("="*60 + "\n")


def main():
    """主函数"""
    parser = argparse.ArgumentParser(
        description='网站分类文章采集工具 - 支持AI改写和翻译'
    )

    parser.add_argument(
        '-c', '--config',
        required=True,
        help='配置文件路径 (JSON格式)'
    )

    parser.add_argument(
        '-u', '--url',
        help='直接指定URL进行采集（可选）'
    )

    parser.add_argument(
        '-n', '--num-articles',
        type=int,
        default=10,
        help='每个分类采集的最大文章数 (默认: 10)'
    )

    parser.add_argument(
        '--category',
        default='其他',
        help='URL模式下的分类名称 (默认: 其他)'
    )

    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='显示详细日志'
    )

    args = parser.parse_args()

    # 设置日志级别
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    # 加载配置
    config = load_config(args.config)

    # 初始化采集器
    scraper = ArticleScraper(config)

    # 执行采集
    if args.url:
        # 从单个URL采集
        logger.info(f"从URL采集: {args.url}")
        summary = scraper.scrape_from_url(
            args.url,
            args.category,
            args.num_articles
        )
    else:
        # 从配置的所有分类采集
        logger.info("从配置的所有分类采集文章")
        summary = scraper.scrape_all_categories(args.num_articles)

    # 打印结果
    print_summary(summary)


if __name__ == '__main__':
    main()
