"""
AI内容处理模块
支持使用OpenAI或Anthropic API进行内容提取、改写和翻译
"""
import os
import logging
from typing import Dict, Optional, Literal
import time

logger = logging.getLogger(__name__)

# AI提供商类型
AIProvider = Literal['openai', 'anthropic']


class AIProcessor:
    """AI内容处理器"""

    def __init__(self, provider: AIProvider = 'openai',
                 api_key: Optional[str] = None,
                 model: Optional[str] = None):
        """
        初始化AI处理器

        Args:
            provider: AI提供商 ('openai' 或 'anthropic')
            api_key: API密钥
            model: 模型名称
        """
        self.provider = provider
        self.api_key = api_key or self._get_api_key()

        if not self.api_key:
            raise ValueError(f"请设置 {self._get_env_var_name()} 环境变量")

        # 设置默认模型
        if model:
            self.model = model
        else:
            self.model = 'gpt-4o' if provider == 'openai' else 'claude-3-5-sonnet-20241022'

        # 初始化客户端
        self.client = self._init_client()
        logger.info(f"使用 {provider} API, 模型: {self.model}")

    def _get_env_var_name(self) -> str:
        """获取环境变量名称"""
        return 'OPENAI_API_KEY' if self.provider == 'openai' else 'ANTHROPIC_API_KEY'

    def _get_api_key(self) -> Optional[str]:
        """从环境变量获取API密钥"""
        return os.environ.get(self._get_env_var_name())

    def _init_client(self):
        """初始化API客户端"""
        if self.provider == 'openai':
            try:
                from openai import OpenAI
                return OpenAI(api_key=self.api_key)
            except ImportError:
                raise ImportError("请安装 openai 包: pip install openai")
        else:
            try:
                from anthropic import Anthropic
                return Anthropic(api_key=self.api_key)
            except ImportError:
                raise ImportError("请安装 anthropic 包: pip install anthropic")

    def _call_api(self, system_prompt: str, user_prompt: str,
                  temperature: float = 0.7, max_retries: int = 3) -> str:
        """
        调用AI API

        Args:
            system_prompt: 系统提示词
            user_prompt: 用户提示词
            temperature: 温度参数
            max_retries: 最大重试次数

        Returns:
            AI生成的文本
        """
        for attempt in range(max_retries):
            try:
                if self.provider == 'openai':
                    response = self.client.chat.completions.create(
                        model=self.model,
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        temperature=temperature
                    )
                    return response.choices[0].message.content.strip()
                else:  # anthropic
                    response = self.client.messages.create(
                        model=self.model,
                        max_tokens=4096,
                        temperature=temperature,
                        system=system_prompt,
                        messages=[
                            {"role": "user", "content": user_prompt}
                        ]
                    )
                    return response.content[0].text.strip()

            except Exception as e:
                logger.error(f"API调用失败 (尝试 {attempt + 1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)  # 指数退避
                else:
                    raise

    def extract_and_rewrite(self, article: Dict) -> Dict:
        """
        提取文章要点并重新撰写

        Args:
            article: 原始文章数据

        Returns:
            包含重写内容的文章数据
        """
        logger.info(f"正在处理文章: {article.get('title', '')[:50]}...")

        original_content = article.get('content', '')
        if not original_content:
            logger.warning("文章内容为空，跳过处理")
            return article

        # 第一步：提取要点
        system_prompt_extract = """你是一个专业的内容分析师。你的任务是从文章中提取核心要点和关键信息。
请以清晰、结构化的方式列出文章的主要观点、重要数据和关键结论。"""

        user_prompt_extract = f"""请分析以下文章，提取核心要点和关键信息：

标题：{article.get('title', '无标题')}

内容：
{original_content[:4000]}  # 限制长度避免超过token限制

请以要点形式列出：
1. 主要观点
2. 关键数据/事实
3. 重要结论"""

        try:
            key_points = self._call_api(system_prompt_extract, user_prompt_extract)
            logger.info("要点提取完成")
        except Exception as e:
            logger.error(f"要点提取失败: {e}")
            key_points = original_content[:500]  # 降级处理

        # 第二步：重新撰写
        system_prompt_rewrite = """你是一个专业的内容编辑。你的任务是根据提取的要点，
重新撰写一篇结构清晰、表达流畅、适合巴黎创业社区阅读的文章。

要求：
1. 保持信息准确性
2. 结构清晰，逻辑连贯
3. 语言专业但易懂
4. 突出对创业者的实用价值
5. 字数控制在800-1500字"""

        user_prompt_rewrite = f"""基于以下要点，重新撰写一篇关于"{article.get('title', '')}"的文章：

{key_points}

原文背景信息：
- 作者：{article.get('author', '未知')}
- 来源：{article.get('url', '')}

请以Markdown格式输出，包含适当的标题和段落结构。"""

        try:
            rewritten_content = self._call_api(
                system_prompt_rewrite,
                user_prompt_rewrite,
                temperature=0.8
            )
            logger.info("内容重写完成")

            # 更新文章数据
            article['original_content'] = original_content
            article['key_points'] = key_points
            article['rewritten_content'] = rewritten_content

        except Exception as e:
            logger.error(f"内容重写失败: {e}")
            article['rewritten_content'] = original_content

        return article

    def translate_to_chinese(self, article: Dict) -> Dict:
        """
        将文章翻译为中文

        Args:
            article: 文章数据

        Returns:
            包含中文翻译的文章数据
        """
        logger.info(f"正在翻译文章: {article.get('title', '')[:50]}...")

        # 如果已经是中文，跳过翻译
        content = article.get('rewritten_content') or article.get('content', '')
        if self._is_chinese(content):
            logger.info("内容已是中文，跳过翻译")
            article['title_zh'] = article.get('title', '')
            article['content_zh'] = content
            return article

        # 翻译标题
        system_prompt = """你是一个专业的翻译。请将以下内容翻译成地道的简体中文。
要求：
1. 准确传达原文含义
2. 语言自然流畅
3. 符合中文表达习惯
4. 保留Markdown格式
5. 专业术语使用业界通用译法"""

        # 翻译标题
        try:
            title_zh = self._call_api(
                system_prompt,
                f"请翻译以下标题为中文：\n{article.get('title', '')}",
                temperature=0.3
            )
            article['title_zh'] = title_zh
            logger.info(f"标题翻译完成: {title_zh}")
        except Exception as e:
            logger.error(f"标题翻译失败: {e}")
            article['title_zh'] = article.get('title', '')

        # 翻译内容
        try:
            content_zh = self._call_api(
                system_prompt,
                f"请翻译以下文章内容为中文：\n\n{content[:4000]}",
                temperature=0.3
            )
            article['content_zh'] = content_zh
            logger.info("内容翻译完成")
        except Exception as e:
            logger.error(f"内容翻译失败: {e}")
            article['content_zh'] = content

        return article

    def _is_chinese(self, text: str) -> bool:
        """
        检查文本是否主要是中文

        Args:
            text: 待检查文本

        Returns:
            是否为中文
        """
        if not text:
            return False

        chinese_chars = sum(1 for char in text[:1000] if '\u4e00' <= char <= '\u9fff')
        total_chars = len([c for c in text[:1000] if c.strip()])

        return total_chars > 0 and chinese_chars / total_chars > 0.3

    def process_article(self, article: Dict, skip_translation: bool = False) -> Dict:
        """
        完整处理文章：提取要点 -> 重写 -> 翻译

        Args:
            article: 原始文章数据
            skip_translation: 是否跳过翻译

        Returns:
            处理后的文章数据
        """
        logger.info(f"开始处理文章: {article.get('title', '')}")

        # 步骤1: 提取要点并重写
        article = self.extract_and_rewrite(article)

        # 步骤2: 翻译为中文（如果需要）
        if not skip_translation:
            article = self.translate_to_chinese(article)
        else:
            article['title_zh'] = article.get('title', '')
            article['content_zh'] = article.get('rewritten_content') or article.get('content', '')

        logger.info("文章处理完成")
        return article
