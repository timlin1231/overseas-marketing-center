import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Globe, Bot, Lock, ArrowRight, Users, Activity, Newspaper } from 'lucide-react';

const Home = () => {
  const tools = [
    {
      id: 1,
      title: '知识库 (Knowledge Base)',
      description: '基于 Obsidian 的第二大脑，可视化管理所有项目与经验。',
      icon: <BookOpen className="w-8 h-8" />,
      active: true,
      link: '/knowledge-base',
      statusText: '已就绪',
      techStack: 'React, Markdown, GitHub API'
    },
    {
      id: 2,
      title: 'SEO 深度审计工具',
      description: '一键诊断站点 SEO 健康度，提供专业优化建议与报告导出。',
      icon: <Activity className="w-8 h-8" />,
      active: true,
      link: '/seo-audit',
      statusText: 'NEW',
      techStack: 'Firecrawl API, Puppeteer, LLM Analysis'
    },
    {
      id: 3,
      title: 'AI 搜索内容合规检测',
      description: '检测内容是否符合 AI 搜索（ChatGPT, Perplexity）的引用标准与最佳实践。',
      icon: <Bot className="w-8 h-8" />,
      active: true,
      link: '/ai-seo',
      statusText: 'NEW',
      techStack: 'Robots.txt Analysis, Schema Check, NLP'
    },
    {
      id: 4,
      title: 'AI News Radar',
      description: '实时追踪全球 AI/Tech 资讯，自动归档至知识库，把握行业风向。',
      icon: <Newspaper className="w-8 h-8" />,
      active: true,
      link: '/ai-news',
      statusText: 'NEW',
      techStack: 'Python, RSS Aggregation, NLP'
    },
    {
      id: 5,
      title: 'GEO 内容生产 Agent',
      description: '自动生成针对不同国家/地区的本地化营销内容。',
      icon: <Globe className="w-8 h-8" />,
      active: false,
      statusText: '开发中',
      techStack: 'LangChain, GPT-4, DeepL API'
    },
    {
      id: 6,
      title: '市场自动化信息收集 Agent',
      description: '全网监控竞品动态、行业趋势与关键词排名。',
      icon: <Bot className="w-8 h-8" />,
      active: false,
      statusText: '规划中',
      techStack: 'Playwright, Python, Vector DB'
    },
    {
      id: 7,
      title: 'AI CRM Agent',
      description: '智能化客户关系管理，自动跟进销售线索与邮件回复。',
      icon: <Users className="w-8 h-8" />,
      active: false,
      statusText: '规划中',
      techStack: 'OpenAI Assistants API, PostgreSQL'
    },
    {
      id: 8,
      title: '更多 Agent 敬请期待',
      description: '......',
      icon: <Lock className="w-8 h-8" />,
      active: false,
      statusText: '待定',
      techStack: 'TBD'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 font-sans text-black dark:text-white">
      <div className="mb-12">
        <h2 className="text-3xl font-bold tracking-tight mb-2">
          Oversea Workstation
        </h2>
        <p className="text-gray-500 dark:text-gray-400 font-light">
          Integrated tools for knowledge management, content generation, and automated intelligence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <Link 
            key={tool.id}
            to={tool.active ? tool.link : '#'}
            className={`group relative p-6 rounded-lg border transition-all duration-200 flex flex-col h-48 ${
              tool.active 
                ? 'bg-white dark:bg-black border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white hover:shadow-sm cursor-pointer' 
                : 'bg-gray-50 dark:bg-gray-900/20 border-gray-100 dark:border-gray-800 opacity-60 cursor-not-allowed'
            }`}
            onClick={(e) => !tool.active && e.preventDefault()}
          >
            <div className="flex items-start justify-between mb-auto">
              <div className={`p-2 rounded-md border ${
                tool.active 
                  ? 'bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white' 
                  : 'bg-gray-100 dark:bg-gray-800 border-transparent text-gray-400'
              }`}>
                {React.cloneElement(tool.icon, { className: "w-5 h-5" })}
              </div>
              {tool.statusText && (
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                  tool.active && tool.statusText === 'NEW'
                    ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' 
                    : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                }`}>
                  {tool.statusText}
                </span>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-semibold mb-1 group-hover:text-black dark:group-hover:text-white transition-colors flex items-center">
                {tool.title}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed line-clamp-2">
                {tool.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Home;
