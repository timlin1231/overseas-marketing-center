
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
    // If no filter, group by Site -> Source
    // But original UI often shows flat list by default or grouped by site
    // Let's replicate the "All Sites" view which groups by Site
    
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
    <div className="flex flex-col h-full bg-[#f4f3ef] text-[#12100f] font-sans">
      {/* Custom Background Orbs (Replicating original CSS) */}
      <div className="fixed w-[260px] h-[260px] bg-[#df6f52] rounded-full blur-[46px] opacity-55 -top-[68px] -left-[60px] pointer-events-none z-0" />
      <div className="fixed w-[300px] h-[300px] bg-[#6ca0a9] rounded-full blur-[46px] opacity-55 top-[120px] -right-[80px] pointer-events-none z-0" />

      {/* Header Section */}
      <header className="px-6 py-6 border-b border-black/5 flex justify-between items-center bg-white/60 backdrop-blur-md sticky top-0 z-10 relative">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3 font-display">
            <div className="w-10 h-10 bg-white/80 border border-black/10 rounded-xl flex items-center justify-center shadow-sm">
                <img src="/logo.svg" alt="Logo" className="w-6 h-6" onError={(e) => e.target.style.display='none'} />
                <Newspaper className="w-5 h-5 text-black" />
            </div>
            AI News Radar
          </h1>
          <p className="text-xs tracking-widest text-[#5f5953] mt-1 ml-1 uppercase font-medium">Real-time Intelligence</p>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="relative group">
                <input 
                    type="text" 
                    placeholder="Search titles / sources..." 
                    className="pl-4 pr-10 py-2.5 bg-white/80 border border-black/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d94825]/20 focus:border-[#d94825] w-64 transition-all shadow-sm placeholder:text-gray-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <button 
                onClick={loadData}
                className="p-2.5 bg-white/80 border border-black/10 rounded-xl hover:bg-white hover:border-black/20 transition-all text-[#5f5953] shadow-sm"
                title="Refresh Data"
            >
                <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        
        {/* Left Sidebar: History */}
        <aside className="w-72 border-r border-black/5 bg-white/40 flex flex-col overflow-hidden backdrop-blur-sm">
            <div className="p-4 border-b border-black/5">
                <h3 className="text-xs font-bold text-[#5f5953] uppercase tracking-widest flex items-center gap-2">
                    <Bookmark className="w-3 h-3" />
                    Saved Briefs
                </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {historyItems.length === 0 ? (
                    <div className="text-center py-12 text-[#5f5953]/60 text-sm">
                        No saved briefs yet.
                    </div>
                ) : (
                    historyItems.map((file, idx) => (
                        <div 
                            key={idx}
                            className="group p-3 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-black/5 transition-all cursor-pointer"
                        >
                            <div className="flex items-start justify-between mb-1">
                                <span className="text-[10px] font-bold text-[#5f5953] uppercase tracking-wide">
                                    {file.name.split('_')[0]}
                                </span>
                            </div>
                            <h4 className="text-sm font-medium text-[#12100f] leading-snug line-clamp-2 group-hover:text-[#d94825] transition-colors">
                                {file.name.replace(/^\d{4}-\d{2}-\d{2}_/, '').replace(/_/g, ' ').replace('.md', '')}
                            </h4>
                        </div>
                    ))
                )}
            </div>
        </aside>

        {/* Right Content: News Feed (Replicating original list style) */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                
                {/* Stats / Controls Mock (Simplified) */}
                <div className="flex gap-2 flex-wrap mb-6">
                    <div className="px-3 py-1.5 bg-white/70 border border-black/10 rounded-full text-xs font-medium text-[#5f5953]">
                        Total: {filteredNews.length} items
                    </div>
                    <div className="px-3 py-1.5 bg-white/70 border border-black/10 rounded-full text-xs font-medium text-[#5f5953]">
                        Sites: {groupedNews.length}
                    </div>
                </div>

                {loading && newsItems.length === 0 ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-2 border-[#d94825] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    groupedNews.map(([siteId, siteData]) => (
                        <section key={siteId} className="bg-white/75 backdrop-blur-sm border border-black/10 rounded-3xl overflow-hidden shadow-sm">
                            {/* Site Header */}
                            <header className="flex justify-between items-center px-5 py-3.5 bg-[#d94825]/5 border-b border-black/5">
                                <h3 className="font-bold text-base font-display text-[#12100f]">{siteData.siteName}</h3>
                                <span className="text-xs text-[#5f5953]">{siteData.items.length} items</span>
                            </header>

                            {/* News List */}
                            <div className="divide-y divide-black/5">
                                {siteData.items.map((item, index) => (
                                    <article 
                                        key={item.id || index}
                                        className="group p-4 hover:bg-white transition-colors relative"
                                    >
                                        <div className="flex flex-wrap gap-2 items-center text-xs text-[#5f5953] mb-1.5">
                                            <span className="font-bold text-[#453f39]">{item.site_name}</span>
                                            {item.source && (
                                                <span className="px-2 py-0.5 border border-black/10 rounded-full text-[10px]">
                                                    {item.source}
                                                </span>
                                            )}
                                            <span className="ml-auto font-mono text-[11px] opacity-70">
                                                {new Date(item.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-start gap-4">
                                            <a 
                                                href={item.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-[15px] leading-snug text-[#12100f] hover:text-[#d94825] transition-colors font-medium block flex-1"
                                            >
                                                {item.title_zh || item.title}
                                                {item.title_zh && item.title !== item.title_zh && (
                                                    <div className="text-xs font-normal text-[#5f5953] mt-1 leading-normal">
                                                        {item.title}
                                                    </div>
                                                )}
                                            </a>

                                            <button 
                                                onClick={() => handleSave(item)}
                                                disabled={savingId === item.id}
                                                className={`flex-shrink-0 p-1.5 rounded-full transition-all opacity-0 group-hover:opacity-100 ${
                                                    savingId === item.id 
                                                        ? 'bg-green-50 text-green-600 opacity-100' 
                                                        : 'hover:bg-gray-100 text-gray-400 hover:text-[#d94825]'
                                                }`}
                                                title="Save Brief"
                                            >
                                                {savingId === item.id ? <CheckCircle className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                                            </button>
                                        </div>
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
