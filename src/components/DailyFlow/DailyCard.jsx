import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import RichEditor from '../RichEditor';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { getFileContent, putFile } from '../../GitHubService';

const sanitizeDailyContent = (raw, dateStr) => {
  let text = raw || '';
  text = text.replace(/^---\n[\s\S]*?\n---\n*/g, '');
  text = text.replace(new RegExp(`^date:\\s*${dateStr}.*\\n`, 'm'), '');
  text = text.replace(/^date:\s*\d{4}-\d{2}-\d{2}.*\n/m, '');
  text = text.replace(/^#\s*\d{4}-\d{2}-\d{2}.*日记.*\n/m, '');
  text = text.replace(new RegExp(`^#\\s*${dateStr}.*\\n`, 'm'), '');
  return text.trim();
};

const DailyCard = ({ note, onUpdate }) => {
  const date = new Date(note.date);
  const dayOfWeek = date.toLocaleDateString('zh-CN', { weekday: 'long' });
  const isToday = new Date().toDateString() === date.toDateString();

  const [isExpanded, setIsExpanded] = useState(isToday); // 仅今天默认展开
  const initialContent = useMemo(() => sanitizeDailyContent(note.content || '', note.date), [note.content, note.date]);
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const lastSavedRef = useRef(initialContent);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    if (isDirty) return;
    const next = sanitizeDailyContent(note.content || '', note.date);
    setContent(next);
    lastSavedRef.current = next;
  }, [note.content, note.date, isDirty]);

  const saveNow = useCallback(async () => {
    const next = sanitizeDailyContent(content, note.date);
    if (next === lastSavedRef.current) {
      setIsDirty(false);
      return;
    }

    setIsSaving(true);
    try {
      const latest = await getFileContent(note.path);
      const shaToUse = latest?.sha || note.sha;
      const result = await putFile(note.path, next, `Update daily note ${note.date}`, shaToUse);
      lastSavedRef.current = next;
      setContent(next);
      setIsDirty(false);
      if (onUpdate) {
        onUpdate({ ...note, content: next, sha: result.content.sha, isNew: false });
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert('保存失败: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  }, [content, note.date, note.path, note.sha, onUpdate]);

  useEffect(() => {
    if (!isExpanded) return;
    if (!isDirty) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      saveNow();
    }, 1200);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [isDirty, isExpanded, saveNow]);

  return (
    <div className={`mb-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-200 ${isToday ? 'ring-1 ring-blue-500/30' : ''}`}>
      {/* Card Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-t-xl group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${isToday ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
            <Calendar size={20} />
          </div>
          <div>
            <div className="flex items-center">
              <span className="text-lg font-bold text-gray-800 dark:text-gray-100 mr-2">{note.date}</span>
              <span className="text-xs text-gray-500 font-medium mr-2">
                {dayOfWeek}
              </span>
              {isToday && <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold">Today</span>}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
          {isExpanded && (
            <span className="text-xs text-gray-400">
              {isSaving ? '保存中...' : isDirty ? '未保存' : '已保存'}
            </span>
          )}
          <button className="text-gray-400 hover:text-gray-600" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Card Content */}
      {isExpanded && (
        <div className="p-4 pt-0 border-t-0 min-h-[140px]" onClick={(e) => e.stopPropagation()}>
          <div className="min-h-[220px]" onClick={(e) => e.stopPropagation()}>
            <RichEditor
              content={content}
              editable={true}
              autoFocus={isToday}
              onChange={(next) => {
                const cleaned = sanitizeDailyContent(next, note.date);
                setContent(cleaned);
                setIsDirty(cleaned !== lastSavedRef.current);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyCard;
