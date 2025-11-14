// functions/api/douyin/play.js
export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url);
  const roomId = searchParams.get('room_id');

  if (!roomId) {
    return new Response(JSON.stringify({ error: 'Missing room_id parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const response = await fetch(`https://live.douyin.com/${roomId}`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
            'Referer': `https://live.douyin.com/`,
        }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Douyin mobile page: ${response.statusText}`);
    }

    const html = await response.text();
    
    const roomInfoMatch = html.match(/<script id="RENDER_DATA" type="application\/json">(.+?)<\/script>/);
    if (!roomInfoMatch || !roomInfoMatch[1]) {
        throw new Error('Could not find room data in Douyin page.');
    }
    const roomData = JSON.parse(decodeURIComponent(roomInfoMatch[1]));
    
    const roomStore = roomData?.app?.initialState?.roomStore || roomData?.initialState?.roomStore;
    if (!roomStore) {
        throw new Error('Could not find roomStore in Douyin data.');
    }
    
    const room = roomStore.roomInfo?.room;
    if (!room || !room.stream_url) {
        throw new Error('Room is not live or stream URL not available.');
    }
    
    const streamUrl = room.stream_url?.flv_pull_url || room.stream_url?.hls_pull_url_map;
    if (!streamUrl) {
        throw new Error('Stream URL not found.');
    }
    
    let urls = [];
    let type = 'flv';
    
    if (room.stream_url.flv_pull_url) {
        const flvUrl = room.stream_url.flv_pull_url.FULL_HD1 || room.stream_url.flv_pull_url.HD1 || room.stream_url.flv_pull_url.SD1 || room.stream_url.flv_pull_url.SD2;
        if (flvUrl) {
            const urlData = typeof flvUrl === 'string' ? JSON.parse(flvUrl) : flvUrl;
            urls = Object.values(urlData);
        }
    }
    
    if (urls.length === 0 && room.stream_url.hls_pull_url_map) {
        const hlsUrl = room.stream_url.hls_pull_url_map.FULL_HD1 || room.stream_url.hls_pull_url_map.HD1 || room.stream_url.hls_pull_url_map.SD1;
        if (hlsUrl) {
            urls = [hlsUrl];
            type = 'hls';
        }
    }
    
    if (urls.length === 0) {
        throw new Error('No valid stream URL found.');
    }

    const result = {
        urls: urls,
        type: type
    };

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}