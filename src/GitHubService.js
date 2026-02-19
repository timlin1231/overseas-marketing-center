const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
const REPO_OWNER = import.meta.env.VITE_REPO_OWNER;
const REPO_NAME = import.meta.env.VITE_REPO_NAME;
const BRANCH = 'main';

const headers = {
  'Authorization': `token ${GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github.v3+json'
};

export const getRepoContent = async (path = '') => {
  if (!GITHUB_TOKEN || !REPO_OWNER || !REPO_NAME) {
    console.warn('GitHub 配置缺失，使用模拟数据');
    return null;
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`, {
      headers
    });
    
    if (!response.ok) throw new Error(`GitHub API Error: ${response.statusText}`);
    
    const data = await response.json();
    
    // 确保返回数组
    if (!Array.isArray(data)) {
        return [data];
    }
    
    return data.map(item => ({
      name: item.name,
      type: item.type === 'dir' ? 'folder' : 'file',
      path: item.path,
      children: item.type === 'dir' ? [] : undefined,
      content: null
    })).filter(item => item.type === 'folder' || item.name.endsWith('.md'));
    
  } catch (error) {
    console.error('Fetch repo content failed:', error);
    return null;
  }
};

export const getFileContent = async (path) => {
  try {
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`, {
      headers
    });
    
    if (!response.ok) throw new Error(`GitHub API Error: ${response.statusText}`);
    
    const data = await response.json();
    // GitHub API 返回的是 base64 编码的内容
    // 使用 decodeURIComponent(escape(atob())) 解决中文乱码问题
    const content = decodeURIComponent(escape(atob(data.content)));
    return content;
  } catch (error) {
    console.error('Fetch file content failed:', error);
    return null;
  }
};
