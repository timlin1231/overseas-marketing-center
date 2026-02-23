import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Activity, 
  BarChart2, 
  Zap, 
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
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  performSeoAudit, 
  getAuditHistory, 
  saveAuditResult, 
  deleteAuditRecord,
  exportToCsv 
} from '../../services/SeoService';

// Progress Step Component
const ProgressStep = ({ currentStep }) => {
  const steps = [
    { id: 1, label: '解析 DNS' },
    { id: 2, label: '连接服务器' },
    { id: 3, label: '抓取页面' },
    { id: 4, label: '分析内容' },
    { id: 5, label: '生成报告' }
  ];

  return (
    <div className="w-full max-w-2xl mx-auto my-8">
      <div className="relative flex justify-between">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 -z-10 transform -translate-y-1/2 rounded-full" />
        <div 
          className="absolute top-1/2 left-0 h-1 bg-blue-500 -z-10 transform -translate-y-1/2 rounded-full transition-all duration-500" 
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />
        {steps.map((step) => (
          <div key={step.id} className="flex flex-col items-center">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                currentStep >= step.id 
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' 
                  : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-400'
              }`}
            >
              {currentStep > step.id ? <CheckCircle size={14} /> : step.id}
            </div>
            <span className={`mt-2 text-xs font-medium transition-colors ${
              currentStep >= step.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
            }`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Metric Card
const MetricCard = ({ title, value, icon, subtext }) => {
  const numValue = parseInt(value);
  const colorClass = isNaN(numValue) 
    ? 'text-gray-500 bg-gray-50' 
    : numValue >= 80 ? 'text-green-500 bg-green-50 dark:bg-green-900/20' 
    : numValue >= 50 ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' 
    : 'text-red-500 bg-red-50 dark:bg-red-900/20';

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-lg ${colorClass}`}>
        {icon}
      </div>
    </div>
  );
};

// Traffic Detail Component (Updated Style)
const TrafficSection = ({ data }) => {
    if (!data || !data.success || !data.data) return null;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">网站流量分析</h3>
                        <div className="flex flex-col">
                            <p className="text-xs text-gray-500">
                                数据来源: {data.source}
                            </p>
                            {data.message && (
                                <p className="text-xs text-amber-500 mt-0.5 flex items-center">
                                    <AlertTriangle size={10} className="mr-1" />
                                    {data.message}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                <a 
                    href={data.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs text-blue-500 hover:underline"
                >
                    查看详情
                </a>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100 dark:divide-gray-700">
                <div className="p-6 text-center">
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">{data.data.totalVisits || '-'}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">月访问量</p>
                </div>
                <div className="p-6 text-center">
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">{data.data.bounceRate || '-'}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">跳出率</p>
                </div>
                <div className="p-6 text-center">
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">{data.data.pagesPerVisit || '-'}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">每次访问页数</p>
                </div>
                <div className="p-6 text-center">
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">{data.data.avgDuration || '-'}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">平均访问时长</p>
                </div>
            </div>
        </div>
    );
};

// Section Detail Component
const AuditSection = ({ title, icon: Icon, data }) => {
  const [expanded, setExpanded] = useState(true);

  if (!data || !Array.isArray(data.items)) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
      <div 
        className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
            {Icon && <Icon size={20} />}
          </div>
          <div>
            <h3 className="text-lg font-bold">{title}</h3>
            <p className="text-xs text-gray-500">
              通过: {data.passedItems || 0}/{data.totalItems || 0} 项
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {data.totalItems > 0 ? Math.round((data.passedItems / data.totalItems) * 100) : 0}%
            </div>
            <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1">
              <div 
                className="h-full bg-blue-500 rounded-full" 
                style={{ width: `${data.totalItems > 0 ? (data.passedItems / data.totalItems) * 100 : 0}%` }}
              />
            </div>
          </div>
          {expanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
        </div>
      </div>
      
      {expanded && (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {data.items.map((item, idx) => (
            <div key={idx} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                    item.status === 'pass' ? 'bg-green-100 text-green-600' :
                    item.status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                    item.status === 'info' ? 'bg-blue-100 text-blue-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {item.status === 'pass' ? '通过' : item.status === 'warning' ? '警告' : item.status === 'info' ? '信息' : '失败'}
                  </span>
                  <h4 className="font-semibold text-base">{item.category}</h4>
                </div>
                {item.priority && item.status !== 'pass' && (
                  <span className={`text-xs font-medium px-2 py-1 rounded border ${
                    item.priority === 'critical' || item.priority === 'high' 
                      ? 'border-red-200 text-red-600 bg-red-50' 
                      : 'border-yellow-200 text-yellow-600 bg-yellow-50'
                  }`}>
                    {item.priority === 'critical' ? '严重' : item.priority === 'high' ? '高优先级' : '中优先级'}
                  </span>
                )}
              </div>
              
              <p className="text-sm text-gray-500 mb-2">{item.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg text-sm">
                <div>
                  <span className="text-gray-400 block text-xs mb-1">当前状态:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200 break-all">{item.currentState}</span>
                </div>
                {item.status !== 'pass' && (
                  <div>
                    <span className="text-gray-400 block text-xs mb-1">修复建议:</span>
                    <span className="text-blue-600 dark:text-blue-400">{item.suggestion}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SeoAudit = () => {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [recentDomains, setRecentDomains] = useState([]);

  useEffect(() => {
    const loadHistory = async () => {
      const savedHistory = await getAuditHistory();
      setHistory(savedHistory);
      const unique = [...new Set(savedHistory.map(h => h.domain))].slice(0, 3);
      setRecentDomains(unique);
    };
    loadHistory();
  }, []);

  const validateDomain = (input) => {
    const pattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return pattern.test(input);
  };

  const handleAudit = async (e) => {
    e?.preventDefault();
    if (!domain.trim()) return;

    let targetDomain = domain.trim();
    if (!targetDomain.startsWith('http')) {
      targetDomain = `https://${targetDomain}`;
      setDomain(targetDomain);
    }

    if (!validateDomain(targetDomain)) {
      setError('请输入有效的域名格式 (如 example.com)');
      return;
    }

    setError(null);
    setLoading(true);
    setResult(null);
    setProgress(1);

    const stepInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 4) {
          clearInterval(stepInterval);
          return 4;
        }
        return prev + 1;
      });
    }, 800);

    try {
      const data = await performSeoAudit(targetDomain);
      setProgress(5);
      setResult(data);
      
      const newHistory = await saveAuditResult(data);
      setHistory(newHistory);
      setRecentDomains([...new Set(newHistory.map(h => h.domain))].slice(0, 3));
      
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 500);
    } catch (err) {
      clearInterval(stepInterval);
      setLoading(false);
      setProgress(0);
      setError(err.message || '审计过程中发生未知错误，请重试。');
    }
  };

  const handleDeleteHistory = async (timestamp) => {
    if (window.confirm('确定要删除这条记录吗？')) {
      const newHistory = await deleteAuditRecord(timestamp);
      setHistory(newHistory);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">
      {/* Sidebar History */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="font-bold flex items-center">
            <History className="mr-2 text-blue-500" size={18} />
            历史记录
          </h2>
          <Link to="/" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <ArrowLeft size={18} />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {history.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">暂无审计记录</div>
          ) : (
            history.map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => setResult(item)}
                className={`p-3 rounded-lg cursor-pointer border transition-all ${
                  result && result.timestamp === item.timestamp
                    ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-blue-200'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-sm truncate w-40" title={item.domain}>
                    {item.domain.replace(/^https?:\/\//, '')}
                  </span>
                  <span className={`text-xs font-bold ${
                    (item.overallScore?.overall || item.score || 0) >= 80 ? 'text-green-500' : 
                    (item.overallScore?.overall || item.score || 0) >= 60 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {item.overallScore?.overall || item.score || 0}分
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteHistory(item.timestamp);
                    }}
                    className="hover:text-red-500 p-1"
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
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <h1 className="text-lg font-bold flex items-center">
              <Activity className="mr-2 text-blue-500" />
              SEO 深度审计工具
            </h1>
            {result && (
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => window.print()} 
                  className="flex items-center px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <FileText size={16} className="mr-2" />
                  打印
                </button>
                <button 
                  onClick={() => exportToCsv(result)} 
                  className="flex items-center px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Download size={16} className="mr-2" />
                  导出 CSV
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-6xl mx-auto">
            
            {/* Search Input */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8 text-center">
              {!result && (
                <>
                  <h2 className="text-2xl font-bold mb-2">输入域名，一键诊断</h2>
                  <p className="text-gray-500 mb-6 text-sm">
                    基于 Google Core Web Vitals 与 GEO 技术标准，全方位检测站点健康度。
                  </p>
                </>
              )}
              
              <form onSubmit={handleAudit} className="max-w-2xl mx-auto relative">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="text-gray-400" size={20} />
                  </div>
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => {
                      setDomain(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="example.com"
                    className={`w-full pl-12 pr-32 py-4 text-lg bg-gray-50 dark:bg-gray-900 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                      error ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg font-medium transition-colors disabled:opacity-70 flex items-center"
                  >
                    {loading ? '审计中...' : '开始审计'}
                  </button>
                </div>
                
                {error && (
                  <div className="absolute left-0 -bottom-8 flex items-center text-red-500 text-sm animate-fade-in">
                    <AlertTriangle size={14} className="mr-1" />
                    {error}
                  </div>
                )}

                {!result && recentDomains.length > 0 && !loading && (
                  <div className="mt-4 flex items-center justify-center space-x-2 text-sm">
                    <span className="text-gray-400">最近审计：</span>
                    {recentDomains.map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDomain(d)}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                      >
                        {d.replace(/^https?:\/\//, '')}
                      </button>
                    ))}
                  </div>
                )}
              </form>

              {loading && (
                <div className="mt-8 animate-fade-in">
                  <ProgressStep currentStep={progress} />
                  <p className="text-sm text-gray-500 animate-pulse">
                    正在深入分析 {domain} 的各项指标...
                  </p>
                </div>
              )}
            </div>

            {/* Results */}
            {result && !loading && (
              <div className="space-y-6 animate-fade-in-up">
                
                {/* 1. Score Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <MetricCard 
                    title="综合评分" 
                    value={result.overallScore?.overall || 0} 
                    icon={<Activity size={24} />} 
                    subtext="加权总分"
                  />
                  <MetricCard 
                    title="桌面端性能" 
                    value={result.overallScore?.desktop || 0} 
                    icon={<Globe size={24} />} 
                    subtext="Google PSI Desktop"
                  />
                  <MetricCard 
                    title="移动端性能" 
                    value={result.overallScore?.mobile || 0} 
                    icon={<Smartphone size={24} />} 
                    subtext="Google PSI Mobile"
                  />
                  <MetricCard 
                    title="技术合规" 
                    value={result.overallScore?.codeServer || 0} 
                    icon={<Code size={24} />} 
                    subtext="代码与服务器配置"
                  />
                </div>

                {/* 2. Traffic Analysis (Prominent Position) */}
                {result.sections?.traffic && (
                    <TrafficSection data={result.sections?.traffic} />
                )}

                {/* 3. Summary & Top Issues */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold mb-4 flex items-center">
                      <Layout className="mr-2 text-blue-500" size={20} />
                      审计概览
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <span className="text-gray-500">健康状况评级</span>
                        <span className={`font-bold text-lg ${
                          result.summary?.health === '优秀' ? 'text-green-500' : 
                          result.summary?.health === '良好' ? 'text-blue-500' : 
                          'text-red-500'
                        }`}>
                          {result.summary?.health}
                        </span>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">关键问题 (Top 5):</p>
                        <ul className="space-y-2">
                          {result.summary?.topIssues?.map((issue, idx) => (
                            <li key={idx} className="flex items-start text-sm">
                              <AlertTriangle size={14} className="text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                              <span className="text-gray-600 dark:text-gray-400">
                                <span className="font-medium text-gray-900 dark:text-gray-100">{issue.category}: </span>
                                {issue.issue}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold mb-4 flex items-center">
                      <List className="mr-2 text-orange-500" size={20} />
                      建议行动
                    </h3>
                    <div className="space-y-3">
                      {result.summary?.recommendations?.map((rec, idx) => (
                        <div key={idx} className="flex items-start p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                          <Info size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                          {rec}
                        </div>
                      ))}
                      {(!result.summary?.recommendations || result.summary.recommendations.length === 0) && (
                        <div className="text-center text-gray-400 py-4">暂无特别建议</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Detailed Sections */}
                <div className="space-y-6">
                  <h2 className="text-xl font-bold ml-1">详细审计报告</h2>
                  
                  <AuditSection 
                    title="1. 程序代码与服务器" 
                    icon={Code} 
                    data={result.sections?.codeServer} 
                  />
                  
                  <AuditSection 
                    title="2. 网站内容优化" 
                    icon={FileText} 
                    data={result.sections?.content} 
                  />
                  
                  <AuditSection 
                    title="3. 移动端适配" 
                    icon={Smartphone} 
                    data={result.sections?.mobile} 
                  />

                  <AuditSection 
                    title="4. AI 搜索准备度 (AISO)" 
                    icon={Bot} 
                    data={result.sections?.ai} 
                  />
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeoAudit;
