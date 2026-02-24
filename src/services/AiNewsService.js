
import { getFileContent, putFile, getRepoContent, deleteFile } from '../GitHubService';

const NEWS_HISTORY_DIR = 'AI-News-History';

// Helper to get Beijing Date String (YYYY-MM-DD)
const getBeijingDateStr = () => {
    // Create a date object from current time
    const d = new Date();
    // Convert to Beijing time string
    return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
};

/**
 * Fetch the latest AI news from the local JSON data
 */
export const fetchLatestNews = async () => {
  try {
    // Add timestamp to prevent caching
    const response = await fetch(`/data/latest-24h.json?t=${Date.now()}`);
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
    const response = await fetch(`/data/waytoagi-7d.json?t=${Date.now()}`);
    if (!response.ok) {
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
  const dateStr = getBeijingDateStr();
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
  const dateStr = getBeijingDateStr();
  const filename = `${dateStr}_Daily_Brief.md`;

  // --- Header ---
  let content = `# 📡 AI News Radar - Daily Brief\n\n`;
  content += `> **Date:** ${dateStr}  \n`;
  content += `> **Generated:** ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n\n`;
  
  // --- Stats Section ---
  content += `## 📊 Overview\n\n`;
  content += `| Metric | Count |\n`;
  content += `| :--- | :---: |\n`;
  content += `| **Total Items** | ${newsData.total_items || 0} |\n`;
  content += `| **AI Focused** | ${newsData.items_ai?.length || 0} |\n`;
  content += `\n---\n\n`;

  // --- WaytoAGI Section ---
  if (waytoagiData?.updates_today?.length > 0) {
    content += `## 🚀 WaytoAGI Updates\n\n`;
    waytoagiData.updates_today.forEach(u => {
      content += `- 🔗 [${u.title}](${u.url}) <span style="color:gray;font-size:0.8em">(${u.date})</span>\n`;
    });
    content += `\n`;
  }

  // --- News Items (AI Focus) ---
  const aiItems = newsData.items_ai || newsData.items || [];
  
  if (aiItems.length > 0) {
    content += `## 🤖 Top AI News\n\n`;
    
    // Group by Site Name to organize the report better
    const grouped = {};
    aiItems.forEach(item => {
        const site = item.site_name || 'Other';
        if (!grouped[site]) grouped[site] = [];
        grouped[site].push(item);
    });

    // Iterate through groups
    for (const [site, items] of Object.entries(grouped)) {
        content += `### 🏷️ ${site}\n\n`;
        
        items.forEach(item => {
            const timeStr = item.published_at 
                ? new Date(item.published_at).toLocaleTimeString('zh-CN', {timeZone: 'Asia/Shanghai', hour: '2-digit', minute:'2-digit'}) 
                : '';
            
            content += `#### ${item.title_zh || item.title}\n`;
            content += `**Time:** ${timeStr} | **Source:** ${item.source || 'General'}\n\n`;
            
            if (item.content || item.description) {
                const summary = (item.content || item.description).slice(0, 200) + '...';
                content += `> ${summary.replace(/\n/g, ' ')}\n\n`;
            }
            
            content += `🔗 [Read Original](${item.url})\n\n`;
            content += `---\n\n`; // Separator
        });
    }
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
 * Generate Markdown content for a single news item
 */
const generateNewsMarkdown = (item) => {
  const timeStr = item.published_at 
      ? new Date(item.published_at).toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'}) 
      : 'Unknown';

  return `# 📰 ${item.title_zh || item.title}

> **Original Title:** ${item.title}  
> **Source:** ${item.site_name} (${item.source || 'General'})  
> **Date:** ${timeStr}  
> **Topic:** ${item.topic || 'AI/Tech'}

## 📝 Summary

${item.content || item.description || 'No summary available.'}

---

### 🔗 Links
- [Read Original Article](${item.url})

---
*Generated by AI News Radar*
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

/**
 * Delete a news history file
 */
export const deleteNewsHistory = async (path) => {
    // We need to get the SHA first to delete via GitHub API
    try {
        const file = await getFileContent(path);
        if (!file || !file.sha) {
            throw new Error('File not found or SHA missing');
        }
        await deleteFile(path, file.sha, `Delete brief: ${path}`);
        return true;
    } catch (e) {
        console.error('Failed to delete brief:', e);
        throw e;
    }
};

/**
 * Get content of a brief
 */
export const getBriefContent = async (path) => {
    const file = await getFileContent(path);
    if (file && file.content) {
        // GitHub API returns base64
        try {
            // Fix for unicode characters
            return decodeURIComponent(escape(atob(file.content.replace(/\n/g, ''))));
        } catch (e) {
            return atob(file.content); // Fallback for simple ascii
        }
    }
    return "";
};

/**
 * Update brief content
 */
export const updateBriefContent = async (path, content) => {
    return await putFile(path, content, `Update brief content: ${path}`);
};
