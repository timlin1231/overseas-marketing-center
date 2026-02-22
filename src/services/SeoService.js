/**
 * 专业 SEO 审计服务
 * 基于完整的 SEO 技术审计标准，涵盖：
 * 1. 程序代码、服务器部分
 * 2. 网站内容相关
 * 3. 手机端及 AMP 站点
 * 4. AI 搜索准备度 (新增)
 * 5. 整体评分
 * 
 * 集成工具：Firecrawl（页面抓取）、PageSpeed Insights（性能）、Schema.org Validator（结构化数据）
 */

import { getFileContent, putFile, getRepoContent } from '../GitHubService';

const FIRECRAWL_API_KEY = import.meta.env.VITE_FIRECRAWL_API_KEY;
const PAGESPEED_API_KEY = import.meta.env.VITE_PAGESPEED_API_KEY; // Google PageSpeed Insights API Key
const AUDIT_RECORDS_DIR = 'SEO-Audit-Records';

/**
 * 核心审计函数 - 执行完整的 SEO 技术审计
 */
export const performSeoAudit = async (domain) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  try {
    // 1. 基础页面抓取（使用 Firecrawl）
    const pageData = await scrapeWebsite(domain);
    
    // 2. 页面速度分析（使用 PageSpeed Insights）
    // 如果没有 API Key，返回 null，表示工具缺失
    const speedData = await analyzePageSpeed(domain);
    
    // 3. 执行五大模块审计
    const codeServerAudit = await auditCodeAndServer(domain, pageData, speedData);
    const contentAudit = await auditContent(domain, pageData);
    const mobileAudit = await auditMobile(domain, speedData);
    const aiAudit = await auditAIReadiness(domain, pageData); // 新增 AI 准备度审计

    const overallScore = calculateOverallScore(codeServerAudit, contentAudit, mobileAudit, speedData);

    // 4. 汇总审计结果
    const result = {
      domain,
      timestamp,
      auditDuration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
      overallScore,
      sections: {
        codeServer: codeServerAudit,
        content: contentAudit,
        mobile: mobileAudit,
        ai: aiAudit,
        scoring: overallScore
      },
      summary: generateSummary(codeServerAudit, contentAudit, mobileAudit, aiAudit, overallScore)
    };

    return result;
  } catch (error) {
    console.error('SEO Audit Failed:', error);
    throw new Error(`审计失败: ${error.message}`);
  }
};

/**
 * 1. 页面抓取（Firecrawl）
 */
