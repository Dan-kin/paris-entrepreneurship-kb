/**
 * 《移个朋友·巴黎创业》前端交互脚本
 */

// 全局状态
const AppState = {
    stories: [],
    resources: [],
    settings: {},
    filteredStories: [],
    filteredResources: [],
    currentSection: 'stories',
    currentResourceType: 'all',
    currentTags: new Set(),
    searchQuery: ''
};

// 工具函数：简单的 Markdown 转 HTML
function markdownToHtml(markdown) {
    if (!markdown) return '';

    let html = markdown
        // 标题
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // 粗体
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // 斜体
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // 链接
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
        // 图片
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
        // 段落
        .replace(/\n\n/g, '</p><p>')
        // 换行
        .replace(/\n/g, '<br>');

    return `<p>${html}</p>`;
}

// 工具函数：格式化日期
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// ==========================================
// 数据加载
// ==========================================

async function loadData() {
    try {
        const [storiesRes, resourcesRes, settingsRes] = await Promise.all([
            fetch('/data/stories.json'),
            fetch('/data/resources.json'),
            fetch('/data/settings.json')
        ]);

        AppState.stories = await storiesRes.json();
        AppState.resources = await resourcesRes.json();
        AppState.settings = await settingsRes.json();

        AppState.filteredStories = [...AppState.stories];
        AppState.filteredResources = [...AppState.resources];

        console.log('数据加载成功', {
            stories: AppState.stories.length,
            resources: AppState.resources.length
        });

        initApp();
    } catch (error) {
        console.error('数据加载失败:', error);
        showError('数据加载失败，请刷新页面重试');
    }
}

function showError(message) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.innerHTML = `
            <div style="text-align: center; color: #e74c3c;">
                <p style="font-size: 18px; margin-bottom: 10px;">⚠️ ${message}</p>
                <button onclick="location.reload()" style="padding: 10px 20px; background-color: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    重新加载
                </button>
            </div>
        `;
    }
}

// ==========================================
// 初始化应用
// ==========================================

function initApp() {
    // 更新网站设置
    updateSiteSettings();

    // 渲染所有内容
    renderStories();
    renderResources();
    renderStats();
    renderFilterTags();
    renderContactInfo();

    // 绑定事件
    bindEvents();

    // 隐藏加载动画
    setTimeout(() => {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.classList.add('hidden');
        }
    }, 500);
}

function updateSiteSettings() {
    const { site_title, site_subtitle } = AppState.settings;

    if (site_title) {
        document.title = site_title;
    }
}

// ==========================================
// 渲染函数
// ==========================================

