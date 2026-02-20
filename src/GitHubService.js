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

// 递归删除文件夹
export const deleteDirectory = async (path) => {
  try {
    // 1. 获取目录下所有内容 (递归)
    // 注意：getRepoContent 只返回一层，我们需要递归获取
    // 但为了简化，我们先尝试获取当前层级，如果是文件直接删，如果是文件夹递归删
    
    // 获取内容
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`;
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
       // 如果已经是 404，说明目录不存在，直接返回成功
       if (response.status === 404) return true;
       throw new Error(`Failed to list directory: ${response.statusText}`);
    }
    
    const items = await response.json();
    
    if (!Array.isArray(items)) {
        // 如果不是数组，说明可能是单个文件（不应该发生，因为我们操作的是目录）
        // 但为了健壮性，当作文件删除
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
