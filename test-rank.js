
const markdown = `
Global Rank:279,194

Country Rank:55,384
`;

const globalRankMatch = markdown.match(/Global Rank\s*:?\s*([\d,]+)/i);
console.log('Global Rank:', globalRankMatch ? globalRankMatch[1] : 'N/A');
