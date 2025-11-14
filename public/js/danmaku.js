/**
 * 弹幕管理类
 * 负责连接弹幕服务器、接收和显示弹幕
 */
class DanmakuManager {
    constructor(container) {
        this.container = container;
        this.danmakuList = [];
        this.isConnected = false;
        this.ws = null;
        this.reconnectTimer = null;
        this.heartbeatTimer = null;
        this.maxDanmaku = 100; // 最多显示的弹幕数量
        
        // 弹幕显示设置
        this.settings = {
            enabled: true,
            opacity: 0.8,
            fontSize: 24,
            speed: 8, // 弹幕移动速度（秒）
            displayArea: 1.0 // 显示区域（1.0 = 100%）
        };
        
        // 创建弹幕容器
        this.createDanmakuContainer();
    }
    
    /**
     * 创建弹幕显示容器
     */
    createDanmakuContainer() {
        this.danmakuContainer = document.createElement('div');
        this.danmakuContainer.className = 'danmaku-container';
        this.container.appendChild(this.danmakuContainer);
    }
    
    /**
     * 连接弹幕服务器
     */
    connect(platform, roomId) {
        this.platform = platform;
        this.roomId = roomId;
        
        if (platform === 'bilibili') {
            this.connectBilibili(roomId);
        } else if (platform === 'douyu') {
            this.connectDouyu(roomId);
        } else if (platform === 'huya') {
            this.connectHuya(roomId);
        } else if (platform === 'douyin') {
            this.connectDouyin(roomId);
        }
        // 后续添加其他平台
    }
    
    /**
     * 连接 B站弹幕服务器
     */
    async connectBilibili(roomId) {
        try {
            // 获取真实房间号
            const response = await fetch(`/api/bilibili/room?room_id=${roomId}`);
            const data = await response.json();
            
            if (data.code !== 0) {
                throw new Error(data.message || '获取房间信息失败');
            }
            
            const realRoomId = data.data.room_id;
            
            // 连接弹幕 WebSocket
            const wsUrl = `wss://broadcastlv.chat.bilibili.com/sub`;
            this.ws = new WebSocket(wsUrl);
            this.ws.binaryType = 'arraybuffer';
            
            this.ws.onopen = () => {
                console.log('弹幕服务器连接成功');
                this.isConnected = true;
                this.sendJoinRoom(realRoomId);
                this.startBilibiliHeartbeat();
            };
            
            this.ws.onmessage = (event) => {
                this.handleBilibiliMessage(event.data);
            };
            
            this.ws.onerror = (error) => {
                console.error('弹幕连接错误:', error);
            };
            
            this.ws.onclose = () => {
                console.log('弹幕连接已断开');
                this.isConnected = false;
                this.stopHeartbeat();
                // 3秒后尝试重连
                this.reconnectTimer = setTimeout(() => {
                    this.connect(this.platform, this.roomId);
                }, 3000);
            };
            
        } catch (error) {
            console.error('连接弹幕服务器失败:', error);
        }
    }

