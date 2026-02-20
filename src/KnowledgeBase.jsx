import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, 
  FileText, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Send, 
  Menu,
  X,
  BookOpen,
  Loader,
  Edit2,
  Trash2,
  Save,
  FilePlus,
  FolderPlus,
  MoreVertical
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getRepoContent, getFileContent, putFile, deleteFile, deleteDirectory, createDirectory, searchFiles } from './GitHubService';

// Toast Notification Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className={`fixed bottom-4 right-4 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg flex items-center z-50 animate-fade-in-up`}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-white/80 hover:text-white">
        <X size={14} />
      </button>
    </div>
  );
};

const FileTree = ({ items, level = 0, onSelect, onLoadChildren, onDelete }) => {
  const [expanded, setExpanded] = useState({});

  const toggle = async (item) => {
    const isExpanding = !expanded[item.path];
    setExpanded(prev => ({ ...prev, [item.path]: isExpanding }));
    
    if (isExpanding && item.children && item.children.length === 0) {
      await onLoadChildren(item);
    }
  };

  if (!items) return null;

  return (
    <div className="text-sm">
      {items.map((item) => (
        <div key={item.path} className="group relative">
          <div 
            className={`flex items-center py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer ${level > 0 ? 'ml-4' : ''}`}
            onClick={() => item.type === 'folder' ? toggle(item) : onSelect(item)}
          >
            <span className="mr-1 text-gray-400">
              {item.type === 'folder' && (
                expanded[item.path] ? <ChevronDown size={14} /> : <ChevronRight size={14} />
              )}
            </span>
            <span className="mr-2 text-blue-500">
              {item.type === 'folder' ? <Folder size={16} /> : <FileText size={16} />}
            </span>
            <span className="truncate text-gray-700 dark:text-gray-300 flex-1">{item.name}</span>
            
            {/* Delete Button (visible on hover) */}
            <button 
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Are you sure you want to delete ${item.name}?`)) {
                  onDelete(item);
                }
              }}
            >
              <Trash2 size={12} />
            </button>
          </div>
          {item.type === 'folder' && expanded[item.path] && (
            item.children && item.children.length > 0 ? (
              <FileTree items={item.children} level={level + 1} onSelect={onSelect} onLoadChildren={onLoadChildren} onDelete={onDelete} />
            ) : (
              <div className={`text-xs text-gray-400 py-1 ${level > 0 ? 'ml-10' : 'ml-6'}`}>
                (Empty or Loading...)
              </div>
            )
          )}
        </div>
      ))}
    </div>
  );
};

const KnowledgeBase = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [quickInput, setQuickInput] = useState('');
  const [fileSystem, setFileSystem] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [fileContentLoading, setFileContentLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [configError, setConfigError] = useState(null);
  const [folders, setFolders] = useState(['00_Inbox']); // 默认目录
  const [selectedFolder, setSelectedFolder] = useState('00_Inbox');
  const [autoSaving, setAutoSaving] = useState(false);

  useEffect(() => {
    const token = import.meta.env.VITE_GITHUB_TOKEN;
    const owner = import.meta.env.VITE_REPO_OWNER;
    const repo = import.meta.env.VITE_REPO_NAME;

    if (!token || !owner || !repo) {
      setConfigError({
        missing: [
          !token && 'VITE_GITHUB_TOKEN',
          !owner && 'VITE_REPO_OWNER',
          !repo && 'VITE_REPO_NAME'
        ].filter(Boolean)
      });
      setLoading(false);
      return;
    }

    loadRoot();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // 自动保存逻辑
  useEffect(() => {
    if (!isEditing || !selectedFile || editedContent === selectedFile.content) return;

    const timer = setTimeout(async () => {
      setAutoSaving(true);
      await handleSaveEdit(true); // true 表示静默保存，不弹 Toast
      setAutoSaving(false);
    }, 3000); // 3秒后自动保存

    return () => clearTimeout(timer);
  }, [editedContent, isEditing, selectedFile]);

  const loadRoot = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getRepoContent('');
      if (data) {
        setFileSystem(data);
        // 提取文件夹列表供选择
        const dirs = data
          .filter(item => item.type === 'folder' && !item.name.startsWith('.'))
          .map(item => item.name);
        if (dirs.length > 0) {
            setFolders(dirs);
            // 如果默认选中的文件夹不存在（比如被删除了），重置为第一个
            if (!dirs.includes(selectedFolder) && selectedFolder !== '00_Inbox') {
                setSelectedFolder(dirs[0]);
            }
        }
      }
    } catch (error) {
      console.error('Failed to load root:', error);
      setLoadError(error.message);
      showToast(`连接 GitHub 失败: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadChildren = async (folder) => {
    if (folder.children && folder.children.length > 0) return;

    const children = await getRepoContent(folder.path);
    if (children) {
      const updateTree = (nodes) => {
        return nodes.map(node => {
          if (node.path === folder.path) {
            return { ...node, children };
          }
          if (node.children) {
            return { ...node, children: updateTree(node.children) };
          }
          return node;
        });
      };
      setFileSystem(prev => updateTree(prev));
    }
  };

  const handleSelectFile = async (file) => {
    if (file.type === 'folder') return;
    
    // If selecting a search result, we might not have the full file object with sha
    // But getFileContent will return sha
    
    setSelectedFile({ ...file, content: 'Loading...' });
    setFileContentLoading(true);
    setIsEditing(false);
    
    const result = await getFileContent(file.path);
    if (result) {
      setSelectedFile({ ...file, content: result.content, sha: result.sha });
      setEditedContent(result.content);
    } else {
      setSelectedFile({ ...file, content: 'Failed to load content.' });
    }
    setFileContentLoading(false);
  };

  const handleQuickSave = async (e) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const folder = selectedFolder || '00_Inbox';
    const filename = `${folder}/Note-${timestamp}.md`;
    
    // 生成标准笔记格式 (Frontmatter)
    const content = `---
date: ${new Date().toISOString()}
type: quick-capture
status: inbox
---

# Quick Note

${quickInput}
`;

    try {
      await putFile(filename, content, 'Quick capture from web');
      showToast(`已保存到 ${folder}`, 'success');
      setQuickInput('');
      
      // Refresh root if we saved to a folder in root
      loadRoot(); 
    } catch (error) {
      showToast('保存失败: ' + error.message, 'error');
    }
  };

  const handleSaveEdit = async (silent = false) => {
    if (!selectedFile) return;

    try {
      const result = await putFile(
        selectedFile.path, 
        editedContent, 
        `Update ${selectedFile.name} from web`, 
        selectedFile.sha
      );
      
      // Update local state with new SHA
      setSelectedFile(prev => ({ ...prev, content: editedContent, sha: result.content.sha }));
      if (!silent) {
        setIsEditing(false);
        showToast('文件已更新', 'success');
      }
    } catch (error) {
      if (!silent) showToast('更新失败: ' + error.message, 'error');
    }
  };

  const handleDelete = async (item) => {
      try {
          if (item.type === 'folder') {
              if (!window.confirm(`确定要删除文件夹 "${item.name}" 及其所有内容吗？此操作不可恢复！`)) return;
              await deleteDirectory(item.path);
              showToast('文件夹已删除', 'success');
          } else {
              if (!window.confirm(`确定要删除文件 "${item.name}" 吗？`)) return;
              await deleteFile(item.path, item.sha, `Delete ${item.name}`);
              showToast('文件已删除', 'success');
          }
          
          if (selectedFile && selectedFile.path.startsWith(item.path)) {
              setSelectedFile(null);
          }
          loadRoot();
      } catch (error) {
          showToast('删除失败: ' + error.message, 'error');
      }
  };

  // 移除旧的 handleDeleteFile，合并到 handleDelete


  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const results = await searchFiles(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleCreateFile = async () => {
    const filename = prompt('输入新文件名 (e.g., folder/new-note.md) 或新文件夹名 (e.g., folder/)');
    if (!filename) return;
    
    if (filename.endsWith('/')) {
        // 创建文件夹
        try {
            await createDirectory(filename);
            showToast('文件夹已创建', 'success');
            loadRoot();
        } catch (error) {
            showToast('创建文件夹失败: ' + error.message, 'error');
        }
    } else {
        // 创建文件
        if (!filename.endsWith('.md')) {
            alert('当前仅支持 .md 文件');
            return;
        }

        try {
            await putFile(filename, '# New File\n', 'Create new file from web');
            showToast('文件已创建', 'success');
            loadRoot();
        } catch (error) {
            showToast('创建失败: ' + error.message, 'error');
        }
    }
  };

  if (configError) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4 flex items-center">
            <X className="mr-2" /> 配置缺失
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            检测到缺少必要的环境变量，无法连接到 GitHub。
          </p>
          <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg mb-6">
            <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-200">缺少的变量：</h3>
            <ul className="list-disc list-inside text-red-500 text-sm font-mono space-y-1">
              {configError.missing.map(v => <li key={v}>{v}</li>)}
            </ul>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            请在 Vercel 项目设置 (Settings) -&gt; Environment Variables 中添加上述变量。
          </p>
          <Link to="/" className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Sidebar: File Explorer */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} flex-shrink-0 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center font-bold text-gray-700 dark:text-gray-200">
            <BookOpen size={18} className="mr-2" />
            <span>知识库</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden">
            <X size={18} />
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="p-2 border-b border-gray-200 dark:border-gray-800">
          <form onSubmit={handleSearch} className="relative">
            <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="全库搜索..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </form>
          {searchResults.length > 0 && (
            <div className="mt-2 max-h-32 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-md p-1">
                <div className="text-xs text-gray-400 px-2 py-1">搜索结果:</div>
                {searchResults.map(result => (
                    <div 
                        key={result.path} 
                        className="px-2 py-1 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 truncate"
                        onClick={() => {
                            handleSelectFile(result);
                            setSearchResults([]); // Close search results
                            setSearchQuery('');
                        }}
                    >
                        {result.name}
                    </div>
                ))}
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex justify-around p-2 border-b border-gray-200 dark:border-gray-800">
             <button onClick={handleCreateFile} className="p-1 text-gray-500 hover:text-blue-500" title="New File">
                 <FilePlus size={16} />
             </button>
             <button onClick={loadRoot} className="p-1 text-gray-500 hover:text-blue-500" title="Refresh">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
             </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-4 text-gray-400">
                <Loader className="animate-spin text-blue-500 mb-2" size={20} />
                <span className="text-xs">加载中...</span>
              </div>
            ) : loadError ? (
              <div className="p-4 text-center">
                <div className="text-red-500 mb-2 font-bold text-sm">连接失败</div>
                <div className="text-xs text-gray-500 mb-4 break-words">{loadError}</div>
                <button 
                  onClick={loadRoot}
                  className="px-3 py-1 bg-blue-100 text-blue-600 rounded-md text-xs hover:bg-blue-200"
                >
                  重试
                </button>
              </div>
            ) : (
              <FileTree items={fileSystem} onSelect={handleSelectFile} onLoadChildren={handleLoadChildren} onDelete={handleDelete} />
            )}
          </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <Link to="/" className="text-sm text-gray-500 hover:text-blue-500 flex items-center">
            <ChevronRight size={14} className="rotate-180 mr-1" />
            返回首页
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-12 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 justify-between bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="mr-3 text-gray-500 hover:text-gray-700">
                <Menu size={20} />
              </button>
            )}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {selectedFile ? selectedFile.name : '未选择文件'}
            </span>
          </div>
          
          {selectedFile && (
            <div className="flex items-center space-x-2">
              {autoSaving && <span className="text-xs text-gray-400 mr-2">自动保存中...</span>}
              {isEditing ? (
                <>
                  <button 
                    onClick={() => setIsEditing(false)} 
                    className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 rounded-md"
                  >
                    取消
                  </button>
                  <button 
                    onClick={() => handleSaveEdit(false)} 
                    className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md"
                  >
                    <Save size={14} className="mr-1" /> 保存
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="flex items-center px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 rounded-md"
                >
                  <Edit2 size={14} className="mr-1" /> 编辑
                </button>
              )}
            </div>
          )}
        </header>

        {/* Content & Quick Input Split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor/Viewer Area */}
          <div className="flex-1 p-0 overflow-y-auto bg-white dark:bg-gray-900 relative">
            {selectedFile ? (
              fileContentLoading ? (
                 <div className="flex items-center justify-center h-full text-gray-400">
                    <Loader className="animate-spin mr-2" size={24} /> 加载中...
                 </div>
              ) : isEditing ? (
                <textarea 
                  className="w-full h-full p-8 font-mono text-base bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 resize-none focus:outline-none"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                />
              ) : (
                <div className="p-8 prose dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed">
                    {selectedFile.content}
                  </pre>
                </div>
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <BookOpen size={48} className="mb-4 opacity-20" />
                <p>选择一个文件开始阅读或编辑</p>
                <p className="text-sm mt-2 text-gray-500">双向同步已就绪: 网页 &lt;-&gt; GitHub &lt;-&gt; Obsidian</p>
              </div>
            )}
          </div>

          {/* Quick Input Sidebar (Right) */}
          <div className="w-80 border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 font-medium text-sm text-gray-600 dark:text-gray-300">
              ⚡️ 快速记录 (Quick Capture)
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-xs text-blue-600 dark:text-blue-300 mb-4">
                输入内容将保存为新笔记，并自动同步到您的 Obsidian。
              </div>
              
              <form onSubmit={handleQuickSave} className="flex flex-col h-full max-h-[calc(100vh-200px)]">
                <div className="mb-2">
                    <label className="text-xs text-gray-500 mb-1 block">存入目录</label>
                    <select 
                        className="w-full p-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedFolder}
                        onChange={(e) => setSelectedFolder(e.target.value)}
                    >
                        {folders.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>

                <textarea 
                  className="flex-1 w-full p-3 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="写下你的想法、待办或会议要点..."
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                />
                <button 
                  type="submit"
                  className="mt-4 w-full flex items-center justify-center py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Send size={16} className="mr-2" />
                  保存并同步
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;
