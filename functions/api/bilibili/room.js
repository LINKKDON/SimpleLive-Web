// Cloudflare Workers 函数 - 获取B站直播间信息
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const roomId = url.searchParams.get('room_id');

  // 处理 CORS 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (!roomId) {
    return new Response(JSON.stringify({ error: '缺少房间ID参数' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const response = await fetch(
      `https://api.live.bilibili.com/room/v1/Room/get_info?room_id=${roomId}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36',
          'Referer': 'https://live.bilibili.com/',
        },
      }
    );

    const data = await response.json();

    if (data.code !== 0) {
      throw new Error(data.message || '获取房间信息失败');
    }

    const roomInfo = data.data;
    
    const userResponse = await fetch(
      `https://api.live.bilibili.com/live_user/v1/Master/info?uid=${roomInfo.uid}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36',
          'Referer': 'https://live.bilibili.com/',
        },
      }
    );
    const userData = await userResponse.json();
    const userInfo = userData.data?.info || {};

    const result = {
      code: 0,
      data: {
        title: roomInfo.title,
        userName: userInfo.uname || '主播',
        userAvatar: userInfo.face || '',
        online: roomInfo.online,
        introduction: roomInfo.description || '',
        status: roomInfo.live_status === 1,
        platform: 'bilibili'
      }
    };

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=10',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ code: -1, error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}