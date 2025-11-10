#!/usr/bin/env python3
"""
构建脚本 - 移个朋友·巴黎创业知识库
处理 Markdown 文件并生成网站静态资源
"""

import os
import json
import re
import shutil
from pathlib import Path
from datetime import datetime
import yaml
import markdown
from PIL import Image

# 配置
CONTENT_DIR = Path("content")
PUBLIC_DIR = Path("public")
SRC_DIR = Path("src")
OUTPUT_DIR = PUBLIC_DIR
IMAGES_DIR = PUBLIC_DIR / "images"

# Markdown 扩展
MD_EXTENSIONS = [
    'meta',
    'fenced_code',
    'tables',
    'toc',
    'nl2br',
    'sane_lists'
]


def ensure_directories():
    """确保必要的目录存在"""
    directories = [
        OUTPUT_DIR,
        OUTPUT_DIR / "stories",
        OUTPUT_DIR / "entrepreneurs",
        OUTPUT_DIR / "resources",
        OUTPUT_DIR / "events",
        IMAGES_DIR / "uploads",
        IMAGES_DIR / "thumbnails"
    ]
    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)


def parse_markdown_file(file_path):
    """解析 Markdown 文件，提取元数据和内容"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 提取 frontmatter
    frontmatter_match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)$', content, re.DOTALL)
    if frontmatter_match:
        frontmatter = yaml.safe_load(frontmatter_match.group(1))
        body = frontmatter_match.group(2)
    else:
        frontmatter = {}
        body = content

    # 转换 Markdown 到 HTML
    md = markdown.Markdown(extensions=MD_EXTENSIONS)
    html_content = md.convert(body)

    # 提取元数据
    meta = {**frontmatter}
    if hasattr(md, 'Meta'):
        meta.update({k: v[0] if len(v) == 1 else v for k, v in md.Meta.items()})

    return {
        'meta': meta,
        'html': html_content,
        'raw': body
    }


def process_image(image_path, max_size=(1200, 1200), thumbnail_size=(400, 300)):
    """处理图片：优化大小并生成缩略图"""
    if not os.path.exists(image_path):
        return None

    try:
        img = Image.open(image_path)

        # 优化原图
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        optimized_path = image_path
        img.save(optimized_path, optimize=True, quality=85)

        # 生成缩略图
        thumb_img = img.copy()
        thumb_img.thumbnail(thumbnail_size, Image.Resampling.LANCZOS)
        thumb_filename = f"thumb_{os.path.basename(image_path)}"
        thumb_path = IMAGES_DIR / "thumbnails" / thumb_filename
        thumb_img.save(thumb_path, optimize=True, quality=80)

        return {
            'original': str(image_path.relative_to(PUBLIC_DIR)),
            'thumbnail': str(thumb_path.relative_to(PUBLIC_DIR))
        }
    except Exception as e:
        print(f"图片处理错误 {image_path}: {e}")
        return None


def process_stories():
    """处理创业故事"""
    stories_dir = CONTENT_DIR / "stories"
    if not stories_dir.exists():
        return []

    stories = []
    for md_file in stories_dir.glob("*.md"):
        try:
            parsed = parse_markdown_file(md_file)
            meta = parsed['meta']

            # 处理图片
            image_info = None
            if 'image' in meta and meta['image']:
                image_path = PUBLIC_DIR / meta['image'].lstrip('/')
                image_info = process_image(image_path)

            story = {
                'id': md_file.stem,
                'title': meta.get('title', ''),
                'date': str(meta.get('date', '')),
                'author': meta.get('author', ''),
                'category': meta.get('category', ''),
                'tags': meta.get('tags', []),
                'excerpt': meta.get('excerpt', ''),
                'image': image_info,
                'published': meta.get('published', True),
                'content': parsed['html']
            }

            if story['published']:
                stories.append(story)

                # 保存单个故事的 JSON
                story_output = OUTPUT_DIR / "stories" / f"{story['id']}.json"
                with open(story_output, 'w', encoding='utf-8') as f:
                    json.dump(story, f, ensure_ascii=False, indent=2)

        except Exception as e:
            print(f"处理故事文件出错 {md_file}: {e}")

    # 按日期排序
    stories.sort(key=lambda x: x['date'], reverse=True)
    return stories


def process_entrepreneurs():
    """处理创业者档案"""
    entrepreneurs_dir = CONTENT_DIR / "entrepreneurs"
    if not entrepreneurs_dir.exists():
        return []

    entrepreneurs = []
    for md_file in entrepreneurs_dir.glob("*.md"):
        try:
            parsed = parse_markdown_file(md_file)
            meta = parsed['meta']

            # 处理头像
            avatar_info = None
            if 'avatar' in meta and meta['avatar']:
                avatar_path = PUBLIC_DIR / meta['avatar'].lstrip('/')
                avatar_info = process_image(avatar_path)

            entrepreneur = {
                'id': md_file.stem,
                'name': meta.get('name', ''),
                'avatar': avatar_info,
                'company': meta.get('company', ''),
                'industry': meta.get('industry', ''),
                'position': meta.get('position', ''),
                'bio': meta.get('bio', ''),
                'contact': meta.get('contact', {}),
                'content': parsed['html']
            }

            entrepreneurs.append(entrepreneur)

            # 保存单个创业者的 JSON
            entrepreneur_output = OUTPUT_DIR / "entrepreneurs" / f"{entrepreneur['id']}.json"
            with open(entrepreneur_output, 'w', encoding='utf-8') as f:
                json.dump(entrepreneur, f, ensure_ascii=False, indent=2)

        except Exception as e:
            print(f"处理创业者文件出错 {md_file}: {e}")

    return entrepreneurs


def process_resources():
    """处理资源库"""
    resources_dir = CONTENT_DIR / "resources"
    if not resources_dir.exists():
        return []

    resources = []
    for md_file in resources_dir.glob("*.md"):
        try:
            parsed = parse_markdown_file(md_file)
            meta = parsed['meta']

            resource = {
                'id': md_file.stem,
                'title': meta.get('title', ''),
                'type': meta.get('type', ''),
                'tags': meta.get('tags', []),
                'url': meta.get('url', ''),
                'file': meta.get('file', ''),
                'content': parsed['html']
            }

            resources.append(resource)

            # 保存单个资源的 JSON
            resource_output = OUTPUT_DIR / "resources" / f"{resource['id']}.json"
            with open(resource_output, 'w', encoding='utf-8') as f:
                json.dump(resource, f, ensure_ascii=False, indent=2)

        except Exception as e:
            print(f"处理资源文件出错 {md_file}: {e}")

    return resources


def process_events():
    """处理活动信息"""
    events_dir = CONTENT_DIR / "events"
    if not events_dir.exists():
        return []

    events = []
    for md_file in events_dir.glob("*.md"):
        try:
            parsed = parse_markdown_file(md_file)
            meta = parsed['meta']

            # 处理海报
            poster_info = None
            if 'poster' in meta and meta['poster']:
                poster_path = PUBLIC_DIR / meta['poster'].lstrip('/')
                poster_info = process_image(poster_path)

            event = {
                'id': md_file.stem,
                'title': meta.get('title', ''),
                'date': str(meta.get('date', '')),
                'location': meta.get('location', ''),
                'type': meta.get('type', ''),
                'speakers': meta.get('speakers', []),
                'poster': poster_info,
                'registration_url': meta.get('registration_url', ''),
                'content': parsed['html']
            }

            events.append(event)

            # 保存单个活动的 JSON
            event_output = OUTPUT_DIR / "events" / f"{event['id']}.json"
            with open(event_output, 'w', encoding='utf-8') as f:
                json.dump(event, f, ensure_ascii=False, indent=2)

        except Exception as e:
            print(f"处理活动文件出错 {md_file}: {e}")

    # 按日期排序
    events.sort(key=lambda x: x['date'], reverse=True)
    return events


def generate_index(stories, entrepreneurs, resources, events):
    """生成主索引文件"""
    index = {
        'stories': [
            {k: v for k, v in story.items() if k != 'content'}
            for story in stories
        ],
        'entrepreneurs': [
            {k: v for k, v in entrepreneur.items() if k != 'content'}
            for entrepreneur in entrepreneurs
        ],
        'resources': [
            {k: v for k, v in resource.items() if k != 'content'}
            for resource in resources
        ],
        'events': [
            {k: v for k, v in event.items() if k != 'content'}
            for event in events
        ],
        'build_time': datetime.now().isoformat(),
        'stats': {
            'total_stories': len(stories),
            'total_entrepreneurs': len(entrepreneurs),
            'total_resources': len(resources),
            'total_events': len(events)
        }
    }

    index_output = OUTPUT_DIR / "index.json"
    with open(index_output, 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    print(f"索引文件已生成: {index_output}")


def copy_static_files():
    """复制静态文件到输出目录"""
    static_files = [
        ('src/index.html', 'index.html'),
        ('src/styles.css', 'styles.css'),
        ('src/script.js', 'script.js'),
        ('src/update-detector.js', 'update-detector.js')
    ]

    for src, dest in static_files:
        src_path = Path(src)
        dest_path = OUTPUT_DIR / dest
        if src_path.exists():
            shutil.copy2(src_path, dest_path)
            print(f"已复制: {src} -> {dest_path}")


def main():
    """主构建流程"""
    print("=== 开始构建 ===")
    print(f"构建时间: {datetime.now()}")

    # 确保目录存在
    ensure_directories()

    # 处理各类内容
    print("\n处理创业故事...")
    stories = process_stories()
    print(f"✓ 处理了 {len(stories)} 个故事")

    print("\n处理创业者档案...")
    entrepreneurs = process_entrepreneurs()
    print(f"✓ 处理了 {len(entrepreneurs)} 个创业者")

    print("\n处理资源库...")
    resources = process_resources()
    print(f"✓ 处理了 {len(resources)} 个资源")

    print("\n处理活动信息...")
    events = process_events()
    print(f"✓ 处理了 {len(events)} 个活动")

    # 生成索引
    print("\n生成索引文件...")
    generate_index(stories, entrepreneurs, resources, events)

    # 复制静态文件
    print("\n复制静态文件...")
    copy_static_files()

    print("\n=== 构建完成 ===")
    print(f"输出目录: {OUTPUT_DIR.absolute()}")


if __name__ == "__main__":
    main()
