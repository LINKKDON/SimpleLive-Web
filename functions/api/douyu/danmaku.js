// functions/api/douyu/danmaku.js
// 获取斗鱼弹幕服务器信息
export async function onRequest(context) {
    const {
        request, // same as existing Worker API
        env, // same as existing Worker API
        params, // if filename includes [id] or [[path]]
        waitUntil, // same as ctx.waitUntil in existing Worker API
        next, // used for middleware
        data, // arbitrary space for passing data between middlewares
    } = context;

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
                'Access-Control-Allow-Origin': '*'
            }
        });
    }

    try {
        // 斗鱼的弹幕信息在房间页面的JS中
        const response = await fetch(`https://www.douyu.com/${roomId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
            }
        });
        const html = await response.text();

        // 使用正则表达式从JS中提取弹幕服务器信息
        const match = html.match(/var\s+\$ROOM\s+=\s+({[\s\S]*?});/);
        if (!match || !match[1]) {
            throw new Error('Could not find room data in Douyu page');
        }
        const roomData = JSON.parse(match[1]);
        
        // 斗鱼的弹幕服务器是固定的，但需要房间ID进行分组
        const danmakuInfo = {
            host: 'danmuproxy.douyu.com',
            port: 8506,
            roomId: roomData.room_id
        };

        return new Response(JSON.stringify({
            code: 0,
            message: 'Success',
            data: danmakuInfo
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            code: 500,
            message: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}