// B站直播 API 封装
class BilibiliSite {
    constructor() {
        this.id = 'bilibili';
        this.name = '哔哩哔哩';
    }

    /**
     * 获取直播间详情
     * @param {string} roomId - 房间ID
     * @returns {Promise<Object>}
     */
    async getRoomDetail(roomId) {
        const response = await fetch(`/api/bilibili/room?room_id=${roomId}`);
        const data = await response.json();
        
        if (data.code !== 0) {
            throw new Error(data.error || '获取直播间信息失败');
        }

        return {
            roomId: roomId,
            ...data.data
        };
    }

    /**
     * 获取播放地址
     * @param {string} roomId - 房间ID
     * @param {string} quality - 清晰度
     * @returns {Promise<Object>}
     */
    async getPlayUrl(roomId, quality = '10000') {
        const response = await fetch(`/api/bilibili/play?room_id=${roomId}&quality=${quality}`);
        const data = await response.json();
        
        if (data.code !== 0) {
            throw new Error(data.error || '获取播放地址失败');
        }

        return {
            urls: data.urls,
            type: data.type,
            headers: data.headers
        };
    }

    /**
     * 格式化在线人数
     * @param {number} num - 人数
     * @returns {string}
     */
    formatOnline(num) {
        if (num >= 10000) {
            return (num / 10000).toFixed(1) + '万';
        }
        return num.toString();
    }
}

// 导出实例
const bilibili = new BilibiliSite();