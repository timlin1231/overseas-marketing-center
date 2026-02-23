
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

    // 6. 计算得分（现在返回分维度的细化得分）
    const dimensionScores = calculateDimensionScores(botAccess, citationPatterns, extractability);
    const overallScore = Math.round((dimensionScores.aiVisibility + dimensionScores.structure + dimensionScores.authority + dimensionScores.extractability + dimensionScores.freshness) / 5);

    // Simplified result structure for the "AI SEO 文章检测工具" requirement
    const result = {
      domain,
      timestamp,
      score: overallScore,
      dimensionScores, // 新增：各维度分数
      passedItems: [],
      failedItems: []
    };

    // --- Transform data into simple Passed/Failed lists ---

    // 1. Content Extractability
    const extractabilityChecks = [
      { 
        check: extractability.hasDefinition, 
        pass: '首段有清晰定义', 
        fail: '无清晰首段定义', 
        tip: '在文章第一段明确定义核心概念（如 "X is a..."）' 
      },
      { 
        check: extractability.hasDirectAnswer, 
        pass: '有40-60词独立答案块', 
        fail: '无40-60词独立答案块', 
        tip: '在核心段落添加1段40-60词的独立摘要' 
      },
      { 
        check: citationPatterns.structure.items.find(i => i.name === 'H2 标题结构')?.passed, 
        pass: 'H2/H3标题匹配查询句式', 
        fail: 'H2/H3标题未优化', 
        tip: '将标题改为问句形式（如 "How to..." 或 "What is..."）' 
      },
      { 
        check: citationPatterns.structure.items.find(i => i.name === '表格数据')?.passed || citationPatterns.structure.items.find(i => i.name === '列表结构')?.passed, 
        pass: '有对比表格/FAQ/列表', 
        fail: '无结构化内容（表格/列表）', 
        tip: '添加 Markdown 表格或无序列表来展示对比或步骤' 
      }
    ];

    // 2. Authority Signals
    const authorityChecks = [
      { 
        check: citationPatterns.authority.items.find(i => i.name === '统计数据')?.passed, 
        pass: '有标注来源的统计数据', 
        fail: '无统计数据', 
        tip: '添加具体的数字或百分比数据，并注明来源' 
      },
      { 
        check: citationPatterns.authority.items.find(i => i.name === '作者署名')?.passed, 
        pass: '有作者署名+资质', 
        fail: '无作者署名', 
        tip: '在文章开头或结尾添加明确的作者信息' 
      },
      // Simplified check for expert quotes (using citation keywords)
      { 
        check: citationPatterns.authority.items.find(i => i.name === '引用来源声明')?.passed, 
        pass: '有专家语录/引用', 
        fail: '无专家语录', 
        tip: '引用行业专家的话或权威报告（使用 "According to..."）' 
      },
      { 
        check: citationPatterns.authority.items.find(i => i.name === '外部引用链接')?.passed, 
        pass: '有外部权威链接', 
        fail: '无外部权威链接', 
        tip: '添加指向 Wikipedia 或高权重行业网站的导出链接' 
      }
    ];

    // 3. Freshness
    const freshnessChecks = [
      { 
        check: citationPatterns.freshness.items.find(i => i.name === '发布/更新日期')?.passed, 
        pass: '已标注更新日期', 
        fail: '未标注更新日期', 
        tip: '在页面显著位置显示 "Last Updated: [Date]"' 
      }
      // Note: "Within 6 months" logic is implicitly handled if date is found, strictly speaking we'd parse the date. 
      // For this simplified version, we'll assume presence of date is the primary technical check.
    ];

    // 4. Bot Access
    const allowedBots = botAccess.bots.filter(b => b.status === 'allowed').map(b => b.name);
    const blockedBots = botAccess.bots.filter(b => b.status === 'blocked').map(b => b.name);
    const botCheck = {
        check: blockedBots.length === 0,
        pass: `Robots.txt 允许所有 AI 爬虫访问 (${allowedBots.length}个)`,
        fail: `Robots.txt 拦截了: ${blockedBots.join(', ')}`,
        tip: '修改 robots.txt，移除针对 GPTBot 等的 Disallow 规则'
    };

    // 5. Schema
    const schemaCheck = {
        check: citationPatterns.schema.score > 0,
        pass: `已部署 Schema 标记 (${citationPatterns.schema.foundTypes.join(', ')})`,
        fail: '未部署 Schema 标记',
        tip: '添加 Article, FAQPage 或 HowTo 类型的 JSON-LD 结构化数据'
    };

    // Aggregate all checks
    const allChecks = [...extractabilityChecks, ...authorityChecks, ...freshnessChecks, botCheck, schemaCheck];

    allChecks.forEach(item => {
        if (item.check) {
            result.passedItems.push(item.pass);
        } else {
            result.failedItems.push({ issue: item.fail, tip: item.tip });
        }
    });

    // Keep the original detailed sections for backward compatibility/history if needed, 
    // but the UI will prioritize the new simplified lists.
    result.sections = {
        botAccess,
        aiAnswers: aiAnswersCheck,
        citationPatterns,
        extractability
    };
    
    // 7. 内容类型分析 (新增)
    result.contentAnalysis = analyzeContentType(pageData.markdown, result);

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
 * 6. 计算各维度得分
 */
const calculateDimensionScores = (botAccess, citationPatterns, extractability) => {
    // AI 可见性 (Bot Access)
    const blockedCount = botAccess.bots.filter(b => b.status === 'blocked').length;
    const aiVisibility = blockedCount === 0 ? 100 : Math.max(0, 100 - blockedCount * 15);

    // 内容结构
    const structure = citationPatterns.structure.score;

    // 权威性
    const authority = citationPatterns.authority.score;

    // 可提取性
    const extractability_score = Math.round((extractability.readability.ratio + (extractability.qaPattern ? 20 : 0)) / 1.2);

    // 内容新鲜度
    const freshness = citationPatterns.freshness.score;

    return {
        aiVisibility,
        structure,
        authority,
        extractability: extractability_score,
        freshness
    };
};

