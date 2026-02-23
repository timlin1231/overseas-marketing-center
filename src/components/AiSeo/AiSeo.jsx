import React, { useState } from 'react';
import { 
  Bot, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Shield, 
  Database,
  Link as LinkIcon,
  Loader2,
  TrendingUp,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { performAiSeoAnalysis } from '../../services/AiSeoService';

// --- Reusable Components (Matching SeoAudit Style) ---

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

const MetricCard = ({ title, value, subtext, icon: Icon }) => {
  const numValue = parseInt(value);
  const statusColor = isNaN(numValue) 
    ? 'bg-gray-200' 
    : numValue >= 80 ? 'bg-green-500' 
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

// --- Specific Sections ---

const BotAccessSection = ({ data }) => {
  const [expanded, setExpanded] = useState(true);

  if (!data) return null;

  const blockedCount = data.bots.filter(b => b.status === 'blocked').length;
  const statusColor = blockedCount === 0 ? 'text-green-500' : 'text-red-500';

  return (
    <Card className="mb-4 overflow-hidden">
      <div 
        className="p-4 flex justify-between items-center cursor-pointer select-none group"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-md text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors">
            <Shield size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">AI Bot Access</h3>
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              {data.exists ? 'robots.txt found' : 'robots.txt missing'} • {blockedCount} Blocked
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
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
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.bots.map((bot, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/30 rounded border border-gray-100 dark:border-gray-800">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{bot.name}</span>
                    <span className="text-[10px] text-gray-400">{bot.company}</span>
                  </div>
                  <Badge color={bot.status === 'allowed' ? 'green' : 'red'}>
                    {bot.status}
                  </Badge>
                </div>
              ))}
            </div>
            {data.exists && (
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 text-xs font-mono text-gray-500 border-t border-gray-100 dark:border-gray-800 overflow-x-auto">
                    <pre>{data.robotsContent}</pre>
                </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

const SchemaSection = ({ data }) => {
  const [expanded, setExpanded] = useState(true);
  if (!data) return null;

  const foundCount = data.items.filter(i => i.found).length;

  return (
    <Card className="mb-4 overflow-hidden">
       <div 
        className="p-4 flex justify-between items-center cursor-pointer select-none group"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-md text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors">
            <Database size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Structured Data (Schema)</h3>
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              {foundCount}/{data.items.length} Critical Types Found
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
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
                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                        <div className="flex items-center space-x-3">
                             {item.found ? (
                                <CheckCircle size={16} className="text-green-500" />
                             ) : (
                                <AlertTriangle size={16} className="text-gray-300" />
                             )}
                             <span className={`text-sm ${item.found ? 'text-black dark:text-white' : 'text-gray-400'}`}>
                                {item.type}
                             </span>
                        </div>
                        {item.found ? (
                            <Badge color="green">Detected</Badge>
                        ) : (
                            <span className="text-xs text-gray-400">Missing</span>
                        )}
                    </div>
                ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

const ContentSection = ({ data }) => {
    const [expanded, setExpanded] = useState(true);
    if (!data) return null;
  
    return (
      <Card className="mb-4 overflow-hidden">
         <div 
          className="p-4 flex justify-between items-center cursor-pointer select-none group"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-md text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Content Extractability</h3>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                Score: {data.extractabilityScore}/80
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
              {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </div>
        </div>
  
        <AnimatePresence>
          {expanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-100 dark:border-gray-800 p-4"
            >
               <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/30 rounded border border-gray-100 dark:border-gray-800">
                      <span className="text-xs text-gray-400 uppercase block mb-1">Paragraph Ratio</span>
                      <span className="text-lg font-bold">{data.readability.ratio}%</span>
                      <span className="text-xs text-gray-500 ml-2">Short / Total</span>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/30 rounded border border-gray-100 dark:border-gray-800">
                      <span className="text-xs text-gray-400 uppercase block mb-1">Elements</span>
                      <div className="flex space-x-2 mt-1">
                          {data.hasTable && <Badge color="blue">Table</Badge>}
                          {data.hasList && <Badge color="blue">List</Badge>}
                          {data.structure.h2 && <Badge color="blue">H2</Badge>}
                      </div>
                  </div>
               </div>
               <div className="text-xs text-gray-500">
                  <p className="mb-2">AI engines prefer content structured with:</p>
                  <ul className="list-disc list-inside space-y-1 ml-1">
                      <li className={data.hasTable ? 'text-green-600' : ''}>Comparison Tables (vs Prose)</li>
                      <li className={data.hasList ? 'text-green-600' : ''}>Numbered/Bulleted Lists</li>
                      <li className={data.readability.ratio > 50 ? 'text-green-600' : ''}>Short, punchy paragraphs (&lt;300 chars)</li>
                  </ul>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    );
};

// --- Main Page Component ---

const AiSeo = () => {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async (e) => {
    e?.preventDefault();
    if (!domain.trim()) return;

    let targetDomain = domain.trim();
    if (!targetDomain.startsWith('http')) {
      targetDomain = `https://${targetDomain}`;
      setDomain(targetDomain);
    }

    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const data = await performAiSeoAnalysis(targetDomain);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full bg-white dark:bg-black text-black dark:text-white font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Sidebar - could be history list in future */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-800 flex flex-col flex-shrink-0 bg-gray-50/50 dark:bg-black">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between h-16">
          <div className="font-bold flex items-center text-sm tracking-wide">
            <Bot className="mr-2" size={16} />
            AI SEO
          </div>
        </div>
        <div className="p-4 text-xs text-gray-500">
           Optimize your content for the new era of search: ChatGPT, Perplexity, Gemini, and Claude.
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <h1 className="text-sm font-bold tracking-tight">AI Search Optimization</h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-6 py-12">
            
            {/* Input Section */}
            <div className={`transition-all duration-500 ${result ? 'mb-12' : 'min-h-[60vh] flex flex-col justify-center'}`}>
              <div className="text-center mb-8">
                {!result && !loading && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <h2 className="text-4xl font-bold mb-4 tracking-tight">AI Visibility Audit</h2>
                        <p className="text-gray-500 max-w-lg mx-auto">
                            Check if your content is ready for AI search engines. Analyze bot access, schema, and extractability.
                        </p>
                    </motion.div>
                )}
              </div>
              
              <div className="max-w-2xl mx-auto w-full relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  {loading ? <Loader2 className="animate-spin text-blue-500" size={20} /> : <Search className="text-gray-400" size={20} />}
                </div>
                <form onSubmit={handleAnalyze}>
                    <input
                        type="text"
                        value={domain}
                        onChange={(e) => {
                            setDomain(e.target.value);
                            if (error) setError(null);
                        }}
                        placeholder="Enter URL to analyze (e.g. https://example.com/blog/post)"
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
            </div>

            {/* Results */}
            {result && !loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                {/* Score Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <MetricCard 
                    title="AI Readiness Score" 
                    value={result.score} 
                    icon={Activity}
                  />
                  <MetricCard 
                    title="Bot Access" 
                    value={result.sections.botAccess.bots.filter(b => b.status === 'blocked').length === 0 ? 100 : 50} 
                    subtext={result.sections.botAccess.bots.filter(b => b.status === 'blocked').length + ' Blocked'}
                    icon={Shield}
                  />
                  <MetricCard 
                    title="Schema Types" 
                    value={result.sections.schema.foundTypes.length} 
                    subtext="Detected"
                    icon={Database}
                  />
                  <MetricCard 
                    title="Authority Signals" 
                    value={result.sections.authority.statsCount + result.sections.authority.externalLinkCount} 
                    subtext="Stats & Citations"
                    icon={LinkIcon}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <BotAccessSection data={result.sections.botAccess} />
                    <SchemaSection data={result.sections.schema} />
                </div>
                
                <ContentSection data={result.sections.content} />

              </motion.div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default AiSeo;