    /**
     * 连接 斗鱼弹幕服务器
     */
    async connectDouyu(roomId) {
        try {
            // 获取弹幕服务器信息
            const response = await fetch(`/api/douyu/danmaku?room_id=${roomId}`);
            const data = await response.json();

            if (data.code !== 0) {
                throw new Error(data.message || '获取斗鱼弹幕信息失败');
            }

            const danmakuInfo = data.data;
            const wsUrl = `wss://${danmakuInfo.host}:${danmakuInfo.port}/`;

            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('斗鱼弹幕服务器连接成功');
                this.isConnected = true;
                // 发送登录和入组消息
                const loginReq = `type@=loginreq/roomid@=${roomId}/`;
                const joinGroupReq = `type@=joingroup/rid@=${roomId}/gid@=-9999/`;
                this.sendDouyuMessage(loginReq);
                this.sendDouyuMessage(joinGroupReq);
                this.startDouyuHeartbeat();
            };

            this.ws.onmessage = (event) => {
                this.handleDouyuMessage(event.data);
            };

            this.ws.onerror = (error) => {
                console.error('斗鱼弹幕连接错误:', error);
            };

            this.ws.onclose = () => {
                console.log('斗鱼弹幕连接已断开');
                this.isConnected = false;
                this.stopHeartbeat();
                this.reconnectTimer = setTimeout(() => {
                    this.connect(this.platform, this.roomId);
                }, 3000);
            };

        } catch (error) {
            console.error('连接斗鱼弹幕服务器失败:', error);
        }
    }

    /**
     * 连接 虎牙弹幕服务器
     */
    async connectHuya(roomId) {
        try {
            if (typeof HuyaDanmaku === 'undefined') {
                console.error('HuyaDanmaku library is not loaded.');
                return;
            }

            // 获取弹幕服务器信息
            const response = await fetch(`/api/huya/danmaku?room_id=${roomId}`);
            const danmakuInfo = await response.json();

            if (danmakuInfo.error) {
                throw new Error(danmakuInfo.error);
            }

            this.huyaDanmaku = new HuyaDanmaku({
                lChannelId: danmakuInfo.lChannelId,
                lSubChannelId: danmakuInfo.lSubChannelId,
            });

            this.huyaDanmaku.on('message', (msg) => {
                if (msg.sContent) {
                    const danmaku = {
                        text: msg.sContent,
                        user: msg.sNickName,
                        uid: msg.lSenderUid,
                        isAdmin: false, // 虎牙弹幕信息中不易直接判断
                        isVip: false,
                    };
                    this.addDanmaku(danmaku);
                }
            });

            this.huyaDanmaku.on('connect', () => {
                console.log('虎牙弹幕服务器连接成功');
                this.isConnected = true;
            });

            this.huyaDanmaku.on('close', () => {
                console.log('虎牙弹幕连接已断开');
                this.isConnected = false;
                this.reconnectTimer = setTimeout(() => {
                    this.connect(this.platform, this.roomId);
                }, 3000);
            });

            this.huyaDanmaku.on('error', (error) => {
                console.error('虎牙弹幕连接错误:', error);
            });

            this.huyaDanmaku.connect();

        } catch (error) {
            console.error('连接虎牙弹幕服务器失败:', error);
        }
    }

    /**
     * 连接 抖音弹幕服务器
     */
    async connectDouyin(roomId) {
        try {
            // 获取连接凭证
            const response = await fetch(`/api/douyin/danmaku?room_id=${roomId}`);
            const result = await response.json();

            if (result.code !== 0) {
                throw new Error(result.message || '获取抖音弹幕信息失败');
            }

            const data = result.data;
            const wsUrl = `${data.wsUrl}?${new URLSearchParams(data.params)}`;
            
            // 加载 protobuf 定义
            if (!this.douyinProtoRoot) {
                this.douyinProtoRoot = await protobuf.load('/assets/douyin.proto');
            }
            const PushFrame = this.douyinProtoRoot.lookupType("PushFrame");
            const Response = this.douyinProtoRoot.lookupType("Response");
            const ChatMessage = this.douyinProtoRoot.lookupType("ChatMessage");
            const GiftMessage = this.douyinProtoRoot.lookupType("GiftMessage");
            const LikeMessage = this.douyinProtoRoot.lookupType("LikeMessage");
            const MemberMessage = this.douyinProtoRoot.lookupType("MemberMessage");

            this.ws = new WebSocket(wsUrl);
            this.ws.binaryType = 'arraybuffer';

            this.ws.onopen = () => {
                console.log('抖音弹幕服务器连接成功');
                this.isConnected = true;
                this.startDouyinHeartbeat();
            };

            this.ws.onmessage = async (event) => {
                try {
                    const pushFrame = PushFrame.decode(new Uint8Array(event.data));
                    if (pushFrame.payload) {
                        const decompressed = pako.ungzip(pushFrame.payload);
                        const response = Response.decode(decompressed);

                        if (response.needAck) {
                            const ackPayload = PushFrame.encode({
                                payloadType: 'ack',
                                logId: pushFrame.logId,
                                payload: response.internalExt,
                            }).finish();
                            this.ws.send(ackPayload);
                        }

                        for (const message of response.messagesList) {
                            switch (message.method) {
                                case 'WebcastChatMessage':
                                    const chatMessage = ChatMessage.decode(message.payload);
                                    this.addDanmaku({
                                        text: chatMessage.content,
                                        user: chatMessage.user.nickName,
                                        uid: chatMessage.user.id,
                                    });
                                    break;
                                case 'WebcastGiftMessage':
                                    const giftMessage = GiftMessage.decode(message.payload);
                                    this.showGift({
                                        uname: giftMessage.user.nickName,
                                        giftName: giftMessage.gift.name,
                                        num: giftMessage.comboCount || 1,
                                    });
                                    break;
                                case 'WebcastLikeMessage':
                                    const likeMessage = LikeMessage.decode(message.payload);
                                    // 点赞消息太频繁，可以选择性显示或忽略
                                    // console.log(`${likeMessage.user.nickName} 点赞了 ${likeMessage.count} 次`);
                                    break;
                                case 'WebcastMemberMessage':
                                     const memberMessage = MemberMessage.decode(message.payload);
                                     this.showWelcome({
                                         uname: memberMessage.user.nickName
                                     });
                                    break;
                            }
                        }
                    }
                } catch (err) {
                    console.error('处理抖音弹幕消息失败:', err);
                }
            };

            this.ws.onerror = (error) => {
                console.error('抖音弹幕连接错误:', error);
            };

            this.ws.onclose = () => {
                console.log('抖音弹幕连接已断开');
                this.isConnected = false;
                this.stopHeartbeat();
                this.reconnectTimer = setTimeout(() => {
                    this.connect(this.platform, this.roomId);
                }, 5000);
            };

        } catch (error) {
            console.error('连接抖音弹幕服务器失败:', error);
        }
    }

    /**
     * 开始抖音心跳
     */
    startDouyinHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                const pingPayload = new Uint8Array([0x3A, 0x02, 0x68, 0x62]); // :hb
                this.ws.send(pingPayload);
            }
        }, 10000); // 10秒一次心跳
    }

    /**
     * 发送斗鱼消息
     */
    sendDouyuMessage(content) {
        // 斗鱼协议：消息长度(4) + 消息长度(4) + 消息类型(2) + 加密字段(1) + 保留字段(1) + 消息内容 + '\0'
        const encoder = new TextEncoder();
        const data = encoder.encode(content + '\0');
        const len = data.byteLength + 8;
        const buffer = new ArrayBuffer(len + 4);
        const view = new DataView(buffer);

        view.setUint32(0, len, true); // 消息长度
        view.setUint32(4, len, true); // 消息长度
        view.setUint16(8, 689, true); // 消息类型, 689: C->S
        view.setUint8(10, 0); // 加密字段
        view.setUint8(11, 0); // 保留字段

        const dataView = new Uint8Array(buffer);
        dataView.set(data, 12);

        this.ws.send(buffer);
    }
    
    /**
     * 开始斗鱼心跳
     */
    startDouyuHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                const heartbeatMsg = `type@=mrkl/`;
                this.sendDouyuMessage(heartbeatMsg);
            }
        }, 45000); // 45秒一次心跳
    }

    /**
     * 处理斗鱼弹幕消息
     */
    handleDouyuMessage(data) {
        const reader = new FileReader();
        reader.onload = () => {
            const text = reader.result;
            const messages = text.split('\0').filter(msg => msg.length > 0);
            messages.forEach(msg => {
                const msgData = this.parseDouyuMessage(msg);
                if (msgData.type === 'chatmsg') {
                    const danmaku = {
                        text: msgData.txt,
                        user: msgData.nn,
                        uid: msgData.uid,
                        isAdmin: (msgData.level || 0) > 50, // 简单示例
                        isVip: (msgData.nl || 0) > 0,
                    };
                    this.addDanmaku(danmaku);
                } else if (msgData.type === 'dgb') {
                    const giftData = {
                        uname: msgData.nn,
                        giftName: msgData.gfid, // 实际需要映射礼物ID到名称
                        num: msgData.gfcnt || 1
                    };
                    this.showGift(giftData);
                } else if (msgData.type === 'uenter') {
                     const userData = {
                        uname: msgData.nn
                    };
                    this.showWelcome(userData);
                }
            });
        };
        reader.readAsText(new Blob([data]));
    }

    /**
     * 解析斗鱼STT消息
     */
    parseDouyuMessage(msg) {
        const data = {};
        const parts = msg.split('/');
        parts.forEach(part => {
            if (part.includes('@=')) {
                const [key, value] = part.split('@=');
                data[key.replace(/@S/g, '/').replace(/@A/g, '@')] = value.replace(/@S/g, '/').replace(/@A/g, '@');
            }
        });
        return data;
    }
    
    /**
     * 发送B站加入房间包
     */
    sendJoinRoom(roomId) {
        const data = {
            roomid: parseInt(roomId),
            uid: 0,
            protover: 2
        };
        
        const payload = JSON.stringify(data);
        const encoder = new TextEncoder();
        const payloadBytes = encoder.encode(payload);
        
        // 构造数据包头部
        const headerLen = 16;
        const packet = new ArrayBuffer(headerLen + payloadBytes.length);
        const view = new DataView(packet);
        
        // 包长度
        view.setUint32(0, headerLen + payloadBytes.length);
        // 头部长度
        view.setUint16(4, headerLen);
        // 协议版本
        view.setUint16(6, 1);
        // 操作码（进房）
        view.setUint32(8, 7);
        // sequence
        view.setUint32(12, 1);
        
        // 写入payload
        const dataView = new Uint8Array(packet);
        dataView.set(payloadBytes, headerLen);
        
        this.ws.send(packet);
    }
    
    /**
     * 开始B站心跳
     */
    startBilibiliHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                const packet = new ArrayBuffer(16);
                const view = new DataView(packet);
                view.setUint32(0, 16); // 包长度
                view.setUint16(4, 16); // 头部长度
                view.setUint16(6, 1);  // 协议版本
                view.setUint32(8, 2);  // 操作码（心跳）
                view.setUint32(12, 1); // sequence
                this.ws.send(packet);
            }
        }, 30000); // 30秒一次心跳
    }
    
    /**
     * 停止心跳
     */
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }
    
    /**
     * 处理 B站弹幕消息
     */
    handleBilibiliMessage(data) {
        const view = new DataView(data);
        let offset = 0;
        
        while (offset < data.byteLength) {
            const packetLen = view.getUint32(offset);
            const headerLen = view.getUint16(offset + 4);
            const protocolVer = view.getUint16(offset + 6);
            const operation = view.getUint32(offset + 8);
            
            const payloadLen = packetLen - headerLen;
            
            if (operation === 5) { // 弹幕消息
                try {
                    let payload;
                    
                    if (protocolVer === 2) {
                        // zlib 压缩
                        const compressedData = new Uint8Array(data, offset + headerLen, payloadLen);
                        // 浏览器环境需要使用 pako 库解压
                        // 这里简化处理，实际项目中需要引入 pako.js
                        console.log('收到压缩弹幕包，需要 pako 库解压');
                    } else {
                        // 未压缩
                        const payloadData = new Uint8Array(data, offset + headerLen, payloadLen);
                        const decoder = new TextDecoder();
                        const text = decoder.decode(payloadData);
                        payload = JSON.parse(text);
                        
                        this.handleCommand(payload);
                    }
                } catch (error) {
                    console.error('解析弹幕数据失败:', error);
                }
            } else if (operation === 3) {
                // 人气值
                const popularity = view.getUint32(offset + headerLen);
                this.updatePopularity(popularity);
            }
            
            offset += packetLen;
        }
    }
    
    /**
     * 处理弹幕命令
     */
    handleCommand(payload) {
        const cmd = payload.cmd;
        
        switch (cmd) {
            case 'DANMU_MSG':
                // 普通弹幕
                const info = payload.info;
                const danmaku = {
                    text: info[1],
                    user: info[2][1],
                    uid: info[2][0],
                    isAdmin: info[2][2] === 1,
                    isVip: info[2][3] === 1,
                    timestamp: info[0][4]
                };
                this.addDanmaku(danmaku);
                break;
                
            case 'SEND_GIFT':
                // 礼物消息
                const giftData = payload.data;
                this.showGift(giftData);
                break;
                
            case 'WELCOME':
                // 欢迎消息
                const userData = payload.data;
                this.showWelcome(userData);
                break;
                
            case 'LIVE':
                // 开播
                this.showNotification('直播开始了！');
                break;
                
            case 'PREPARING':
                // 下播
                this.showNotification('主播下播了');
                break;
        }
    }
    
    /**
     * 添加弹幕到显示队列
     */
    addDanmaku(danmaku) {
        if (!this.settings.enabled) return;
        
        // 限制弹幕数量
        if (this.danmakuList.length >= this.maxDanmaku) {
            const oldest = this.danmakuList.shift();
            if (oldest.element && oldest.element.parentNode) {
                oldest.element.remove();
            }
        }
        
        // 创建弹幕元素
        const element = this.createDanmakuElement(danmaku);
        this.danmakuContainer.appendChild(element);
        
        // 添加到列表
        danmaku.element = element;
        this.danmakuList.push(danmaku);
        
        // 开始动画
        this.animateDanmaku(element);
    }
    
    /**
     * 创建弹幕 DOM 元素
     */
    createDanmakuElement(danmaku) {
        const element = document.createElement('div');
        element.className = 'danmaku-item';
        element.textContent = danmaku.text;
        
        // 设置样式
        element.style.fontSize = `${this.settings.fontSize}px`;
        element.style.opacity = this.settings.opacity;
        
        // VIP 样式
        if (danmaku.isVip) {
            element.classList.add('vip');
        }
        
        // 管理员样式
        if (danmaku.isAdmin) {
            element.classList.add('admin');
        }
        
        // 随机轨道
        const containerHeight = this.danmakuContainer.offsetHeight * this.settings.displayArea;
        const trackHeight = this.settings.fontSize * 1.5;
        const trackCount = Math.floor(containerHeight / trackHeight);
        const track = Math.floor(Math.random() * trackCount);
        
        element.style.top = `${track * trackHeight}px`;
        element.style.right = '-100%';
        
        return element;
    }
    
    /**
     * 弹幕动画
     */
    animateDanmaku(element) {
        const containerWidth = this.danmakuContainer.offsetWidth;
        const elementWidth = element.offsetWidth;
        const distance = containerWidth + elementWidth;
        const duration = this.settings.speed * 1000;
        
        element.style.transition = `right ${duration}ms linear`;
        
        // 使用 requestAnimationFrame 确保动画流畅
        requestAnimationFrame(() => {
            element.style.right = `${containerWidth}px`;
        });
        
        // 动画结束后移除元素
        setTimeout(() => {
            if (element.parentNode) {
                element.remove();
            }
            const index = this.danmakuList.findIndex(d => d.element === element);
            if (index !== -1) {
                this.danmakuList.splice(index, 1);
            }
        }, duration);
    }
    
    /**
     * 显示礼物消息
     */
    showGift(giftData) {
        const message = `${giftData.uname} 送出了 ${giftData.giftName} x${giftData.num}`;
        this.showSystemMessage(message, 'gift');
    }
    
    /**
     * 显示欢迎消息
     */
    showWelcome(userData) {
        const message = `欢迎 ${userData.uname} 进入直播间`;
        this.showSystemMessage(message, 'welcome');
    }
    
    /**
     * 显示系统消息
     */
    showSystemMessage(text, type = 'system') {
        const element = document.createElement('div');
        element.className = `danmaku-system ${type}`;
        element.textContent = text;
        
        this.danmakuContainer.appendChild(element);
        
        // 3秒后淡出
        setTimeout(() => {
            element.style.opacity = '0';
            setTimeout(() => element.remove(), 300);
        }, 3000);
    }
    
    /**
     * 显示通知
     */
    showNotification(text) {
        this.showSystemMessage(text, 'notification');
    }
    
    /**
     * 更新人气值
     */
    updatePopularity(count) {
        // 触发自定义事件
        const event = new CustomEvent('popularity', { detail: count });
        this.container.dispatchEvent(event);
    }
    
    /**
     * 更新设置
     */
    updateSettings(settings) {
        Object.assign(this.settings, settings);
    }
    
    /**
     * 切换弹幕显示
     */
    toggleDanmaku(enabled) {
        this.settings.enabled = enabled;
        if (!enabled) {
            this.clearDanmaku();
        }
    }
    
    /**
     * 清空弹幕
     */
    clearDanmaku() {
        this.danmakuList.forEach(danmaku => {
            if (danmaku.element && danmaku.element.parentNode) {
                danmaku.element.remove();
            }
        });
        this.danmakuList = [];
    }
    
    /**
     * 断开连接
     */
    disconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        
        this.stopHeartbeat();
        
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        if (this.huyaDanmaku) {
            this.huyaDanmaku.destroy();
            this.huyaDanmaku = null;
        }
        
        this.isConnected = false;
        this.clearDanmaku();
    }
}

// 导出
window.DanmakuManager = DanmakuManager;