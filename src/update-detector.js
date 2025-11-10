/**
 * 自动更新检测脚本
 * 功能：定期检测网站内容是否有更新，如有更新则提示用户刷新页面
 */

(function() {
    'use strict';

    // 配置
    const CONFIG = {
        // 检查更新的间隔时间（毫秒），默认 5 分钟
        CHECK_INTERVAL: 5 * 60 * 1000,
        // API 端点
        VERSION_URL: '/data/index.json',
        // 本地存储键名
        STORAGE_KEY: 'parisEntrepreneurship_version',
        // 是否在控制台显示调试信息
        DEBUG: false
    };

    // 当前版本信息
    let currentVersion = null;
    let checkTimer = null;

    /**
     * 调试日志
     */
    function log(...args) {
        if (CONFIG.DEBUG) {
            console.log('[UpdateDetector]', ...args);
        }
    }

    /**
     * 获取当前版本信息
     */
    async function getCurrentVersion() {
        try {
            const response = await fetch(CONFIG.VERSION_URL, {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            log('获取版本信息成功:', data);

            return {
                version: data.version,
                lastUpdated: data.last_updated,
                storiesCount: data.stories_count,
                resourcesCount: data.resources_count
            };
        } catch (error) {
            log('获取版本信息失败:', error);
            return null;
        }
    }

    /**
     * 从本地存储读取版本信息
     */
    function getStoredVersion() {
        try {
            const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            log('读取本地版本信息失败:', error);
            return null;
        }
    }

    /**
     * 保存版本信息到本地存储
     */
    function saveVersion(versionInfo) {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(versionInfo));
            log('保存版本信息成功:', versionInfo);
        } catch (error) {
            log('保存版本信息失败:', error);
        }
    }

    /**
     * 显示更新提示
     */
    function showUpdateNotification(newVersion) {
        // 检查是否已经有更新提示
        if (document.getElementById('updateNotification')) {
            return;
        }

        const notification = document.createElement('div');
        notification.id = 'updateNotification';
        notification.innerHTML = `
            <div style="
                position: fixed;
                bottom: 80px;
                right: 30px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px 25px;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                z-index: 10000;
                max-width: 350px;
                animation: slideInRight 0.5s ease;
            ">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                    <strong style="font-size: 16px;">📢 内容已更新</strong>
                    <button
                        onclick="document.getElementById('updateNotification').remove()"
                        style="
                            background: transparent;
                            border: none;
                            color: white;
                            font-size: 20px;
                            cursor: pointer;
                            padding: 0;
                            margin-left: 10px;
                        "
                    >×</button>
                </div>
                <p style="margin: 0 0 15px 0; font-size: 14px; line-height: 1.5;">
                    网站有新内容更新，刷新页面查看最新内容。
                </p>
                <button
                    onclick="location.reload()"
                    style="
                        background: white;
                        color: #667eea;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 6px;
                        font-weight: 600;
                        cursor: pointer;
                        width: 100%;
                        font-size: 14px;
                    "
                >
                    立即刷新
                </button>
            </div>
            <style>
                @keyframes slideInRight {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            </style>
        `;

        document.body.appendChild(notification);
        log('显示更新提示');
    }

    /**
     * 更新页脚的更新时间
     */
    function updateFooterInfo(versionInfo) {
        const updateInfo = document.getElementById('updateInfo');
        if (updateInfo && versionInfo.lastUpdated) {
            const date = new Date(versionInfo.lastUpdated);
            const formattedDate = date.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            updateInfo.textContent = `最后更新：${formattedDate}`;
        }
    }

    /**
     * 检查更新
     */
    async function checkForUpdates() {
        log('开始检查更新...');

        const newVersion = await getCurrentVersion();
        if (!newVersion) {
            log('无法获取版本信息，跳过本次检查');
            return;
        }

        // 如果是首次加载，保存版本信息并更新页脚
        if (!currentVersion) {
            currentVersion = newVersion;
            saveVersion(newVersion);
            updateFooterInfo(newVersion);
            log('首次加载，当前版本:', currentVersion);
            return;
        }

        // 检查版本是否有变化
        if (newVersion.version !== currentVersion.version) {
            log('检测到新版本:', newVersion.version, '当前版本:', currentVersion.version);
            showUpdateNotification(newVersion);
            // 更新当前版本信息（但不保存到 localStorage，等用户刷新后再保存）
            currentVersion = newVersion;
        } else {
            log('没有检测到更新');
        }
    }

    /**
     * 启动更新检测
     */
    function startUpdateDetection() {
        log('启动更新检测，间隔:', CONFIG.CHECK_INTERVAL / 1000, '秒');

        // 立即执行一次检查
        checkForUpdates();

        // 设置定时检查
        checkTimer = setInterval(checkForUpdates, CONFIG.CHECK_INTERVAL);

        // 页面可见性改变时检查更新
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                log('页面重新可见，检查更新');
                checkForUpdates();
            }
        });
    }

    /**
     * 停止更新检测
     */
    function stopUpdateDetection() {
        if (checkTimer) {
            clearInterval(checkTimer);
            checkTimer = null;
            log('停止更新检测');
        }
    }

    /**
     * 初始化
     */
    function init() {
        // 页面加载完成后启动更新检测
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', startUpdateDetection);
        } else {
            startUpdateDetection();
        }

        // 页面卸载时清理
        window.addEventListener('beforeunload', stopUpdateDetection);

        log('更新检测器初始化完成');
    }

    // 暴露全局控制接口（用于调试）
    if (CONFIG.DEBUG) {
        window.UpdateDetector = {
            checkNow: checkForUpdates,
            start: startUpdateDetection,
            stop: stopUpdateDetection,
            getCurrentVersion: () => currentVersion,
            config: CONFIG
        };
    }

    // 启动
    init();

})();
