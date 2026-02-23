
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  Activity, 
  Moon, 
  Sun, 
  Menu, 
  X,
  Layout as LayoutIcon,
  ChevronDown,
  Github,
  Bot
} from 'lucide-react';

const Layout = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  // Load theme from local storage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    // const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Default to Light Mode unless explicitly set to 'dark'
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const navItems = [
    { 
      label: 'Overview', 
      path: '/', 
      icon: LayoutIcon 
    },
    { 
      label: 'Knowledge Base', 
      path: '/knowledge-base', 
      icon: BookOpen 
    },
    { 
      label: 'SEO Audit', 
      path: '/seo-audit', 
      icon: Activity 
    },
    { 
      label: 'AI SEO Audit', 
      path: '/ai-seo', 
      icon: Bot 
    }
  ];

  return (
    <div className="flex h-screen bg-white dark:bg-black text-black dark:text-white font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Sidebar - Vercel Dashboard Style */}
      <aside 
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-black transition-all duration-300 overflow-hidden flex flex-col relative`}
      >
        {/* Project/Team Switcher Area */}
        <div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3 w-full cursor-pointer hover:bg-gray-200/50 dark:hover:bg-gray-800 p-2 rounded-md transition-colors">
            <div className="w-6 h-6 bg-black dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black font-bold text-xs">
              O
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Oversea Workstation</p>
              <p className="text-[10px] text-gray-500 truncate">Tim's Workspace</p>
            </div>
            <ChevronDown size={14} className="text-gray-400" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="px-2 text-[10px] font-mono uppercase text-gray-400 mb-2 mt-2">Menu</p>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2 text-sm rounded-md transition-all group ${
                  isActive 
                    ? 'bg-white dark:bg-gray-900 text-black dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-gray-800' 
                    : 'text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-800'
                }`}
              >
                <item.icon size={16} className={`mr-3 ${isActive ? 'text-black dark:text-white' : 'text-gray-400 group-hover:text-black dark:group-hover:text-white'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
          <a 
            href="https://github.com/timlin1231/overseas-marketing-center" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center px-3 py-2 text-sm text-gray-500 hover:text-black dark:hover:text-white rounded-md hover:bg-gray-200/50 dark:hover:bg-gray-800 transition-colors"
          >
            <Github size={16} className="mr-3" />
            GitHub
          </a>
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center px-3 py-2 text-sm text-gray-500 hover:text-black dark:hover:text-white rounded-md hover:bg-gray-200/50 dark:hover:bg-gray-800 transition-colors"
          >
            {darkMode ? <Sun size={16} className="mr-3" /> : <Moon size={16} className="mr-3" />}
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-black relative">
        {/* Mobile Header */}
        <header className="md:hidden h-14 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-50">
           <div className="flex items-center space-x-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1">
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <span className="font-semibold text-sm">Oversea Workstation</span>
           </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
