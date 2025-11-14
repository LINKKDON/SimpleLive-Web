// public/js/sites/douyu.js
const douyu = {
    // 获取房间详情
    async getRoomDetail(roomId) {
        const response = await fetch(`/api/douyu/room?room_id=${roomId}`);
        if (!response.ok) {
            throw new Error('获取斗鱼房间信息失败');
        }
        const data = await response.json();

        if (data.error !== 0) {
            throw new Error(data.msg || '获取斗鱼房间信息失败');
        }

        const roomInfo = data.room;
        return {
            title: roomInfo.room_name,
            userName: roomInfo.owner_name,
            userAvatar: roomInfo.avatar.middle,
            online: roomInfo.online,
            introduction: roomInfo.show_details,
            status: roomInfo.show_status === 1, // 1 表示开播
        };
    },

    // 获取播放地址
    async getPlayUrl(roomId, quality = 'hls') {
        const response = await fetch(`/api/douyu/play?room_id=${roomId}`);
        if (!response.ok) {
            throw new Error('获取斗鱼播放地址失败');
        }
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        return {
            urls: data.urls,
            type: data.type,
        };
    },

    // 格式化在线人数
    formatOnline(online) {
        if (online > 10000) {
            return `${(online / 10000).toFixed(1)}万`;
        }
        return online;
    }
};