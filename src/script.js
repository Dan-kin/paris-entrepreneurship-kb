/**
 * 主脚本 - 移个朋友·巴黎创业知识库
 * 处理页面交互和数据加载
 */

// 全局状态
let appData = {
    stories: [],
    entrepreneurs: [],
    resources: [],
    events: [],
    stats: {}
};

let filteredStories = [];
let filteredResources = [];

// ========================================
// 初始化
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    loadData();
    setupFilters();
    setupModal();
});

// ========================================
// 导航栏
// ========================================

function initNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    // 移动端菜单切换
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // 平滑滚动和高亮
    navLinks.forEach(link => {
        if (!link.classList.contains('admin-link')) {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href.startsWith('#')) {
                    e.preventDefault();
                    const targetId = href.substring(1);
                    const targetSection = document.getElementById(targetId);

                    if (targetSection) {
                        targetSection.scrollIntoView({ behavior: 'smooth' });

                        // 更新激活状态
                        navLinks.forEach(l => l.classList.remove('active'));
                        link.classList.add('active');

                        // 关闭移动端菜单
                        if (navMenu) {
                            navMenu.classList.remove('active');
                        }
                    }
                }
            });
        }
    });

    // 滚动时更新导航高亮
    window.addEventListener('scroll', updateActiveNav);
}

