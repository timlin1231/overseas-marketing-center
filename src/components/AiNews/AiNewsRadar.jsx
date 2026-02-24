
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Newspaper, 
  Bookmark, 
  ExternalLink, 
  TrendingUp, 
  Search, 
  Calendar,
  Clock,
  RefreshCcw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { fetchLatestNews, saveNewsToHistory, getNewsHistory } from '../../services/AiNewsService';

// --- Utility Components ---

const StatusBadge = ({ type, text }) => {
  const colors = {
    tech: 'bg-blue-50 text-blue-700 border-blue-200',
    ai: 'bg-purple-50 text-purple-700 border-purple-200',
    business: 'bg-green-50 text-green-700 border-green-200',
    default: 'bg-gray-50 text-gray-700 border-gray-200'
  };
  
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${colors[type] || colors.default}`}>
      {text}
    </span>
  );
};

// --- Main Component ---

const AiNewsRadar = () => {
  const [activeTab, setActiveTab] = useState('latest');
  const [newsItems, setNewsItems] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Initial Load
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load News
      const data = await fetchLatestNews();
      // Handle potential different JSON structures based on the python script output
      const items = data.items || [];
      setNewsItems(items);

      // Load History
      const history = await getNewsHistory();
      setHistoryItems(history || []);
      
    } catch (err) {
      console.error(err);
      setError('Failed to load AI news data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (item) => {
    if (savingId) return;
    setSavingId(item.id);
    try {
      await saveNewsToHistory(item);
      // Refresh history locally
      const newHistory = await getNewsHistory();
      setHistoryItems(newHistory);
    } catch (err) {
      console.error('Failed to save news item:', err);
      alert('Failed to save to Knowledge Base');
    } finally {
      setSavingId(null);
    }
  };

  // Filter Logic - Using same logic as original app.js
  const filteredNews = newsItems.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const hay = `${item.title || ""} ${item.title_zh || ""} ${item.title_en || ""} ${item.site_name || ""} ${item.source || ""}`.toLowerCase();
    return hay.includes(q);
  });

  // Grouping Logic (Replicating original site)
  const groupItems = (items) => {
    // Replicate the exact grouping from original: 
    // 1. Compute stats per site
    // 2. Sort sites by count desc
    // 3. Group by Source inside Site is not in the original list view, it's flat list or site-grouped.
    // Let's strictly follow the screenshot logic: Group by Site.
    
    const siteMap = new Map();
    items.forEach(item => {
        if (!siteMap.has(item.site_id)) {
            siteMap.set(item.site_id, {
                siteName: item.site_name || item.site_id,
                items: []
            });
        }
        siteMap.get(item.site_id).items.push(item);
    });

    // Sort sites by item count desc
    return Array.from(siteMap.entries()).sort((a, b) => {
        return b[1].items.length - a[1].items.length;
    });
  };

  const groupedNews = groupItems(filteredNews);

  return (
    <div className="flex flex-col h-full bg-white text-gray-900 font-sans">
      {/* Header Section - Standard Layout Style */}
      <header className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-black" />
            AI News Radar
          </h1>
          <p className="text-sm text-gray-500 mt-1">Real-time intelligence from top AI sources</p>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="relative group">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search news..." 
                    className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-300 w-64 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <button 
                onClick={loadData}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-900"
                title="Refresh Data"
            >
                <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar: History - Standard Layout Style */}
        <aside className="w-80 border-r border-gray-100 bg-gray-50/50 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Bookmark className="w-3 h-3" />
                    Saved Briefs
                </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {historyItems.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm">
                        No saved briefs yet.
                    </div>
                ) : (
                    historyItems.map((file, idx) => (
                        <div 
                            key={idx}
                            className="group p-3 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 transition-all cursor-pointer"
                        >
                            <div className="flex items-start justify-between">
                                <span className="text-xs font-medium text-gray-500 font-mono">
                                    {file.name.split('_')[0]}
                                </span>
                                <ExternalLink className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <h4 className="text-sm font-medium text-gray-800 mt-1 line-clamp-2 leading-snug">
                                {file.name.replace(/^\d{4}-\d{2}-\d{2}_/, '').replace(/_/g, ' ').replace('.md', '')}
                            </h4>
                        </div>
                    ))
                )}
            </div>
        </aside>

        {/* Right Content: News Feed */}
        <main className="flex-1 overflow-y-auto p-8 bg-white">
            <div className="max-w-5xl mx-auto space-y-8">
                
                {/* Stats Header - Matching Screenshot Logic */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="text-xs text-gray-500 mb-1">Total Items (24h)</div>
                        <div className="text-2xl font-bold">{filteredNews.length}</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="text-xs text-gray-500 mb-1">Active Sites</div>
                        <div className="text-2xl font-bold">{groupedNews.length}</div>
                    </div>
                </div>

                {loading && newsItems.length === 0 ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div>
                    </div>
                ) : (
                    groupedNews.map(([siteId, siteData]) => (
                        <section key={siteId} className="border border-gray-200 rounded-xl overflow-hidden">
                            {/* Site Header - Matching Screenshot Style */}
                            <header className="flex justify-between items-center px-5 py-3 bg-gray-50 border-b border-gray-200">
                                <h3 className="font-bold text-sm text-gray-900">{siteData.siteName}</h3>
                                <span className="text-xs text-gray-500">{siteData.items.length} items</span>
                            </header>

                            {/* News List */}
                            <div className="divide-y divide-gray-100">
                                {siteData.items.map((item, index) => (
                                    <article 
                                        key={item.id || index}
                                        className="group p-4 hover:bg-blue-50/30 transition-colors relative flex items-start justify-between gap-4"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                                    {item.source || 'General'}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-mono">
                                                   {new Date(item.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            
                                            <a 
                                                href={item.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-sm font-medium text-gray-900 hover:text-blue-600 leading-snug block"
                                            >
                                                {item.title_zh || item.title}
                                            </a>
                                            
                                            {item.title_zh && item.title !== item.title_zh && (
                                                <div className="text-xs text-gray-500 mt-0.5 truncate">
                                                    {item.title}
                                                </div>
                                            )}
                                        </div>

                                        <button 
                                            onClick={() => handleSave(item)}
                                            disabled={savingId === item.id}
                                            className={`flex-shrink-0 p-1.5 rounded-md transition-all ${
                                                savingId === item.id 
                                                    ? 'bg-green-50 text-green-600' 
                                                    : 'text-gray-300 hover:text-gray-600 hover:bg-gray-100'
                                            }`}
                                            title="Save Brief"
                                        >
                                            {savingId === item.id ? <CheckCircle className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                                        </button>
                                    </article>
                                ))}
                            </div>
                        </section>
                    ))
                )}
            </div>
        </main>
      </div>
    </div>
  );
};

export default AiNewsRadar;