function renderStories() {
    const grid = document.getElementById('storiesGrid');
    if (!grid) return;

    if (AppState.filteredStories.length === 0) {
        grid.innerHTML = '<p class="text-center" style="grid-column: 1 / -1; padding: 40px; color: #999;">未找到相关故事</p>';
        return;
    }

    grid.innerHTML = AppState.filteredStories.map(story => `
        <div class="story-card" data-story-id="${story.id}" onclick="openStoryModal(${story.id})">
            ${story.cover_image ?
                `<img src="${story.cover_image}" alt="${story.title}" class="story-image" loading="lazy">` :
                '<div class="story-image" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>'
            }
            <div class="story-content">
                <h3 class="story-title">${story.title || '未命名故事'}</h3>
                <div class="story-meta">
                    ${story.entrepreneur ? `<span class="story-meta-item">👤 ${story.entrepreneur}</span>` : ''}
                    ${story.company ? `<span class="story-meta-item">🏢 ${story.company}</span>` : ''}
                    ${story.industry ? `<span class="story-meta-item">📊 ${story.industry}</span>` : ''}
                </div>
                <p class="story-excerpt">${story.excerpt || '暂无摘要'}</p>
                ${story.tags && story.tags.length > 0 ? `
                    <div class="story-tags">
                        ${story.tags.map(tag => `<span class="story-tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function renderResources() {
    const list = document.getElementById('resourcesList');
    if (!list) return;

    const filtered = AppState.currentResourceType === 'all'
        ? AppState.filteredResources
        : AppState.filteredResources.filter(r => r.resource_type === AppState.currentResourceType);

    if (filtered.length === 0) {
        list.innerHTML = '<p class="text-center" style="padding: 40px; color: #999;">未找到相关资源</p>';
        return;
    }

    list.innerHTML = filtered.map(resource => `
        <div class="resource-card">
            <div class="resource-header">
                <div>
                    <h3 class="resource-title">${resource.title}</h3>
                </div>
                <span class="resource-type">${resource.resource_type}</span>
            </div>
            <p class="resource-description">${resource.description || ''}</p>
            ${resource.url ? `
                <a href="${resource.url}" class="resource-link" target="_blank" rel="noopener">
                    查看详情 →
                </a>
            ` : ''}
            ${resource.contact ? `
                <p style="margin-top: 10px; font-size: 14px; color: #666;">
                    📧 ${resource.contact}
                </p>
            ` : ''}
        </div>
    `).join('');
}

function renderStats() {
    const statsContainer = document.getElementById('storiesStats');
    if (!statsContainer) return;

    // 统计行业分布
    const industries = {};
    AppState.stories.forEach(story => {
        if (story.industry) {
            industries[story.industry] = (industries[story.industry] || 0) + 1;
        }
    });

    // 统计标签
    const allTags = new Set();
    AppState.stories.forEach(story => {
        if (story.tags) {
            story.tags.forEach(tag => allTags.add(tag));
        }
    });

    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-number">${AppState.stories.length}</div>
            <div class="stat-label">创业故事</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${Object.keys(industries).length}</div>
            <div class="stat-label">涉及行业</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${allTags.size}</div>
            <div class="stat-label">标签数量</div>
        </div>
    `;
}

function renderFilterTags() {
    const container = document.getElementById('filterTags');
    if (!container) return;

    // 收集所有标签
    const tagCount = {};
    AppState.stories.forEach(story => {
        if (story.tags) {
            story.tags.forEach(tag => {
                tagCount[tag] = (tagCount[tag] || 0) + 1;
            });
        }
    });

    // 按出现次数排序
    const sortedTags = Object.entries(tagCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    if (sortedTags.length === 0) {
        container.innerHTML = '<p style="color: #999;">暂无标签</p>';
        return;
    }

    container.innerHTML = sortedTags.map(([tag, count]) => `
        <span class="tag" data-tag="${tag}" onclick="toggleTag('${tag}')">
            ${tag} (${count})
        </span>
    `).join('');
}

function renderContactInfo() {
    const container = document.getElementById('contactInfo');
    if (!container) return;

    const { contact_email, social_media } = AppState.settings;

    let html = '';
    if (contact_email) {
        html += `<div class="contact-item">📧 ${contact_email}</div>`;
    }
    if (social_media) {
        if (social_media.wechat) {
            html += `<div class="contact-item">💬 微信公众号: ${social_media.wechat}</div>`;
        }
        if (social_media.weibo) {
            html += `<div class="contact-item">📱 微博: ${social_media.weibo}</div>`;
        }
        if (social_media.xiaohongshu) {
            html += `<div class="contact-item">📕 小红书: ${social_media.xiaohongshu}</div>`;
        }
    }

    container.innerHTML = html || '<p style="color: #999;">暂无联系方式</p>';
}

// ==========================================
// 事件绑定
// ==========================================

function bindEvents() {
    // 导航切换
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            switchSection(section);
        });
    });

    // 搜索
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    if (searchInput && searchBtn) {
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

    // 资源类型切换
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.getAttribute('data-type');
            switchResourceType(type);
        });
    });

    // 模态框关闭
    const modalClose = document.getElementById('modalClose');
    const modalOverlay = document.querySelector('.modal-overlay');

    if (modalClose) {
        modalClose.addEventListener('click', closeStoryModal);
    }
    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeStoryModal);
    }

    // 返回顶部
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });
    }
}