function updateActiveNav() {
    const sections = document.querySelectorAll('.section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    let currentSection = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.offsetHeight;

        if (window.pageYOffset >= sectionTop &&
            window.pageYOffset < sectionTop + sectionHeight) {
            currentSection = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

// ========================================
// 数据加载
// ========================================

async function loadData() {
    try {
        const response = await fetch('/index.json');
        if (!response.ok) {
            throw new Error('无法加载数据');
        }

        const data = await response.json();
        appData = data;

        // 初始化过滤后的数据
        filteredStories = data.stories || [];
        filteredResources = data.resources || [];

        // 渲染内容
        renderStats(data.stats);
        renderStories(filteredStories);
        renderEntrepreneurs(data.entrepreneurs);
        renderResources(filteredResources);
        renderEvents(data.events);

    } catch (error) {
        console.error('数据加载失败:', error);
        showError();
    }
}

function showError() {
    const sections = ['stories', 'entrepreneurs', 'resources', 'events'];
    sections.forEach(section => {
        const grid = document.getElementById(`${section}Grid`) ||
                     document.getElementById(`${section}List`);
        if (grid) {
            grid.innerHTML = `
                <div class="empty-state">
                    <p>数据加载失败，请稍后重试</p>
                </div>
            `;
        }
    });
}

// ========================================
// 统计信息
// ========================================

function renderStats(stats) {
    if (!stats) return;

    animateNumber('totalStories', stats.total_stories || 0);
    animateNumber('totalEntrepreneurs', stats.total_entrepreneurs || 0);
    animateNumber('totalResources', stats.total_resources || 0);
    animateNumber('totalEvents', stats.total_events || 0);
}

function animateNumber(elementId, target) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const duration = 1500;
    const steps = 60;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, duration / steps);
}

// ========================================
// 创业故事
// ========================================

function renderStories(stories) {
    const grid = document.getElementById('storiesGrid');
    const empty = document.getElementById('storiesEmpty');

    if (!grid) return;

    if (!stories || stories.length === 0) {
        grid.style.display = 'none';
        if (empty) empty.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    if (empty) empty.style.display = 'none';

    grid.innerHTML = stories.map(story => `
        <div class="card" onclick="showStoryDetail('${story.id}')">
            ${story.image && story.image.thumbnail ?
                `<img src="/${story.image.thumbnail}" alt="${story.title}" class="card-image">` :
                '<div class="card-image" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>'
            }
            <div class="card-content">
                ${story.category ? `<span class="card-category">${story.category}</span>` : ''}
                <h3 class="card-title">${escapeHtml(story.title)}</h3>
                ${story.excerpt ? `<p class="card-excerpt">${escapeHtml(story.excerpt)}</p>` : ''}
                <div class="card-meta">
                    <span>${story.author || '匿名'}</span>
                    <span>${formatDate(story.date)}</span>
                </div>
                ${story.tags && story.tags.length > 0 ? `
                    <div class="card-tags">
                        ${story.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

async function showStoryDetail(storyId) {
    try {
        const response = await fetch(`/stories/${storyId}.json`);
        if (!response.ok) throw new Error('故事不存在');

        const story = await response.json();

        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            ${story.image && story.image.original ?
                `<img src="/${story.image.original}" alt="${story.title}" style="width: 100%; border-radius: 8px; margin-bottom: 2rem;">` :
                ''
            }
            ${story.category ? `<span class="card-category">${story.category}</span>` : ''}
            <h1 style="margin-top: 1rem;">${escapeHtml(story.title)}</h1>
            <div class="card-meta" style="margin: 1rem 0;">
                <span><strong>作者:</strong> ${story.author || '匿名'}</span>
                <span><strong>发布:</strong> ${formatDate(story.date)}</span>
            </div>
            ${story.tags && story.tags.length > 0 ? `
                <div class="card-tags" style="margin-bottom: 2rem;">
                    ${story.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : ''}
            <div class="content">
                ${story.content}
            </div>
        `;

        openModal();
    } catch (error) {
        console.error('加载故事详情失败:', error);
        alert('无法加载故事详情');
    }
}

// ========================================
// 创业者档案
// ========================================

function renderEntrepreneurs(entrepreneurs) {
    const grid = document.getElementById('entrepreneursGrid');
    const empty = document.getElementById('entrepreneursEmpty');

    if (!grid) return;

    if (!entrepreneurs || entrepreneurs.length === 0) {
        grid.style.display = 'none';
        if (empty) empty.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    if (empty) empty.style.display = 'none';

    grid.innerHTML = entrepreneurs.map(entrepreneur => `
        <div class="entrepreneur-card" onclick="showEntrepreneurDetail('${entrepreneur.id}')">
            ${entrepreneur.avatar && entrepreneur.avatar.thumbnail ?
                `<img src="/${entrepreneur.avatar.thumbnail}" alt="${entrepreneur.name}" class="entrepreneur-avatar">` :
                `<div class="entrepreneur-avatar" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem; font-weight: bold;">
                    ${entrepreneur.name ? entrepreneur.name.charAt(0) : '?'}
                </div>`
            }
            <h3 class="entrepreneur-name">${escapeHtml(entrepreneur.name)}</h3>
            <div class="entrepreneur-company">${escapeHtml(entrepreneur.company)}</div>
            <div class="entrepreneur-industry">${escapeHtml(entrepreneur.industry)}</div>
            ${entrepreneur.bio ? `<p class="entrepreneur-bio">${escapeHtml(entrepreneur.bio)}</p>` : ''}
        </div>
    `).join('');
}

async function showEntrepreneurDetail(entrepreneurId) {
    try {
        const response = await fetch(`/entrepreneurs/${entrepreneurId}.json`);
        if (!response.ok) throw new Error('创业者档案不存在');

        const entrepreneur = await response.json();

        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <div style="text-align: center; margin-bottom: 2rem;">
                ${entrepreneur.avatar && entrepreneur.avatar.original ?
                    `<img src="/${entrepreneur.avatar.original}" alt="${entrepreneur.name}" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 4px solid #2563eb;">` :
                    `<div style="width: 150px; height: 150px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0 auto; display: flex; align-items: center; justify-content: center; color: white; font-size: 3rem; font-weight: bold;">
                        ${entrepreneur.name ? entrepreneur.name.charAt(0) : '?'}
                    </div>`
                }
            </div>
            <h1 style="text-align: center;">${escapeHtml(entrepreneur.name)}</h1>
            <div style="text-align: center; margin-bottom: 2rem;">
                <p style="font-size: 1.25rem; color: #2563eb; margin-bottom: 0.5rem;">${escapeHtml(entrepreneur.company)}</p>
                <p style="color: #64748b;">${escapeHtml(entrepreneur.position)} · ${escapeHtml(entrepreneur.industry)}</p>
            </div>
            ${entrepreneur.bio ? `<p style="text-align: center; font-style: italic; color: #64748b; margin-bottom: 2rem;">"${escapeHtml(entrepreneur.bio)}"</p>` : ''}
            ${entrepreneur.contact && Object.keys(entrepreneur.contact).length > 0 ? `
                <div style="margin-bottom: 2rem; padding: 1rem; background: #f8fafc; border-radius: 8px;">
                    <h3>联系方式</h3>
                    ${entrepreneur.contact.email ? `<p><strong>邮箱:</strong> ${escapeHtml(entrepreneur.contact.email)}</p>` : ''}
                    ${entrepreneur.contact.linkedin ? `<p><strong>LinkedIn:</strong> <a href="${entrepreneur.contact.linkedin}" target="_blank">${entrepreneur.contact.linkedin}</a></p>` : ''}
                    ${entrepreneur.contact.twitter ? `<p><strong>Twitter:</strong> <a href="${entrepreneur.contact.twitter}" target="_blank">${entrepreneur.contact.twitter}</a></p>` : ''}
                    ${entrepreneur.contact.wechat ? `<p><strong>微信:</strong> ${escapeHtml(entrepreneur.contact.wechat)}</p>` : ''}
                </div>
            ` : ''}
            <div class="content">
                ${entrepreneur.content}
            </div>
        `;

        openModal();
    } catch (error) {
        console.error('加载创业者详情失败:', error);
        alert('无法加载创业者详情');
    }
}

// ========================================
// 资源库
// ========================================

function renderResources(resources) {
    const list = document.getElementById('resourcesList');
    const empty = document.getElementById('resourcesEmpty');

    if (!list) return;

    if (!resources || resources.length === 0) {
        list.style.display = 'none';
        if (empty) empty.style.display = 'block';
        return;
    }

    list.style.display = 'flex';
    if (empty) empty.style.display = 'none';

    list.innerHTML = resources.map(resource => `
        <div class="resource-item" onclick="showResourceDetail('${resource.id}')">
            <div class="resource-header">
                <h3 class="resource-title">${escapeHtml(resource.title)}</h3>
                ${resource.type ? `<span class="resource-type">${resource.type}</span>` : ''}
            </div>
            ${resource.tags && resource.tags.length > 0 ? `
                <div class="card-tags" style="margin-bottom: 1rem;">
                    ${resource.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : ''}
            ${resource.url ? `<p style="color: #2563eb; margin-bottom: 0.5rem;">🔗 ${resource.url}</p>` : ''}
        </div>
    `).join('');
}

async function showResourceDetail(resourceId) {
    try {
        const response = await fetch(`/resources/${resourceId}.json`);
        if (!response.ok) throw new Error('资源不存在');

        const resource = await response.json();

        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <div style="margin-bottom: 2rem;">
                ${resource.type ? `<span class="resource-type">${resource.type}</span>` : ''}
            </div>
            <h1>${escapeHtml(resource.title)}</h1>
            ${resource.tags && resource.tags.length > 0 ? `
                <div class="card-tags" style="margin: 1rem 0;">
                    ${resource.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : ''}
            ${resource.url ? `
                <div style="margin: 1.5rem 0; padding: 1rem; background: #f8fafc; border-radius: 8px;">
                    <strong>链接:</strong> <a href="${resource.url}" target="_blank" rel="noopener">${resource.url}</a>
                </div>
            ` : ''}
            ${resource.file ? `
                <div style="margin: 1.5rem 0; padding: 1rem; background: #f8fafc; border-radius: 8px;">
                    <strong>文件:</strong> <a href="${resource.file}" download>下载文件</a>
                </div>
            ` : ''}
            <div class="content">
                ${resource.content}
            </div>
        `;

        openModal();
    } catch (error) {
        console.error('加载资源详情失败:', error);
        alert('无法加载资源详情');
    }
}

// ========================================
// 活动信息
// ========================================

function renderEvents(events) {
    const grid = document.getElementById('eventsGrid');
    const empty = document.getElementById('eventsEmpty');

    if (!grid) return;

    if (!events || events.length === 0) {
        grid.style.display = 'none';
        if (empty) empty.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    if (empty) empty.style.display = 'none';

    grid.innerHTML = events.map(event => `
        <div class="card" onclick="showEventDetail('${event.id}')">
            ${event.poster && event.poster.thumbnail ?
                `<img src="/${event.poster.thumbnail}" alt="${event.title}" class="card-image">` :
                '<div class="card-image" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);"></div>'
            }
            <div class="card-content">
                ${event.type ? `<span class="card-category" style="background-color: #f59e0b;">${event.type}</span>` : ''}
                <h3 class="card-title">${escapeHtml(event.title)}</h3>
                <p style="color: #64748b; margin-bottom: 0.5rem;">📅 ${formatDate(event.date)}</p>
                <p style="color: #64748b; margin-bottom: 1rem;">📍 ${escapeHtml(event.location)}</p>
                ${event.speakers && event.speakers.length > 0 ? `
                    <p style="color: #64748b;">🎤 ${event.speakers.join(', ')}</p>
                ` : ''}
                ${event.registration_url ? `
                    <a href="${event.registration_url}" target="_blank" class="btn btn-primary" style="margin-top: 1rem; display: inline-block;" onclick="event.stopPropagation()">立即报名</a>
                ` : ''}
            </div>
        </div>
    `).join('');
}

async function showEventDetail(eventId) {
    try {
        const response = await fetch(`/events/${eventId}.json`);
        if (!response.ok) throw new Error('活动不存在');

        const event = await response.json();

        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            ${event.poster && event.poster.original ?
                `<img src="/${event.poster.original}" alt="${event.title}" style="width: 100%; border-radius: 8px; margin-bottom: 2rem;">` :
                ''
            }
            ${event.type ? `<span class="card-category" style="background-color: #f59e0b;">${event.type}</span>` : ''}
            <h1 style="margin-top: 1rem;">${escapeHtml(event.title)}</h1>
            <div style="margin: 1.5rem 0; padding: 1rem; background: #f8fafc; border-radius: 8px;">
                <p style="margin-bottom: 0.5rem;"><strong>📅 时间:</strong> ${formatDate(event.date)}</p>
                <p style="margin-bottom: 0.5rem;"><strong>📍 地点:</strong> ${escapeHtml(event.location)}</p>
                ${event.speakers && event.speakers.length > 0 ? `
                    <p><strong>🎤 主讲人:</strong> ${event.speakers.join(', ')}</p>
                ` : ''}
            </div>
            ${event.registration_url ? `
                <div style="text-align: center; margin: 2rem 0;">
                    <a href="${event.registration_url}" target="_blank" class="btn btn-primary">立即报名参加</a>
                </div>
            ` : ''}
            <div class="content">
                ${event.content}
            </div>
        `;

        openModal();
    } catch (error) {
        console.error('加载活动详情失败:', error);
        alert('无法加载活动详情');
    }
}

// ========================================
// 过滤器
// ========================================

function setupFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const searchInput = document.getElementById('searchInput');
    const resourceTypeFilter = document.getElementById('resourceTypeFilter');

    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterStories);
    }

    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterStories, 300));
    }

    if (resourceTypeFilter) {
        resourceTypeFilter.addEventListener('change', filterResources);
    }
}

function filterStories() {
    const category = document.getElementById('categoryFilter')?.value || '';
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';

    filteredStories = appData.stories.filter(story => {
        const matchCategory = !category || story.category === category;
        const matchSearch = !search ||
            story.title.toLowerCase().includes(search) ||
            (story.excerpt && story.excerpt.toLowerCase().includes(search)) ||
            (story.author && story.author.toLowerCase().includes(search)) ||
            (story.tags && story.tags.some(tag => tag.toLowerCase().includes(search)));

        return matchCategory && matchSearch;
    });

    renderStories(filteredStories);
}

function filterResources() {
    const type = document.getElementById('resourceTypeFilter')?.value || '';

    filteredResources = appData.resources.filter(resource => {
        return !type || resource.type === type;
    });

    renderResources(filteredResources);
}

// ========================================
// 模态框
// ========================================

function setupModal() {
    const modal = document.getElementById('detailModal');
    const closeBtn = document.getElementById('modalClose');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // ESC键关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

function openModal() {
    const modal = document.getElementById('detailModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const modal = document.getElementById('detailModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ========================================
// 工具函数
// ========================================

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        return dateString;
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
