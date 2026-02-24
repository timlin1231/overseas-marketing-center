
import React, { useState, useEffect } from 'react';
import { 
  Newspaper, 
  Bookmark, 
  RefreshCcw,
  CheckCircle,
  Search,
  ExternalLink,
  Calendar,
  Clock,
  Trash2,
  Eye,
  Plus,
  MoreVertical,
  FolderOpen,
  X,
  Edit2
} from 'lucide-react';
import { fetchLatestNews, fetchWaytoagiNews, saveNewsToHistory, saveDailyReport, getNewsHistory, deleteNewsHistory, getBriefContent, updateBriefContent } from '../../services/AiNewsService';

// --- Utility Components ---

const ViewBriefModal = ({ file, onClose }) => {
    const [content, setContent] = useState('Loading...');
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const text = await getBriefContent(file.path);
                const initialContent = text || 'No content.';
                setContent(initialContent);
                setEditedContent(initialContent);
            } catch (e) {
                console.error(e);
                setContent('Error loading content. Please check your network.');
            }
        };
        if (file?.path) load();
    }, [file]);

    const handleSaveEdit = async () => {
        setIsSaving(true);
        try {
             await updateBriefContent(file.path, editedContent);
             setContent(editedContent);
             setIsEditing(false);
             alert('Brief updated successfully!');
        } catch (e) {
            console.error(e);
            alert('Failed to save changes. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="font-bold text-lg text-gray-900">{file.name}</h3>
                    <div className="flex items-center gap-2">
                        {!isEditing ? (
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                title="Edit Brief"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                        ) : (
                            <button 
                                onClick={handleSaveEdit}
                                disabled={isSaving}
                                className="px-3 py-1.5 bg-black text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-0 bg-gray-50 relative">
                    {isEditing ? (
                        <textarea 
                            className="w-full h-full p-6 bg-white font-mono text-sm text-gray-700 resize-none focus:outline-none"
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                        />
                    ) : (
                        <div className="p-6">
                            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">{content}</pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- Utility Functions ---

const fmtNumber = (n) => new Intl.NumberFormat("zh-CN").format(n || 0);

const fmtTime = (iso) => {
  if (!iso) return "时间未知";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "时间未知";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
};

const fmtDate = (iso) => {
  if (!iso) return "未知日期";
  const d = new Date(`${iso}T00:00:00`); // Ensure local time interpretation if just date
  if (Number.isNaN(d.getTime())) {
      // Try parsing as full ISO if simple date fails
      const d2 = new Date(iso);
      if (!Number.isNaN(d2.getTime())) return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit" }).format(d2);
      return iso;
  }
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  }).format(d);
};

// --- Components ---

const NewsItem = ({ item, onSave, isSaving, savedIds }) => {
    const isSaved = savedIds.includes(item.id);

    return (
        <article className="group relative flex items-start justify-between gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 uppercase tracking-wide">
                        {item.site_name}
                    </span>
                    <span className="text-[10px] font-medium text-gray-400">
                        {item.source || 'General'}
                    </span>
                    <span className="text-[10px] text-gray-300 font-mono flex items-center gap-1">
                       <Clock className="w-3 h-3" />
                       {fmtTime(item.published_at || item.first_seen_at)}
                    </span>
                </div>
                
                <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm font-medium text-gray-900 hover:text-blue-600 leading-snug block group-hover:underline decoration-blue-200 underline-offset-2"
                >
                    {item.title_zh || item.title}
                </a>
                
                {item.title_zh && item.title !== item.title_zh && (
                    <div className="text-xs text-gray-400 mt-0.5 truncate font-light">
                        {item.title}
                    </div>
                )}
            </div>

            <button 
                onClick={() => onSave(item)}
                disabled={isSaving || isSaved}
                className={`flex-shrink-0 p-1.5 rounded-md transition-all ${
                    isSaved
                        ? 'bg-green-50 text-green-600' 
                        : 'text-gray-300 hover:text-gray-600 hover:bg-white hover:shadow-sm'
                }`}
                title={isSaved ? "Saved" : "Save Brief"}
            >
                {isSaved ? <CheckCircle className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>
        </article>
    );
};

const SourceGroup = ({ source, items, onSave, savingId, savedIds }) => (
    <div className="mb-4 last:mb-0">
        <div className="flex items-center gap-2 mb-2 px-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{source}</h4>
            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 rounded-full">{items.length}</span>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden divide-y divide-gray-50">
            {items.map((item, idx) => (
                <NewsItem 
                    key={item.id || idx} 
                    item={item} 
                    onSave={onSave} 
                    isSaving={savingId === item.id}
                    savedIds={savedIds}
                />
            ))}
        </div>
    </div>
);

const SiteGroup = ({ siteName, items, onSave, savingId, savedIds }) => {
    // Group items by source within the site
    const sourceGroups = React.useMemo(() => {
        const map = new Map();
        items.forEach(item => {
            const key = item.source || 'Default';
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(item);
        });
        return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
    }, [items]);

    return (
        <section className="mb-8">
            <header className="flex items-center gap-3 mb-4 px-1">
                <div className="h-6 w-1 bg-gray-900 rounded-full"></div>
                <h3 className="font-bold text-lg text-gray-900">{siteName}</h3>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                    {items.length} items
                </span>
            </header>
            
            <div className="space-y-4">
                {sourceGroups.map(([source, groupItems]) => (
                    <SourceGroup 
                        key={source} 
                        source={source} 
                        items={groupItems} 
                        onSave={onSave}
                        savingId={savingId}
                        savedIds={savedIds}
                    />
                ))}
            </div>
        </section>
    );
};

// --- Main Page Component ---

const AiNewsRadar = () => {
  // Data States
  const [newsData, setNewsData] = useState(null);
  const [waytoagiData, setWaytoagiData] = useState(null);
  const [newsItems, setNewsItems] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [savedIds, setSavedIds] = useState([]); // Track saved IDs for UI feedback
  const [viewFile, setViewFile] = useState(null); // File to view in modal
  
  // Category Management States
  const [categories, setCategories] = useState(() => {
      const saved = localStorage.getItem('ai_news_categories');
      return saved ? JSON.parse(saved) : [
          { id: 'ai_news', name: 'AI News Information', type: 'default' },
          { id: 'industry_monitor', name: 'Industry Monitoring', type: 'custom' }
      ];
  });
  const [activeCategory, setActiveCategory] = useState('ai_news');
  const [isEditingCats, setIsEditingCats] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  const [mode, setMode] = useState('ai'); // 'ai' | 'all'
  const [dedupe, setDedup] = useState(true);
  const [waytoagiMode, setWaytoagiMode] = useState('today'); // 'today' | '7d'

  // Persist Categories
  useEffect(() => {
      localStorage.setItem('ai_news_categories', JSON.stringify(categories));
  }, [categories]);

  // Initial Load
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [news, waytoagi, history] = await Promise.all([
        fetchLatestNews(),
        fetchWaytoagiNews(),
        getNewsHistory()
      ]);

      setNewsData(news);
      setWaytoagiData(waytoagi);
      setHistoryItems(history || []);
      
      // Initialize news items
      const initialItems = news.items_ai || news.items || [];
      setNewsItems(initialItems);

    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Re-calculate displayed items when filters/mode change
  useEffect(() => {
    if (!newsData) return;

    let items = [];
    if (activeCategory === 'ai_news') {
        if (mode === 'ai') {
            items = newsData.items_ai || [];
        } else {
            items = dedupe 
                ? (newsData.items_all || [])
                : (newsData.items_all_raw || []);
        }
    } else {
        // Placeholder for other categories
        items = []; 
    }
    setNewsItems(items);
  }, [mode, dedupe, newsData, activeCategory]);

  // Derived Statistics
  const stats = newsData ? {
    aiCount: newsData.total_items || 0,
    allCount: newsData.total_items_raw || 0,
    allDedupCount: newsData.total_items_all_mode || 0,
    siteCount: newsData.site_count || 0,
    sourceCount: newsData.source_count || 0,
    archiveTotal: newsData.archive_total || 0,
    generatedAt: newsData.generated_at
  } : null;

  // Site Stats for Filters
  const siteStats = React.useMemo(() => {
    if (!newsItems.length) return [];
    const m = new Map();
    newsItems.forEach(item => {
        if (!m.has(item.site_id)) {
            m.set(item.site_id, { id: item.site_id, name: item.site_name, count: 0 });
        }
        m.get(item.site_id).count++;
    });
    return Array.from(m.values()).sort((a, b) => b.count - a.count);
  }, [newsItems]);

  // WaytoAGI Logic
  const waytoagiView = React.useMemo(() => {
      if (!waytoagiData) return { updates: [], count: 0 };
      
      const updates7d = waytoagiData.updates_7d || [];
      const updatesToday = waytoagiData.updates_today || [];
      
      // Fallback logic if updates_today is empty but we have data in 7d
      const latestDate = waytoagiData.latest_date || (updates7d.length ? updates7d[0].date : null);
      const effectiveToday = updatesToday.length 
          ? updatesToday 
          : (latestDate ? updates7d.filter(u => u.date === latestDate) : []);

      if (waytoagiMode === 'today') {
          return { updates: effectiveToday, count: effectiveToday.length, label: `Today (${latestDate || '--'})` };
      } else {
          return { updates: updates7d, count: updates7d.length, label: 'Last 7 Days' };
      }
  }, [waytoagiData, waytoagiMode]);

  // Grouping Logic for Main List
  const groupedNews = React.useMemo(() => {
      // 1. Filter
      const filtered = newsItems.filter(item => {
        if (siteFilter && item.site_id !== siteFilter) return false;
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        const hay = `${item.title || ""} ${item.title_zh || ""} ${item.title_en || ""} ${item.site_name || ""} ${item.source || ""}`.toLowerCase();
        return hay.includes(q);
      });

      // 2. Group
      // If specific site filter is active, we just return one "pseudo-site" group containing all items
      // The rendering logic inside SiteGroup will handle the source grouping.
      if (siteFilter) {
          if (filtered.length === 0) return [];
          const siteName = filtered[0].site_name || siteFilter;
          return [[siteFilter, { siteName, items: filtered }]];
      }

      // Default: Group by Site
      const siteMap = new Map();
      filtered.forEach(item => {
          if (!siteMap.has(item.site_id)) {
              siteMap.set(item.site_id, {
                  siteName: item.site_name || item.site_id,
                  items: []
              });
          }
          siteMap.get(item.site_id).items.push(item);
      });

      return Array.from(siteMap.entries()).sort((a, b) => b[1].items.length - a[1].items.length);
  }, [newsItems, siteFilter, searchQuery]);

  // Handlers
  const handleSave = async (item) => {
    if (savingId) return;
    setSavingId(item.id);
    try {
      await saveNewsToHistory(item);
      setSavedIds(prev => [...prev, item.id]);
      // Refresh history sidebar
      const newHistory = await getNewsHistory();
      setHistoryItems(newHistory);
    } catch (err) {
      console.error('Failed to save:', err);
      alert('Failed to save to Knowledge Base');
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveReport = async () => {
      if (savingId === 'report' || !newsData) return;
      setSavingId('report');
      try {
          await saveDailyReport(newsData, waytoagiData);
          // Wait a bit for GitHub API consistency
          await new Promise(r => setTimeout(r, 1000));
          const newHistory = await getNewsHistory();
          setHistoryItems(newHistory);
          alert('Daily Report Saved Successfully!');
      } catch (err) {
          console.error('Failed to save report:', err);
          alert('Failed to save report. Please check the console for details.');
      } finally {
          setSavingId(null);
      }
  };

  const handleDeleteBrief = async (e, file) => {
      e.stopPropagation();
      if (!confirm(`Are you sure you want to delete "${file.name}"?`)) return;
      
      try {
          await deleteNewsHistory(file.path);
          // Wait a bit for GitHub API consistency
          await new Promise(r => setTimeout(r, 500));
          const newHistory = await getNewsHistory();
          setHistoryItems(newHistory);
      } catch (err) {
          console.error(err);
          alert('Failed to delete brief.');
      }
  };

  const handleAddCategory = () => {
      const name = prompt("Enter category name:");
      if (!name) return;
      const id = 'cat_' + Date.now();
      setCategories([...categories, { id, name, type: 'custom' }]);
      setActiveCategory(id);
  };

  const handleDeleteCategory = (e, id) => {
      e.stopPropagation();
      if (!confirm('Delete this category?')) return;
      setCategories(categories.filter(c => c.id !== id));
      if (activeCategory === id) setActiveCategory('ai_news');
  };

  return (
    <div className="flex flex-col h-full bg-[#fcfcfc] text-gray-900 font-sans">
      {viewFile && <ViewBriefModal file={viewFile} onClose={() => setViewFile(null)} />}
      
      {/* Header */}
      <header className="px-8 py-5 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-20 flex justify-between items-center">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shadow-md">
                <Newspaper className="w-5 h-5" />
            </div>
            <div>
                <h1 className="text-xl font-bold tracking-tight text-gray-900">AI News Radar</h1>
                <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">Global Intelligence Network</p>
            </div>
        </div>
        
        <div className="flex items-center gap-3">
             <span className="text-xs text-gray-400 font-mono">
                Updated: {stats ? fmtTime(stats.generatedAt) : '--:--'}
            </span>
            <button 
                onClick={handleSaveReport}
                disabled={savingId === 'report'}
                className="flex items-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-black transition-colors disabled:opacity-50"
            >
                {savingId === 'report' ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <Bookmark className="w-3 h-3" />
                )}
                Save Daily Report
            </button>
            <button 
                onClick={loadAllData}
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                title="Refresh Data"
            >
                <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar: Saved Briefs */}
        <aside className="w-72 border-r border-gray-100 bg-gray-50/50 flex flex-col overflow-hidden">
            
            {/* Category Switcher (Requested Feature) */}
            <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <FolderOpen className="w-3 h-3" />
                        Monitoring
                    </h3>
                    <button onClick={handleAddCategory} className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-black transition-colors" title="Add Category">
                        <Plus className="w-3 h-3" />
                    </button>
                </div>
                <div className="space-y-1">
                    {categories.map(cat => (
                        <div 
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`group flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${
                                activeCategory === cat.id 
                                    ? 'bg-white text-black shadow-sm ring-1 ring-gray-200' 
                                    : 'text-gray-500 hover:text-black hover:bg-gray-100'
                            }`}
                        >
                            <span className="truncate">{cat.name}</span>
                            {cat.type === 'custom' && (
                                <button 
                                    onClick={(e) => handleDeleteCategory(e, cat.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Bookmark className="w-3 h-3" />
                    Saved Briefs
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {historyItems.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm">
                        No saved briefs.
                    </div>
                ) : (
                    historyItems.map((file, idx) => (
                        <div 
                            key={idx}
                            onClick={() => setViewFile(file)}
                            className="group relative p-3 rounded-lg bg-white border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">
                                    {file.name.split('_')[0]}
                                </span>
                                <button 
                                    onClick={(e) => handleDeleteBrief(e, file)}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                    title="Delete Brief"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                            <h4 className="text-sm font-medium text-gray-700 group-hover:text-black leading-snug line-clamp-2 pr-4">
                                {file.name.replace(/^\d{4}-\d{2}-\d{2}_/, '').replace(/_/g, ' ').replace('.md', '')}
                            </h4>
                        </div>
                    ))
                )}
            </div>
        </aside>

        {/* Main Feed */}
        <main className="flex-1 overflow-y-auto bg-white scroll-smooth">
            {activeCategory === 'ai_news' ? (
                <div className="max-w-4xl mx-auto px-8 py-8 space-y-8">
                    {/* ... (Existing AI News Content) ... */}
                    {/* 1. Statistics Dashboard */}
                    {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {[
                                ['24h AI', stats.aiCount],
                                ['24h All', stats.allCount],
                                ['Deduped', stats.allDedupCount],
                                ['Sites', stats.siteCount],
                                ['Sources', stats.sourceCount],
                                ['Archive', stats.archiveTotal],
                            ].map(([label, val]) => (
                                <div key={label} className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</div>
                                    <div className="text-2xl font-bold text-gray-900">{fmtNumber(val)}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 2. Controls & Filters */}
                    <div className="bg-white sticky top-0 z-10 py-4 -mx-2 px-2 border-b border-transparent">
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Search topics, sources..." 
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                
                                <select 
                                    value={siteFilter}
                                    onChange={(e) => setSiteFilter(e.target.value)}
                                    className="pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-black cursor-pointer appearance-none min-w-[160px]"
                                >
                                    <option value="">All Sites</option>
                                    {siteStats.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.count})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                    <button 
                                        onClick={() => setMode('ai')}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${mode === 'ai' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                    >
                                        AI Focused
                                    </button>
                                    <button 
                                        onClick={() => setMode('all')}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${mode === 'all' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                    >
                                        All News
                                    </button>
                                </div>
                                
                                {mode === 'all' && (
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input 
                                            type="checkbox" 
                                            checked={dedupe}
                                            onChange={(e) => setDedup(e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black" 
                                        />
                                        <span className="text-sm font-medium text-gray-600">Deduplicate</span>
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 3. WaytoAGI Section */}
                    {waytoagiData && (
                        <section className="bg-gray-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
                            
                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div>
                                    <h2 className="text-lg font-bold flex items-center gap-2">
                                        WaytoAGI Updates
                                        <span className="px-2 py-0.5 bg-white/10 text-xs font-normal rounded-full">{waytoagiView.label}</span>
                                    </h2>
                                    <div className="text-xs text-gray-400 mt-1 flex gap-2">
                                        <a href={waytoagiData.root_url} target="_blank" className="hover:text-white underline">Home</a>
                                        <span>•</span>
                                        <a href={waytoagiData.history_url} target="_blank" className="hover:text-white underline">History</a>
                                    </div>
                                </div>
                                <div className="flex bg-white/10 p-1 rounded-lg">
                                    <button 
                                        onClick={() => setWaytoagiMode('today')}
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${waytoagiMode === 'today' ? 'bg-white text-black' : 'text-gray-300 hover:text-white'}`}
                                    >
                                        Today
                                    </button>
                                    <button 
                                        onClick={() => setWaytoagiMode('7d')}
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${waytoagiMode === '7d' ? 'bg-white text-black' : 'text-gray-300 hover:text-white'}`}
                                    >
                                        7 Days
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3 relative z-10 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {waytoagiView.updates.length === 0 ? (
                                    <div className="text-gray-500 text-sm py-4 text-center">No updates found for this period.</div>
                                ) : (
                                    waytoagiView.updates.map((u, i) => (
                                        <a 
                                            key={i} 
                                            href={u.url} 
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-4 group hover:bg-white/5 p-2 rounded-lg transition-colors"
                                        >
                                            <span className="text-xs font-mono text-gray-500 min-w-[60px]">{fmtDate(u.date)}</span>
                                            <span className="text-sm text-gray-200 group-hover:text-white group-hover:underline underline-offset-4 decoration-purple-400">{u.title}</span>
                                        </a>
                                    ))
                                )}
                            </div>
                        </section>
                    )}

                    {/* 4. Main News List */}
                    <div className="min-h-[200px]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mb-4"></div>
                                <p className="text-sm">Loading intelligence...</p>
                            </div>
                        ) : groupedNews.length === 0 ? (
                            <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <p className="text-gray-500">No news found matching your filters.</p>
                                <button 
                                    onClick={() => {setSearchQuery(''); setSiteFilter(''); setMode('ai');}}
                                    className="mt-4 text-sm font-medium text-blue-600 hover:underline"
                                >
                                    Clear filters
                                </button>
                            </div>
                        ) : (
                            groupedNews.map(([siteId, siteData]) => (
                                <SiteGroup 
                                    key={siteId}
                                    siteName={siteData.siteName}
                                    items={siteData.items}
                                    onSave={handleSave}
                                    savingId={savingId}
                                    savedIds={savedIds}
                                />
                            ))
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                    <FolderOpen className="w-12 h-12 mb-4 text-gray-200" />
                    <h2 className="text-lg font-bold text-gray-900 mb-2">
                        {categories.find(c => c.id === activeCategory)?.name}
                    </h2>
                    <p className="max-w-md">
                        This monitoring category is currently empty. Configure sources or scripts to populate this feed.
                    </p>
                </div>
            )}
        </main>
      </div>
    </div>
  );
};

export default AiNewsRadar;
