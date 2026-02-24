
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

  // Filter Logic
  const filteredNews = newsItems.filter(item => 
    item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.title_zh?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.site_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white text-gray-900 font-sans">
      {/* Header Section */}
      <header className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-black" />
            AI News Radar
          </h1>
          <p className="text-sm text-gray-500 mt-1">Real-time intelligence from top AI sources</p>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="relative group">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
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
        
        {/* Left Sidebar: History (Matches Layout of other tools) */}
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
            <div className="max-w-5xl mx-auto">
                
                {/* Tabs */}
                <div className="flex gap-6 border-b border-gray-100 mb-8">
                    <button 
                        onClick={() => setActiveTab('latest')}
                        className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'latest' ? 'text-black' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Latest Updates
                        {activeTab === 'latest' && (
                            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
                        )}
                    </button>
                    <button 
                        onClick={() => setActiveTab('trending')}
                        className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'trending' ? 'text-black' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Trending (Top 24h)
                        {activeTab === 'trending' && (
                            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
                        )}
                    </button>
                </div>

                {/* News Grid */}
                {loading && newsItems.length === 0 ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                        <AnimatePresence>
                            {filteredNews.slice(0, 50).map((item, index) => (
                                <motion.div
                                    key={item.id || index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2, delay: index * 0.03 }}
                                    className="group relative bg-white border border-gray-100 rounded-xl p-5 hover:border-gray-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <img 
                                                    src={`https://www.google.com/s2/favicons?domain=${new URL(item.url).hostname}&sz=32`} 
                                                    alt="icon" 
                                                    className="w-4 h-4 rounded-sm opacity-70 grayscale group-hover:grayscale-0 transition-all"
                                                    onError={(e) => e.target.style.display = 'none'}
                                                />
                                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                    {item.site_name}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(item.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-semibold text-gray-900 leading-snug mb-2 group-hover:text-blue-600 transition-colors">
                                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
                                                {item.title_zh || item.title}
                                            </a>
                                        </h3>
                                        
                                        {item.title_zh && item.title !== item.title_zh && (
                                            <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                                                {item.title}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                                        <div className="flex gap-2">
                                            {/* Smart Tags based on content */}
                                            {item.title.toLowerCase().includes('openai') && <StatusBadge type="ai" text="OpenAI" />}
                                            {item.title.toLowerCase().includes('google') && <StatusBadge type="tech" text="Google" />}
                                            {item.title.toLowerCase().includes('apple') && <StatusBadge type="business" text="Apple" />}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => handleSave(item)}
                                                disabled={savingId === item.id}
                                                className={`p-2 rounded-full transition-all ${savingId === item.id ? 'bg-green-50 text-green-600' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-700'}`}
                                                title="Save to Knowledge Base"
                                            >
                                                {savingId === item.id ? (
                                                    <CheckCircle className="w-4 h-4" />
                                                ) : (
                                                    <Bookmark className="w-4 h-4" />
                                                )}
                                            </button>
                                            <a 
                                                href={item.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all"
                                                title="Read Original"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </main>
      </div>
    </div>
  );
};

export default AiNewsRadar;
