
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import RichEditor from '../RichEditor';
import { Calendar, ChevronDown, ChevronUp, Clock, Save, MoreHorizontal } from 'lucide-react';
import { getFileContent, putFile } from '../../GitHubService';

const sanitizeDailyContent = (raw, dateStr) => {
  let text = raw || '';
  // Remove frontmatter
  text = text.replace(/^---\n[\s\S]*?\n---\n*/g, '');
  // Remove redundant date/title headers
  text = text.replace(new RegExp(`^date:\\s*${dateStr}.*\\n`, 'm'), '');
  text = text.replace(/^date:\s*\d{4}-\d{2}-\d{2}.*\n/m, '');
  text = text.replace(/^#\s*\d{4}-\d{2}-\d{2}.*日记.*\n/m, '');
  text = text.replace(new RegExp(`^#\\s*${dateStr}.*\\n`, 'm'), '');
  return text.trim();
};

const DailyCard = ({ note, onUpdate, onSave }) => {
  const date = new Date(note.date);
  const dayOfWeek = date.toLocaleDateString('zh-CN', { weekday: 'long' });
  const isToday = new Date().toDateString() === date.toDateString();

  const [isExpanded, setIsExpanded] = useState(() => {
    const sanitized = sanitizeDailyContent(note.content || '', note.date);
    return isToday || sanitized.length > 0;
  });
  
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
      if (onSave) {
          await onSave(next);
      } else {
          const latest = await getFileContent(note.path);
          const shaToUse = latest?.sha || note.sha;
          const result = await putFile(note.path, next, `Update daily note ${note.date}`, shaToUse);
          if (onUpdate) {
            onUpdate({ ...note, content: next, sha: result.content.sha, isNew: false });
          }
      }
      lastSavedRef.current = next;
      setContent(next);
      setIsDirty(false);
    } catch (error) {
      console.error('Save failed:', error);
      // alert('保存失败: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  }, [content, note.date, note.path, note.sha, onUpdate, onSave]);

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
    <div className={`group mb-6 bg-white dark:bg-black rounded-xl border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:shadow-lg hover:border-gray-200 dark:hover:border-gray-700 ${isToday ? 'ring-2 ring-black/5 dark:ring-white/10' : ''}`}>
      {/* Card Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg border ${isToday ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' : 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-900 dark:border-gray-800'}`}>
            <span className="text-xs font-medium uppercase leading-none mb-0.5">{date.getDate()}</span>
            <span className="text-[10px] opacity-70 leading-none">{date.toLocaleDateString('en-US', { month: 'short' })}</span>
          </div>
          
          <div className="flex flex-col">
             <div className="flex items-center gap-2">
                <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                    {dayOfWeek}
                </span>
                {isToday && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                        Today
                    </span>
                )}
             </div>
             <div className="flex items-center gap-2 text-xs text-gray-400">
                 <Clock size={12} />
                 <span>{note.date}</span>
                 {isDirty && <span className="text-amber-500 font-medium">• Unsaved changes</span>}
                 {isSaving && <span className="text-blue-500 font-medium">• Saving...</span>}
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           <button className="p-2 text-gray-400 hover:text-black dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
           </button>
        </div>
      </div>

      {/* Card Content */}
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
         <div className="px-1 pb-4" onClick={(e) => e.stopPropagation()}>
            {/* Custom Prose Class for Daily Notes: tighter padding, smaller font than full doc */}
            <RichEditor
              content={content}
              editable={true}
              autoFocus={isToday}
              proseClass="prose prose-sm dark:prose-invert max-w-none px-4 py-2 focus:outline-none min-h-[120px]"
              onChange={(next) => {
                const cleaned = sanitizeDailyContent(next, note.date);
                setContent(cleaned);
                setIsDirty(cleaned !== lastSavedRef.current);
              }}
            />
         </div>
         
         {/* Footer / Status Bar if needed */}
         {isExpanded && (
             <div className="px-4 py-2 border-t border-gray-50 dark:border-gray-900 flex justify-end">
                 <span className="text-[10px] text-gray-300 dark:text-gray-700 font-mono">
                     {content.length} chars
                 </span>
             </div>
         )}
      </div>
    </div>
  );
};

export default DailyCard;
