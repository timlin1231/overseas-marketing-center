const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
const REPO_OWNER = import.meta.env.VITE_REPO_OWNER;
const REPO_NAME = import.meta.env.VITE_REPO_NAME;
const BRANCH = 'main';

const headers = {
  'Authorization': `token ${GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github.v3+json',
  'Content-Type': 'application/json',
};

// 辅助函数：UTF-8 转 Base64 (支持中文)
const utf8_to_b64 = (str) => {
  return window.btoa(unescape(encodeURIComponent(str)));
};

// 辅助函数：Base64 转 UTF-8 (支持中文)
const b64_to_utf8 = (str) => {
  return decodeURIComponent(escape(window.atob(str)));
};

export const getRepoContent = async (path = '') => {
  if (!GITHUB_TOKEN || !REPO_OWNER || !REPO_NAME) {
    throw new Error('Missing configuration: GITHUB_TOKEN, REPO_OWNER, or REPO_NAME');
  }

  try {
    // 添加时间戳防止缓存
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}&t=${new Date().getTime()}`;
    const response = await fetch(url, {
      headers: { ...headers, 'Content-Type': undefined } // GET 请求不需要 Content-Type
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Repository or path not found: ${REPO_OWNER}/${REPO_NAME}/${path}`);
      }
      if (response.status === 401) {
        throw new Error('Authentication failed: Invalid GITHUB_TOKEN');
      }
      throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
        return [data];
    }
    
    return data.map(item => ({
      name: item.name,
      type: item.type === 'dir' ? 'folder' : 'file',
      path: item.path,
      sha: item.sha, // 关键：保存 SHA 以便后续更新/删除
      children: item.type === 'dir' ? [] : undefined,
      content: null
    })).filter(item => item.type === 'folder' || item.name.endsWith('.md'));
    
  } catch (error) {
    console.error('Fetch repo content failed:', error);
    throw error; // Re-throw to handle in UI
  }
};

export const getFileContent = async (path) => {
  try {
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}&t=${new Date().getTime()}`, {
      headers: { ...headers, 'Content-Type': undefined }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return {
      content: b64_to_utf8(data.content),
      sha: data.sha
    };
  } catch (error) {
    console.error('Fetch file content failed:', error);
    return null;
  }
};

// 创建或更新文件
export const putFile = async (path, content, message, sha = null) => {
  try {
    const body = {
      message: message,
      content: utf8_to_b64(content),
      branch: BRANCH
    };
    
    if (sha) {
      body.sha = sha;
    }

    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Update failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Put file failed:', error);
    throw error;
  }
};

// 删除文件
export const deleteFile = async (path, sha, message) => {
  try {
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({
        message: message,
        sha: sha,
        branch: BRANCH
      })
    });

    if (!response.ok) throw new Error('Delete failed');
    return true;
  } catch (error) {
    console.error('Delete file failed:', error);
    throw error;
  }
};

// 获取指定日期的笔记 (如果不存在则返回空)
export const getDailyNote = async (dateStr) => {
  // dateStr 格式: YYYY-MM-DD
  const path = `Daily/${dateStr}.md`;
  try {
    const file = await getFileContent(path);
    return file ? { ...file, date: dateStr } : null;
  } catch (error) {
    // 404 is expected for new days
    return null;
  }
};

// 批量获取最近 N 天的笔记
export const getRecentDailyNotes = async (days = 7) => {
  const notes = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    notes.push(getDailyNote(dateStr));
  }
  
  const results = await Promise.all(notes);
  return results.map((note, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    const dateStr = date.toISOString().split('T')[0];
    
    return note || { 
      name: `${dateStr}.md`, 
      path: `Daily/${dateStr}.md`, 
      content: '', 
      sha: null,
      date: dateStr,
      isNew: true 
    };
  });
};

// 追加内容到今日笔记
export const appendToDailyNote = async (content) => {
  const today = new Date().toISOString().split('T')[0];
  const path = `Daily/${today}.md`;
  
  const currentNote = await getDailyNote(today);
  
  let newContent = content;
  let sha = null;
  const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  
  if (currentNote) {
    // 简洁追加: 空行 + 时间戳 + 内容
    newContent = `${currentNote.content}\n\n**${time}** ${content}`;
    sha = currentNote.sha;
  } else {
    // 新建文件: 仅包含第一条记录，不再添加 Frontmatter 或 H1 标题
    // 以保持内容极简
    newContent = `**${time}** ${content}`;
  }
  
  // 确保目录存在
  await createDirectory('Daily/');
  
  return putFile(path, newContent, `Update daily note ${today}`, sha);
};

// 递归删除文件夹
export const deleteDirectory = async (path) => {
  try {
    // 1. 获取目录下所有内容 (递归)
    // 限制获取内容时 headers 必须包含 token
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`;
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
       if (response.status === 404) return true;
       throw new Error(`Failed to list directory: ${response.statusText}`);
    }
    
    const items = await response.json();
    
    if (!Array.isArray(items)) {
        return deleteFile(items.path, items.sha, `Delete ${items.name}`);
    }

    // 2. 并行删除所有文件和子目录
    const promises = items.map(async (item) => {
      if (item.type === 'dir') {
        return deleteDirectory(item.path);
      } else {
        return deleteFile(item.path, item.sha, `Delete ${item.name} via web`);
      }
    });

    await Promise.all(promises);
    return true;
  } catch (error) {
    console.error('Delete directory failed:', error);
    throw error;
  }
};

// 创建文件夹 (通过创建 .gitkeep)
export const createDirectory = async (path) => {
  try {
    // 移除末尾的斜杠
    const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
    const gitkeepPath = `${cleanPath}/.gitkeep`;

    const existing = await getFileContent(gitkeepPath);
    if (existing && existing.sha) {
      return true;
    }

    await putFile(gitkeepPath, '', `Create directory ${cleanPath}`);
    return true;
  } catch (error) {
    console.error('Create directory failed:', error);
    throw error;
  }
};

// 全局搜索
export const searchFiles = async (query) => {
  try {
    // 限制在当前仓库搜索
    const q = `${query} repo:${REPO_OWNER}/${REPO_NAME} extension:md`;
    const response = await fetch(`https://api.github.com/search/code?q=${encodeURIComponent(q)}`, {
      headers: { ...headers, 'Content-Type': undefined }
    });

    if (!response.ok) return [];
    
    const data = await response.json();
    return data.items.map(item => ({
      name: item.name,
      path: item.path,
      type: 'file'
    }));
  } catch (error) {
    console.error('Search failed:', error);
    return [];
  }
};
