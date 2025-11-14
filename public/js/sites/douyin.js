// public/js/sites/douyin.js
const douyin = {
    // 获取房间详情
    getRoomDetail: async (roomId) => {
        const response = await fetch(`/api/douyin/room?room_id=${roomId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        return data;
    },

    // 获取播放地址
    getPlayUrl: async (roomId, quality) => {
        const response = await fetch(`/api/douyin/play?room_id=${roomId}&quality=${quality}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        return data;
    },

    // 格式化在线人数
    formatOnline: (online) => {
        if (online > 10000) {
            return `${(online / 10000).toFixed(1)}万`;
        }
        return online;
    }
};