// functions/api/huya/danmaku.js
export async function onRequest(context) {
    const {
        request,
        env,
        params,
        waitUntil,
        next,
        data,
    } = context;

    const url = new URL(request.url);
    const roomId = url.searchParams.get('room_id');

    if (!roomId) {
        return new Response(JSON.stringify({ error: 'Missing room_id parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        // 使用移动端页面，更容易获取信息
        const response = await fetch(`https://m.huya.com/${roomId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch Huya room page: ${response.status}`);
        }
        const text = await response.text();

        // 正则表达式匹配直播间信息
        const match = text.match(/var\s+TT_ROOM_DATA\s*=\s*({.+?});/);
        if (!match || !match[1]) {
            throw new Error('Could not find room data in Huya page.');
        }

        const roomData = JSON.parse(match[1]);
        
        const lChannelId = roomData.lChannelId;
        const lSubChannelId = roomData.lSubChannelId;

        if (!lChannelId || !lSubChannelId) {
            throw new Error('Required stream info not found in room data.');
        }

        const danmakuInfo = {
            lChannelId,
            lSubChannelId,
        };

        return new Response(JSON.stringify(danmakuInfo), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });

    } catch (error) {
        console.error('Error fetching Huya danmaku info:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    }
}