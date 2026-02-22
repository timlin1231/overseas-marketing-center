import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader, Send, RefreshCw } from 'lucide-react';
import DailyCard from '../DailyFlow/DailyCard';
import { getFileContent, putFile } from '../../GitHubService';

// -----------------------------------------------------------------------------
// Helper: Parse single file content into "Cards" based on H2 headers (## YYYY-MM-DD or ## Title)
// -----------------------------------------------------------------------------
const parseContentToCards = (fullContent) => {
  if (!fullContent) return [];
  
  // Split by "## " but keep the delimiter
  // Regex: Split by newline followed by ##
  const parts = fullContent.split(/\n(?=## )/);
  
  const cards = parts.map(part => {
    const trimmed = part.trim();
    if (!trimmed) return null;
    
    // Extract title
    const match = trimmed.match(/^## (.*?)(?:\n|$)/);
    let title = 'Untitled';
    let content = trimmed;
    
    if (match) {
      title = match[1].trim();
      // Remove the header line from content to avoid duplication in DailyCard
      content = trimmed.replace(/^## .*(\n|$)/, '').trim();
    } else {
        // If no H2 header, treat first line as title or just "General"
        // But to be consistent with DailyCard (which expects date), we might need a fake date or just use the title
    }
    
    return {
      date: title, // We map "Title" to "date" prop of DailyCard to reuse the UI
      content: content,
      originalFull: trimmed
    };
  }).filter(Boolean);
  
  // Sort by date desc if they look like dates? 
  // For now, keep original order or reverse? DailyFlow is reverse (newest first).
  // Let's try to detect if they are dates.
  // If user just appends, newer is at bottom usually.
  // But DailyFlow shows newest at top.
  // Let's reverse them for display to match DailyFlow experience.
  return cards.reverse();
};

// -----------------------------------------------------------------------------
// Helper: Serialize cards back to single markdown string
// -----------------------------------------------------------------------------
const serializeCardsToContent = (cards) => {
  // Re-reverse to save in chronological order (oldest top, newest bottom) which is standard for log files
  const ordered = [...cards].reverse();
  return ordered.map(c => `## ${c.date}\n\n${c.content}`).join('\n\n');
};

const SingleFileCardFlow = ({ title, path }) => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fileSha, setFileSha] = useState(null);
  const [quickInput, setQuickInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Load and Parse
  const load = useCallback(async () => {
    setLoading(true);
    try {
      let file = await getFileContent(path);
      if (!file) {
        // Create if not exists
        await putFile(path, '', `Create ${path}`);
        file = await getFileContent(path);
      }
      
      setFileSha(file.sha);
      const parsed = parseContentToCards(file.content || '');
      setCards(parsed);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  // Append Quick Input
  const handleQuickSubmit = async (e) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    
    setSubmitting(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const timeStr = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      const newEntry = `**${timeStr}** ${quickInput}`;
      
      // 1. Get latest content to ensure we don't overwrite
      const file = await getFileContent(path);
      let content = file?.content || '';
      let sha = file?.sha || fileSha;
      
      // 2. Check if today's section exists
      // Regex to find "## YYYY-MM-DD"
      const todayHeaderRegex = new RegExp(`^## ${todayStr}\\s*$`, 'm');
      
      let nextContent = '';
      if (todayHeaderRegex.test(content)) {
        // Insert into existing section
        // We need to find where the NEXT section starts or End of File
        // This is tricky with regex replace.
        // Simpler: Split, find the part, append, join.
        const parts = content.split(/\n(?=## )/);
        const updatedParts = parts.map(part => {
            if (part.startsWith(`## ${todayStr}`)) {
                return `${part.trim()}\n\n${newEntry}`;
            }
            return part;
        });
        nextContent = updatedParts.join('\n\n');
      } else {
        // Append new section at the end (standard log format)
        // Ensure double newline before header if file not empty
        const prefix = content.trim() ? '\n\n' : '';
        nextContent = `${content.trim()}${prefix}## ${todayStr}\n\n${newEntry}`;
      }
      
      await putFile(path, nextContent, `Append to ${title}`, sha);
      setQuickInput('');
      load(); // Reload to refresh UI
    } catch (err) {
      alert('Failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Card Edit
  const handleCardUpdate = async (updatedCard) => {
    // 1. Update local state first for responsiveness
    const newCards = cards.map(c => c.date === updatedCard.date ? updatedCard : c);
    setCards(newCards);
    
    // 2. Serialize and Save
    // Note: This is "whole file save" which might be risky for concurrency, 
    // but consistent with single-file architecture.
    try {
        const nextContent = serializeCardsToContent(newCards);
        // We need latest SHA
        const file = await getFileContent(path);
        await putFile(path, nextContent, `Update card ${updatedCard.date}`, file.sha);
        // Update SHA locally
        const newFile = await getFileContent(path);
        setFileSha(newFile.sha);
    } catch (err) {
        console.error('Auto-save failed', err);
        // Revert? Or just alert?
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Top Input Area (Same as DailyFlow) */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 shadow-sm z-10">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleQuickSubmit} className="relative">
            <textarea
              className="w-full p-4 pr-12 text-base bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all resize-none"
              placeholder={`记录到 ${title}... (自动归档到今日)`}
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
            <span className="flex items-center cursor-pointer hover:text-blue-500" onClick={load}>
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
              <p>正在解析 {title}...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {cards.length === 0 ? (
                 <div className="text-center py-20 text-gray-400">
                    <p>暂无内容，在上方输入第一条记录吧</p>
                 </div>
              ) : (
                  cards.map((card, idx) => (
                    <DailyCard 
                      key={card.date || idx} 
                      note={{
                          ...card,
                          path: path, // Note: DailyCard uses this path for putFile, but here we override save logic?
                          // Actually DailyCard handles save internally using putFile(note.path).
                          // This is a conflict! DailyCard writes to a FILE path assuming it owns the file.
                          // But here multiple cards share ONE file.
                          // WE MUST MODIFY DailyCard OR WRAP IT.
                          // Since we want to reuse UI, we can pass a "virtual" path or intercept onUpdate?
                          
                          // WAIT: DailyCard calls `putFile(note.path, ...)` internally.
                          // If we pass `path` (e.g. `todolist.md`), DailyCard will overwrite the WHOLE file with just that card's content!
                          // This is DANGEROUS.
                          
                          // FIX: We need DailyCard to support "controlled mode" where it doesn't save itself, 
                          // OR we accept that we can't reuse DailyCard's internal save logic easily without refactoring.
                          
                          // Strategy:
                          // Modify DailyCard to accept `onSave` prop. If provided, it calls `onSave(content)` INSTEAD of `putFile`.
                      }}
                      // We need to pass a custom prop to intercept save
                      onSave={async (newContent) => {
                          const updated = { ...card, content: newContent };
                          await handleCardUpdate(updated);
                      }}
                    />
                  ))
              )}
              
              {cards.length > 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                   - End of {title} -
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SingleFileCardFlow;
