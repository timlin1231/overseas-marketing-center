
const FIRECRAWL_API_KEY = 'fc-ae57322be6ae4ff9af1820f78914ad2e';

async function testScrape() {
    const domain = 'scrapeless.com';
    const targetUrl = `https://traffic.cv/${domain}`;
    
    console.log(`Scraping ${targetUrl} with Firecrawl...`);

    try {
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
            },
            body: JSON.stringify({
                url: targetUrl,
                formats: ['markdown'],
                onlyMainContent: true
            })
        });

        const data = await response.json();
        console.log('Success:', data.success);
        
        if (data.success && data.data) {
            console.log('Markdown Preview (first 2000 chars):', data.data.markdown.substring(0, 2000));
        } else {
            console.log('No valid data returned or success=false');
            console.log('Full Response:', JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error('Fetch Error:', error);
    }
}

testScrape();
