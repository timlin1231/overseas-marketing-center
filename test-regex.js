
const markdown = `
Total Visits

167.06K+1.88%

Avg. Duration

00:00:27

Pages per Visit

1.76

Bounce Rate

42.61%
`;

const totalVisitsMatch = markdown.match(/Total Visits\s+([\d.KMB]+)/);
const avgDurationMatch = markdown.match(/Avg\. Duration\s+([\d:]+)/);
const pagesPerVisitMatch = markdown.match(/Pages per Visit\s+([\d.]+)/);
const bounceRateMatch = markdown.match(/Bounce Rate\s+([\d.]+%)/);

console.log('Total Visits:', totalVisitsMatch ? totalVisitsMatch[1] : 'N/A');
console.log('Avg Duration:', avgDurationMatch ? avgDurationMatch[1] : 'N/A');
console.log('Pages/Visit:', pagesPerVisitMatch ? pagesPerVisitMatch[1] : 'N/A');
console.log('Bounce Rate:', bounceRateMatch ? bounceRateMatch[1] : 'N/A');
