// public/js/sites/huya.js
const huya = {
    getRoomDetail: async (roomId) => {
        const response = await fetch(`/api/huya/room?room_id=${roomId}`);
        const data = await response.json();
        
        if (data.code !== 0) {
            throw new Error(data.error || '获取房间信息失败');
        }
        
        return {
            roomId: roomId,
            ...data.data
        };
    },

    getPlayUrl: async (roomId, quality) => {
        const response = await fetch(`/api/huya/play?room_id=${roomId}`);
        const data = await response.json();
        
        if (data.code !== 0) {
            throw new Error(data.error || '获取播放地址失败');
        }
        
        return {
            urls: data.urls,
            type: data.type
        };
    },

    // 格式化在线人数
    formatOnline: (online) => {
        if (online > 10000) {
            return `${(online / 10000).toFixed(1)}万`;
        }
        return online;
    }
};