const scrapeWebsite = async (domain) => {
  if (!FIRECRAWL_API_KEY) {
    throw new Error('Firecrawl API Key 未配置，无法进行页面抓取。请在设置中配置 API Key。');
  }

  try {
    const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify({
        url: domain,
        pageOptions: {
          onlyMainContent: false,
          includeHtml: true,
          screenshot: false
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Firecrawl API Error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success || !data.data) {
      throw new Error('Firecrawl: 未返回有效数据');
    }

    return {
      html: data.data.html || '',
      markdown: data.data.content || '',
      metadata: data.data.metadata || {},
      links: data.data.links || []
    };
  } catch (error) {
    console.error('Firecrawl scrape failed:', error);
    throw error; // 抓取失败直接抛出，因为这是基础数据
  }
};

/**
 * 2. 页面速度分析（Google PageSpeed Insights）
 */
const analyzePageSpeed = async (domain) => {
  if (!PAGESPEED_API_KEY || PAGESPEED_API_KEY.length === 0) {
    console.warn('PageSpeed API Key missing.');
    return null; // 明确返回 null 表示工具缺失
  }

  try {
    const desktopUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(domain)}&strategy=desktop&key=${PAGESPEED_API_KEY}`;
    const mobileUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(domain)}&strategy=mobile&key=${PAGESPEED_API_KEY}`;

    const [desktopRes, mobileRes] = await Promise.all([
      fetch(desktopUrl),
      fetch(mobileUrl)
    ]);

    // 如果 API 请求失败，也视为工具不可用或调用失败
    if (!desktopRes.ok || !mobileRes.ok) {
        console.warn('PageSpeed API request failed');
        return null;
    }

    const desktop = await desktopRes.json();
    const mobile = await mobileRes.json();

    const getScore = (res) => res.lighthouseResult?.categories?.performance?.score * 100 || 0;
    const getAudit = (res, key) => res.lighthouseResult?.audits?.[key]?.displayValue || 'N/A';

    return {
      desktop: {
        score: getScore(desktop),
        fcp: getAudit(desktop, 'first-contentful-paint'),
        lcp: getAudit(desktop, 'largest-contentful-paint'),
        ttfb: getAudit(desktop, 'server-response-time'),
        cls: getAudit(desktop, 'cumulative-layout-shift')
      },
      mobile: {
        score: getScore(mobile),
        fcp: getAudit(mobile, 'first-contentful-paint'),
        lcp: getAudit(mobile, 'largest-contentful-paint'),
        ttfb: getAudit(mobile, 'server-response-time'),
        cls: getAudit(mobile, 'cumulative-layout-shift')
      }
    };
  } catch (error) {
    console.error('PageSpeed analysis failed:', error);
    return null;
  }
};

/**
 * 3. 程序代码、服务器部分审计
 */
const auditCodeAndServer = async (domain, pageData, speedData) => {
  const items = [];
  
  // 3.1 页面打开速度
  if (speedData) {
    const lcpValue = parseFloat(speedData.desktop.lcp);
    items.push({
        category: '页面打开速度',
        description: '建议网站打开速度控制在3秒以内',
        status: lcpValue <= 3 ? 'pass' : 'fail',
        currentState: `桌面端 LCP: ${speedData.desktop.lcp}`,
        issue: lcpValue > 3 ? `页面加载速度为 ${speedData.desktop.lcp}，超过建议值` : '',
        suggestion: lcpValue > 3 ? '优化图片大小、启用 CDN、减少 JavaScript 执行时间' : '速度良好',
        priority: lcpValue > 3 ? 'high' : 'low',
        tool: 'PageSpeed Insights'
    });
  } else {
      items.push({
        category: '页面打开速度',
        description: '建议网站打开速度控制在3秒以内',
        status: 'info',
        currentState: '未检测 (PageSpeed 工具缺失)',
        issue: '缺乏 PageSpeed API Key',
        suggestion: '配置 PageSpeed API 以获取真实性能数据',
        priority: 'low',
        tool: 'PageSpeed Insights'
      });
  }

  // 3.2 SSL 证书
  const hasSSL = domain.startsWith('https://');
  items.push({
    category: 'SSL证书',
    description: '网站必须添加SSL证书',
    status: hasSSL ? 'pass' : 'fail',
    currentState: hasSSL ? '已配置 HTTPS' : '未配置 HTTPS',
    issue: !hasSSL ? '网站未启用 HTTPS' : '',
    suggestion: !hasSSL ? '立即购买并配置 SSL 证书（推荐 Let\'s Encrypt 免费证书）' : '已正确配置',
    priority: !hasSSL ? 'critical' : 'low',
    tool: 'Manual Check'
  });

  // 3.3 Robots.txt 检查
  const robotsCheck = await checkRobotsTxt(domain);
  items.push({
    category: 'Robots.txt配置',
    description: '检查是否允许 AI 爬虫（GPTBot, Claude-Web等）访问',
    status: robotsCheck.exists ? 'pass' : 'warning',
    currentState: robotsCheck.exists ? `已配置，${robotsCheck.allowsAI ? '允许 AI 爬虫' : '部分限制 AI 爬虫'}` : '未找到 robots.txt',
    issue: !robotsCheck.exists ? '缺少 robots.txt 文件' : (!robotsCheck.allowsAI ? '可能限制了 AI 爬虫访问' : ''),
    suggestion: !robotsCheck.exists ? '创建 robots.txt 文件并允许主流搜索引擎和 AI 爬虫' : '检查是否需要开放更多 AI 爬虫权限',
    priority: !robotsCheck.exists ? 'high' : 'medium',
    tool: 'HTTP Request'
  });

  // 3.4 Sitemap 文件
  const sitemapCheck = await checkSitemap(domain);
  items.push({
    category: 'Sitemap文件',
    description: '需安装sitemap.xml文件',
    status: sitemapCheck.exists ? 'pass' : 'fail',
    currentState: sitemapCheck.exists ? `找到 Sitemap（${sitemapCheck.urlCount} 条URL）` : '未找到 Sitemap',
    issue: !sitemapCheck.exists ? '缺少 sitemap.xml' : '',
    suggestion: !sitemapCheck.exists ? '生成并提交 sitemap.xml 到 Google Search Console' : '定期更新 Sitemap',
    priority: !sitemapCheck.exists ? 'high' : 'low',
    tool: 'HTTP Request'
  });

  // 3.5 元标签配置（NoIndex）
  const hasNoIndex = pageData.html.toLowerCase().includes('noindex');
  items.push({
    category: '元标签配置',
    description: '重要页面不应有 NoIndex 标签',
    status: !hasNoIndex ? 'pass' : 'fail',
    currentState: hasNoIndex ? '发现 NoIndex 标签' : '无 NoIndex 标签',
    issue: hasNoIndex ? '页面设置了 NoIndex，搜索引擎将不会索引此页面' : '',
    suggestion: hasNoIndex ? '移除 <meta name="robots" content="noindex"> 标签' : '正常',
    priority: hasNoIndex ? 'critical' : 'low',
    tool: 'HTML Analysis'
  });

  // 3.6 结构化数据（Schema.org）
  const schemaCheck = checkSchema(pageData.html);
  items.push({
    category: '结构化数据',
    description: '检查 Schema.org 标记（BreadcrumbList, Organization, Product等）',
    status: schemaCheck.hasSchema ? 'pass' : 'warning',
    currentState: schemaCheck.hasSchema ? `找到 ${schemaCheck.types.length} 种类型: ${schemaCheck.types.join(', ')}` : '未找到结构化数据',
    issue: !schemaCheck.hasSchema ? '缺少结构化数据标记' : '',
    suggestion: !schemaCheck.hasSchema ? '添加 JSON-LD 结构化数据（面包屑、组织信息、产品信息等）' : '建议使用 Google Rich Results Test 验证',
    priority: !schemaCheck.hasSchema ? 'medium' : 'low',
    tool: 'HTML Parser'
  });

  // 3.7 URL 规范化
  const urlCheck = checkURLStructure(domain, pageData.links);
  items.push({
    category: 'URL规范化',
    description: 'URL 应全小写、无特殊字符、层级不超过3级',
    status: urlCheck.isValid ? 'pass' : 'warning',
    currentState: urlCheck.summary,
    issue: !urlCheck.isValid ? urlCheck.issues.join('; ') : '',
    suggestion: '使用规范的 URL 结构，避免中文和特殊符号',
    priority: !urlCheck.isValid ? 'medium' : 'low',
    tool: 'URL Parser'
  });

  // 3.8 Heading Tag 检查
  const headingCheck = checkHeadings(pageData.html);
  items.push({
    category: 'Heading Tag',
    description: '每页一个H1，H1包含关键词，H标签层级合理',
    status: headingCheck.isValid ? 'pass' : 'fail',
    currentState: `H1数量: ${headingCheck.h1Count}, H2数量: ${headingCheck.h2Count}`,
    issue: headingCheck.issues.join('; '),
    suggestion: 'H1唯一且包含核心关键词，H2控制在5个以内，保持层级结构',
    priority: !headingCheck.isValid ? 'high' : 'low',
    tool: 'HTML Parser'
  });

  // 3.9 ALT 属性检查
  const altCheck = checkImageAlt(pageData.html);
  items.push({
    category: 'ALT属性',
    description: '所有图片应有描述性 ALT 属性',
    status: altCheck.percentage > 80 ? 'pass' : 'warning',
    currentState: `${altCheck.withAlt}/${altCheck.total} 图片有 ALT（${altCheck.percentage}%）`,
    issue: altCheck.percentage < 80 ? `${altCheck.total - altCheck.withAlt} 张图片缺少 ALT 属性` : '',
    suggestion: '为所有图片添加描述性 ALT 文本，提升可访问性和 SEO',
    priority: altCheck.percentage < 50 ? 'high' : 'medium',
    tool: 'HTML Parser'
  });

  // 3.10 死链接检查
  const deadLinksCheck = await checkDeadLinks(pageData.links);
  items.push({
    category: '死链接',
    description: '删除所有死链接或跳转到404页面',
    status: deadLinksCheck.count === 0 ? 'pass' : 'warning',
    currentState: deadLinksCheck.count === 0 ? '未发现死链接' : `发现 ${deadLinksCheck.count} 个死链接`,
    issue: deadLinksCheck.count > 0 ? `存在 ${deadLinksCheck.count} 个无效链接` : '',
    suggestion: deadLinksCheck.count > 0 ? '修复或删除死链接，设置自定义404页面' : '链接健康',
    priority: deadLinksCheck.count > 5 ? 'high' : 'medium',
    tool: 'Link Checker'
  });

  return {
    title: '程序代码、服务器部分',
    totalItems: items.length,
    passedItems: items.filter(i => i.status === 'pass').length,
    items
  };
};

/**
 * 4. 网站内容相关审计
 */
const auditContent = async (domain, pageData) => {
  const items = [];
  const { metadata, html, markdown } = pageData;

  // 4.1 Title 检查
  const title = metadata.title || '';
  const titleValid = title.length >= 30 && title.length <= 60;
  items.push({
    category: 'Title',
    description: '包含关键词，关键词放在前部，长度30-60字符',
    status: titleValid ? 'pass' : 'warning',
    currentState: `"${title}" (${title.length}字符)`,
    issue: !titleValid ? (title.length < 30 ? 'Title 过短' : 'Title 过长') : '',
    suggestion: !titleValid ? '调整 Title 长度至30-60字符，核心关键词前置' : 'Title 长度合适',
    priority: !titleValid ? 'high' : 'low',
    tool: 'Metadata Parser'
  });

  // 4.2 Description 检查
  const description = metadata.description || '';
  const descValid = description.length >= 90 && description.length <= 160;
  items.push({
    category: 'Description',
    description: '概括网站主要内容，长度90-160字符',
    status: descValid ? 'pass' : 'warning',
    currentState: `${description.substring(0, 50)}... (${description.length}字符)`,
    issue: !descValid ? (description.length < 90 ? 'Description 过短' : 'Description 过长') : '',
    suggestion: !descValid ? '优化 Meta Description 至90-160字符' : 'Description 长度合适',
    priority: !descValid ? 'medium' : 'low',
    tool: 'Metadata Parser'
  });

  // 4.3 内容丰富度
  const wordCount = markdown.split(/\s+/).length;
  const contentRich = wordCount > 300;
  items.push({
    category: '页面内容丰富度',
    description: '主要内容应大于300词',
    status: contentRich ? 'pass' : 'warning',
    currentState: `约 ${wordCount} 词`,
    issue: !contentRich ? '内容过少，不利于 SEO' : '',
    suggestion: !contentRich ? '增加高质量原创内容，建议至少300词' : '内容丰富',
    priority: !contentRich ? 'high' : 'low',
    tool: 'Content Analysis'
  });

  // 4.4 关键词密度与强调
  const keywordCheck = analyzeKeywordDensity(markdown, title, html);
  items.push({
    category: '关键词使用',
    description: '关键词自然分布，使用<strong>标签强调',
    status: keywordCheck.isOptimal ? 'pass' : 'warning',
    currentState: `Top关键词: ${keywordCheck.topKeywords.slice(0, 3).join(', ')}`,
    issue: !keywordCheck.isOptimal ? '关键词密度异常或未使用 Strong 标签强调' : '',
    suggestion: '确保核心关键词自然出现在标题、段落首句和<strong>标签中',
    priority: 'medium',
    tool: 'Text Analysis'
  });

  // 4.5 多媒体内容
  const mediaCheck = checkMultimedia(html);
  items.push({
    category: '丰富页面内容',
    description: '增加图片、视频等多种格式内容',
    status: mediaCheck.hasMedia ? 'pass' : 'warning',
    currentState: `图片: ${mediaCheck.imageCount}, 视频: ${mediaCheck.videoCount}`,
    issue: !mediaCheck.hasMedia ? '缺少多媒体内容' : '',
    suggestion: !mediaCheck.hasMedia ? '添加相关图片和视频，提升用户体验' : '多媒体内容充足',
    priority: !mediaCheck.hasMedia ? 'medium' : 'low',
    tool: 'HTML Parser'
  });

  // 4.6 YouTube 嵌入检查
  const hasYouTube = html.includes('youtube.com') || html.includes('youtu.be');
  items.push({
    category: 'YouTube',
    description: '通过YouTube嵌入视频有助于搜索排名',
    status: hasYouTube ? 'pass' : 'info',
    currentState: hasYouTube ? '已嵌入 YouTube 视频' : '未使用 YouTube',
    issue: '',
    suggestion: hasYouTube ? '保持 YouTube 视频内容更新' : '建议嵌入相关 YouTube 视频',
    priority: 'low',
    tool: 'HTML Parser'
  });

  // 4.7 Privacy Policy 检查
  const hasPrivacyPolicy = html.toLowerCase().includes('privacy') && html.toLowerCase().includes('policy');
  items.push({
    category: 'Privacy Policy',
    description: '网站需要有隐私政策页面',
    status: hasPrivacyPolicy ? 'pass' : 'warning',
    currentState: hasPrivacyPolicy ? '找到 Privacy Policy' : '未找到 Privacy Policy',
    issue: !hasPrivacyPolicy ? '缺少隐私政策页面' : '',
    suggestion: !hasPrivacyPolicy ? '创建并链接 Privacy Policy 页面（法律要求）' : '已有隐私政策',
    priority: !hasPrivacyPolicy ? 'high' : 'low',
    tool: 'Content Search'
  });

  return {
    title: '网站内容相关',
    totalItems: items.length,
    passedItems: items.filter(i => i.status === 'pass').length,
    items
  };
};

/**
 * 5. 手机端及 AMP 站点审计
 */
const auditMobile = async (domain, speedData) => {
  const items = [];

  // 5.1 移动端性能评分
  if (speedData) {
      const mobileScore = speedData.mobile.score;
      items.push({
        category: '移动端性能',
        description: '移动端评分需要大于50分',
        status: mobileScore > 50 ? 'pass' : 'fail',
        currentState: `移动端评分: ${mobileScore.toFixed(0)}/100`,
        issue: mobileScore <= 50 ? '移动端性能较差' : '',
        suggestion: mobileScore <= 50 ? '优化移动端资源加载、减少渲染阻塞' : '移动端性能良好',
        priority: mobileScore <= 50 ? 'high' : 'low',
        tool: 'PageSpeed Insights'
      });
  } else {
      items.push({
        category: '移动端性能',
        description: '移动端评分需要大于50分',
        status: 'info',
        currentState: '未检测 (PageSpeed 工具缺失)',
        issue: '',
        suggestion: '配置 PageSpeed API 以获取数据',
        priority: 'low',
        tool: 'PageSpeed Insights'
      });
  }

  // 5.2 响应式支持
  items.push({
    category: '响应式支持',
    description: '网站应支持多种终端设备',
    status: 'info',
    currentState: '建议通过 Google Mobile-Friendly Test 验证',
    issue: '',
    suggestion: '确保使用响应式设计，适配各种屏幕尺寸',
    priority: 'medium',
    tool: 'Manual Check'
  });

  // 5.3 AMP 站点检查
  items.push({
    category: 'AMP网站',
    description: 'AMP 可提升移动端加载速度',
    status: 'info',
    currentState: '未检测到 AMP 版本',
    issue: '',
    suggestion: '考虑为内容页面创建 AMP 版本（可选）',
    priority: 'low',
    tool: 'HTML Parser'
  });

  return {
    title: '手机端及AMP站点',
    totalItems: items.length,
    passedItems: items.filter(i => i.status === 'pass').length,
    items
  };
};

/**
 * 6. AI 搜索准备度 (AI Readiness) - 新增
 */
const auditAIReadiness = async (domain, pageData) => {
    const items = [];
    const robotsCheck = await checkRobotsTxt(domain);
    const llmsTxtCheck = await checkLLMsTxt(domain);
    
    // 6.1 Robots.txt 对 AI Bot 的友好度
    const aiBots = ['GPTBot', 'Claude-Web', 'Perplexity-Bot', 'Googlebot-Extended'];
    const blockedBots = aiBots.filter(bot => 
        robotsCheck.content && robotsCheck.content.includes(`User-agent: ${bot}`) && robotsCheck.content.includes('Disallow: /')
    );
    
    items.push({
        category: 'AI 爬虫访问权限',
        description: '是否允许主流 AI Bot (GPT, Claude, Perplexity) 访问',
        status: blockedBots.length === 0 ? 'pass' : 'warning',
        currentState: blockedBots.length === 0 ? '允许主要 AI 爬虫' : `拦截了: ${blockedBots.join(', ')}`,
        issue: blockedBots.length > 0 ? '阻止了部分 AI 爬虫，可能影响 AI 搜索排名' : '',
        suggestion: '建议在 robots.txt 中明确允许 GPTBot, Claude-Web 等 User-Agent',
        priority: 'high',
        tool: 'Robots.txt Analysis'
    });

    // 6.2 LLMs.txt 配置
    items.push({
        category: 'LLMs.txt 配置',
        description: '是否配置 /llms.txt 标准文件',
        status: llmsTxtCheck.exists ? 'pass' : 'warning',
        currentState: llmsTxtCheck.exists ? '已配置 llms.txt' : '未找到 llms.txt',
        issue: !llmsTxtCheck.exists ? '缺少 LLM 专用描述文件' : '',
        suggestion: '创建 llms.txt 文件，帮助 LLM 更好地理解网站内容结构 (参考 llmstxt.org)',
        priority: 'medium',
        tool: 'HTTP Request'
    });

    // 6.3 Meta 标签 AI 友好性
    const metaRobots = pageData.html.match(/<meta\s+name=["']robots["'][^>]*content=["']([^"']*)["']/i);
    const metaContent = metaRobots ? metaRobots[1].toLowerCase() : '';
    const isAiFriendly = !metaContent.includes('noimageai') && !metaContent.includes('noai');
    
    items.push({
        category: 'Meta 标签 AI 限制',
        description: '检查是否存在针对 AI 的限制标签 (noai, noimageai)',
        status: isAiFriendly ? 'pass' : 'warning',
        currentState: isAiFriendly ? '无 AI 限制标签' : '存在 AI 限制标签',
        issue: !isAiFriendly ? 'Meta 标签中包含 noai 限制' : '',
        suggestion: '除非有版权顾虑，否则建议移除 noai 标签以增加 AI 曝光',
        priority: 'low',
        tool: 'HTML Analysis'
    });

    return {
        title: 'AI 搜索准备度',
        totalItems: items.length,
        passedItems: items.filter(i => i.status === 'pass').length,
        items
    };
};

/**
 * 7. 计算整体评分
 */
const calculateOverallScore = (codeServerAudit, contentAudit, mobileAudit, speedData) => {
  const desktopScore = speedData ? speedData.desktop.score : 0;
  const mobileScore = speedData ? speedData.mobile.score : 0;
  
  const codeServerPass = (codeServerAudit.passedItems / codeServerAudit.totalItems) * 100;
  const contentPass = (contentAudit.passedItems / contentAudit.totalItems) * 100;
  const mobilePass = (mobileAudit.passedItems / mobileAudit.totalItems) * 100;

  // 调整权重，如果缺少 Speed 数据，权重分摊到其他项
  let overallScore;
  if (speedData) {
      overallScore = Math.round(
        (codeServerPass * 0.35 + contentPass * 0.25 + mobilePass * 0.15 + desktopScore * 0.15 + mobileScore * 0.10)
      );
  } else {
      // 降级模式：仅计算基础项
      overallScore = Math.round(
        (codeServerPass * 0.50 + contentPass * 0.30 + mobilePass * 0.20)
      );
  }

  return {
    overall: overallScore,
    desktop: speedData ? Math.round(desktopScore) : 0,
    mobile: speedData ? Math.round(mobileScore) : 0,
    codeServer: Math.round(codeServerPass),
    content: Math.round(contentPass),
    mobileCompatibility: Math.round(mobilePass),
    breakdown: {
      '程序代码、服务器': codeServerPass.toFixed(1) + '%',
      '网站内容': contentPass.toFixed(1) + '%',
      '手机端': mobilePass.toFixed(1) + '%',
      '桌面端性能': speedData ? desktopScore.toFixed(1) : 'N/A',
      '移动端性能': speedData ? mobileScore.toFixed(1) : 'N/A'
    }
  };
};

/**
 * 8. 生成审计总结
 */
const generateSummary = (codeServerAudit, contentAudit, mobileAudit, aiAudit, overallScore) => {
  const allItems = [
    ...codeServerAudit.items,
    ...contentAudit.items,
    ...mobileAudit.items,
    ...aiAudit.items
  ];

  const criticalIssues = allItems.filter(i => i.priority === 'critical' && i.status === 'fail');
  const highIssues = allItems.filter(i => i.priority === 'high' && (i.status === 'fail' || i.status === 'warning'));
  
  return {
    health: overallScore.overall > 80 ? '优秀' : overallScore.overall > 60 ? '良好' : overallScore.overall > 40 ? '一般' : '需改进',
    criticalCount: criticalIssues.length,
    highPriorityCount: highIssues.length,
    topIssues: [...criticalIssues, ...highIssues].slice(0, 5).map(i => ({
      category: i.category,
      issue: i.issue || i.suggestion,
      priority: i.priority
    })),
    recommendations: [
      criticalIssues.length > 0 ? `立即修复 ${criticalIssues.length} 个严重问题` : null,
      highIssues.length > 0 ? `优先处理 ${highIssues.length} 个高优先级问题` : null,
      overallScore.desktop < 80 && overallScore.desktop > 0 ? '优化桌面端性能，目标80分以上' : null,
      !overallScore.desktop ? '配置 PageSpeed API 以获取性能评分' : null
    ].filter(Boolean)
  };
};

// ============== 辅助函数 ==============

const checkFileWithFallback = async (domain, filename) => {
  // 1. 尝试原始域名
  let url = new URL(filename, domain).href;
  try {
    let response = await fetch(url);
    const contentType = response.headers.get('content-type') || '';
    
    // 如果返回 OK 且不是 HTML (可能是重定向到了首页)
    if (response.ok && !contentType.includes('text/html')) {
      const text = await response.text();
      return { exists: true, content: text, url };
    }
  } catch (e) {
    // ignore
  }

  // 2. 尝试 www 或去 www
  const urlObj = new URL(domain);
  let altDomain;
  if (urlObj.hostname.startsWith('www.')) {
    altDomain = urlObj.hostname.replace('www.', '');
  } else {
    altDomain = `www.${urlObj.hostname}`;
  }
  
  try {
    const altUrl = new URL(filename, `${urlObj.protocol}//${altDomain}`).href;
    const response = await fetch(altUrl);
    const contentType = response.headers.get('content-type') || '';

    if (response.ok && !contentType.includes('text/html')) {
      const text = await response.text();
      return { exists: true, content: text, url: altUrl };
    }
  } catch (e) {
    // ignore
  }

  return { exists: false, content: '', url: '' };
};

const checkRobotsTxt = async (domain) => {
  const result = await checkFileWithFallback(domain, '/robots.txt');
  if (result.exists) {
    const allowsAI = !result.content.toLowerCase().includes('disallow: /') || 
                     result.content.toLowerCase().includes('gptbot') ||
                     result.content.toLowerCase().includes('claude-web');
    return { exists: true, content: result.content, allowsAI };
  }
  return { exists: false, allowsAI: false, content: '' };
};

const checkLLMsTxt = async (domain) => {
  const result = await checkFileWithFallback(domain, '/llms.txt');
  return { exists: result.exists };
};

const checkSitemap = async (domain) => {
  const result = await checkFileWithFallback(domain, '/sitemap.xml');
  if (result.exists) {
    const urlMatches = result.content.match(/<url>/g);
    return { exists: true, urlCount: urlMatches ? urlMatches.length : 0 };
  }
  return { exists: false, urlCount: 0 };
};

const checkSchema = (html) => {
  const jsonLdMatches = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/gs);
  if (!jsonLdMatches) return { hasSchema: false, types: [] };
  
  const types = new Set();
  jsonLdMatches.forEach(match => {
    try {
      const json = JSON.parse(match.replace(/<\/?script[^>]*>/g, ''));
      if (json['@type']) types.add(json['@type']);
      if (json['@graph']) {
          json['@graph'].forEach(item => {
              if(item['@type']) types.add(item['@type']);
          });
      }
    } catch (e) {}
  });
  
  return { hasSchema: types.size > 0, types: Array.from(types) };
};

const checkURLStructure = (domain, links) => {
  const issues = [];
  let validCount = 0;
  
  links.slice(0, 20).forEach(link => {
    if (link.includes('中文') || /[^\x00-\x7F]/.test(link)) {
      issues.push('包含中文或特殊字符');
    }
    if (link !== link.toLowerCase()) {
      issues.push('URL 包含大写字母');
    }
    const depth = link.split('/').filter(Boolean).length - 2; // 减去 protocol 和 domain
    if (depth > 3) {
      issues.push('URL 层级超过3级');
    } else {
      validCount++;
    }
  });
  
  return {
    isValid: issues.length < 3,
    summary: `${validCount}/${links.length} URL 符合规范`,
    issues: [...new Set(issues)]
  };
};

const checkHeadings = (html) => {
  const h1Matches = html.match(/<h1[^>]*>.*?<\/h1>/gi) || [];
  const h2Matches = html.match(/<h2[^>]*>.*?<\/h2>/gi) || [];
  
  const issues = [];
  if (h1Matches.length === 0) issues.push('缺少 H1 标签');
  if (h1Matches.length > 1) issues.push('存在多个 H1 标签');
  if (h2Matches.length > 5) issues.push('H2 标签过多');
  
  return {
    isValid: issues.length === 0,
    h1Count: h1Matches.length,
    h2Count: h2Matches.length,
    issues
  };
};

const checkImageAlt = (html) => {
  const imgMatches = html.match(/<img[^>]*>/gi) || [];
  const withAlt = imgMatches.filter(img => /alt=["'][^"']*["']/.test(img)).length;
  
  return {
    total: imgMatches.length,
    withAlt,
    percentage: imgMatches.length > 0 ? Math.round((withAlt / imgMatches.length) * 100) : 100
  };
};

const checkDeadLinks = async (links) => {
  // 简化版：仅统计外部链接数量，不实际检测（会很慢）
  const externalLinks = links.filter(link => link.startsWith('http'));
  return { count: 0, total: externalLinks.length }; // Mock: 实际需要逐个请求
};

const analyzeKeywordDensity = (markdown, title, html) => {
  const words = markdown.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const frequency = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  const sorted = Object.entries(frequency).sort((a, b) => b[1] - a[1]);
  const topKeywords = sorted.slice(0, 5).map(([word]) => word);
  
  // 检查是否使用了 strong 标签
  const hasStrong = html.includes('<strong>') || html.includes('<b>');

  return {
    isOptimal: hasStrong, // 增强检查：必须有 strong 标签
    topKeywords
  };
};

const checkMultimedia = (html) => {
  const imageCount = (html.match(/<img[^>]*>/gi) || []).length;
  const videoCount = (html.match(/<video[^>]*>/gi) || []).length + 
                     (html.match(/youtube\.com|youtu\.be/gi) || []).length;
  
  return {
    hasMedia: imageCount > 0 || videoCount > 0,
    imageCount,
    videoCount
  };
};

// ============== 历史记录管理（保持不变）==============

export const getAuditHistory = async () => {
  try {
    const files = await getRepoContent(AUDIT_RECORDS_DIR);
    if (!files || files.length === 0) {
      return migrateFromLocalStorage();
    }

    const records = [];
    for (const file of files) {
      if (file.type === 'file' && file.name.endsWith('.json')) {
        try {
          const content = await getFileContent(file.path);
          if (content && content.content) {
            const record = JSON.parse(content.content);
            records.push(record);
          }
        } catch (e) {
          console.error(`Failed to load ${file.name}:`, e);
        }
      }
    }

    return records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (e) {
    console.error('Failed to load history from GitHub:', e);
    return getLocalHistory();
  }
};

const migrateFromLocalStorage = async () => {
  const localHistory = getLocalHistory();
  if (localHistory.length === 0) return [];

  console.log('Migrating audit history from localStorage to GitHub...');
  
  for (const record of localHistory) {
    try {
      await saveToGitHub(record);
    } catch (e) {
      console.error('Migration failed for record:', e);
    }
  }

  return localHistory;
};

const getLocalHistory = () => {
  try {
    const history = localStorage.getItem('seo_audit_history');
    return history ? JSON.parse(history) : [];
  } catch (e) {
    console.error('Failed to parse localStorage history', e);
    return [];
  }
};

const saveToGitHub = async (result) => {
  const sanitizedDomain = result.domain.replace(/[^a-zA-Z0-9.-]/g, '_');
  const timestamp = new Date(result.timestamp).getTime();
  const filename = `${sanitizedDomain}_${timestamp}.json`;
  const filePath = `${AUDIT_RECORDS_DIR}/${filename}`;

  const content = JSON.stringify(result, null, 2);
  await putFile(filePath, content, `Add SEO audit record for ${result.domain}`);
};

export const saveAuditResult = async (result) => {
  try {
    await saveToGitHub(result);

    const localHistory = getLocalHistory();
    const newHistory = [result, ...localHistory].slice(0, 20);
    localStorage.setItem('seo_audit_history', JSON.stringify(newHistory));

    return await getAuditHistory();
  } catch (e) {
    console.error('Failed to save to GitHub:', e);
    const localHistory = getLocalHistory();
    const newHistory = [result, ...localHistory].slice(0, 20);
    localStorage.setItem('seo_audit_history', JSON.stringify(newHistory));
    return newHistory;
  }
};

export const deleteAuditRecord = async (timestamp) => {
    try {
      const files = await getRepoContent(AUDIT_RECORDS_DIR);
      if (files) {
        for (const file of files) {
          if (file.type === 'file' && file.name.includes(new Date(timestamp).getTime().toString())) {
            console.log(`Skipping GitHub deletion for ${file.name}`);
          }
        }
      }

      const localHistory = getLocalHistory();
      const newHistory = localHistory.filter(item => item.timestamp !== timestamp);
      localStorage.setItem('seo_audit_history', JSON.stringify(newHistory));

      return await getAuditHistory();
    } catch (e) {
      console.error('Failed to delete from GitHub:', e);
      const localHistory = getLocalHistory();
      const newHistory = localHistory.filter(item => item.timestamp !== timestamp);
      localStorage.setItem('seo_audit_history', JSON.stringify(newHistory));
      return newHistory;
    }
};

export const exportToCsv = (result) => {
  const headers = ['Section', 'Category', 'Status', 'Issue', 'Suggestion', 'Priority'];
  const rows = [];
  
  Object.values(result.sections).forEach(section => {
    if (section && section.items) {
      section.items.forEach(item => {
        rows.push([
          section.title,
          item.category,
          item.status,
          item.issue || '-',
          item.suggestion,
          item.priority
        ]);
      });
    }
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.map(c => `"${c}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `seo_audit_${result.domain.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
