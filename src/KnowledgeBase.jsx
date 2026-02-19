import React, { useState, useEffect } from 'react';
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
  Loader
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getRepoContent, getFileContent } from './GitHubService';

const FileTree = ({ items, level = 0, onSelect, onLoadChildren }) => {
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
        <div key={item.path}>
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
            <span className="truncate text-gray-700 dark:text-gray-300">{item.name}</span>
          </div>
          {item.type === 'folder' && expanded[item.path] && (
            item.children && item.children.length > 0 ? (
              <FileTree items={item.children} level={level + 1} onSelect={onSelect} onLoadChildren={onLoadChildren} />
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
  const [fileContentLoading, setFileContentLoading] = useState(false);

  useEffect(() => {
    loadRoot();
  }, []);

  const loadRoot = async () => {
    setLoading(true);
    const data = await getRepoContent('');
    if (data) {
      setFileSystem(data);
    }
    setLoading(false);
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
    
    setSelectedFile({ ...file, content: 'Loading...' });
    setFileContentLoading(true);
    
    const content = await getFileContent(file.path);
    setSelectedFile({ ...file, content: content || 'Failed to load content.' });
    setFileContentLoading(false);
  };

  const handleQuickSave = (e) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    alert(`已将内容保存到 00_Inbox: \n${quickInput}\n(需后端支持 GitHub API 写入)`);
    setQuickInput('');
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">
      {/* Sidebar: File Explorer */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} flex-shrink-0 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center font-bold text-gray-700 dark:text-gray-200">
            <BookOpen size={18} className="mr-2" />
            <span>知识库 (GitHub)</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="搜索..." 
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex justify-center p-4">
              <Loader className="animate-spin text-blue-500" size={20} />
            </div>
          ) : (
            <FileTree items={fileSystem} onSelect={handleSelectFile} onLoadChildren={handleLoadChildren} />
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
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {selectedFile ? selectedFile.name : '未选择文件'}
            </span>
          </div>
        </header>

        {/* Content & Quick Input Split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor/Viewer Area */}
          <div className="flex-1 p-8 overflow-y-auto bg-white dark:bg-gray-900">
            {selectedFile ? (
              <div className="prose dark:prose-invert max-w-none">
                {fileContentLoading ? (
                   <div className="flex items-center text-gray-400">
                      <Loader className="animate-spin mr-2" size={16} /> 加载中...
                   </div>
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed">
                    {selectedFile.content}
                  </pre>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <BookOpen size={48} className="mb-4 opacity-20" />
                <p>选择一个文件开始阅读或编辑</p>
                <p className="text-sm mt-2 text-gray-500">数据来源: GitHub 仓库</p>
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
                这里输入的内容将自动整理到 <strong>00_Inbox</strong>，稍后 AI 会帮你分类。
              </div>
              
              <form onSubmit={handleQuickSave} className="flex flex-col h-full max-h-[calc(100vh-200px)]">
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
                  保存到收件箱
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
