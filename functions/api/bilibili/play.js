// Cloudflare Workers 函数 - 获取B站播放地址
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const roomId = url.searchParams.get('room_id');
  const quality = url.searchParams.get('quality') || '10000';

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
    // 获取播放信息
    const response = await fetch(
      `https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo?room_id=${roomId}&protocol=0,1&format=0,2&codec=0&qn=${quality}&platform=web&ptype=8`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://live.bilibili.com/',
        },
      }
    );

    const data = await response.json();

    if (data.code !== 0) {
      throw new Error(data.message || '获取播放地址失败');
    }

    const urls = [];
    const streamList = data.data.playurl_info.playurl.stream;

    streamList.forEach((stream) => {
      stream.format.forEach((format) => {
        format.codec.forEach((codec) => {
          const baseUrl = codec.base_url;
          codec.url_info.forEach((urlInfo) => {
            urls.push(`${urlInfo.host}${baseUrl}${urlInfo.extra}`);
          });
        });
      });
    });

    urls.sort((a, b) => (a.includes('mcdn') ? 1 : -1));

    // 根据第一个 URL 判断类型
    const firstUrl = urls[0] || '';
    const type = firstUrl.includes('.m3u8') ? 'hls' : 'flv';

    return new Response(
      JSON.stringify({
        code: 0,
        urls,
        type,
        headers: {
          Referer: 'https://live.bilibili.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=30',
        },
      }
    );
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