import React, { useState, useEffect, useRef } from 'react';
import { getRecentDailyNotes, appendToDailyNote, putFile } from '../../GitHubService';
import DailyCard from './DailyCard';
import { Send, Loader, RefreshCw, Paperclip, Image as ImageIcon } from 'lucide-react';

const DailyFlow = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickInput, setQuickInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const data = await getRecentDailyNotes(7); // Load last 7 days
      setNotes(data);
    } catch (error) {
      console.error('Failed to load daily notes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleQuickSubmit = async (e) => {
    e.preventDefault();
    if (!quickInput.trim()) return;

    setSubmitting(true);
    try {
      await appendToDailyNote(quickInput);
      setQuickInput('');
      // Reload to show the new content
      await loadNotes();
    } catch (error) {
      alert('发送失败: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNoteUpdate = (updatedNote) => {
    setNotes(prev => prev.map(n => n.date === updatedNote.date ? updatedNote : n));
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // TODO: 实现更完善的文件上传逻辑 (比如上传到 assets 目录)
    // 这里简化处理：转 Base64 并不适合直接插入 Markdown，应该上传后获取 URL
    // 假设我们上传到 'attachments/YYYY/MM/filename'
    
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const path = `attachments/${year}/${month}/${file.name}`;
    
    setSubmitting(true);
    try {
        // 读取文件内容
        const reader = new FileReader();
        reader.onload = async (event) => {
            const content = event.target.result.split(',')[1]; // 去掉 data:image/png;base64, 前缀
            // 注意：GitHub API 需要 Base64，但我们的 putFile 辅助函数会再次转 Base64，所以这里需要传原始字符串？
            // 不，putFile 的 utf8_to_b64 是处理字符串的。对于二进制文件，我们需要调整 putFile 或者这里直接调 API。
            // 为了简单，我们假设 putFile 可以处理。
            // 实际上，putFile 接收字符串并编码。对于图片，这是有问题的。
            // 我们需要修改 putFile 或者在这里自己实现上传。
            
            // 修正：我们直接用 GitHub API 上传 Base64
            // 但复用 putFile 比较麻烦，因为 putFile 会再次编码。
            // 让我们在 KnowledgeBase 级别或者 Service 级别增加 uploadFile。
            // 暂时先提示用户
            alert('文件上传功能需要后端支持二进制文件，当前暂未完全实现。');
            setSubmitting(false);
        };
        reader.readAsDataURL(file);
    } catch (error) {
        console.error(error);
        setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black">
      {/* Top Input Area */}
      <div className="bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 p-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleQuickSubmit} className="relative">
            <textarea
              className="w-full p-4 pr-12 text-sm bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all resize-none placeholder:text-gray-400"
              placeholder="What's on your mind? (Markdown supported)"
              rows={3}
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleQuickSubmit(e);
                }
              }}
            />
            <div className="absolute left-3 bottom-3 flex space-x-2">
                <button 
                    type="button" 
                    className="p-1 text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                    title="Upload (Coming Soon)"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Paperclip size={16} />
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileSelect} 
                />
            </div>
            <button
              type="submit"
              disabled={submitting || !quickInput.trim()}
              className="absolute right-3 bottom-3 p-1.5 bg-black text-white dark:bg-white dark:text-black rounded-md hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </form>
          <div className="text-[10px] text-gray-400 mt-2 flex justify-between px-1 uppercase tracking-wider font-medium">
            <span>Cmd+Enter to send</span>
            <span className="flex items-center cursor-pointer hover:text-black dark:hover:text-white transition-colors" onClick={loadNotes}>
                <RefreshCw size={10} className="mr-1" /> Refresh
            </span>
          </div>
        </div>
      </div>

      {/* Cards Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white dark:bg-black">
        <div className="max-w-3xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader className="animate-spin mb-4" size={20} />
              <p className="text-xs font-mono uppercase">Loading memories...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {notes.map(note => (
                <DailyCard 
                  key={note.date} 
                  note={note} 
                  onUpdate={handleNoteUpdate}
                />
              ))}
              
              <div className="text-center py-8 text-gray-300 dark:text-gray-700 text-xs font-mono uppercase tracking-widest">
                - Recent 7 Days -
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyFlow;
