
import { getFileContent, putFile, getRepoContent } from '../GitHubService';

const FIRECRAWL_API_KEY = import.meta.env.VITE_FIRECRAWL_API_KEY;
const AUDIT_RECORDS_DIR = 'SEO-Audit-Records';
const AUDIT_MD_DIR = 'SEO-Audits';

/**
 * 核心 AI SEO 审计函数
 */
export const performAiSeoAnalysis = async (domain) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  try {
    // 1. 获取页面内容
    const pageData = await scrapeWebsite(domain);
    
    // 2. 检查 Robots.txt (Bot Access)
    const botAccess = await checkAiBotAccess(domain);

    // 3. 模拟 AI 回答检查 (Step 1: Check AI Answers)
    const aiAnswersCheck = await checkAiAnswers(domain, pageData);

    // 4. 分析引用模式 (Step 2: Analyze Citation Patterns)
    // 包括: Content structure, Authority signals, Freshness, Schema markup, Third-party presence
    const citationPatterns = analyzeCitationPatterns(pageData, botAccess);

    // 5. 内容可提取性检查 (Step 3: Content Extractability Check)
    const extractability = analyzeContentStructure(pageData.html, pageData.markdown);

    // 6. 计算得分
    const score = calculateAiScore(botAccess, citationPatterns, extractability);

    const result = {
      domain,
      timestamp,
      score,
      sections: {
        botAccess,
        aiAnswers: aiAnswersCheck,
        citationPatterns,
        extractability
      }
    };
    
    // 7. 使用大模型进行深度分析
    const llmAnalysis = await analyzeWithLLM(pageData.markdown, result);
    result.sections.llmAnalysis = llmAnalysis;

    // 自动保存报告
    await saveAiSeoReport(result);

    return result;

  } catch (error) {
    console.error('AI SEO Analysis Failed:', error);
    throw new Error(`AI SEO 分析失败: ${error.message}`);
  }
};

/**
 * 1. 抓取页面 (复用 Firecrawl)
 */
const scrapeWebsite = async (domain) => {
  try {
    const response = await fetch('/api/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: domain,
        formats: ['markdown', 'html']
      })
    });

    const data = await response.json();
    if (!data.success || !data.data) {
      throw new Error(`Scrape Failed: ${data.error || 'Unknown error'}`);
    }

    return {
      html: data.data.html || '',
      markdown: data.data.markdown || '',
      metadata: data.data.metadata || {}
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
    const regex = new RegExp(`User-agent:\\s*${bot.name}[\\s\\S]*?Disallow:\\s*/`, 'i');
    const blockedByRule = regex.test(content);

    return {
      ...bot,
      status: blockedByRule ? 'blocked' : 'allowed'
    };
  });

  return {
    exists,
    robotsContent: content.slice(0, 500),
    bots: results
  };
};

/**
 * 3. 模拟 AI 回答检查 (Step 1)
 * 既然无法直接查询 ChatGPT，我们基于页面内容特征来评估其作为“优质答案”的潜力
 */
const checkAiAnswers = async (domain, pageData) => {
    const { markdown, metadata } = pageData;
    const queries = [];
    
    // 基于 Title 生成潜在查询
    if (metadata.title) {
        queries.push(`What is ${metadata.title.split('|')[0].trim()}?`);
        queries.push(`${metadata.title.split('|')[0].trim()} reviews`);
    }

    // 检查页面是否包含直接回答问题的结构
    const hasDefinition = /is a|refers to|defined as/i.test(markdown.slice(0, 1000));
    const hasDirectAnswer = markdown.split('\n').some(line => line.length > 50 && line.length < 200 && !line.includes('#'));
    
    return {
        potentialQueries: queries.slice(0, 3),
        isOptimizedForAnswers: hasDefinition && hasDirectAnswer,
        factors: [
            { name: '首段定义', passed: hasDefinition, desc: '首段是否包含清晰的定义（利于 "What is" 类查询）' },
            { name: '独立答案块', passed: hasDirectAnswer, desc: '是否包含 40-60 词的独立段落（利于提取为 Snippet）' }
        ]
    };
};

/**
 * 4. 分析引用模式 (Step 2)
 */
