#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
《移个朋友·巴黎创业》知识库构建脚本
功能：
1. 扫描 content 目录下的所有 Markdown 文件
2. 解析 YAML front matter 和 Markdown 内容
3. 生成 stories.json 和 resources.json 数据文件
4. 复制静态文件到 dist 目录
"""

import os
import json
import yaml
import shutil
import re
from pathlib import Path
from datetime import datetime
import hashlib

# 项目根目录
ROOT_DIR = Path(__file__).parent.parent
CONTENT_DIR = ROOT_DIR / "content"
SRC_DIR = ROOT_DIR / "src"
DIST_DIR = ROOT_DIR / "dist"
PUBLIC_DIR = ROOT_DIR / "public"


def ensure_dir(path):
    """确保目录存在"""
    path.mkdir(parents=True, exist_ok=True)


def parse_markdown_file(file_path):
    """解析 Markdown 文件，提取 front matter 和内容"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 匹配 YAML front matter
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)$', content, re.DOTALL)

    if not match:
        print(f"警告: {file_path} 没有有效的 front matter")
        return None, None

    front_matter_str = match.group(1)
    body = match.group(2).strip()

    try:
        front_matter = yaml.safe_load(front_matter_str)
    except yaml.YAMLError as e:
        print(f"错误: 解析 {file_path} 的 front matter 失败: {e}")
        return None, None

    return front_matter, body


def process_stories():
    """处理创业故事"""
    stories_dir = CONTENT_DIR / "stories"
    stories = []

    if not stories_dir.exists():
        print(f"警告: 故事目录不存在: {stories_dir}")
        return stories

    for md_file in stories_dir.glob("*.md"):
        front_matter, body = parse_markdown_file(md_file)

        if front_matter is None:
            continue

        # 只处理已发布的故事
        if not front_matter.get('published', True):
            continue

        story = {
            'id': front_matter.get('id'),
            'title': front_matter.get('title'),
            'entrepreneur': front_matter.get('entrepreneur'),
            'company': front_matter.get('company'),
            'industry': front_matter.get('industry'),
            'founded_year': front_matter.get('founded_year'),
            'location': front_matter.get('location', '巴黎'),
            'cover_image': front_matter.get('cover_image', ''),
            'tags': front_matter.get('tags', []),
            'excerpt': front_matter.get('excerpt', ''),
            'date': str(front_matter.get('date', '')),
            'body': body,
            'slug': md_file.stem
        }

        stories.append(story)

    # 按日期排序（最新的在前）
    stories.sort(key=lambda x: x.get('date', ''), reverse=True)

    print(f"✓ 处理了 {len(stories)} 个创业故事")
    return stories


def process_resources():
    """处理创业资源"""
    resources_dir = CONTENT_DIR / "resources"
    resources = []

    if not resources_dir.exists():
        print(f"警告: 资源目录不存在: {resources_dir}")
        return resources

    for md_file in resources_dir.glob("*.md"):
        front_matter, body = parse_markdown_file(md_file)

        if front_matter is None:
            continue

        # 只处理已发布的资源
        if not front_matter.get('published', True):
            continue

        resource = {
            'id': front_matter.get('id'),
            'title': front_matter.get('title'),
            'resource_type': front_matter.get('resource_type'),
            'description': front_matter.get('description', ''),
            'url': front_matter.get('url', ''),
            'contact': front_matter.get('contact', ''),
            'date': str(front_matter.get('date', '')),
            'body': body,
            'slug': md_file.stem
        }

        resources.append(resource)

    # 按日期排序（最新的在前）
    resources.sort(key=lambda x: x.get('date', ''), reverse=True)

    print(f"✓ 处理了 {len(resources)} 个创业资源")
    return resources


