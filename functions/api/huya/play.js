// functions/api/huya/play.js
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
    const response = await fetch(`https://m.huya.com/${roomId}`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
            'Referer': `https://m.huya.com/`,
        }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Huya mobile page: ${response.statusText}`);
    }

    const html = await response.text();
    
    const liveInfoMatch = html.match(/var\s*TT_LIVE_INFO\s*=\s*({.+?});/);
     if (!liveInfoMatch || !liveInfoMatch[1]) {
        throw new Error('Could not find live data in Huya page.');
    }
    const liveData = JSON.parse(liveInfoMatch[1]);

    const streamInfo = liveData.stream.flv.multiLine;
    const url = streamInfo[0].url;

    const result = {
        code: 0,
        urls: [url],
        type: 'flv'
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