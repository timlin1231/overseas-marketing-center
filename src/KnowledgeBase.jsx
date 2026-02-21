import React, { useState, useEffect, useRef } from 'react';
import { 
  X,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Folder,
  FileText,
  Menu,
  Calendar,
  FilePlus,
  FolderPlus,
  Trash2,
  MoreVertical,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getRepoContent, getFileContent, putFile, deleteFile, deleteDirectory, createDirectory } from './GitHubService';
import DailyFlow from './components/DailyFlow/DailyFlow';
import RichEditor from './components/RichEditor';
import { ConfirmModal, InputModal } from './components/Modals';

// Simple FileTree Component
const FileTree = ({ items, level = 0, onSelect, onLoadChildren, onDelete, selectedPath }) => {
  const [expanded, setExpanded] = useState({});

  const toggle = async (item) => {
    const isExpanding = !expanded[item.path];
    setExpanded(prev => ({ ...prev, [item.path]: isExpanding }));
    
    if (isExpanding && item.children && item.children.length === 0 && onLoadChildren) {
      await onLoadChildren(item);
    }
  };

  if (!items) return null;

  return (
    <div className="text-sm">
      {items.map((item) => (
        <div key={item.path} className="group relative">
          <div 
            className={`flex items-center py-1.5 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer ${level > 0 ? 'ml-4' : ''} ${selectedPath === item.path ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-gray-700 dark:text-gray-300'}`}
            onClick={() => item.type === 'folder' ? toggle(item) : onSelect(item)}
          >
            <span className="mr-1 text-gray-400 w-4 flex justify-center">
              {item.type === 'folder' && (
                expanded[item.path] ? <ChevronDown size={14} /> : <ChevronRight size={14} />
              )}
            </span>
            <span className="mr-2 text-blue-500">
              {item.type === 'folder' ? <Folder size={16} /> : <FileText size={16} />}
            </span>
            <span className="truncate flex-1">{item.name}</span>
            
            {/* Delete Button (visible on hover) */}
            <button 
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item);
              }}
            >
              <Trash2 size={12} />
            </button>
          </div>
          {item.type === 'folder' && expanded[item.path] && (
            item.children && item.children.length > 0 ? (
              <FileTree items={item.children} level={level + 1} onSelect={onSelect} onLoadChildren={onLoadChildren} onDelete={onDelete} selectedPath={selectedPath} />
            ) : (
              <div className={`text-xs text-gray-400 py-1 ${level > 0 ? 'ml-10' : 'ml-8'}`}>
                (Empty)
              </div>
            )
          )}
        </div>
      ))}
    </div>
  );
};

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

  const [toast, setToast] = useState(null);
  const [loadError, setLoadError] = useState(null);

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

  const loadRoot = async () => {
    setLoading(true);
    try {
        const data = await getRepoContent('');
        if (data) setFileSystem(data);
    } catch (e) {
        console.error(e);
        setLoadError(e.message);
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

  const handleDelete = (item) => {
    setConfirmModal({
      isOpen: true,
      title: item.type === 'folder' ? '删除文件夹' : '删除文件',
      message: item.type === 'folder' 
        ? `确定要删除文件夹 "${item.name}" 及其所有内容吗？此操作不可恢复！`
        : `确定要删除文件 "${item.name}" 吗？`,
      onConfirm: async () => {
        try {
          if (item.type === 'folder') {
            await deleteDirectory(item.path);
            showToast('文件夹已删除', 'success');
          } else {
            await deleteFile(item.path, item.sha, `Delete ${item.name}`);
            showToast('文件已删除', 'success');
          }
          
          if (selectedFile && selectedFile.path.startsWith(item.path)) {
            setSelectedFile(null);
            setViewMode('daily'); // Reset to daily view if deleted
          }
          loadRoot();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          showToast('删除失败: ' + error.message, 'error');
        }
      }
    });
  };

  const handleCreateFile = () => {
    setInputModal({
      isOpen: true,
      title: '新建文件或文件夹',
      message: '输入文件名以 .md 结尾，或者输入文件夹名以 / 结尾',
      placeholder: 'e.g., new-note.md or new-folder/',
      onConfirm: async (filename) => {
        if (!filename) return;
        
        try {
          if (filename.endsWith('/')) {
            await createDirectory(filename);
            showToast('文件夹已创建', 'success');
          } else {
            if (!filename.endsWith('.md')) {
              showToast('当前仅支持 .md 文件', 'error');
              return;
            }
            await putFile(filename, '# New File\n', 'Create new file from web');
            showToast('文件已创建', 'success');
          }
          loadRoot();
          setInputModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          showToast('创建失败: ' + error.message, 'error');
        }
      }
    });
  };

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
    // Only auto-save if in editor mode, file is selected, content changed, and not currently loading
    if (viewMode !== 'editor' || !selectedFile || editedContent === selectedFile.content || fileContentLoading) return;

    const timer = setTimeout(async () => {
      setAutoSaving(true);
      await handleSaveEdit(true);
      setAutoSaving(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [editedContent, viewMode, selectedFile, fileContentLoading]);

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
      
      {/* Modals */}
      <ConfirmModal 
        isOpen={confirmModal.isOpen} 
        title={confirmModal.title} 
        message={confirmModal.message} 
        onConfirm={confirmModal.onConfirm} 
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} 
      />
      <InputModal 
        isOpen={inputModal.isOpen} 
        title={inputModal.title} 
        message={inputModal.message} 
        placeholder={inputModal.placeholder}
        onConfirm={inputModal.onConfirm} 
        onCancel={() => setInputModal(prev => ({ ...prev, isOpen: false }))} 
      />

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

            <div className="text-xs font-bold text-gray-400 uppercase px-2 mb-2">Favorites</div>
            <div className="space-y-1">
                <div 
                    className={`flex items-center px-2 py-1.5 text-sm rounded-md cursor-pointer ${selectedFile?.name === 'Projectkickoff.md' && viewMode === 'editor' ? 'bg-gray-200 dark:bg-gray-800' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
                    onClick={() => handleSelectFile({ name: 'Projectkickoff.md', path: 'Projectkickoff.md', type: 'file' })}
                >
                    <FileText size={14} className="mr-2 text-orange-500" />
                    Projectkickoff
                </div>
                <div 
                    className={`flex items-center px-2 py-1.5 text-sm rounded-md cursor-pointer ${selectedFile?.name === 'todolist.md' && viewMode === 'editor' ? 'bg-gray-200 dark:bg-gray-800' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
                    onClick={() => handleSelectFile({ name: 'todolist.md', path: 'todolist.md', type: 'file' })}
                >
                    <FileText size={14} className="mr-2 text-green-500" />
                    todolist
                </div>
            </div>
            
            <div className="flex items-center justify-between px-2 mt-6 mb-2">
                <div className="text-xs font-bold text-gray-400 uppercase">All Files</div>
                <button 
                    onClick={handleCreateFile}
                    className="p-1 text-gray-400 hover:text-blue-600 rounded-md transition-colors"
                    title="New File/Folder"
                >
                    <Plus size={14} />
                </button>
            </div>
            
            <FileTree 
                items={fileSystem} 
                onSelect={handleSelectFile} 
                onLoadChildren={handleLoadChildren} 
                onDelete={handleDelete}
                selectedPath={selectedFile?.path}
            />
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
