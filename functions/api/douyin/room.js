// functions/api/douyin/room.js
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
    if (!room) {
        throw new Error('Could not find room info.');
    }

    const result = {
        code: 0,
        data: {
            title: room.title || '未知标题',
            userName: room.owner?.nickname || '未知主播',
            userAvatar: room.owner?.avatar_thumb?.url_list?.[0] || '',
            online: room.user_count || 0,
            introduction: room.owner?.signature || '',
            status: room.status === 2,
            platform: 'douyin'
        }
    };

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ code: -1, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}