
export default async function handler(request, response) {
  // 处理 CORS
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  const { url, formats = ['markdown', 'html'] } = request.body;

  if (!url) {
    return response.status(400).json({ success: false, error: 'URL is required' });
  }

  const apiKey = process.env.VITE_FIRECRAWL_API_KEY || process.env.FIRECRAWL_API_KEY;

  if (!apiKey) {
    return response.status(500).json({ success: false, error: 'Firecrawl API Key not configured on server' });
  }

  try {
    const firecrawlRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        url,
        formats,
        onlyMainContent: false
      })
    });

    if (!firecrawlRes.ok) {
        const errorText = await firecrawlRes.text();
        return response.status(firecrawlRes.status).json({ success: false, error: `Firecrawl API Error: ${errorText}` });
    }

    const data = await firecrawlRes.json();
    return response.status(200).json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    return response.status(500).json({ success: false, error: error.message });
  }
}