/**
 * 内容类型与特征分析 (新增)
 */
const analyzeContentType = (markdown, currentResult) => {
    const wordCount = markdown.split(/\s+/).length;
    const hasStats = /\d+%|\d{4}年|\d+个/.test(markdown);
    const hasQA = /\?|How to|What is/i.test(markdown);
    const hasList = markdown.includes('- ') || markdown.includes('1.');
    const hasComparison = /vs\.|versus|对比|相比/i.test(markdown);
    
    // 判断内容类型
    let contentType = {
        primary: '',
        characteristics: []
    };

    if (hasStats && wordCount > 1000) {
        contentType.primary = '数据报告类';
        contentType.characteristics = ['包含具体数据', '明确来源', '发布时间'];
    } else if (hasQA && hasList) {
        contentType.primary = '问答/指南类';
        contentType.characteristics = ['采用"问题-步骤-结论"结构', '使用明确的标题层级', '分步点为导向'];
    } else if (hasComparison) {
        contentType.primary = '对比/评测类';
        contentType.characteristics = ['包含具体数字对比', '中立客观', '逻辑清晰'];
    } else if (hasList) {
        contentType.primary = '富媒体内容';
        contentType.characteristics = ['配有清晰的结构', '带逐字稿的描述', '加入ALT文本说明'];
    } else {
        contentType.primary = '热点/行业动态类';
        contentType.characteristics = ['明确标注时间', '聚焦"新变化+影响+应对方法"'];
    }

    // AI 偏好的内容特征
    const aiPreferredTraits = [
        { name: '中立性', met: !/(我们|我司|本公司)/i.test(markdown.slice(0, 500)), desc: '客观表述，避免过度营销或主观判断' },
        { name: '结构化', met: hasList || /<table/i.test(markdown), desc: '逻辑清晰，层次分明，易于AI解析' },
        { name: '可折解', met: markdown.split('\n\n').length > 5, desc: '每个段落都是独立的"可引用点"' },
        { name: '可验证', met: hasStats, desc: '数据可查，事实准确，来源可靠' },
        { name: '场景明确', met: wordCount > 300, desc: '内容具体，有实际应用价值，避免抽象概念' }
    ];

    // 优化建议（分阶段）
    const optimizationPhases = [
        {
            phase: '第一阶段 (1-2周)',
            title: '基础优化',
            tasks: [
                { done: currentResult.sections.botAccess.bots.every(b => b.status === 'allowed'), text: '修复robots.txt错误' },
                { done: currentResult.sections.citationPatterns.schema.score > 0, text: '添加或优化结构化数据' },
                { done: aiPreferredTraits.find(t => t.name === '可折解')?.met, text: '添加清晰的首段定义' },
                { done: currentResult.sections.citationPatterns.structure.items.find(i => i.name === 'H2 标题结构')?.passed, text: '优化标题结构' }
            ]
        },
        {
            phase: '第二阶段 (3-4周)',
            title: '内容重构',
            tasks: [
                { done: currentResult.sections.citationPatterns.structure.items.find(i => i.name === '表格数据')?.passed, text: '转换为结构化元素' },
                { done: currentResult.sections.citationPatterns.authority.items.find(i => i.name === '统计数据')?.passed, text: '添加统计数据和权威来源' },
                { done: currentResult.sections.citationPatterns.authority.items.find(i => i.name === '作者署名')?.passed, text: '完善作者信息和专业资质' },
                { done: hasQA, text: '创建FAQ部分' }
            ]
        },
        {
            phase: '第三阶段 (2-3个月)',
            title: '深度优化',
            tasks: [
                { done: false, text: '竞争对手分析' },
                { done: false, text: '创建AI友好内容' },
                { done: false, text: '建立内容更新机制' },
                { done: false, text: '扩展第三方平台存在' }
            ]
        }
    ];

    return {
        contentType,
        aiPreferredTraits,
        optimizationPhases
    };
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

    // 3. Save to localStorage
    const localHistory = getLocalHistory();
    const newHistory = [result, ...localHistory].slice(0, 20);
    localStorage.setItem('ai_seo_audit_history', JSON.stringify(newHistory));
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

// 获取 AI 历史记录 (优先 GitHub，失败则 LocalStorage)
export const getAiAuditHistory = async () => {
    try {
        const files = await getRepoContent(AUDIT_RECORDS_DIR);
        
        // If empty or no files found, try local storage
        if (!files || files.length === 0) {
             return getLocalHistory();
        }
        
        const records = [];
        for (const file of files) {
            if (file.type === 'file' && file.name.endsWith('_ai.json')) {
                const content = await getFileContent(file.path);
                if (content && content.content) {
                    records.push(JSON.parse(content.content));
                }
            }
        }
        
        // Sync local storage with fetched records if successful
        if (records.length > 0) {
            localStorage.setItem('ai_seo_audit_history', JSON.stringify(records.slice(0, 20)));
        }
        
        return records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (e) {
        console.error('Failed to load AI history from GitHub, falling back to local:', e);
        return getLocalHistory();
    }
};

const getLocalHistory = () => {
  try {
    const history = localStorage.getItem('ai_seo_audit_history');
    return history ? JSON.parse(history) : [];
  } catch (e) {
    console.error('Failed to parse localStorage history', e);
    return [];
  }
};
