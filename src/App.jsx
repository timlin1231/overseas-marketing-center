
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TaskProvider } from './context/TaskContext';
import Layout from './components/Layout';
import Home from './Home';
import KnowledgeBase from './KnowledgeBase';
import SeoAudit from './components/SeoAudit/SeoAudit';
import AiSeoAudit from './components/AiSeo/AiSeoAudit';

function App() {
  return (
    <TaskProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="knowledge-base" element={<KnowledgeBase />} />
            <Route path="seo-audit" element={<SeoAudit />} />
            <Route path="ai-seo" element={<AiSeoAudit />} />
          </Route>
        </Routes>
      </Router>
    </TaskProvider>
  );
}

export default App;
