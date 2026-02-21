import React, { useState, useEffect } from 'react';
import { 
  X,
  BookOpen,
  ChevronRight,
  Folder,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getRepoContent } from './GitHubService';
import DailyFlow from './components/DailyFlow/DailyFlow';

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
  const [configError, setConfigError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fileSystem, setFileSystem] = useState([]);

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
            <div className="text-xs font-bold text-gray-400 uppercase px-2 mb-2">Folders</div>
            {/* Hardcoded or Filtered Folders based on user request */}
            <div className="space-y-1">
                {['00_Inbox', 'Templates'].map(folder => (
                    <div key={folder} className="flex items-center px-2 py-1.5 text-sm text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer">
                        <Folder size={14} className="mr-2 text-blue-500" />
                        {folder}
                    </div>
                ))}
            </div>
            
            <div className="text-xs font-bold text-gray-400 uppercase px-2 mt-4 mb-2">Files</div>
             {fileSystem.filter(i => i.type === 'file' && !i.name.startsWith('.')).map(file => (
                 <div key={file.path} className="flex items-center px-2 py-1.5 text-sm text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer">
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

      {/* Main Content: Daily Flow */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-gray-900">
        <DailyFlow />
      </div>
    </div>
  );
};

export default KnowledgeBase;
