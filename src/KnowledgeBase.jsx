import React, { useState, useEffect, useRef } from 'react';
import { 
  X,
  BookOpen,
  ChevronRight,
  Folder,
  FileText,
  Menu,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getRepoContent, getFileContent, putFile } from './GitHubService';
import DailyFlow from './components/DailyFlow/DailyFlow';
import RichEditor from './components/RichEditor';
import { ConfirmModal, InputModal } from './components/Modals'; // Assuming these still exist or need to be recreated if deleted

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

const KnowledgeBase = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [viewMode, setViewMode] = useState('daily'); // 'daily' | 'editor'
  
  const [fileSystem, setFileSystem] = useState([]);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(null);
  const [fileContentLoading, setFileContentLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [autoSaving, setAutoSaving] = useState(false);
  
  // TOC State
  const editorRef = useRef(null);
  const [tocItems, setTocItems] = useState([]);
  
  // Modals state
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [inputModal, setInputModal] = useState({ isOpen: false, title: '', message: '', placeholder: '', onConfirm: () => {} });

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
    
    // Load file system just for navigation (simplified)
    const loadNav = async () => {
        try {
            const data = await getRepoContent('');
            if (data) setFileSystem(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    loadNav();
  }, []);

  const handleSelectFile = async (file) => {
    if (file.type === 'folder') return;
    
    setViewMode('editor');
    setSelectedFile({ ...file, content: 'Loading...' });
    setFileContentLoading(true);
    setTocItems([]);
    
    const result = await getFileContent(file.path);
    if (result) {
      setSelectedFile({ ...file, content: result.content, sha: result.sha });
      setEditedContent(result.content);
    } else {
      setSelectedFile({ ...file, content: 'Failed to load content.' });
    }
    setFileContentLoading(false);
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
      
      setSelectedFile(prev => ({ ...prev, content: editedContent, sha: result.content.sha }));
      // if (!silent) showToast('文件已更新', 'success'); // Toast removed for simplicity
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  // Auto-save for editor
  useEffect(() => {
    if (viewMode !== 'editor' || !selectedFile || editedContent === selectedFile.content) return;

    const timer = setTimeout(async () => {
      setAutoSaving(true);
      await handleSaveEdit(true);
      setAutoSaving(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [editedContent, viewMode, selectedFile]);

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
      
      {/* Minimal Sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-gray-50 dark:bg-gray-900/50">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center">
          <BookOpen size={18} className="mr-2 text-blue-600" />
          <span className="font-bold text-gray-800 dark:text-gray-200">知识库</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1 mb-4">
                <div 
                    className={`flex items-center px-2 py-2 text-sm rounded-md cursor-pointer ${viewMode === 'daily' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    onClick={() => setViewMode('daily')}
                >
                    <Calendar size={16} className="mr-2" />
                    Daily Flow
                </div>
            </div>

            <div className="text-xs font-bold text-gray-400 uppercase px-2 mb-2">Folders</div>
            <div className="space-y-1">
                {['Daily', 'Projectkickoff', 'todolist'].map(folder => (
                    <div key={folder} className="flex items-center px-2 py-1.5 text-sm text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer">
                        <Folder size={14} className="mr-2 text-blue-500" />
                        {folder}
                    </div>
                ))}
            </div>
            
            <div className="text-xs font-bold text-gray-400 uppercase px-2 mt-4 mb-2">Files</div>
             {fileSystem.filter(i => i.type === 'file' && !i.name.startsWith('.')).map(file => (
                 <div 
                    key={file.path} 
                    className={`flex items-center px-2 py-1.5 text-sm rounded-md cursor-pointer ${selectedFile?.path === file.path && viewMode === 'editor' ? 'bg-gray-200 dark:bg-gray-800' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
                    onClick={() => handleSelectFile(file)}
                 >
                     <FileText size={14} className="mr-2 text-gray-400" />
                     <span className="truncate">{file.name}</span>
                 </div>
             ))}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <Link to="/" className="text-sm text-gray-500 hover:text-blue-500 flex items-center">
            <ChevronRight size={14} className="rotate-180 mr-1" />
            返回首页
          </Link>
        </div>
      </div>

      {/* Main Content: Daily Flow or Editor */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-gray-900">
        {viewMode === 'daily' ? (
            <DailyFlow />
        ) : (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Editor Header */}
                <header className="h-12 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 justify-between bg-white dark:bg-gray-900">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {selectedFile ? selectedFile.name : '未选择文件'}
                    </span>
                  </div>
                  {selectedFile && (
                    <div className="flex items-center space-x-2">
                      {autoSaving ? (
                        <span className="text-xs text-gray-400 mr-2 flex items-center">
                          <Loader size={12} className="animate-spin mr-1" /> 自动保存中...
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 mr-2">已保存</span>
                      )}
                    </div>
                  )}
                </header>
                
                {/* Editor Area */}
                <div className="flex-1 p-0 overflow-y-auto bg-white dark:bg-gray-900 relative">
                    {selectedFile ? (
                      fileContentLoading ? (
                         <div className="flex items-center justify-center h-full text-gray-400">
                            <Loader className="animate-spin mr-2" size={24} /> 加载中...
                         </div>
                      ) : (
                        <RichEditor 
                          ref={editorRef}
                          content={editedContent} 
                          onChange={setEditedContent}
                          onHeadingsUpdate={setTocItems}
                        />
                      )
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <BookOpen size={48} className="mb-4 opacity-20" />
                        <p>选择一个文件开始阅读或编辑</p>
                      </div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBase;
