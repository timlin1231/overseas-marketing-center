import React, { useState } from 'react';
import RichEditor from '../RichEditor';
import { Calendar, ChevronDown, ChevronUp, Edit2, Save } from 'lucide-react';
import { putFile } from '../../GitHubService';

const DailyCard = ({ note, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(note.content || '');
  const [isSaving, setIsSaving] = useState(false);

  const date = new Date(note.date);
  const dayOfWeek = date.toLocaleDateString('zh-CN', { weekday: 'long' });
  const isToday = new Date().toDateString() === date.toDateString();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 如果是新文件，GitHubService 会处理创建逻辑，但这里如果是编辑现有卡片，我们直接 putFile
      // 注意：这里的逻辑是全量覆盖，而不是追加。
      // 追加逻辑只用于顶部的快速输入框。
      // 卡片内的编辑应该是自由编辑。
      
      let newContent = content;
      // 确保新文件有 Frontmatter (如果内容为空且是新文件)
      if (note.isNew && !content.startsWith('---')) {
         newContent = `---
date: ${note.date}
type: daily-log
---

# ${note.date} 日记

${content}`;
      }

      const result = await putFile(
        note.path,
        newContent,
        `Update daily note ${note.date}`,
        note.sha
      );
      
      if (onUpdate) {
        onUpdate({ ...note, content: newContent, sha: result.content.sha, isNew: false });
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Save failed:', error);
      alert('保存失败: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-200 ${isToday ? 'ring-2 ring-blue-100 dark:ring-blue-900' : ''}`}>
      {/* Card Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-t-xl"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${isToday ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
            <Calendar size={20} />
          </div>
          <div>
            <div className="flex items-center">
              <span className="font-bold text-gray-800 dark:text-gray-100 mr-2">{note.date}</span>
              <span className="text-xs text-gray-500 font-medium px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                {dayOfWeek}
              </span>
              {isToday && <span className="ml-2 text-xs text-blue-600 font-bold">Today</span>}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {content.length} 字
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
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
          <button className="text-gray-400">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Card Content */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 min-h-screen">
          {isEditing ? (
            <div className="h-full min-h-screen">
               <RichEditor 
                  content={content} 
                  onChange={setContent} 
               />
            </div>
          ) : (
            <div className="prose dark:prose-invert max-w-none text-sm text-gray-600 dark:text-gray-300">
              {/* 这里简单展示 Markdown 内容，实际可以使用 RichEditor 的只读模式 */}
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
