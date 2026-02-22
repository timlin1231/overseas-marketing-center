import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { BookOpen, Globe, Bot, Moon, Sun, Lock, ArrowRight, Users, Activity } from 'lucide-react';
import KnowledgeBase from './KnowledgeBase';
import SeoAudit from './components/SeoAudit/SeoAudit';

function Home() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const tools = [
    {
      id: 1,
      title: '知识库 (Knowledge Base)',
      description: '基于 Obsidian 的第二大脑，可视化管理所有项目与经验。',
      icon: <BookOpen className="w-8 h-8 text-blue-500" />,
      active: true,
      link: '/knowledge-base',
      statusText: '已就绪',
      techStack: 'React, Markdown, GitHub API'
    },
    {
      id: 2,
      title: 'SEO 深度审计工具',
      description: '一键诊断站点 SEO 健康度，提供专业优化建议与报告导出。',
      icon: <Activity className="w-8 h-8 text-green-500" />,
      active: true,
      link: '/seo-audit',
      statusText: 'NEW',
      techStack: 'Firecrawl API, Puppeteer, LLM Analysis'
    },
    {
      id: 3,
      title: 'GEO 内容生产 Agent',
      description: '自动生成针对不同国家/地区的本地化营销内容。',
      icon: <Globe className="w-8 h-8 text-gray-400" />,
      active: false,
      statusText: '开发中',
      techStack: 'LangChain, GPT-4, DeepL API'
    },
    {
      id: 4,
      title: '市场自动化信息收集 Agent',
      description: '全网监控竞品动态、行业趋势与关键词排名。',
      icon: <Bot className="w-8 h-8 text-gray-400" />,
      active: false,
      statusText: '规划中',
      techStack: 'Playwright, Python, Vector DB'
    },
    {
      id: 5,
      title: 'AI CRM Agent',
      description: '智能化客户关系管理，自动跟进销售线索与邮件回复。',
      icon: <Users className="w-8 h-8 text-gray-400" />,
      active: false,
      statusText: '规划中',
      techStack: 'OpenAI Assistants API, PostgreSQL'
    },
    {
      id: 6,
      title: '更多 Agent 敬请期待',
      description: '......',
      icon: <Lock className="w-8 h-8 text-gray-300" />,
      active: false,
      statusText: '待定',
      techStack: 'TBD'
    }
  ];

  return (
    <div className="min-h-screen transition-colors duration-300 bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 font-sans">
      {/* Header */}
      <header className="fixed w-full top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-black font-bold text-xl">
              O
            </div>
            <h1 className="text-lg font-bold tracking-tight">
              Oversea <span className="text-gray-500">Workstation</span>
            </h1>
          </div>
          
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <h2 className="text-5xl md:text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-500 dark:from-white dark:to-gray-500 tracking-tight">
            Oversea Workstation
          </h2>
          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-light">
            集成知识管理、内容生产与自动化情报收集，赋能海外市场拓展。
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <Link 
              key={tool.id}
              to={tool.active ? tool.link : '#'}
              className={`relative group p-6 rounded-xl border transition-all duration-200 flex flex-col h-full ${
                tool.active 
                  ? 'bg-white dark:bg-black border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 hover:shadow-sm cursor-pointer' 
                  : 'bg-gray-50 dark:bg-gray-900/30 border-gray-100 dark:border-gray-800 opacity-60 cursor-not-allowed'
              }`}
              onClick={(e) => !tool.active && e.preventDefault()}
            >
              <div className="flex items-start justify-between mb-6">
                <div className={`p-2.5 rounded-lg border ${tool.active ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700' : 'bg-gray-100 dark:bg-gray-800 border-transparent'}`}>
                  {tool.icon}
                </div>
                {tool.statusText && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide border ${
                    tool.active 
                      ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30' 
                      : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700'
                  }`}>
                    {tool.statusText}
                  </span>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100 group-hover:text-black dark:group-hover:text-white transition-colors flex items-center">
                  {tool.title}
                  {tool.active && <ArrowRight size={16} className="ml-2 opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                  {tool.description}
                </p>
              </div>

              {/* Tech Stack Badge */}
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                 <div className="text-[10px] font-mono text-gray-400 dark:text-gray-600 flex items-center">
                    <span className="mr-2">Tech Stack:</span>
                    <span className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-400 truncate max-w-[180px]">
                        {tool.techStack}
                    </span>
                 </div>
              </div>
              
              {!tool.active && (
                <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-[1px] rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="bg-black text-white px-4 py-2 rounded-full text-xs font-medium shadow-lg">
                    Coming Soon
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black mt-12">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <div className="w-6 h-6 bg-black dark:bg-white rounded-md flex items-center justify-center text-white dark:text-black font-bold text-xs">O</div>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Oversea Workstation</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-col md:flex-row items-center gap-4">
                <p>Created by <span className="font-semibold text-black dark:text-white">Tim</span></p>
                <span className="hidden md:inline text-gray-300 dark:text-gray-700">|</span>
                <p>© 2026 All rights reserved.</p>
            </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/knowledge-base" element={<KnowledgeBase />} />
        <Route path="/seo-audit" element={<SeoAudit />} />
      </Routes>
    </Router>
  );
}

export default App;
