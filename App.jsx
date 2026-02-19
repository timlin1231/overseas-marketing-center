import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { BookOpen, Globe, Bot, Moon, Sun, Lock, ArrowRight } from 'lucide-react';
import KnowledgeBase from './KnowledgeBase';

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
      statusText: '已就绪'
    },
    {
      id: 2,
      title: 'GEO 内容生产 Agent',
      description: '自动生成针对不同国家/地区的本地化营销内容。',
      icon: <Globe className="w-8 h-8 text-gray-400" />,
      active: false,
      statusText: '开发中'
    },
    {
      id: 3,
      title: '市场自动化信息收集 Agent',
      description: '全网监控竞品动态、行业趋势与关键词排名。',
      icon: <Bot className="w-8 h-8 text-gray-400" />,
      active: false,
      statusText: '规划中'
    },
    {
      id: 4,
      title: '更多 Agent 敬请期待',
      description: '......',
      icon: <Lock className="w-8 h-8 text-gray-300" />,
      active: false,
      statusText: '待定'
    }
  ];

  return (
    <div className="min-h-screen transition-colors duration-300 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="fixed w-full top-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              O
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              Overseas <span className="text-blue-600">营销提效中心</span>
            </h1>
          </div>
          
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            打造你的超级个体工作台
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            集成知识管理、内容生产与自动化情报收集，赋能海外市场拓展。
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map((tool) => (
            <Link 
              key={tool.id}
              to={tool.active ? tool.link : '#'}
              className={`relative group p-6 rounded-2xl border transition-all duration-300 ${
                tool.active 
                  ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 cursor-pointer' 
                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-800 opacity-70 cursor-not-allowed'
              }`}
              onClick={(e) => !tool.active && e.preventDefault()}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${tool.active ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  {tool.icon}
                </div>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                  tool.active 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {tool.statusText}
                </span>
              </div>
              
              <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center">
                {tool.title}
                {tool.active && <ArrowRight size={16} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                {tool.description}
              </p>
              
              {!tool.active && (
                <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-[1px] rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="bg-black/75 text-white px-4 py-2 rounded-lg text-sm font-medium">
                    即将上线
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-500 dark:text-gray-500 text-sm">
        <p>© 2026 Overseas Marketing Efficiency Center. Powered by Claude Code.</p>
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
      </Routes>
    </Router>
  );
}

export default App;
