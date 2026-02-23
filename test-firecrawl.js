
const FIRECRAWL_API_KEY = 'fc-ae57322be6ae4ff9af1820f78914ad2e';

async function testScrape() {
    const domain = 'scrapeless.com';
    const similarWebUrl = `https://www.similarweb.com/website/${domain}`;
    
    console.log(`Scraping ${similarWebUrl} with Firecrawl...`);

    try {
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
            },
            body: JSON.stringify({
                url: similarWebUrl,
                formats: ['markdown'],
                onlyMainContent: true
            })
        });

        const data = await response.json();
        console.log('Success:', data.success);
        
        if (data.success && data.data) {
            console.log('Markdown Preview (first 1000 chars):', data.data.markdown.substring(0, 1000));
            
            const markdown = data.data.markdown;
            const totalVisitsMatch = markdown.match(/Total Visits\s*([\d.KMB]+)/i);
            const bounceRateMatch = markdown.match(/Bounce Rate\s*([\d.]+%)/i);
            const pagesPerVisitMatch = markdown.match(/Pages per Visit\s*([\d.]+)/i);
            const avgDurationMatch = markdown.match(/Avg Visit Duration\s*([\d:]+)/i);
            
            console.log('Extracted Data:');
            console.log('Total Visits:', totalVisitsMatch ? totalVisitsMatch[1] : 'N/A');
            console.log('Bounce Rate:', bounceRateMatch ? bounceRateMatch[1] : 'N/A');
            console.log('Pages/Visit:', pagesPerVisitMatch ? pagesPerVisitMatch[1] : 'N/A');
            console.log('Avg Duration:', avgDurationMatch ? avgDurationMatch[1] : 'N/A');
        } else {
            console.log('No valid data returned or success=false');
            console.log('Full Response:', JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error('Fetch Error:', error);
    }
}

testScrape();
