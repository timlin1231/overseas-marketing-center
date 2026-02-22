import { useEffect, useRef, useState } from 'react';
import { Loader, RefreshCw, Send } from 'lucide-react';
import RichEditor from '../RichEditor';
import { getFileContent, putFile } from '../../GitHubService';

const TopicFlow = ({ title, path }) => {
  const [content, setContent] = useState('');
  const [sha, setSha] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [quickInput, setQuickInput] = useState('');
  const lastSavedRef = useRef('');
  const saveTimerRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const file = await getFileContent(path);
      if (file) {
        setContent(file.content || '');
        setSha(file.sha);
        lastSavedRef.current = file.content || '';
        setDirty(false);
        return;
      }

      await putFile(path, '', `Create ${path}`);
      const created = await getFileContent(path);
      setContent(created?.content || '');
      setSha(created?.sha || null);
      lastSavedRef.current = created?.content || '';
      setDirty(false);
    } finally {
      setLoading(false);
    }
  };

  const saveNow = async () => {
    if (!dirty) return;
    if (content === lastSavedRef.current) {
      setDirty(false);
      return;
    }

    setSaving(true);
    try {
      const result = await putFile(path, content, `Update ${path}`, sha);
      const nextSha = result?.content?.sha || sha;
      setSha(nextSha);
      lastSavedRef.current = content;
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    load();
  }, [path]);

  useEffect(() => {
    if (!dirty) return;

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
  }, [dirty, content]);

  const appendQuick = async () => {
    const text = quickInput.trim();
    if (!text) return;
    const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const line = `- [${time}] ${text}`;
    const next = content.trim() ? `${content}\n\n${line}` : line;
    setContent(next);
    setQuickInput('');
    setDirty(true);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 shadow-sm z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {saving ? '保存中...' : dirty ? '未保存' : '已保存'}
            <button
              onClick={load}
              className="flex items-center gap-1 hover:text-blue-500"
              type="button"
            >
              <RefreshCw size={12} />
              刷新
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="快速记录一条（自动带时间戳）"
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      appendQuick();
                    }
                  }}
                />
                <button
                  onClick={appendQuick}
                  disabled={!quickInput.trim()}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>

            <div className="min-h-[420px]">
              {loading ? (
                <div className="flex items-center justify-center py-20 text-gray-400">
                  <Loader className="animate-spin mr-2" size={20} />
                  加载中...
                </div>
              ) : (
                <RichEditor
                  content={content}
                  editable={true}
                  autoFocus={true}
                  onChange={(next) => {
                    setContent(next);
                    setDirty(next !== lastSavedRef.current);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicFlow;

