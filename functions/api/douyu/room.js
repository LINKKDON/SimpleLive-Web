// functions/api/douyu/room.js
export async function onRequest(context) {
  // 从 URL 获取房间 ID
  const { searchParams } = new URL(context.request.url);
  const roomId = searchParams.get('room_id');

  if (!roomId) {
    return new Response(JSON.stringify({ error: 'Missing room_id parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 构造请求 URL
    const url = `https://www.douyu.com/betard/${roomId}`;
    
    // 发起请求
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch room info: ${response.statusText}`);
    }

    const data = await response.json();

    // 返回处理后的数据
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}