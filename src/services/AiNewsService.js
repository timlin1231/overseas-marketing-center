
import { getFileContent, putFile, getRepoContent } from '../GitHubService';

const NEWS_HISTORY_DIR = 'AI-News-History';

/**
 * Fetch the latest AI news from the local JSON data
 * In a real scenario, this might fetch from an API or the python server
 */
export const fetchLatestNews = async () => {
  try {
    const response = await fetch('/data/latest-24h.json');
    if (!response.ok) {
      throw new Error('Failed to fetch news data');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching AI news:', error);
    return { items: [] };
  }
};

/**
 * Save a specific news item or a daily summary to the Knowledge Base
 */
export const saveNewsToHistory = async (newsItem) => {
  const dateStr = new Date().toISOString().split('T')[0];
  // Sanitize title for filename
  const safeTitle = newsItem.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_').slice(0, 50);
  const filename = `${dateStr}_${safeTitle}.md`;
  
  const mdContent = generateNewsMarkdown(newsItem);
  
  await putFile(
    `${NEWS_HISTORY_DIR}/${filename}`, 
    mdContent, 
    `Save AI News: ${newsItem.title}`
  );
  
  return {
    name: filename,
    path: `${NEWS_HISTORY_DIR}/${filename}`,
    type: 'file',
    timestamp: new Date().toISOString()
  };
};

/**
 * Generate Markdown content for a news item
 */
const generateNewsMarkdown = (item) => {
  return `# ${item.title}

**Source:** [${item.site_name}](${item.url})
**Date:** ${new Date(item.published_at).toLocaleString()}
**Topic:** ${item.topic || 'AI/Tech'}

## Summary
${item.content || item.description || 'No summary available.'}

## Original Link
${item.url}

---
*Saved via AI News Radar*
`;
};

/**
 * Get the history of saved news items
 */
export const getNewsHistory = async () => {
  try {
    // Ensure directory exists
    try {
      await getRepoContent(NEWS_HISTORY_DIR);
    } catch (e) {
      // If it doesn't exist, we'll return empty list. 
      // The putFile method will create it when saving.
      return [];
    }

    const files = await getRepoContent(NEWS_HISTORY_DIR);
    if (!files) return [];

    // Filter for markdown files
    const historyFiles = files.filter(f => f.name.endsWith('.md'));
    
    // Sort by name (which starts with date) descending
    return historyFiles.sort((a, b) => b.name.localeCompare(a.name));
  } catch (error) {
    console.error('Failed to fetch news history:', error);
    return [];
  }
};
