import React, { useState, useEffect } from 'react';
import { getRecentDailyNotes, appendToDailyNote } from '../../GitHubService';
import DailyCard from './DailyCard';
import { Send, Loader, RefreshCw } from 'lucide-react';

const DailyFlow = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickInput, setQuickInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Top Input Area */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 shadow-sm z-10">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleQuickSubmit} className="relative">
            <textarea
              className="w-full p-4 pr-12 text-base bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all resize-none"
              placeholder="此刻在想什么？直接输入，自动记录到今天..."
              rows={3}
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleQuickSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={submitting || !quickInput.trim()}
              className="absolute right-3 bottom-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
          <div className="text-xs text-gray-400 mt-2 flex justify-between px-1">
            <span>支持 Markdown · Ctrl+Enter 发送</span>
            <span className="flex items-center cursor-pointer hover:text-blue-500" onClick={loadNotes}>
                <RefreshCw size={12} className="mr-1" /> 刷新列表
            </span>
          </div>
        </div>
      </div>

      {/* Cards Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-3xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader className="animate-spin text-blue-500 mb-4" size={32} />
              <p>正在加载最近的记忆...</p>
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
              
              <div className="text-center py-8 text-gray-400 text-sm">
                - 仅展示最近 7 天内容 -
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyFlow;
