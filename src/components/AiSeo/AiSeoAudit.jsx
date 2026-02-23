
import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Shield, 
  Database,
  Link as LinkIcon,
  Loader2,
  Activity,
  Clock,
  Globe,
  Layout,
  Star,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { performAiSeoAnalysis } from '../../services/AiSeoService';
import { useTask } from '../../context/TaskContext';

// --- Reusable Components (Vercel Style) ---

const Badge = ({ children, color = 'gray' }) => {
  const colors = {
    gray: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-800',
    blue: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
    green: 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
    red: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${colors[color] || colors.gray} inline-flex items-center`}>
      {children}
    </span>
  );
};

const Card = ({ children, className = '' }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className={`bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_8px_rgba(0,0,0,0.04)] transition-all duration-200 ${className}`}
  >
    {children}
  </motion.div>
);

const SectionHeader = ({ icon: Icon, title, score, children }) => (
    <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 text-gray-500">
            <Icon size={20} strokeWidth={1.5} />
        </div>
        <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            {children}
        </div>
        {score !== undefined && (
             <div className="text-2xl font-bold font-sans tracking-tight">
                {score}<span className="text-sm text-gray-400 font-normal ml-1">/100</span>
             </div>
        )}
    </div>
);

const ChecklistItem = ({ passed, label, desc }) => (
    <div className="flex items-start py-3 border-b border-gray-50 dark:border-gray-900 last:border-0">
        <div className={`mt-0.5 mr-3 flex-shrink-0 ${passed ? 'text-green-500' : 'text-gray-300'}`}>
            {passed ? <CheckCircle size={16} fill="currentColor" className="text-white dark:text-black" /> : <div className="w-4 h-4 rounded-full border-2 border-current" />}
        </div>
        <div>
            <div className={`text-sm font-medium ${passed ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500'}`}>
                {label}
            </div>
            {desc && <div className="text-xs text-gray-400 mt-0.5">{desc}</div>}
        </div>
    </div>
);

// --- Sections ---

const AiAnswersSection = ({ data }) => {
    if (!data) return null;
    return (
        <Card className="p-6">
            <SectionHeader icon={Bot} title="AI 回答优化潜力" score={data.isOptimizedForAnswers ? 90 : 40}>
                <p className="text-xs text-gray-500">模拟 "What is" 类查询的回答质量</p>
            </SectionHeader>
            
            <div className="mt-4 space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                    <span className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2 block">潜在查询示例</span>
                    <div className="space-y-1">
                        {data.potentialQueries.map((q, i) => (
                            <div key={i} className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center">
                                <Search size={12} className="mr-2 opacity-50" />
                                "{q}"
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-1">
                    {data.factors.map((factor, idx) => (
                        <ChecklistItem key={idx} passed={factor.passed} label={factor.name} desc={factor.desc} />
                    ))}
                </div>
            </div>
        </Card>
    );
};

const CitationPatternsSection = ({ data }) => {
    if (!data) return null;
    return (
        <Card className="p-6">
            <SectionHeader icon={LinkIcon} title="引用与权威性模式" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center">
                        <Layout size={12} className="mr-1" /> 内容结构
                    </h4>
                    {data.structure.items.map((item, i) => (
                        <ChecklistItem key={i} passed={item.passed} label={item.name} desc={item.desc} />
                    ))}
                </div>
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center">
                        <Star size={12} className="mr-1" /> 权威信号
                    </h4>
                    {data.authority.items.map((item, i) => (
                        <ChecklistItem key={i} passed={item.passed} label={item.name} desc={item.desc} />
                    ))}
                </div>
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center">
                        <Clock size={12} className="mr-1" /> 时效性
                    </h4>
                    {data.freshness.items.map((item, i) => (
                        <ChecklistItem key={i} passed={item.passed} label={item.name} desc={item.desc} />
                    ))}
                </div>
                 <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center">
                        <Globe size={12} className="mr-1" /> 第三方存在
                    </h4>
                    {data.thirdParty.items.map((item, i) => (
                        <ChecklistItem key={i} passed={item.passed} label={item.name} desc={item.desc} />
                    ))}
                </div>
            </div>
        </Card>
    );
};

const BotAccessSection = ({ data }) => {
    const [expanded, setExpanded] = useState(true);
    if (!data) return null;

    const blockedCount = data.bots.filter(b => b.status === 'blocked').length;

    return (
        <Card className="overflow-hidden">
            <div className="p-6 cursor-pointer hover:bg-gray-50/50 transition-colors" onClick={() => setExpanded(!expanded)}>
                <div className="flex justify-between items-center">
                    <SectionHeader icon={Shield} title="AI 爬虫访问权限">
                         <div className="flex items-center space-x-2 text-xs">
                            <Badge color={data.exists ? 'green' : 'red'}>{data.exists ? 'Robots.txt 已配置' : 'Robots.txt 缺失'}</Badge>
                            <Badge color={blockedCount === 0 ? 'green' : 'yellow'}>{blockedCount} 个拦截</Badge>
                         </div>
                    </SectionHeader>
                    {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
            </div>
            
            <AnimatePresence>
                {expanded && (
                    <motion.div 
                        initial={{ height: 0 }} 
                        animate={{ height: 'auto' }} 
                        exit={{ height: 0 }}
                        className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/10"
                    >
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {data.bots.map((bot, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 rounded border border-gray-100 dark:border-gray-800 bg-white dark:bg-black">
                                    <span className="text-sm font-medium">{bot.name}</span>
                                    <Badge color={bot.status === 'allowed' ? 'green' : 'red'}>
                                        {bot.status === 'allowed' ? '允许' : '拦截'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
};

// --- Main Page ---

const AiSeoAudit = () => {
  const { 
    aiAuditState, 
    updateAiAudit, 
    refreshAiHistory 
  } = useTask();
  
  const { loading, result, error, domain, history } = aiAuditState;

  const handleAnalyze = async (e) => {
    e?.preventDefault();
    if (!domain.trim()) return;

    let targetDomain = domain.trim();
    if (!targetDomain.startsWith('http')) {
      targetDomain = `https://${targetDomain}`;
      updateAiAudit({ domain: targetDomain });
    }

    updateAiAudit({ loading: true, error: null, result: null });

    try {
      const data = await performAiSeoAnalysis(targetDomain);
      
      // Update result state
      updateAiAudit({ result: data });
      
      // Refresh local history in sidebar
      await refreshAiHistory(); 
      
      // Optional: Trigger a refresh of the Knowledge Base file tree if possible, 
      // but since KB is a separate component, user might need to refresh KB manually or we use a global event.
      // For now, the file is saved to repo, so next time KB loads it will appear.
      
    } catch (err) {
      updateAiAudit({ error: err.message || 'Analysis failed.' });
    } finally {
      updateAiAudit({ loading: false });
    }
  };

  const loadHistoryItem = (item) => {
    updateAiAudit({ 
        result: item, 
        domain: item.domain,
        error: null 
    });
  };

  return (
    <div className="flex h-full bg-white dark:bg-black text-black dark:text-white font-sans">
      {/* Sidebar History */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-800 flex flex-col flex-shrink-0 bg-gray-50/50 dark:bg-black h-full overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 h-16 flex items-center">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Audit History</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {history.map((item, idx) => (
                <div 
                    key={idx}
                    onClick={() => loadHistoryItem(item)}
                    className={`p-3 rounded-md cursor-pointer text-sm transition-colors ${
                        result && result.timestamp === item.timestamp 
                        ? 'bg-white shadow-sm border border-gray-200 text-black dark:bg-gray-800 dark:border-gray-700 dark:text-white' 
                        : 'text-gray-500 hover:bg-gray-200/50 dark:hover:bg-gray-800/50'
                    }`}
                >
                    <div className="font-medium truncate">{item.domain.replace(/^https?:\/\//, '')}</div>
                    <div className="flex justify-between items-center mt-1">
                        <span className="text-[10px] text-gray-400">{new Date(item.timestamp).toLocaleDateString()}</span>
                        <span className={`text-[10px] font-bold ${
                            item.score >= 80 ? 'text-green-600' : item.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                            {item.score}
                        </span>
                    </div>
                </div>
            ))}
            {history.length === 0 && (
                <div className="p-4 text-center text-xs text-gray-400">
                    暂无历史记录
                </div>
            )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2">
                <Bot className="text-black dark:text-white" size={20} />
                <h1 className="text-base font-bold tracking-tight">AI 搜索内容合规检测</h1>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-6 py-8 pb-20">
            
            {/* Input Section */}
            <div className={`transition-all duration-500 ease-in-out ${result ? 'mb-8' : 'min-h-[50vh] flex flex-col justify-center'}`}>
               {!result && !loading && (
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold mb-2 tracking-tight">优化您的内容以适应 AI 搜索</h2>
                        <p className="text-gray-500 max-w-lg mx-auto text-sm">
                            分析您的网站是否符合 AI 搜索内容标准，提升被 ChatGPT, Perplexity 等引用的概率。
                        </p>
                    </div>
                )}
                
                <div className="max-w-2xl mx-auto w-full relative">
                    <form onSubmit={handleAnalyze} className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            {loading ? <Loader2 className="animate-spin text-blue-500" size={20} /> : <Search className="text-gray-400" size={20} />}
                        </div>
                        <input
                            type="text"
                            value={domain}
                            onChange={(e) => updateAiAudit({ domain: e.target.value, error: null })}
                            placeholder="输入网址 (例如 https://example.com/blog/post)"
                            disabled={loading}
                            className="w-full pl-12 pr-4 py-3 text-base bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent outline-none transition-all"
                        />
                        <button 
                            type="submit" 
                            disabled={loading || !domain}
                            className="absolute right-2 top-2 bottom-2 px-4 bg-black dark:bg-white text-white dark:text-black rounded-md text-sm font-medium hover:opacity-80 disabled:opacity-50 transition-opacity"
                        >
                            {loading ? '分析中...' : '开始审计'}
                        </button>
                    </form>
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, y: -5 }} 
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-3 flex items-center text-red-500 text-xs font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded"
                        >
                            <AlertTriangle size={12} className="mr-2" />
                            {error}
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Results Grid */}
            {result && !loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Simplified Output: Passed & Failed Lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Passed Items */}
                    <Card className="p-6 border-l-4 border-l-green-500">
                        <div className="flex items-center mb-4">
                            <CheckCircle className="text-green-500 mr-2" size={24} />
                            <h3 className="text-lg font-bold">达标项 ({result.passedItems.length})</h3>
                        </div>
                        <ul className="space-y-3">
                            {result.passedItems.length > 0 ? (
                                result.passedItems.map((item, idx) => (
                                    <li key={idx} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 mr-2 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))
                            ) : (
                                <li className="text-sm text-gray-400 italic">暂无达标项</li>
                            )}
                        </ul>
                    </Card>

                    {/* Failed Items */}
                    <Card className="p-6 border-l-4 border-l-red-500">
                        <div className="flex items-center mb-4">
                            <AlertTriangle className="text-red-500 mr-2" size={24} />
                            <h3 className="text-lg font-bold">未达标项 ({result.failedItems.length})</h3>
                        </div>
                        <ul className="space-y-4">
                            {result.failedItems.length > 0 ? (
                                result.failedItems.map((item, idx) => (
                                    <li key={idx} className="text-sm">
                                        <div className="flex items-start text-gray-900 dark:text-gray-100 font-medium mb-1">
                                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 mr-2 flex-shrink-0" />
                                            {item.issue}
                                        </div>
                                        <div className="ml-3.5 pl-2 border-l-2 border-gray-100 dark:border-gray-800 text-gray-500 text-xs py-1">
                                            💡 提示：{item.tip}
                                        </div>
                                    </li>
                                ))
                            ) : (
                                <li className="text-sm text-gray-400 italic">太棒了！所有检查项均已达标 🎉</li>
                            )}
                        </ul>
                    </Card>
                </div>

              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiSeoAudit;
