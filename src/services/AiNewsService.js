
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
 * Fetch WaytoAGI news updates (7 days)
 */
export const fetchWaytoagiNews = async () => {
  try {
    const response = await fetch('/data/waytoagi-7d.json');
    if (!response.ok) {
      // It's possible this file doesn't exist yet if the crawler hasn't run it
      console.warn('WaytoAGI data not found, returning empty.');
      return { updates_7d: [], updates_today: [] };
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching WaytoAGI news:', error);
    return { updates_7d: [], updates_today: [] };
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
 * Save the entire daily report as a single Markdown file
 */
export const saveDailyReport = async (newsData, waytoagiData) => {
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${dateStr}_Daily_Brief.md`;

  let content = `# AI News Radar - Daily Brief (${dateStr})\n\n`;
  
  // Stats
  content += `## Overview\n`;
  content += `- **Total Items:** ${newsData.total_items || 0}\n`;
  content += `- **AI Items:** ${newsData.items_ai?.length || 0}\n`;
  content += `- **Generated:** ${new Date().toLocaleString()}\n\n`;

  // WaytoAGI
  if (waytoagiData?.updates_today?.length > 0) {
    content += `## WaytoAGI Updates\n`;
    waytoagiData.updates_today.forEach(u => {
      content += `- [${u.title}](${u.url}) (${u.date})\n`;
    });
    content += `\n`;
  }

  // News Items (AI Focus)
  const aiItems = newsData.items_ai || newsData.items || [];
  if (aiItems.length > 0) {
    content += `## Top AI News\n`;
    aiItems.forEach(item => {
      content += `### ${item.title_zh || item.title}\n`;
      content += `- **Source:** ${item.site_name} / ${item.source || 'General'}\n`;
      content += `- **Link:** ${item.url}\n`;
      content += `- **Time:** ${new Date(item.published_at).toLocaleTimeString()}\n\n`;
    });
  }

  await putFile(
    `${NEWS_HISTORY_DIR}/${filename}`, 
    content, 
    `Save Daily Brief: ${dateStr}`
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