def load_site_settings():
    """加载网站设置"""
    settings_file = CONTENT_DIR / "settings" / "site.yml"

    if not settings_file.exists():
        print("警告: 网站设置文件不存在，使用默认设置")
        return {
            'site_title': '移个朋友·巴黎创业',
            'site_subtitle': '巴黎创业故事与资源知识库',
            'site_description': '分享在巴黎创业的故事、经验和资源',
        }

    with open(settings_file, 'r', encoding='utf-8') as f:
        settings = yaml.safe_load(f)

    print("✓ 加载网站设置")
    return settings


def generate_data_files(stories, resources, settings):
    """生成 JSON 数据文件"""
    data_dir = DIST_DIR / "data"
    ensure_dir(data_dir)

    # 生成 stories.json
    with open(data_dir / "stories.json", 'w', encoding='utf-8') as f:
        json.dump(stories, f, ensure_ascii=False, indent=2)
    print(f"✓ 生成 stories.json ({len(stories)} 条)")

    # 生成 resources.json
    with open(data_dir / "resources.json", 'w', encoding='utf-8') as f:
        json.dump(resources, f, ensure_ascii=False, indent=2)
    print(f"✓ 生成 resources.json ({len(resources)} 条)")

    # 生成 settings.json
    with open(data_dir / "settings.json", 'w', encoding='utf-8') as f:
        json.dump(settings, f, ensure_ascii=False, indent=2)
    print("✓ 生成 settings.json")

    # 生成索引文件（包含统计信息）
    index = {
        'last_updated': datetime.now().isoformat(),
        'stories_count': len(stories),
        'resources_count': len(resources),
        'version': generate_version_hash(stories, resources)
    }

    with open(data_dir / "index.json", 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
    print("✓ 生成 index.json")


def generate_version_hash(stories, resources):
    """生成内容版本哈希（用于检测更新）"""
    content = json.dumps([stories, resources], sort_keys=True)
    return hashlib.md5(content.encode()).hexdigest()[:8]


def copy_static_files():
    """复制静态文件到 dist 目录"""

    # 复制 HTML、CSS、JS 文件
    static_files = [
        'index.html',
        'styles.css',
        'script.js',
        'update-detector.js'
    ]

    for file_name in static_files:
        src = SRC_DIR / file_name
        dst = DIST_DIR / file_name

        if src.exists():
            shutil.copy2(src, dst)
            print(f"✓ 复制 {file_name}")
        else:
            print(f"警告: {file_name} 不存在")

    # 复制上传的图片
    uploads_src = CONTENT_DIR / "uploads"
    uploads_dst = DIST_DIR / "uploads"

    if uploads_src.exists():
        if uploads_dst.exists():
            shutil.rmtree(uploads_dst)
        shutil.copytree(uploads_src, uploads_dst)
        print(f"✓ 复制图片文件")

    # 复制 public 目录（包含 admin）
    if PUBLIC_DIR.exists():
        for item in PUBLIC_DIR.iterdir():
            if item.is_dir():
                dst = DIST_DIR / item.name
                if dst.exists():
                    shutil.rmtree(dst)
                shutil.copytree(item, dst)
                print(f"✓ 复制 {item.name} 目录")
            else:
                shutil.copy2(item, DIST_DIR / item.name)
                print(f"✓ 复制 {item.name}")


def main():
    """主函数"""
    print("=" * 50)
    print("开始构建《移个朋友·巴黎创业》知识库")
    print("=" * 50)

    # 创建输出目录
    ensure_dir(DIST_DIR)
    print("✓ 创建输出目录")

    # 处理内容
    stories = process_stories()
    resources = process_resources()
    settings = load_site_settings()

    # 生成数据文件
    generate_data_files(stories, resources, settings)

    # 复制静态文件
    copy_static_files()

    print("=" * 50)
    print("构建完成！")
    print(f"输出目录: {DIST_DIR}")
    print(f"故事数量: {len(stories)}")
    print(f"资源数量: {len(resources)}")
    print("=" * 50)


if __name__ == "__main__":
    main()