const analyzeCitationPatterns = (pageData, botAccess) => {
    const { html, markdown, metadata } = pageData;

    // 4.1 Content Structure
    const hasTable = /<table/i.test(html);
    const hasList = /<ul|<ol/i.test(html);
    const hasH2 = /<h2/i.test(html);
    
    // 4.2 Authority Signals
    const externalLinks = (html.match(/href=["']https?:\/\/(?!domain)/g) || []).length;
    const statsMatches = markdown.match(/\d+(\.\d+)?%|\d{4}年|\d+个/g) || [];
    const citationKeywords = ['根据', 'According to', 'Source:', '数据来源', 'study', 'research'];
    const hasCitations = citationKeywords.some(kw => markdown.includes(kw));
    const hasAuthor = /author|by|作者/i.test(html) || !!metadata.author;

    // 4.3 Freshness
    // 尝试在 meta 中找 date
    const dateMatch = html.match(/datePublished|dateModified|publish_date|updated_time/i);
    // 增强的日期检测正则，支持 "Updated on Feb 15, 2026" 等格式
    const textDateRegex = /(?:updated|published|posted|modified)\s*(?:on|at)?\s*:?\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4}/i;
    const hasDate = !!dateMatch || /\d{4}-\d{2}-\d{2}/.test(html) || textDateRegex.test(html.replace(/<[^>]+>/g, ' '));

    // 4.4 Schema Markup
    const schemaAnalysis = analyzeSchema(html);

    // 4.5 Third-party Presence (模拟)
    // 检查是否链接到权威第三方 (Wikipedia, LinkedIn, G2 等)
    const authoritativeDomains = ['wikipedia.org', 'linkedin.com', 'g2.com', 'capterra.com', 'trustradius.com', 'github.com'];
    const hasThirdPartyLinks = authoritativeDomains.some(d => html.includes(d));

    return {
        structure: {
            score: (hasTable ? 30 : 0) + (hasList ? 30 : 0) + (hasH2 ? 40 : 0),
            items: [
                { name: '表格数据', passed: hasTable, desc: '适合 "vs" 对比类查询提取' },
                { name: '列表结构', passed: hasList, desc: '适合 "How to" 步骤提取' },
                { name: 'H2 标题结构', passed: hasH2, desc: '清晰的层级结构' }
            ]
        },
        authority: {
            score: (externalLinks > 0 ? 20 : 0) + (statsMatches.length > 0 ? 30 : 0) + (hasCitations ? 30 : 0) + (hasAuthor ? 20 : 0),
            items: [
                { name: '外部引用链接', passed: externalLinks > 0, desc: '链接到外部权威来源' },
                { name: '统计数据', passed: statsMatches.length > 0, desc: '包含具体数字和统计' },
                { name: '引用来源声明', passed: hasCitations, desc: '使用 "According to" 等引用语' },
                { name: '作者署名', passed: hasAuthor, desc: '明确的作者信息' }
            ]
        },
        freshness: {
            score: hasDate ? 100 : 0,
            items: [
                { name: '发布/更新日期', passed: hasDate, desc: '明确的时间戳信号' }
            ]
        },
        schema: schemaAnalysis,
        thirdParty: {
            score: hasThirdPartyLinks ? 100 : 0,
            items: [
                { name: '关联权威平台', passed: hasThirdPartyLinks, desc: '链接到 Wikipedia, LinkedIn, G2 等' }
            ]
        }
    };
};

/**
 * 5. 内容结构分析 (Step 3: Extractability)
 */
const analyzeContentStructure = (html, markdown) => {
    // 检查段落长度
    const paragraphs = markdown.split(/\n\n+/).filter(p => p.trim().length > 0);
    const shortParagraphs = paragraphs.filter(p => p.length < 300).length;
    const totalParagraphs = paragraphs.length;
    
    // 问答模式
    const hasQAPattern = /\?|What is|How to/i.test(markdown);

    return {
        readability: {
            ratio: totalParagraphs > 0 ? Math.round((shortParagraphs / totalParagraphs) * 100) : 0,
            total: totalParagraphs
        },
        qaPattern: hasQAPattern
    };
};

/**
 * Schema 分析辅助函数
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

  const criticalSchemas = ['Article', 'FAQPage', 'HowTo', 'Product', 'BreadcrumbList', 'Organization', 'Person'];
  const items = criticalSchemas.map(schema => ({
    type: schema,
    found: foundSchemas.has(schema)
  }));

  return {
    score: Math.min(100, foundSchemas.size * 20),
    foundTypes: Array.from(foundSchemas),
    items
  };
};

/**
 * 6. 计算总分
 */
const calculateAiScore = (botAccess, citationPatterns, extractability) => {
    let score = 0;
    
    // Bot Access (20%)
    const blockedCount = botAccess.bots.filter(b => b.status === 'blocked').length;
    score += (blockedCount === 0 ? 20 : Math.max(0, 20 - blockedCount * 5));

    // Citation Patterns (60%)
    score += (citationPatterns.structure.score / 100) * 15;
    score += (citationPatterns.authority.score / 100) * 15;
    score += (citationPatterns.freshness.score / 100) * 10;
    score += (citationPatterns.schema.score / 100) * 10;
    score += (citationPatterns.thirdParty.score / 100) * 10;

    // Extractability (20%)
    score += (extractability.readability.ratio / 100) * 10;
    score += (extractability.qaPattern ? 10 : 0);

    return Math.round(score);
};

/**
 * 使用 LLM 进行深度分析
 * 由于是前端服务，我们这里模拟 LLM 的分析逻辑，或者调用外部 API
 * 为了演示，这里使用规则引擎模拟 LLM 的输出
 */
const analyzeWithLLM = async (markdown, currentResult) => {
    // 这里可以接入 OpenAI/Gemini API，但为了不暴露 Key，我们暂时用高级规则模拟
    // 如果有后端 API，可以直接 fetch('/api/analyze', { body: markdown })
    
    const analysis = {
        summary: "该页面内容结构清晰，但在 AI 引用优化方面仍有提升空间。",
        strengths: [],
        weaknesses: [],
        suggestions: []
    };

    if (currentResult.score >= 80) {
        analysis.summary = "该页面针对 AI 搜索进行了良好的优化，具有较高的引用潜力。";
        analysis.strengths.push("结构化数据完善，利于机器理解");
        analysis.strengths.push("权威性信号强，包含外部引用和统计数据");
    } else if (currentResult.score >= 50) {
        analysis.summary = "该页面具备基础的 SEO 素质，但在针对 AI 的结构化表达上有所欠缺。";
    } else {
        analysis.summary = "该页面可能难以被 AI 搜索引擎有效引用，建议进行大幅度结构优化。";
        analysis.weaknesses.push("缺乏清晰的定义和直接答案块");
        analysis.weaknesses.push("缺少权威性信号（数据、引用、作者信息）");
    }

    // 针对具体维度的建议
    const { citationPatterns } = currentResult.sections;
    
    if (!citationPatterns.structure.items.find(i => i.name === '表格数据').passed) {
        analysis.suggestions.push("建议将对比类内容（如优缺点、价格）转换为 Markdown 表格，AI 更倾向于引用表格数据。");
    }
    
    if (!citationPatterns.authority.items.find(i => i.name === '统计数据').passed) {
        analysis.suggestions.push("尝试加入具体的统计数据（如 '提升了 50%' 而非 '提升了很多'），数字更容易被提取。");
    }

    if (!citationPatterns.freshness.items.find(i => i.name === '发布/更新日期').passed) {
        analysis.suggestions.push("页面缺少明确的发布或更新日期，这会显著降低内容在 AI 眼中的时效性权重。");
    }

    return analysis;
};

/**
 * 保存报告
 */
const saveAiSeoReport = async (result) => {
    const domain = result.domain.replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = new Date(result.timestamp).getTime();
    
    // Ensure directory exists
    try {
        await getRepoContent(AUDIT_RECORDS_DIR);
    } catch (e) {
        // Ignore if not found, putFile usually handles creation if path is simple
    }

    // 1. 保存 JSON 记录
    const jsonFilename = `${domain}_${timestamp}_ai.json`;
    await putFile(`${AUDIT_RECORDS_DIR}/${jsonFilename}`, JSON.stringify(result, null, 2), `Add AI SEO audit record for ${result.domain}`);

    // 2. 保存 Markdown 报告
    const dateStr = new Date(result.timestamp).toISOString().split('T')[0];
    const mdFilename = `AI_SEO_${domain}_${dateStr}.md`;
    const mdContent = generateMarkdownReport(result);
    await putFile(`${AUDIT_MD_DIR}/${mdFilename}`, mdContent, `Add AI SEO Audit Report for ${result.domain}`);
};

/**
 * 生成 Markdown 报告
 */
const generateMarkdownReport = (result) => {
    let md = `# AI SEO 审计报告: ${result.domain}\n\n`;
    md += `**日期:** ${new Date(result.timestamp).toLocaleString()}\n`;
    md += `**AI 准备度评分:** ${result.score}/100\n\n`;

    md += `## 🤖 AI Bot 访问权限\n\n`;
    result.sections.botAccess.bots.forEach(bot => {
        md += `- **${bot.name}**: ${bot.status === 'allowed' ? '✅ 允许' : '❌ 拦截'}\n`;
    });
    md += `\n`;

    md += `## 📚 引用模式分析\n\n`;
    
    md += `### 内容结构\n`;
    result.sections.citationPatterns.structure.items.forEach(item => {
        md += `- [${item.passed ? 'x' : ' '}] ${item.name}: ${item.desc}\n`;
    });

    md += `\n### 权威性信号\n`;
    result.sections.citationPatterns.authority.items.forEach(item => {
        md += `- [${item.passed ? 'x' : ' '}] ${item.name}: ${item.desc}\n`;
    });

    md += `\n### 结构化数据 (Schema)\n`;
    result.sections.citationPatterns.schema.items.forEach(item => {
        md += `- [${item.found ? 'x' : ' '}] ${item.type}\n`;
    });

    return md;
};

// 获取 AI 历史记录 (复用 SeoService 的逻辑，只是过滤条件不同)
export const getAiAuditHistory = async () => {
    try {
        const files = await getRepoContent(AUDIT_RECORDS_DIR);
        if (!files) return [];
        
        const records = [];
        for (const file of files) {
            if (file.type === 'file' && file.name.endsWith('_ai.json')) {
                const content = await getFileContent(file.path);
                if (content && content.content) {
                    records.push(JSON.parse(content.content));
                }
            }
        }
        return records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (e) {
        console.error('Failed to load AI history:', e);
        return [];
    }
};
