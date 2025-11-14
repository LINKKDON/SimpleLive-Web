// Cloudflare Workers 函数 - 获取B站直播间信息
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const roomId = url.searchParams.get('id');

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
    // 请求 B站 API
    const response = await fetch(
      `https://api.bilibili.com/xlive/web-room/v1/index/getInfoByRoom?room_id=${roomId}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://live.bilibili.com/',
        },
      }
    );

    const data = await response.json();

    // 返回数据
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=10',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}