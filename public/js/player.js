// 播放器页面逻辑
(function() {
    'use strict';

    // 从 URL 获取参数
    const urlParams = new URLSearchParams(window.location.search);
    const platform = urlParams.get('platform') || 'bilibili';
    const roomId = urlParams.get('room');

    // 当前平台实例
    let currentSite = bilibili;
    
    // FLV 播放器实例
    let flvPlayer = null;
    
    // 弹幕管理器实例
    let danmakuManager = null;
    
    // 当前房间信息
    let roomDetail = null;

    // DOM 元素
    const videoPlayer = document.getElementById('videoPlayer');
    const videoWrapper = document.getElementById('videoWrapper');
    const danmakuLayer = document.getElementById('danmakuLayer');
    const roomTitle = document.getElementById('roomTitle');
    const streamerAvatar = document.getElementById('streamerAvatar');
    const streamerName = document.getElementById('streamerName');
    const roomIntro = document.getElementById('roomIntro');
    const onlineCount = document.getElementById('onlineCount');
    const roomStatus = document.getElementById('roomStatus');
    const playerLoading = document.getElementById('playerLoading');
    const playerError = document.getElementById('playerError');
    const qualitySelector = document.getElementById('qualitySelector');
    const qualityButtons = document.getElementById('qualityButtons');
    const popularityCount = document.getElementById('popularityCount');

    // 初始化
    async function init() {
        if (!roomId) {
            showError('缺少房间ID参数');
            return;
        }

        // 根据平台选择对应的 site
        switch(platform) {
            case 'bilibili':
                currentSite = bilibili;
                break;
            case 'douyu':
                currentSite = douyu;
                break;
            case 'huya':
                currentSite = huya;
                break;
            case 'douyin':
                currentSite = douyin;
                break;
            default:
                currentSite = bilibili;
        }

        // 加载直播间信息
        await loadRoomInfo();
    }

    // 加载直播间信息
    async function loadRoomInfo() {
        try {
            showLoading('正在获取直播间信息...');
            
            // 获取房间详情
            roomDetail = await currentSite.getRoomDetail(roomId);
            
            // 更新页面信息
            updateRoomInfo(roomDetail);
            
            // 检查直播状态
            if (!roomDetail.status) {
                showError('主播未开播');
                return;
            }
            
            // 开始播放
            await startPlay();
            
            // 连接弹幕
            connectDanmaku();
            
        } catch (error) {
            console.error('加载直播间信息失败:', error);
            showError('加载失败: ' + error.message);
        }
    }

    // 更新房间信息显示
    function updateRoomInfo(room) {
        roomTitle.textContent = room.title;
        streamerAvatar.src = room.userAvatar;
        streamerAvatar.alt = room.userName;
        streamerName.textContent = room.userName;
        roomIntro.textContent = room.introduction || '暂无简介';
        onlineCount.textContent = currentSite.formatOnline(room.online);
        roomStatus.textContent = room.status ? '直播中' : '未开播';
        
        // 更新页面标题
        document.title = `${room.title} - ${room.userName} - Simple Live`;
    }

    // 开始播放
    async function startPlay(quality = '10000') {
        try {
            showLoading('正在加载直播流...');
            
            // 获取播放地址
            const playInfo = await currentSite.getPlayUrl(roomId, quality);
            
            if (!playInfo.urls || playInfo.urls.length === 0) {
                throw new Error('未获取到播放地址');
            }

            // 播放视频
            await playVideo(playInfo.urls[0], playInfo.type);
            
            hideLoading();
            
        } catch (error) {
            console.error('播放失败:', error);
            showError('播放失败: ' + error.message);
        }
    }

    // 播放视频
    async function playVideo(url, type) {
        return new Promise((resolve, reject) => {
            // 如果已有播放器，先销毁
            if (flvPlayer) {
                flvPlayer.destroy();
                flvPlayer = null;
            }

            if (type === 'flv') {
                // 检查浏览器支持
                if (!flvjs.isSupported()) {
                    reject(new Error('浏览器不支持 FLV 播放'));
                    return;
                }

                // 创建 FLV 播放器
                flvPlayer = flvjs.createPlayer({
                    type: 'flv',
                    url: url,
                    isLive: true,
                    hasAudio: true,
                    hasVideo: true,
                    cors: true
                }, {
                    enableWorker: true,
                    enableStashBuffer: false,
                    stashInitialSize: 128,
                    lazyLoad: false,
                    autoCleanupSourceBuffer: true
                });

                flvPlayer.attachMediaElement(videoPlayer);
                
                // 监听事件
                flvPlayer.on(flvjs.Events.ERROR, (errorType, errorDetail) => {
                    console.error('FLV播放错误:', errorType, errorDetail);
                    reject(new Error(`播放错误: ${errorType}`));
                });

                flvPlayer.on(flvjs.Events.LOADING_COMPLETE, () => {
                    console.log('FLV 加载完成');
                });

                // 加载并播放
                flvPlayer.load();
                flvPlayer.play().then(() => {
                    console.log('开始播放');
                    resolve();
                }).catch(err => {
                    reject(err);
                });

            } else if (type === 'hls' || type === 'm3u8') {
                // 优先使用 Hls.js 播放
                if (typeof Hls !== 'undefined' && Hls.isSupported()) {
                    const hls = new Hls();
                    hls.loadSource(url);
                    hls.attachMedia(videoPlayer);
                    hls.on(Hls.Events.MANIFEST_PARSED, function() {
                        videoPlayer.play().then(resolve).catch(reject);
                    });
                    hls.on(Hls.Events.ERROR, function (event, data) {
                        if (data.fatal) {
                            console.error('HLS 播放错误:', data);
                            reject(new Error(`HLS Error: ${data.details}`));
                        }
                    });
                }
                // 降级使用浏览器原生 HLS 支持 (主要针对 Safari)
                else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
                    videoPlayer.src = url;
                    videoPlayer.addEventListener('loadedmetadata', function() {
                        videoPlayer.play().then(resolve).catch(reject);
                    });
                } else {
                    reject(new Error('浏览器不支持 HLS 播放'));
                }
            } else {
                // 原生播放
                videoPlayer.src = url;
                videoPlayer.play().then(resolve).catch(reject);
            }

            // 监听视频错误
            videoPlayer.onerror = (e) => {
                console.error('视频播放错误:', e);
                reject(new Error('视频播放失败'));
            };
        });
    }

    // 重试播放（全局函数）
    window.retryPlay = function() {
        hideError();
        loadRoomInfo();
    };

    // 显示加载状态
    function showLoading(message = '加载中...') {
        playerLoading.querySelector('p').textContent = message;
        playerLoading.style.display = 'flex';
        playerError.style.display = 'none';
    }

    // 隐藏加载状态
    function hideLoading() {
        playerLoading.style.display = 'none';
    }

    // 显示错误
    function showError(message) {
        playerError.querySelector('.error-text').textContent = message;
        playerError.style.display = 'flex';
        playerLoading.style.display = 'none';
    }

    // 隐藏错误
    function hideError() {
        playerError.style.display = 'none';
    }

    // 连接弹幕
    function connectDanmaku() {
        try {
            // 创建弹幕管理器
            danmakuManager = new DanmakuManager(danmakuLayer);
            
            // 监听人气值更新
            danmakuLayer.addEventListener('popularity', (e) => {
                const count = e.detail;
                popularityCount.textContent = currentSite.formatOnline(count);
            });
            
            // 连接弹幕服务器
            danmakuManager.connect(platform, roomId);
            
            console.log('弹幕连接成功');
        } catch (error) {
            console.error('弹幕连接失败:', error);
        }
    }

    // 弹幕控制
    const toggleDanmakuBtn = document.getElementById('toggleDanmaku');
    const danmakuSettingsBtn = document.getElementById('danmakuSettings');
    
    let danmakuEnabled = true;
    
    toggleDanmakuBtn.addEventListener('click', () => {
        danmakuEnabled = !danmakuEnabled;
        if (danmakuManager) {
            danmakuManager.toggleDanmaku(danmakuEnabled);
        }
        toggleDanmakuBtn.textContent = danmakuEnabled ? '💬 弹幕' : '🚫 弹幕';
        toggleDanmakuBtn.style.opacity = danmakuEnabled ? '1' : '0.5';
    });
    
    danmakuSettingsBtn.addEventListener('click', () => {
        openSettingsModal();
    });

    // 弹幕设置
    window.openSettingsModal = function() {
        const modal = document.getElementById('settingsModal');
        modal.style.display = 'flex';
    };
    
    window.closeSettingsModal = function() {
        const modal = document.getElementById('settingsModal');
        modal.style.display = 'none';
    };
    
    // 设置项监听
    const enableDanmaku = document.getElementById('enableDanmaku');
    const danmakuOpacity = document.getElementById('danmakuOpacity');
    const danmakuFontSize = document.getElementById('danmakuFontSize');
    const danmakuSpeed = document.getElementById('danmakuSpeed');
    const danmakuArea = document.getElementById('danmakuArea');
    
    const opacityValue = document.getElementById('opacityValue');
    const fontSizeValue = document.getElementById('fontSizeValue');
    const speedValue = document.getElementById('speedValue');
    const areaValue = document.getElementById('areaValue');
    
    enableDanmaku.addEventListener('change', (e) => {
        if (danmakuManager) {
            danmakuManager.toggleDanmaku(e.target.checked);
        }
        danmakuEnabled = e.target.checked;
        toggleDanmakuBtn.textContent = danmakuEnabled ? '💬 弹幕' : '🚫 弹幕';
        toggleDanmakuBtn.style.opacity = danmakuEnabled ? '1' : '0.5';
    });
    
    danmakuOpacity.addEventListener('input', (e) => {
        const value = e.target.value / 100;
        opacityValue.textContent = `${e.target.value}%`;
        if (danmakuManager) {
            danmakuManager.updateSettings({ opacity: value });
        }
    });
    
    danmakuFontSize.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        fontSizeValue.textContent = `${value}px`;
        if (danmakuManager) {
            danmakuManager.updateSettings({ fontSize: value });
        }
    });
    
    danmakuSpeed.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        speedValue.textContent = `${value}秒`;
        if (danmakuManager) {
            danmakuManager.updateSettings({ speed: value });
        }
    });
    
    danmakuArea.addEventListener('input', (e) => {
        const value = e.target.value / 100;
        areaValue.textContent = `${e.target.value}%`;
        if (danmakuManager) {
            danmakuManager.updateSettings({ displayArea: value });
        }
    });
    
    // 点击模态框背景关闭
    document.getElementById('settingsModal').addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeSettingsModal();
        }
    });

    // 页面卸载时清理
    window.addEventListener('beforeunload', () => {
        if (flvPlayer) {
            flvPlayer.destroy();
            flvPlayer = null;
        }
        if (danmakuManager) {
            danmakuManager.disconnect();
            danmakuManager = null;
        }
    });

    // 移动端适配 - 阻止双击放大
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);

    // 全屏功能
    videoPlayer.addEventListener('dblclick', () => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            videoPlayer.requestFullscreen().catch(err => {
                console.error('全屏失败:', err);
            });
        }
    });

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();