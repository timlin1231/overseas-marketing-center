import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  Download, 
  Trash2, 
  ExternalLink,
  ChevronRight,
  Activity,
  BarChart2,
  Zap,
  RefreshCw,
  MoreVertical,
  X
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
        {/* Progress Line */}
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

// Result Card Component
const MetricCard = ({ title, value, icon, status }) => {
  const statusColors = {
    good: 'text-green-500 bg-green-50 dark:bg-green-900/20',
    warning: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
    bad: 'text-red-500 bg-red-50 dark:bg-red-900/20'
  };
  
  // Simple heuristic for demo
  const colorClass = parseInt(value) > 80 ? statusColors.good : parseInt(value) > 50 ? statusColors.warning : statusColors.bad;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${colorClass}`}>
        {icon}
      </div>
    </div>
  );
};

const SeoAudit = () => {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0); // 0: idle, 1-5: steps
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [recentDomains, setRecentDomains] = useState([]);

  // Load history on mount
  useEffect(() => {
    const savedHistory = getAuditHistory();
    setHistory(savedHistory);
    // Extract unique recent domains
    const unique = [...new Set(savedHistory.map(h => h.domain))].slice(0, 3);
    setRecentDomains(unique);
  }, []);

  const validateDomain = (input) => {
    // Simple regex for domain validation
    const pattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return pattern.test(input);
  };

  const handleAudit = async (e) => {
    e?.preventDefault();
    if (!domain.trim()) return;

    // Auto-complete protocol
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

    // Simulate progress steps
    const stepInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 4) {
          clearInterval(stepInterval);
          return 4; // Hold at step 4 until actual completion
        }
        return prev + 1;
      });
    }, 500);

    try {
      const data = await performSeoAudit(targetDomain);
      setProgress(5);
      setResult(data);
      
      // Save to history
      const newHistory = saveAuditResult(data);
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

  const handleDeleteHistory = (timestamp) => {
    if (window.confirm('确定要删除这条记录吗？')) {
      const newHistory = deleteAuditRecord(timestamp);
      setHistory(newHistory);
    }
  };

  const loadHistoryItem = (item) => {
    setDomain(item.domain);
    setResult(item);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <ArrowLeft size={20} className="text-gray-500" />
            </Link>
            <h1 className="text-lg font-bold flex items-center">
              <Activity className="mr-2 text-blue-500" />
              SEO 深度审计工具
            </h1>
          </div>
          {result && (
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => window.print()} 
                className="flex items-center px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <FileText size={16} className="mr-2" />
                打印 PDF
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

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Input Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8 text-center">
          <h2 className="text-2xl font-bold mb-2">输入域名，一键诊断</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
            基于 Google Core Web Vitals 与技术 SEO 标准，全方位检测站点健康度。
          </p>
          
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
                    error ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800'
                }`}
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? '审计中...' : '开始审计'}
              </button>
            </div>
            
            {/* Error Message */}
            {error && (
                <div className="absolute left-0 -bottom-8 flex items-center text-red-500 text-sm animate-fade-in">
                    <AlertTriangle size={14} className="mr-1" />
                    {error}
                </div>
            )}

            {/* Recent History Tags */}
            {recentDomains.length > 0 && !loading && (
              <div className="mt-4 flex items-center justify-center space-x-2 text-sm">
                <span className="text-gray-400">最近审计：</span>
                {recentDomains.map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDomain(d)}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300 transition-colors"
                  >
                    {d.replace(/^https?:\/\//, '')}
                  </button>
                ))}
              </div>
            )}
          </form>

          {/* Progress Bar */}
          {loading && (
             <div className="mt-8 animate-fade-in">
                <ProgressStep currentStep={progress} />
                <p className="text-sm text-gray-500 animate-pulse">
                    正在深入分析 {domain} 的各项指标...
                </p>
             </div>
          )}
        </div>

        {/* Results Section */}
        {result && !loading && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Top Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard 
                title="SEO 健康分" 
                value={result.score} 
                icon={<Activity size={24} />} 
              />
              <MetricCard 
                title="加载速度 (LCP)" 
                value={result.metrics.loadTime} 
                icon={<Zap size={24} />} 
              />
              <MetricCard 
                title="TDK 合规度" 
                value={result.metrics.tdkHealth} 
                icon={<BarChart2 size={24} />} 
              />
            </div>

            {/* Detailed Report */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold">审计详情报告</h3>
                    <span className="text-sm text-gray-400">
                        生成时间: {new Date(result.timestamp).toLocaleString()}
                    </span>
                </div>
                
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {result.issues.map((issue, idx) => (
                        <div key={idx} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-3">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                        issue.severity === 'high' ? 'bg-red-100 text-red-600' :
                                        issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                                        'bg-blue-100 text-blue-600'
                                    }`}>
                                        {issue.severity}
                                    </span>
                                    <h4 className="font-semibold text-lg">{issue.title}</h4>
                                </div>
                                <span className="text-xs font-medium text-gray-400 border border-gray-200 dark:border-gray-600 px-2 py-1 rounded">
                                    {issue.type}
                                </span>
                            </div>
                            
                            <p className="text-gray-600 dark:text-gray-300 mb-3 ml-1">
                                {issue.fix}
                            </p>
                            
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex items-start">
                                <Zap size={16} className="text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                                <span className="text-sm text-blue-700 dark:text-blue-300">
                                    <strong>专家建议：</strong> {issue.suggestion}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        )}

        {/* History Section */}
        {history.length > 0 && !loading && (
            <div className="mt-12">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                    <Clock className="mr-2 text-gray-400" />
                    历史审计记录
                </h3>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-3 font-medium">域名</th>
                                <th className="px-6 py-3 font-medium">时间</th>
                                <th className="px-6 py-3 font-medium">分数</th>
                                <th className="px-6 py-3 font-medium text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {history.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-blue-600">
                                        {item.domain}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {new Date(item.timestamp).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`font-bold ${
                                            item.score > 80 ? 'text-green-500' : 
                                            item.score > 60 ? 'text-yellow-500' : 'text-red-500'
                                        }`}>
                                            {item.score}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-3">
                                        <button 
                                            onClick={() => loadHistoryItem(item)}
                                            className="text-blue-500 hover:text-blue-700 font-medium"
                                        >
                                            查看
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteHistory(item.timestamp)}
                                            className="text-gray-400 hover:text-red-500"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default SeoAudit;
