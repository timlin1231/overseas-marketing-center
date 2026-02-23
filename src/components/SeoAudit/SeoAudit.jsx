
import React, { useState, useEffect } from 'react';
import { useTask } from '../../context/TaskContext';
import { 
  Search, 
  Activity, 
  Layout, 
  List, 
  History,
  Trash2,
  FileText,
  Download,
  CheckCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Globe,
  Smartphone,
  Code,
  Bot,
  TrendingUp,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  performSeoAudit, 
  getAuditHistory, 
  saveAuditResult, 
  deleteAuditRecord,
  exportToCsv 
} from '../../services/SeoService';

// --- Utility Components ---

const Badge = ({ children, color = 'gray' }) => {
  const colors = {
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider ${colors[color] || colors.gray}`}>
      {children}
    </span>
  );
};

const Card = ({ children, className = '' }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className={`bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm hover:border-gray-400 dark:hover:border-gray-600 transition-colors ${className}`}
  >
    {children}
  </motion.div>
);

const ProgressStep = ({ currentStep }) => {
  const steps = ['DNS', 'Server', 'Crawl', 'Content', 'Report'];
  const percentage = Math.min(((currentStep - 1) / (steps.length - 1)) * 100, 100);

  return (
    <div className="w-full max-w-xl mx-auto my-12">
      <div className="flex justify-between mb-2 text-xs font-mono text-gray-400 uppercase tracking-widest">
        <span>Progress</span>
        <span>{percentage.toFixed(0)}%</span>
      </div>
      <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-black dark:bg-white"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>
      <div className="flex justify-between mt-4">
        {steps.map((label, idx) => {
            const stepNum = idx + 1;
            const isActive = currentStep >= stepNum;
            return (
                <div key={idx} className={`flex flex-col items-center transition-colors duration-300 ${isActive ? 'text-black dark:text-white' : 'text-gray-300 dark:text-gray-700'}`}>
                    <span className="text-[10px] font-mono uppercase tracking-wider">{label}</span>
                </div>
            )
        })}
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, subtext, icon: Icon }) => {
  const numValue = parseInt(value);
  const statusColor = isNaN(numValue) 
    ? 'bg-gray-200' 
    : numValue >= 90 ? 'bg-green-500' 
    : numValue >= 50 ? 'bg-yellow-500' 
    : 'bg-red-500';

  return (
    <Card className="p-6 flex flex-col justify-between h-32 relative overflow-hidden group">
      <div className="flex justify-between items-start">
        <span className="text-xs font-mono uppercase text-gray-500 tracking-wider">{title}</span>
        {Icon && <Icon size={16} className="text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors" />}
      </div>
      
      <div className="flex items-end space-x-2">
          <span className="text-4xl font-bold tracking-tight font-sans">{value}</span>
          {subtext && <span className="text-xs text-gray-400 mb-1.5">{subtext}</span>}
      </div>

      <div className={`absolute bottom-0 left-0 h-1 w-full ${statusColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
    </Card>
  );
};

const TrafficSection = ({ data }) => {
    if (!data || !data.success || !data.data) return null;

    return (
        <Card className="mb-6 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                <div className="flex items-center space-x-3">
                    <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-md text-purple-600 dark:text-purple-400">
                        <TrendingUp size={16} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold">Traffic Analytics</h3>
                        <div className="flex items-center text-[10px] text-gray-400 space-x-2">
                             <span>Source: {data.source}</span>
                             {data.message && (
                                <span className="flex items-center text-amber-500">
                                    <AlertTriangle size={10} className="mr-1" />
                                    {data.message}
                                </span>
                             )}
                        </div>
                    </div>
                </div>
                <a 
                    href={data.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs flex items-center text-gray-500 hover:text-black dark:hover:text-white transition-colors"
                >
                    Details <ExternalLink size={10} className="ml-1" />
                </a>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-y md:divide-y-0 divide-gray-100 dark:divide-gray-800">
                {[
                    { label: 'Global Rank', value: data.data.globalRank || '-' },
                    { label: 'Total Visits', value: data.data.totalVisits },
                    { label: 'Bounce Rate', value: data.data.bounceRate },
                    { label: 'Pages / Visit', value: data.data.pagesPerVisit },
                    { label: 'Avg Duration', value: data.data.avgDuration }
                ].map((item, idx) => (
                    <div key={idx} className="p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                        <p className="text-2xl font-mono font-semibold text-black dark:text-white mb-1 tracking-tight">
                            {item.value || '-'}
                        </p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">{item.label}</p>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const AuditSection = ({ title, icon: Icon, data, index }) => {
  const [expanded, setExpanded] = useState(index === 0);

  if (!data || !Array.isArray(data.items)) return null;

  const score = data.totalItems > 0 ? Math.round((data.passedItems / data.totalItems) * 100) : 0;
  const scoreColor = score >= 80 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500';

  return (
    <Card className="mb-4 overflow-hidden">
      <div 
        className="p-4 flex justify-between items-center cursor-pointer select-none group"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-md text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors">
            {Icon && <Icon size={18} />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</h3>
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              {data.passedItems}/{data.totalItems} Passed
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
            <div className="flex flex-col items-end mr-2">
                <span className={`text-lg font-bold font-mono ${scoreColor}`}>{score}%</span>
            </div>
            {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>
      
      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-100 dark:border-gray-800"
          >
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.items.map((item, idx) => (
                <div key={idx} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors flex items-start space-x-4">
                    <div className="mt-1 flex-shrink-0">
                        {item.status === 'pass' ? (
                            <CheckCircle size={16} className="text-green-500" />
                        ) : item.status === 'warning' ? (
                            <AlertTriangle size={16} className="text-yellow-500" />
                        ) : item.status === 'info' ? (
                            <Info size={16} className="text-blue-500" />
                        ) : (
                            <AlertTriangle size={16} className="text-red-500" />
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.category}</h4>
                            {item.priority && item.status !== 'pass' && (
                                <Badge color={item.priority === 'critical' ? 'red' : 'yellow'}>
                                    {item.priority}
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                        
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs bg-gray-50 dark:bg-gray-900/50 p-2 rounded border border-gray-100 dark:border-gray-800">
                            <div>
                                <span className="text-gray-400 block mb-0.5 uppercase text-[10px] tracking-wider">Current State</span>
                                <span className="font-mono text-gray-700 dark:text-gray-300 break-all">{item.currentState}</span>
                            </div>
                            {item.status !== 'pass' && (
                                <div>
                                    <span className="text-gray-400 block mb-0.5 uppercase text-[10px] tracking-wider">Suggestion</span>
                                    <span className="text-blue-600 dark:text-blue-400">{item.suggestion}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

const SeoAudit = () => {
  const { 
    seoAuditState, 
    updateSeoAudit, 
    refreshSeoHistory 
  } = useTask();
  
  const { loading, progress, result, error, domain, history } = seoAuditState;
  
  const [recentDomains, setRecentDomains] = useState([]);

  useEffect(() => {
    // Only update recentDomains when history changes
    if (history && history.length > 0) {
        const unique = [...new Set(history.map(h => h.domain))].slice(0, 5);
        setRecentDomains(unique);
    }
  }, [history]);

  const handleAudit = async (e) => {
    e?.preventDefault();
    if (!domain.trim()) return;

    let targetDomain = domain.trim();
    if (!targetDomain.startsWith('http')) {
      targetDomain = `https://${targetDomain}`;
      updateSeoAudit({ domain: targetDomain });
    }

    updateSeoAudit({ loading: true, result: null, error: null, progress: 1 });

    const stepInterval = setInterval(() => {
        // Only update progress if still loading
        updateSeoAudit({ progress: Math.min(4, (seoAuditState.progress || 1) + 1) });
    }, 800);

    try {
      const data = await performSeoAudit(targetDomain);
      
      // Save result immediately
      await saveAuditResult(data);
      refreshSeoHistory(); // Refresh history list
      
      clearInterval(stepInterval);
      updateSeoAudit({ 
          loading: false, 
          progress: 5, 
          result: data 
      });
      
      setTimeout(() => {
        updateSeoAudit({ progress: 0 });
      }, 500);

    } catch (err) {
      clearInterval(stepInterval);
      updateSeoAudit({ 
          loading: false, 
          progress: 0, 
          error: err.message || 'Audit failed. Please try again.' 
      });
    }
  };

  const handleDeleteHistory = async (timestamp) => {
    if (window.confirm('Delete this record?')) {
      await deleteAuditRecord(timestamp);
      refreshSeoHistory();
    }
  };

  const loadHistoryItem = (item) => {
      updateSeoAudit({ 
          result: item, 
          domain: item.domain,
          error: null 
      });
  };

  return (
    <div className="flex h-full bg-white dark:bg-black text-black dark:text-white font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Sidebar - History List */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-800 flex flex-col flex-shrink-0 bg-gray-50/50 dark:bg-black">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between h-16">
          <div className="font-bold flex items-center text-sm tracking-wide">
            <History className="mr-2" size={16} />
            AUDIT HISTORY
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest px-2 mb-2 mt-2">History</div>
          {!history || history.length === 0 ? (
            <div className="px-2 py-4 text-xs text-gray-400">No recent audits</div>
          ) : (
            history.map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => loadHistoryItem(item)}
                className={`group px-3 py-2.5 rounded-md cursor-pointer text-sm flex justify-between items-center transition-all ${
                  result && result.timestamp === item.timestamp
                    ? 'bg-white dark:bg-gray-900 shadow-sm text-black dark:text-white ring-1 ring-gray-200 dark:ring-gray-800'
                    : 'text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-900'
                }`}
              >
                <span className="truncate w-32 font-medium">
                  {item.domain.replace(/^https?:\/\/(www\.)?/, '')}
                </span>
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className={`text-[10px] font-mono ${
                        (item.overallScore?.overall || 0) >= 80 ? 'text-green-500' : 'text-gray-400'
                    }`}>
                        {item.overallScore?.overall || 0}
                    </span>
                    <button 
                        onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteHistory(item.timestamp);
                        }}
                        className="text-gray-400 hover:text-red-500"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Sticky Header */}
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <h1 className="text-sm font-bold tracking-tight">
                {result ? result.domain : 'New Audit'}
                </h1>
                {result && (
                    <Badge color={result.overallScore?.overall >= 80 ? 'green' : 'gray'}>
                        {result.overallScore?.overall >= 80 ? 'Excellent' : 'Audit Complete'}
                    </Badge>
                )}
            </div>
            {result && (
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => window.print()} 
                  className="p-2 text-gray-500 hover:text-black dark:hover:text-white transition-colors"
                  title="Print"
                >
                  <FileText size={18} />
                </button>
                <button 
                  onClick={() => exportToCsv(result)} 
                  className="flex items-center px-3 py-1.5 text-xs font-medium bg-black text-white dark:bg-white dark:text-black rounded-md hover:opacity-80 transition-opacity"
                >
                  <Download size={14} className="mr-1.5" />
                  Export CSV
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-6 py-12">
            
            {/* Search Input Area */}
            <div className={`transition-all duration-500 ${result ? 'mb-12' : 'min-h-[60vh] flex flex-col justify-center'}`}>
              <div className="text-center mb-8">
                {!result && !loading && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <h2 className="text-4xl font-bold mb-4 tracking-tight">SEO Performance Audit</h2>
                        <p className="text-gray-500 max-w-lg mx-auto">
                            Analyze your site's performance, SEO, and accessibility with Google Core Web Vitals and AI-readiness checks.
                        </p>
                    </motion.div>
                )}
              </div>
              
              <div className="max-w-2xl mx-auto w-full relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  {loading ? <Loader2 className="animate-spin text-blue-500" size={20} /> : <Search className="text-gray-400" size={20} />}
                </div>
                <form onSubmit={handleAudit}>
                    <input
                        type="text"
                        value={domain}
                        onChange={(e) => {
                            updateSeoAudit({ domain: e.target.value });
                            if (error) updateSeoAudit({ error: null });
                        }}
                        placeholder="Enter domain (e.g. vercel.com)"
                        disabled={loading}
                        className="w-full pl-12 pr-4 py-4 text-lg bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg shadow-[0_0_0_1px_rgba(0,0,0,0.0)] focus:shadow-[0_0_0_2px_rgba(0,0,0,1)] dark:focus:shadow-[0_0_0_2px_rgba(255,255,255,1)] outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-700"
                    />
                </form>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full mt-2 left-0 flex items-center text-red-500 text-xs font-medium"
                  >
                    <AlertTriangle size={12} className="mr-1" />
                    {error}
                  </motion.div>
                )}
              </div>

              {!result && recentDomains.length > 0 && !loading && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-8 flex flex-wrap justify-center gap-2"
                >
                  {recentDomains.map(d => (
                    <button
                      key={d}
                      onClick={() => updateSeoAudit({ domain: d })}
                      className="px-3 py-1 text-xs text-gray-500 border border-gray-200 dark:border-gray-800 rounded-full hover:border-gray-400 dark:hover:border-gray-600 hover:text-black dark:hover:text-white transition-colors"
                    >
                      {d.replace(/^https?:\/\//, '')}
                    </button>
                  ))}
                </motion.div>
              )}

              {loading && <ProgressStep currentStep={progress} />}
            </div>

            {/* Results Grid */}
            {result && !loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                
                {/* 1. Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <MetricCard 
                    title="Overall Score" 
                    value={result.overallScore?.overall || 0} 
                    icon={Activity}
                  />
                  <MetricCard 
                    title="Desktop Perf" 
                    value={result.overallScore?.desktop || 0} 
                    icon={Globe}
                  />
                  <MetricCard 
                    title="Mobile Perf" 
                    value={result.overallScore?.mobile || 0} 
                    icon={Smartphone}
                  />
                  <MetricCard 
                    title="Tech Health" 
                    value={result.overallScore?.codeServer || 0} 
                    icon={Code}
                  />
                </div>

                {/* 2. Traffic Analysis */}
                {result.sections?.traffic && (
                    <TrafficSection data={result.sections?.traffic} />
                )}

                {/* 3. Summary Block - Vercel style split */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="col-span-2 p-6">
                    <h3 className="text-sm font-bold mb-4 flex items-center">
                      <Layout className="mr-2 text-gray-400" size={18} />
                      Audit Overview
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-gray-500">Health Status:</span>
                        <Badge color={
                          result.summary?.health === '优秀' ? 'green' : 
                          result.summary?.health === '良好' ? 'blue' : 'red'
                        }>
                          {result.summary?.health}
                        </Badge>
                      </div>
                      
                      <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-3">Top Issues</p>
                        <ul className="space-y-3">
                          {result.summary?.topIssues?.map((issue, idx) => (
                            <li key={idx} className="flex items-start text-sm group">
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 mr-3 flex-shrink-0" />
                              <span className="text-gray-600 dark:text-gray-300">
                                <span className="font-semibold text-black dark:text-white mr-1">{issue.category}:</span>
                                {issue.issue}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-gray-50/50 dark:bg-gray-900/20 border-dashed">
                    <h3 className="text-sm font-bold mb-4 flex items-center">
                      <List className="mr-2 text-gray-400" size={18} />
                      Recommendations
                    </h3>
                    <div className="space-y-3">
                      {result.summary?.recommendations?.map((rec, idx) => (
                        <div key={idx} className="flex items-start text-xs text-gray-600 dark:text-gray-400">
                          <CheckCircle size={14} className="mr-2 mt-0.5 text-blue-500 flex-shrink-0" />
                          {rec}
                        </div>
                      ))}
                      {(!result.summary?.recommendations || result.summary.recommendations.length === 0) && (
                        <div className="text-center text-gray-400 py-4 text-xs">No specific recommendations</div>
                      )}
                    </div>
                  </Card>
                </div>

                {/* 4. Accordion Details */}
                <div className="space-y-2">
                  <h2 className="text-lg font-bold mb-4 px-1">Detailed Report</h2>
                  
                  <AuditSection 
                    title="Code & Server Configuration" 
                    icon={Code} 
                    data={result.sections?.codeServer}
                    index={0} 
                  />
                  
                  <AuditSection 
                    title="Content Optimization" 
                    icon={FileText} 
                    data={result.sections?.content}
                    index={1} 
                  />
                  
                  <AuditSection 
                    title="Mobile Compatibility" 
                    icon={Smartphone} 
                    data={result.sections?.mobile}
                    index={2} 
                  />

                  <AuditSection 
                    title="AI Search Readiness (AISO)" 
                    icon={Bot} 
                    data={result.sections?.ai}
                    index={3} 
                  />
                </div>

              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeoAudit;
