"""
网站内容抓取模块
支持从指定网站按分类抓取文章内容
"""
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import time
from typing import List, Dict, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class WebScraper:
    """网站内容抓取器"""

    def __init__(self, base_url: str, headers: Optional[Dict] = None):
        """
        初始化抓取器

        Args:
            base_url: 网站基础URL
            headers: 请求头
        """
        self.base_url = base_url
        self.headers = headers or {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)

    def fetch_page(self, url: str, retry: int = 3) -> Optional[BeautifulSoup]:
        """
        获取页面内容

        Args:
            url: 页面URL
            retry: 重试次数

        Returns:
            BeautifulSoup对象，失败返回None
        """
        for attempt in range(retry):
            try:
                logger.info(f"正在抓取: {url} (尝试 {attempt + 1}/{retry})")
                response = self.session.get(url, timeout=30)
                response.raise_for_status()
                response.encoding = response.apparent_encoding
                return BeautifulSoup(response.text, 'html.parser')
            except Exception as e:
                logger.error(f"抓取失败: {e}")
                if attempt < retry - 1:
                    time.sleep(2 ** attempt)  # 指数退避
                else:
                    return None

    def extract_categories(self, category_url: str, category_selector: str) -> List[Dict[str, str]]:
        """
        提取分类列表

        Args:
            category_url: 分类页面URL
            category_selector: 分类CSS选择器

        Returns:
            分类列表，包含name和url
        """
        soup = self.fetch_page(category_url)
        if not soup:
            return []

        categories = []
        for element in soup.select(category_selector):
            # 尝试获取链接和名称
            link = element.get('href') or element.find('a', href=True)
            if link:
                if isinstance(link, str):
                    url = urljoin(self.base_url, link)
                    name = element.get_text(strip=True)
                else:
                    url = urljoin(self.base_url, link['href'])
                    name = link.get_text(strip=True)

                categories.append({
                    'name': name,
                    'url': url
                })

        logger.info(f"发现 {len(categories)} 个分类")
        return categories

    def extract_article_links(self, category_url: str, article_selector: str,
                             max_pages: int = 1) -> List[str]:
        """
        提取分类下的文章链接

        Args:
            category_url: 分类页面URL
            article_selector: 文章链接CSS选择器
            max_pages: 最大抓取页数

        Returns:
            文章URL列表
        """
        articles = []

        for page in range(1, max_pages + 1):
            # 构建分页URL（可能需要根据网站调整）
            if max_pages > 1:
                page_url = f"{category_url}?page={page}"
            else:
                page_url = category_url

            soup = self.fetch_page(page_url)
            if not soup:
                break

            # 提取文章链接
            for element in soup.select(article_selector):
                link = element.get('href')
                if not link and element.find('a', href=True):
                    link = element.find('a', href=True)['href']

                if link:
                    article_url = urljoin(self.base_url, link)
                    if article_url not in articles:
                        articles.append(article_url)

            logger.info(f"页面 {page}: 发现 {len(articles)} 篇文章")

            # 礼貌性延迟
            if page < max_pages:
                time.sleep(1)

        return articles

    def extract_article_content(self, article_url: str,
                               title_selector: str,
                               content_selector: str,
                               author_selector: Optional[str] = None,
                               date_selector: Optional[str] = None) -> Dict:
        """
        提取文章内容

        Args:
            article_url: 文章URL
            title_selector: 标题CSS选择器
            content_selector: 内容CSS选择器
            author_selector: 作者CSS选择器
            date_selector: 日期CSS选择器

        Returns:
            文章数据字典
        """
        soup = self.fetch_page(article_url)
        if not soup:
            return {}

        # 提取标题
        title_element = soup.select_one(title_selector)
        title = title_element.get_text(strip=True) if title_element else "无标题"

        # 提取内容
        content_element = soup.select_one(content_selector)
        if content_element:
            # 移除脚本和样式
            for script in content_element(['script', 'style']):
                script.decompose()
            content = content_element.get_text(separator='\n\n', strip=True)
        else:
            content = ""

        # 提取作者
        author = ""
        if author_selector:
            author_element = soup.select_one(author_selector)
            author = author_element.get_text(strip=True) if author_element else ""

        # 提取日期
        date = ""
        if date_selector:
            date_element = soup.select_one(date_selector)
            date = date_element.get_text(strip=True) if date_element else ""

        article_data = {
            'url': article_url,
            'title': title,
            'content': content,
            'author': author,
            'date': date
        }

        logger.info(f"成功提取文章: {title[:50]}...")
        return article_data

    def scrape_category(self, category_name: str, category_url: str,
                       article_selector: str,
                       title_selector: str,
                       content_selector: str,
                       author_selector: Optional[str] = None,
                       date_selector: Optional[str] = None,
                       max_articles: int = 10,
                       max_pages: int = 1) -> List[Dict]:
        """
        抓取整个分类的文章

        Args:
            category_name: 分类名称
            category_url: 分类URL
            article_selector: 文章链接选择器
            title_selector: 标题选择器
            content_selector: 内容选择器
            author_selector: 作者选择器
            date_selector: 日期选择器
            max_articles: 最大文章数
            max_pages: 最大页数

        Returns:
            文章列表
        """
        logger.info(f"开始抓取分类: {category_name}")

        # 获取文章链接
        article_links = self.extract_article_links(
            category_url, article_selector, max_pages
        )[:max_articles]

        # 抓取文章内容
        articles = []
        for i, link in enumerate(article_links, 1):
            logger.info(f"抓取文章 {i}/{len(article_links)}")
            article = self.extract_article_content(
                link, title_selector, content_selector,
                author_selector, date_selector
            )

            if article.get('content'):
                article['category'] = category_name
                articles.append(article)

            # 礼貌性延迟
            time.sleep(1)

        logger.info(f"分类 {category_name} 抓取完成，共 {len(articles)} 篇文章")
        return articles
