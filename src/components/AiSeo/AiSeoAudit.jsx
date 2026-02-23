import React, { useState } from 'react';
import { performAiSeoAnalysis } from '../../services/AiSeoService';
import { Loader2, Search, AlertTriangle, CheckCircle, Download } from 'lucide-react';

// Minimal Safe Version to fix White Screen
const AiSeoAudit = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async (e) => {
    e?.preventDefault();
    if (!url.trim()) return;

    let targetDomain = url.trim();
    if (!targetDomain.startsWith('http')) {
      targetDomain = `https://${targetDomain}`;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Starting analysis for:', targetDomain);
      const data = await performAiSeoAnalysis(targetDomain);
      console.log('Analysis result:', data);
      setResult(data);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
      if (!result) return;
      const md = `# AI SEO Report for ${result.domain}\nScore: ${result.score}\n\nPassed Items:\n${result.passedItems.join('\n- ')}\n\nFailed Items:\n${result.failedItems.map(i => `- ${i.issue} (Tip: ${i.tip})`).join('\n')}`;
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${Date.now()}.md`;
      a.click();
  };

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen bg-white text-black">
      <h1 className="text-2xl font-bold mb-6">AI 搜索内容合规检测 (Safe Mode)</h1>
      
      {/* Input */}
      <div className="flex gap-2 mb-8">
        <input 
          type="text" 
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="输入网址 (https://...)"
          className="flex-1 p-3 border border-gray-300 rounded text-black"
        />
        <button 
          onClick={handleAnalyze}
          disabled={loading}
          className="px-6 py-3 bg-black text-white rounded hover:opacity-80 disabled:opacity-50"
        >
          {loading ? '分析中...' : '开始审计'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded mb-6 border border-red-200">
          Error: {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-6">
          {/* Score */}
          <div className="p-6 border rounded-lg bg-gray-50">
            <h2 className="text-xl font-bold mb-2">总分: {result.score}/100</h2>
            <p className="text-sm text-gray-500">检测时间: {new Date(result.timestamp).toLocaleString()}</p>
          </div>

          {/* Progress Bars (Simple HTML) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {result.dimensionScores && Object.entries(result.dimensionScores).map(([key, val]) => (
                 <div key={key} className="border p-3 rounded">
                     <div className="flex justify-between text-sm font-medium mb-1">
                         <span className="capitalize">{key}</span>
                         <span>{val}%</span>
                     </div>
                     <div className="h-2 bg-gray-200 rounded overflow-hidden">
                         <div className="h-full bg-blue-500" style={{ width: `${val}%` }}></div>
                     </div>
                 </div>
             ))}
          </div>

          {/* Lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-green-200 bg-green-50 p-4 rounded">
                <h3 className="font-bold text-green-700 mb-3 flex items-center"><CheckCircle size={18} className="mr-2"/> 达标项</h3>
                <ul className="space-y-2 text-sm text-green-800">
                    {result.passedItems.map((item, i) => <li key={i}>✓ {item}</li>)}
                </ul>
            </div>
            <div className="border border-red-200 bg-red-50 p-4 rounded">
                <h3 className="font-bold text-red-700 mb-3 flex items-center"><AlertTriangle size={18} className="mr-2"/> 未达标项</h3>
                <ul className="space-y-3 text-sm text-red-800">
                    {result.failedItems.map((item, i) => (
                        <li key={i}>
                            <div className="font-medium">✕ {item.issue}</div>
                            <div className="text-xs text-red-600 mt-1 opacity-80">💡 {item.tip}</div>
                        </li>
                    ))}
                </ul>
            </div>
          </div>

          {/* Download */}
          <button onClick={downloadReport} className="flex items-center px-4 py-2 border rounded hover:bg-gray-100 text-sm">
              <Download size={16} className="mr-2"/> 下载报告
          </button>
        </div>
      )}
    </div>
  );
};

export default AiSeoAudit;