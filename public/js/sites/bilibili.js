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
        try {
            const response = await fetch(`/api/bilibili/room?id=${roomId}`);
            const data = await response.json();
            
            if (data.code !== 0) {
                throw new Error(data.message || '获取直播间信息失败');
            }

            const roomInfo = data.data.room_info;
            const anchorInfo = data.data.anchor_info.base_info;

            return {
                roomId: roomInfo.room_id.toString(),
                title: roomInfo.title,
                cover: roomInfo.cover,
                userName: anchorInfo.uname,
                userAvatar: anchorInfo.face,
                online: roomInfo.online,
                status: roomInfo.live_status === 1,
                introduction: roomInfo.description,
                platform: this.id
            };
        } catch (error) {
            console.error('获取直播间信息失败:', error);
            throw error;
        }
    }

    /**
     * 获取播放地址
     * @param {string} roomId - 房间ID
     * @param {string} quality - 清晰度
     * @returns {Promise<Object>}
     */
    async getPlayUrl(roomId, quality = '10000') {
        try {
            const response = await fetch(`/api/bilibili/play?id=${roomId}&quality=${quality}`);
            const data = await response.json();
            
            if (data.code !== 0) {
                throw new Error(data.error || '获取播放地址失败');
            }

            return {
                urls: data.urls,
                type: data.type,
                headers: data.headers
            };
        } catch (error) {
            console.error('获取播放地址失败:', error);
            throw error;
        }
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