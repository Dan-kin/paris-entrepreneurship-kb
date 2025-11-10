/**
 * 自动更新检测脚本 - 移个朋友·巴黎创业知识库
 * 检测网站内容更新并提示用户刷新
 */

(function () {
    'use strict';

    // 配置
    const CONFIG = {
        checkInterval: 5 * 60 * 1000, // 5分钟检查一次
        notificationDuration: 10000, // 通知显示10秒
        storageKey: 'paris_kb_build_time',
        endpoint: '/index.json'
    };

    let currentBuildTime = null;
    let checkTimer = null;
    let notificationElement = null;

    // ========================================
    // 初始化
    // ========================================

    function init() {
        // 等待页面加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', start);
        } else {
            start();
        }
    }

    function start() {
        loadCurrentBuildTime()
            .then(() => {
                displayLastUpdateInfo();
                startPeriodicCheck();
            })
            .catch(error => {
                console.error('初始化更新检测失败:', error);
            });
    }

    // ========================================
    // 加载当前构建时间
    // ========================================

    async function loadCurrentBuildTime() {
        try {
            const response = await fetch(CONFIG.endpoint, {
                cache: 'no-cache'
            });

            if (!response.ok) {
                throw new Error('无法获取构建信息');
            }

            const data = await response.json();
            currentBuildTime = data.build_time;

            // 保存到本地存储
            if (currentBuildTime) {
                localStorage.setItem(CONFIG.storageKey, currentBuildTime);
            }

            return currentBuildTime;
        } catch (error) {
            console.error('加载构建时间失败:', error);
            // 尝试从本地存储读取
            currentBuildTime = localStorage.getItem(CONFIG.storageKey);
            return currentBuildTime;
        }
    }

    // ========================================
    // 定期检查更新
    // ========================================

    function startPeriodicCheck() {
        // 清除之前的定时器
        if (checkTimer) {
            clearInterval(checkTimer);
        }

        // 设置新的定时器
        checkTimer = setInterval(checkForUpdates, CONFIG.checkInterval);

        // 页面可见性变化时检查
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                checkForUpdates();
            }
        });
    }

    async function checkForUpdates() {
        try {
            const response = await fetch(CONFIG.endpoint, {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });

            if (!response.ok) {
                return;
            }

            const data = await response.json();
            const newBuildTime = data.build_time;

            if (newBuildTime && currentBuildTime && newBuildTime !== currentBuildTime) {
                // 发现新版本
                showUpdateNotification();
                currentBuildTime = newBuildTime;
                localStorage.setItem(CONFIG.storageKey, newBuildTime);
            }
        } catch (error) {
            console.error('检查更新失败:', error);
        }
    }

    // ========================================
    // 显示更新通知
    // ========================================

    function showUpdateNotification() {
        // 如果已经有通知，先移除
        if (notificationElement) {
            notificationElement.remove();
        }

        // 创建通知元素
        notificationElement = document.createElement('div');
        notificationElement.className = 'update-notification';
        notificationElement.innerHTML = `
            <div class="update-notification-content">
                <span class="update-notification-icon">🔄</span>
                <span class="update-notification-message">网站内容已更新</span>
                <button class="update-notification-button" onclick="window.location.reload()">
                    刷新页面
                </button>
                <button class="update-notification-close" aria-label="关闭">
                    ×
                </button>
            </div>
        `;

        // 添加样式
        addNotificationStyles();

        // 添加到页面
        document.body.appendChild(notificationElement);

        // 关闭按钮事件
        const closeBtn = notificationElement.querySelector('.update-notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', hideUpdateNotification);
        }

        // 自动隐藏
        setTimeout(hideUpdateNotification, CONFIG.notificationDuration);

        // 添加显示动画
        setTimeout(() => {
            notificationElement.classList.add('show');
        }, 100);
    }

    function hideUpdateNotification() {
        if (notificationElement) {
            notificationElement.classList.remove('show');
            setTimeout(() => {
                if (notificationElement) {
                    notificationElement.remove();
                    notificationElement = null;
                }
            }, 300);
        }
    }

    function addNotificationStyles() {
        // 检查是否已经添加过样式
        if (document.getElementById('update-notification-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'update-notification-styles';
        style.textContent = `
            .update-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 400px;
                opacity: 0;
                transform: translateY(-20px);
                transition: all 0.3s ease;
            }

            .update-notification.show {
                opacity: 1;
                transform: translateY(0);
            }

            .update-notification-content {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                display: flex;
                align-items: center;
                gap: 1rem;
            }

            .update-notification-icon {
                font-size: 1.5rem;
                animation: rotate 2s linear infinite;
            }

            @keyframes rotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            .update-notification-message {
                flex: 1;
                font-weight: 500;
            }

            .update-notification-button {
                background-color: white;
                color: #667eea;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 0.9rem;
            }

            .update-notification-button:hover {
                transform: scale(1.05);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            }

            .update-notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0.8;
                transition: opacity 0.2s;
            }

            .update-notification-close:hover {
                opacity: 1;
            }

            @media (max-width: 768px) {
                .update-notification {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }

                .update-notification-content {
                    padding: 0.875rem 1rem;
                    font-size: 0.9rem;
                }

                .update-notification-icon {
                    font-size: 1.25rem;
                }

                .update-notification-button {
                    padding: 0.4rem 0.8rem;
                    font-size: 0.85rem;
                }
            }
        `;

        document.head.appendChild(style);
    }

    // ========================================
    // 显示最后更新信息
    // ========================================

    function displayLastUpdateInfo() {
        const updateInfoElement = document.getElementById('updateInfo');
        if (!updateInfoElement || !currentBuildTime) {
            return;
        }

        try {
            const buildDate = new Date(currentBuildTime);
            const now = new Date();
            const diffMs = now - buildDate;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            let timeAgo;
            if (diffMins < 1) {
                timeAgo = '刚刚';
            } else if (diffMins < 60) {
                timeAgo = `${diffMins}分钟前`;
            } else if (diffHours < 24) {
                timeAgo = `${diffHours}小时前`;
            } else {
                timeAgo = `${diffDays}天前`;
            }

            updateInfoElement.textContent = `最后更新: ${timeAgo}`;
        } catch (error) {
            console.error('显示更新信息失败:', error);
        }
    }

    // ========================================
    // 手动刷新功能（可供外部调用）
    // ========================================

    window.checkForUpdatesNow = function () {
        checkForUpdates();
    };

    // ========================================
    // 启动
    // ========================================

    init();
})();
