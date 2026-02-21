import React, { useState } from 'react';
import RichEditor from '../RichEditor';
import { Calendar, ChevronDown, ChevronUp, Edit2, Save } from 'lucide-react';
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
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(sanitizeDailyContent(note.content || '', note.date));
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (!isEditing) {
      setContent(sanitizeDailyContent(note.content || '', note.date));
    }
  }, [note.content, note.date, isEditing]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const newContent = sanitizeDailyContent(content, note.date);

      const latest = await getFileContent(note.path);
      const shaToUse = latest?.sha || note.sha;

      const result = await putFile(
        note.path,
        newContent,
        `Update daily note ${note.date}`,
        shaToUse
      );
      
      if (onUpdate) {
        onUpdate({ ...note, content: newContent, sha: result.content.sha, isNew: false });
      }
      setContent(newContent);
      setIsEditing(false);
    } catch (error) {
      console.error('Save failed:', error);
      alert('保存失败: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

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
        
        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          {isExpanded && (
            isEditing ? (
              <>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-200 rounded-md"
                >
                  取消
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-3 py-1.5 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded-md flex items-center"
                >
                  {isSaving ? '保存中...' : <><Save size={12} className="mr-1" /> 保存</>}
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title="编辑"
              >
                <Edit2 size={16} />
              </button>
            )
          )}
          <button className="text-gray-400 hover:text-gray-600">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Card Content */}
      {isExpanded && (
        <div className="p-4 pt-0 border-t-0 min-h-[100px]" onClick={(e) => {
          // Prevent collapsing when clicking content area
          e.stopPropagation();
          if (!isEditing) setIsEditing(true);
        }}>
          {isEditing ? (
            <div className="min-h-[200px]" onClick={(e) => e.stopPropagation()}>
               <RichEditor 
                  content={content} 
                  onChange={setContent} 
               />
            </div>
          ) : (
            <div className="max-w-none text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
               <RichEditor 
                  content={content}
                  editable={false}
               />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DailyCard;