// ==========================================
// 交互功能
// ==========================================

function switchSection(section) {
    AppState.currentSection = section;

    // 更新导航高亮
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === section) {
            link.classList.add('active');
        }
    });

    // 切换内容区域
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });
    const targetSection = document.getElementById(section);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim().toLowerCase();
    AppState.searchQuery = query;

    if (!query && AppState.currentTags.size === 0) {
        AppState.filteredStories = [...AppState.stories];
        AppState.filteredResources = [...AppState.resources];
    } else {
        // 过滤故事
        AppState.filteredStories = AppState.stories.filter(story => {
            const matchSearch = !query ||
                (story.title && story.title.toLowerCase().includes(query)) ||
                (story.excerpt && story.excerpt.toLowerCase().includes(query)) ||
                (story.company && story.company.toLowerCase().includes(query)) ||
                (story.industry && story.industry.toLowerCase().includes(query)) ||
                (story.entrepreneur && story.entrepreneur.toLowerCase().includes(query));

            const matchTags = AppState.currentTags.size === 0 ||
                (story.tags && story.tags.some(tag => AppState.currentTags.has(tag)));

            return matchSearch && matchTags;
        });

        // 过滤资源
        AppState.filteredResources = AppState.resources.filter(resource => {
            return !query ||
                (resource.title && resource.title.toLowerCase().includes(query)) ||
                (resource.description && resource.description.toLowerCase().includes(query));
        });
    }

    renderStories();
    renderResources();
}

function toggleTag(tag) {
    if (AppState.currentTags.has(tag)) {
        AppState.currentTags.delete(tag);
    } else {
        AppState.currentTags.add(tag);
    }

    // 更新标签样式
    document.querySelectorAll('.tag').forEach(tagEl => {
        const tagName = tagEl.getAttribute('data-tag');
        if (AppState.currentTags.has(tagName)) {
            tagEl.classList.add('active');
        } else {
            tagEl.classList.remove('active');
        }
    });

    performSearch();
}

function switchResourceType(type) {
    AppState.currentResourceType = type;

    // 更新按钮样式
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-type') === type) {
            btn.classList.add('active');
        }
    });

    renderResources();
}

function openStoryModal(storyId) {
    const story = AppState.stories.find(s => s.id === storyId);
    if (!story) return;

    const modal = document.getElementById('storyModal');
    const modalBody = document.getElementById('modalBody');

    if (!modal || !modalBody) return;

    modalBody.innerHTML = `
        ${story.cover_image ? `<img src="${story.cover_image}" alt="${story.title}" style="width: 100%; border-radius: 8px; margin-bottom: 30px;">` : ''}
        <h1>${story.title}</h1>
        <div style="display: flex; gap: 20px; margin: 20px 0; color: #666; flex-wrap: wrap;">
            ${story.entrepreneur ? `<span>👤 ${story.entrepreneur}</span>` : ''}
            ${story.company ? `<span>🏢 ${story.company}</span>` : ''}
            ${story.industry ? `<span>📊 ${story.industry}</span>` : ''}
            ${story.location ? `<span>📍 ${story.location}</span>` : ''}
            ${story.founded_year ? `<span>📅 ${story.founded_year}</span>` : ''}
        </div>
        ${story.tags && story.tags.length > 0 ? `
            <div style="margin: 20px 0; display: flex; gap: 10px; flex-wrap: wrap;">
                ${story.tags.map(tag => `<span style="padding: 4px 12px; background: #f0f0f0; border-radius: 12px; font-size: 14px;">${tag}</span>`).join('')}
            </div>
        ` : ''}
        <div class="story-body" style="margin-top: 30px;">
            ${markdownToHtml(story.body)}
        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeStoryModal() {
    const modal = document.getElementById('storyModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// ==========================================
// 初始化
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    loadData();
});
