// functions/api/douyin/danmaku.js
export async function onRequest(context) {
    const {
        request, // same as existing Worker API
        env, // same as existing Worker API
        params, // if you have params
        waitUntil, // same as ctx.waitUntil in existing Worker API
        next, // same as existing Worker API
        data, // arbitrary space for passing data between middlewares
    } = context;

    try {
        const url = new URL(request.url);
        const roomId = url.searchParams.get('room_id');

        if (!roomId) {
            return new Response(JSON.stringify({
                code: 400,
                message: 'Missing room_id parameter'
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            });
        }

        // 抖音的弹幕需要从页面中获取 msToken 和 ttwid
        const liveUrl = `https://live.douyin.com/${roomId}`;
        const livePageResponse = await fetch(liveUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
                'Connection': 'keep-alive',
            },
        });

        if (!livePageResponse.ok) {
            throw new Error(`Failed to fetch Douyin live page, status: ${livePageResponse.status}`);
        }

        const text = await livePageResponse.text();
        
        // 从页面中提取 __RENDER_DATA__
        const match = text.match(/<script id="RENDER_DATA" type="application\/json">([\s\S]*?)<\/script>/);
        if (!match || !match[1]) {
            throw new Error('Could not find __RENDER_DATA__ in the page');
        }
        
        const renderData = JSON.parse(decodeURIComponent(match[1]));
        const roomStore = renderData.app.initialState.roomStore;
        const roomInfo = roomStore.roomInfo;
        const roomIdStr = roomInfo.roomId;
        const userUniqueId = roomInfo.owner.web_rid;

        // 从响应头中获取 ttwid
        const cookies = livePageResponse.headers.get('set-cookie') || '';
        const ttwidMatch = cookies.match(/ttwid=([^;]+)/);
        const ttwid = ttwidMatch ? ttwidMatch[1] : '';

        // 从页面中获取 msToken
        const msTokenMatch = text.match(/"msToken":"(.*?)"/);
        const msToken = msTokenMatch ? msTokenMatch[1] : '';

        if (!msToken) {
            throw new Error('Could not find msToken in the page');
        }

        // 构建WebSocket URL和参数
        const wsUrl = 'wss://webcast5-ws-web-lq.douyin.com/webcast/im/push/v2/';
        const params = {
            app_name: 'douyin_web',
            version_code: '180800',
            webcast_sdk_version: '1.0.14-beta.0',
            update_version_code: '1.0.14-beta.0',
            compress: 'gzip',
            device_platform: 'web',
            cookie_enabled: 'true',
            screen_width: '1920',
            screen_height: '1080',
            browser_language: 'zh-CN',
            browser_platform: 'Win32',
            browser_name: 'Mozilla',
            browser_version: '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            browser_online: 'true',
            tz_name: 'Asia/Shanghai',
            cursor: 't-0_r-1_d-1_u-1',
            internal_ext: `internal_src:dim|wss_push_room_id:${roomIdStr}|wss_push_did:${userUniqueId}|first_req_ms:${Date.now()}|fetch_time:${Date.now()}|seq:1|wss_info:0-${Date.now()}-0-0|wrds_v:7598137`,
            host: 'https://live.douyin.com',
            aid: '6383',
            live_id: '1',
            did_rule: '3',
            endpoint: 'live_pc',
            support_wrds: '1',
            user_unique_id: userUniqueId,
            im_path: '/webcast/im/fetch/',
            identity: 'audience',
            need_persist_msg_count: '15',
            insert_task_id: '',
            live_reason: '',
            room_id: roomIdStr,
            heartbeatDuration: '0',
        };

        return new Response(JSON.stringify({
            code: 0,
            message: 'Success',
            data: {
                wsUrl: wsUrl,
                params: params,
                ttwid: ttwid,
                roomId: roomIdStr,
                userUniqueId: userUniqueId,
            },
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });

    } catch (error) {
        return new Response(JSON.stringify({
            code: 500,
            message: error.message,
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    }
}