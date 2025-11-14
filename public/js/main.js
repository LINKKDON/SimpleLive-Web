// 首页主逻辑
(function() {
    'use strict';

    // 当前选择的平台
    let currentPlatform = 'bilibili';
    let currentSite = bilibili;

    // DOM 元素
    const roomIdInput = document.getElementById('roomId');
    const goBtn = document.getElementById('goBtn');
    const roomList = document.getElementById('roomList');
    const loading = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const platformSelect = document.getElementById('platformSelect');

    // 初始化
    function init() {
        // 绑定平台切换
        platformSelect.addEventListener('change', handlePlatformChange);

        // 绑定观看按钮
        goBtn.addEventListener('click', handleGoToRoom);
        
        // 回车键观看
        roomIdInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleGoToRoom();
            }
        });

        // 加载推荐直播间（演示数据）
        loadDemoRooms();
    }

    // 切换平台
    function handlePlatformChange(e) {
        currentPlatform = e.target.value;

        // 根据平台切换 site 实例
        switch(currentPlatform) {
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

        // 重新加载推荐
        loadDemoRooms();
    }

    // 跳转到直播间
    function handleGoToRoom() {
        const roomId = roomIdInput.value.trim();
        if (!roomId) {
            showError('请输入房间号');
            return;
        }

        // 跳转到播放页面
        window.location.href = `/player.html?platform=${currentPlatform}&room=${roomId}`;
    }

    // 加载演示房间列表
    function loadDemoRooms() {
        showLoading();

        let demoRooms = [];
        if (currentPlatform === 'bilibili') {
            demoRooms = [
                { roomId: '545068', title: '【3D高能】让我康康今天播什么', cover: 'https://i0.hdslb.com/bfs/live/new_room_cover/e6c24b2e05f95649e2d2fc98eb3b77c4f6ce70c1.jpg', userName: '赤井心Akua', online: 50000 },
                { roomId: '21852', title: '【干饭】今天吃什么呢', cover: 'https://i0.hdslb.com/bfs/live/new_room_cover/6d9e8f6f8c8c3e5f4f7b2d9e8f6f8c8c3e5f4f7b.jpg', userName: 'B站直播', online: 30000 },
                { roomId: '76', title: '你们好鸭~', cover: 'https://i0.hdslb.com/bfs/live/new_room_cover/3d4b8f8c8c3e5f4f7b2d9e8f6f8c8c3e5f4f7b2d.jpg', userName: '晚玉', online: 80000 },
                { roomId: '6', title: '吃个饭~', cover: 'https://i0.hdslb.com/bfs/live/new_room_cover/5f4f7b2d9e8f6f8c8c3e5f4f7b2d9e8f6f8c8c3e.jpg', userName: '老实憨厚的笑笑', online: 120000 }
            ];
        } else if (currentPlatform === 'douyu') {
            demoRooms = [
                { roomId: '9999', title: 'Doinb', cover: 'https://rpic.douyucdn.cn/asrpic/220118/9999_1823.png/1280x720', userName: 'Doinb', online: 300000 },
                { roomId: '74751', title: '长沙乡村敢死队', cover: 'https://rpic.douyucdn.cn/asrpic/220118/74751_1823.png/1280x720', userName: '长沙乡村敢死队', online: 150000 },
                { roomId: '12345', title: '一条小团团OvO', cover: 'https://rpic.douyucdn.cn/asrpic/220118/12345_1823.png/1280x720', userName: '一条小团团OvO', online: 500000 },
                { roomId: '522423', title: '寅子', cover: 'https://rpic.douyucdn.cn/asrpic/220118/522423_1823.png/1280x720', userName: '寅子', online: 200000 }
            ];
        } else if (currentPlatform === 'huya') {
            demoRooms = [
                { roomId: 'lol', title: '英雄联盟', cover: 'https://huyaimg.msstatic.com/cdn/huyapai/1805/e433878ef1cf512a6515e058c24321.jpg', userName: '英雄联盟官方赛事', online: 980000 },
                { roomId: '660000', title: 'Uzi', cover: 'https://huyaimg.msstatic.com/cdn/huyapai/1805/e433878ef1cf512a6515e058c24321.jpg', userName: 'Uzi', online: 1500000 },
                { roomId: 'saonan', title: '骚男', cover: 'https://huyaimg.msstatic.com/cdn/huyapai/1805/e433878ef1cf512a6515e058c24321.jpg', userName: '骚男', online: 800000 },
                { roomId: '243547', title: 'CSGO', cover: 'https://huyaimg.msstatic.com/cdn/huyapai/1805/e433878ef1cf512a6515e058c24321.jpg', userName: 'CSGO官方赛事', online: 450000 }
            ];
        } else if (currentPlatform === 'douyin') {
            demoRooms = [
                { roomId: '688702459485', title: '三只羊网络', cover: 'https://p3-webcast.douyinpic.com/img/webcast/user_avatar/688702459485_1598523523.jpeg', userName: '疯狂小杨哥', online: 1000000 },
                { roomId: '709898629159', title: '东方甄选', cover: 'https://p3-webcast.douyinpic.com/img/webcast/user_avatar/709898629159_1626778998.jpeg', userName: '东方甄选', online: 800000 },
                { roomId: '92000370000', title: '交个朋友', cover: 'https://p3-webcast.douyinpic.com/img/webcast/user_avatar/92000370000_1602754558.jpeg', userName: '罗永浩', online: 500000 },
                { roomId: '694916891234', title: '刘畊宏', cover: 'https://p3-webcast.douyinpic.com/img/webcast/user_avatar/694916891234_1618824558.jpeg', userName: '刘畊宏', online: 1200000 }
            ];
        }

        // 渲染房间列表
        setTimeout(() => {
            hideLoading();
            renderRooms(demoRooms);
        }, 300);
    }

    // 渲染房间列表
    function renderRooms(rooms) {
        if (!rooms || rooms.length === 0) {
            roomList.innerHTML = '<p style="text-align: center; padding: 40px; color: #999;">暂无直播间</p>';
            return;
        }

        roomList.innerHTML = rooms.map(room => `
            <div class="room-card" onclick="goToRoom('${room.roomId}')">
                <img src="${room.cover}" alt="${room.title}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'400\\' height=\\'225\\'%3E%3Crect fill=\\'%23ddd\\' width=\\'400\\' height=\\'225\\'/%3E%3Ctext fill=\\'%23999\\' x=\\'50%25\\' y=\\'50%25\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' font-size=\\'20\\'%3E暂无封面%3C/text%3E%3C/svg%3E'">
                <h3>${escapeHtml(room.title)}</h3>
                <p>${escapeHtml(room.userName)}</p>
                <span class="online">${formatOnline(room.online)} 人气</span>
            </div>
        `).join('');
    }

    // 跳转到房间（全局函数，供 onclick 调用）
    window.goToRoom = function(roomId) {
        window.location.href = `/player.html?platform=${currentPlatform}&room=${roomId}`;
    };

    // 格式化在线人数
    function formatOnline(num) {
        if (num >= 10000) {
            return (num / 10000).toFixed(1) + '万';
        }
        return num.toLocaleString();
    }

    // HTML 转义
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 显示加载状态
    function showLoading() {
        loading.style.display = 'block';
        errorDiv.style.display = 'none';
        roomList.innerHTML = '';
    }

    // 隐藏加载状态
    function hideLoading() {
        loading.style.display = 'none';
    }

    // 显示错误
    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 3000);
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();