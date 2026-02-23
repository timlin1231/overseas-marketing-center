import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './Home';
import KnowledgeBase from './KnowledgeBase';
import SeoAudit from './components/SeoAudit/SeoAudit';
import AiSeo from './components/AiSeo/AiSeo';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="knowledge-base" element={<KnowledgeBase />} />
          <Route path="seo-audit" element={<SeoAudit />} />
          <Route path="ai-seo" element={<AiSeo />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
