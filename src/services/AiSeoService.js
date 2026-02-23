
import { getFileContent, putFile, getRepoContent } from '../GitHubService';

const FIRECRAWL_API_KEY = import.meta.env.VITE_FIRECRAWL_API_KEY;

/**
 * 核心 AI SEO 分析函数
 */
export const performAiSeoAnalysis = async (domain) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  try {
    // 1. 获取页面内容
    const pageData = await scrapeWebsite(domain);
    
    // 2. 检查 Robots.txt
    const botAccess = await checkAiBotAccess(domain);

    // 3. 分析结构化数据 (Schema)
    const schemaAnalysis = analyzeSchema(pageData.html);

    // 4. 分析内容结构 (Extractability)
    const contentAnalysis = analyzeContentStructure(pageData.html, pageData.markdown);

    // 5. 检查外部引用和权威性 (Authority)
    const authorityAnalysis = analyzeAuthority(pageData.html, pageData.markdown);

    // 6. 计算得分
    const score = calculateAiScore(botAccess, schemaAnalysis, contentAnalysis, authorityAnalysis);

    return {
      domain,
      timestamp,
      score,
      sections: {
        botAccess,
        schema: schemaAnalysis,
        content: contentAnalysis,
        authority: authorityAnalysis
      }
    };

  } catch (error) {
    console.error('AI SEO Analysis Failed:', error);
    throw new Error(`AI SEO 分析失败: ${error.message}`);
  }
};

/**
 * 1. 抓取页面 (复用 Firecrawl)
 */
const scrapeWebsite = async (domain) => {
  if (!FIRECRAWL_API_KEY) {
    throw new Error('Firecrawl API Key 未配置');
  }

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify({
        url: domain,
        formats: ['markdown', 'html'],
        onlyMainContent: false
      })
    });

    const data = await response.json();
    if (!data.success || !data.data) {
      throw new Error('Firecrawl: 未返回有效数据');
    }

    return {
      html: data.data.html || '',
      markdown: data.data.markdown || ''
    };
  } catch (error) {
    console.error('Scrape failed:', error);
    throw error;
  }
};

/**
 * 2. 检查 AI Bot 访问权限
 */
const checkAiBotAccess = async (domain) => {
  const robotsUrl = new URL('/robots.txt', domain).href;
  let content = '';
  let exists = false;

  try {
    const res = await fetch(robotsUrl);
    if (res.ok) {
      content = await res.text();
      exists = true;
    }
  } catch (e) {
    console.warn('Failed to fetch robots.txt', e);
  }

  const aiBots = [
    { name: 'GPTBot', company: 'OpenAI (ChatGPT)' },
    { name: 'ClaudeBot', company: 'Anthropic (Claude)' },
    { name: 'CCBot', company: 'Common Crawl (Training)' },
    { name: 'Google-Extended', company: 'Google (Gemini/Vertex)' },
    { name: 'PerplexityBot', company: 'Perplexity AI' },
    { name: 'Bingbot', company: 'Microsoft (Copilot)' },
    { name: 'anthropic-ai', company: 'Anthropic' }
  ];

  const results = aiBots.map(bot => {
    // 简单的 Disallow 检查
    const isBlocked = content.toLowerCase().includes(`user-agent: ${bot.name.toLowerCase()}`) && 
                      content.toLowerCase().includes('disallow: /'); // 简化的检查，实际解析更复杂
    // 更严谨的解析应该看具体的 User-agent 块，这里做简化处理：
    // 如果 robots.txt 包含 "User-agent: BotName" 且紧接着有 "Disallow: /" 则视为拦截
    
    // 简单的正则匹配
    const regex = new RegExp(`User-agent:\\s*${bot.name}[\\s\\S]*?Disallow:\\s*/`, 'i');
    const blockedByRule = regex.test(content);

    return {
      ...bot,
      status: blockedByRule ? 'blocked' : 'allowed'
    };
  });

  return {
    exists,
    robotsContent: content.slice(0, 500), // 预览
    bots: results
  };
};

/**
 * 3. 分析 Schema
 */
const analyzeSchema = (html) => {
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  const foundSchemas = new Set();
  
  jsonLdMatches.forEach(match => {
    try {
      const content = match.replace(/<script[^>]*>|<\/script>/gi, '');
      const json = JSON.parse(content);
      
      const extractType = (obj) => {
        if (obj['@type']) foundSchemas.add(obj['@type']);
        if (obj['@graph']) obj['@graph'].forEach(extractType);
      };
      extractType(json);
    } catch (e) {}
  });

  const criticalSchemas = ['Article', 'FAQPage', 'HowTo', 'Product', 'BreadcrumbList', 'Organization'];
  const items = criticalSchemas.map(schema => ({
    type: schema,
    found: foundSchemas.has(schema)
  }));

  return {
    foundTypes: Array.from(foundSchemas),
    items
  };
};

/**
 * 4. 分析内容结构 (Extractability)
 */
const analyzeContentStructure = (html, markdown) => {
  const hasTable = /<table/i.test(html);
  const hasList = /<ul|<ol/i.test(html);
  const hasH1 = /<h1/i.test(html);
  const hasH2 = /<h2/i.test(html);
  
  // 检查段落长度 (简易版：Markdown 中换行符分割的段落，平均长度)
  const paragraphs = markdown.split(/\n\n+/).filter(p => p.trim().length > 0);
  const shortParagraphs = paragraphs.filter(p => p.length < 300).length; // AI 喜欢短段落
  const totalParagraphs = paragraphs.length;
  
  // 检查是否包含类似 "Q:" "A:" 或 "What is" 的问答模式
  const hasQAPattern = /\?|What is|How to/i.test(markdown);

  return {
    hasTable,
    hasList,
    structure: {
      h1: hasH1,
      h2: hasH2,
    },
    readability: {
      shortParagraphs,
      totalParagraphs,
      ratio: totalParagraphs > 0 ? Math.round((shortParagraphs / totalParagraphs) * 100) : 0
    },
    extractabilityScore: (hasTable ? 20 : 0) + (hasList ? 20 : 0) + (hasH2 ? 20 : 0) + (hasQAPattern ? 20 : 0)
  };
};

/**
 * 5. 权威性分析
 */
const analyzeAuthority = (html, markdown) => {
  // 检查外部链接 (引用来源)
  const externalLinks = (html.match(/href=["']https?:\/\/(?!domain)/g) || []).length;
  
  // 检查数字/统计数据
  const statsMatches = markdown.match(/\d+(\.\d+)?%|\d{4}年|\d+个/g) || [];
  
  // 检查引用词
  const citationKeywords = ['根据', 'According to', 'Source:', '数据来源', 'study', 'research'];
  const hasCitations = citationKeywords.some(kw => markdown.includes(kw));

  return {
    externalLinkCount: externalLinks,
    statsCount: statsMatches.length,
    hasCitations
  };
};

/**
 * 6. 计算得分
 */
const calculateAiScore = (botAccess, schema, content, authority) => {
  let score = 0;

  // Bot Access (Max 30)
  const blockedCount = botAccess.bots.filter(b => b.status === 'blocked').length;
  score += Math.max(0, 30 - (blockedCount * 5));

  // Schema (Max 25)
  const schemaCount = schema.items.filter(i => i.found).length;
  score += Math.min(25, schemaCount * 5);

  // Content (Max 25)
  score += Math.min(25, content.extractabilityScore / 80 * 25);

  // Authority (Max 20)
  if (authority.externalLinkCount > 0) score += 5;
  if (authority.statsCount > 0) score += 10;
  if (authority.hasCitations) score += 5;

  return Math.round(score);
};
