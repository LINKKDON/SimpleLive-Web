// functions/api/douyu/play.js
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
    const response = await fetch(`https://m.douyu.com/html5/live?roomId=${roomId}`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
            'Referer': `https://m.douyu.com/`,
        }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Douyu mobile API: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error !== 0) {
        throw new Error(data.msg || 'Failed to get stream URL from Douyu');
    }

    const streamUrl = data.data.hls_url;

    if (!streamUrl) {
        throw new Error('Stream URL not found in Douyu API response.');
    }

    const result = {
      urls: [streamUrl],
      type: 'hls',
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