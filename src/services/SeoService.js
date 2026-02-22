// src/services/SeoService.js

/**
 * 模拟 SEO 审计过程
 * 在真实环境中，这里应该调用后端 API 或 Serverless Function，
 * 后端再调用 Firecrawl 或其他爬虫服务抓取页面，然后通过 LLM 分析生成报告。
 */
export const performSeoAudit = async (domain) => {
  // 模拟网络请求延迟
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 模拟失败情况 (10% 概率)
  if (Math.random() < 0.1) {
    throw new Error('域名无法解析或连接超时，请检查拼写是否正确。');
  }

  // 模拟审计结果
  const isGood = Math.random() > 0.3;
  const loadTime = (Math.random() * 2 + 0.5).toFixed(2); // 0.5 - 2.5s
  
  return {
    domain,
    timestamp: new Date().toISOString(),
    score: Math.floor(Math.random() * 40 + 60), // 60-100
    metrics: {
      loadTime: `${loadTime}s`,
      tdkHealth: `${Math.floor(Math.random() * 30 + 70)}%`,
      backlinks: Math.floor(Math.random() * 500 + 50)
    },
    summary: {
      health: isGood ? '良好' : '一般',
      topIssues: [
        '首页 TDK 配置需优化',
        '移动端视口未适配',
        '部分图片缺少 Alt 属性'
      ]
    },
    issues: [
      {
        type: 'technical',
        severity: 'high',
        title: '缺少 HTTPS 重定向',
        impact: 'High',
        fix: '在服务器配置中添加 301 重定向，将所有 HTTP 流量指向 HTTPS。',
        suggestion: '建议在 Nginx/Apache 配置中添加 rewrite 规则。'
      },
      {
        type: 'onpage',
        severity: 'medium',
        title: '首页 Title 标签过长',
        impact: 'Medium',
        fix: '将 Title 标签控制在 60 字符以内，确保核心关键词前置。',
        suggestion: '当前长度 85 字符，建议删减冗余词汇。'
      },
      {
        type: 'content',
        severity: 'low',
        title: '图片缺少 Alt 属性',
        impact: 'Low',
        fix: '为所有关键图片添加描述性 Alt 文本。',
        suggestion: '主要涉及 banner.jpg 和 logo.png。'
      },
      {
        type: 'technical',
        severity: 'high',
        title: 'Core Web Vitals: LCP > 2.5s',
        impact: 'High',
        fix: '优化最大内容绘制时间，压缩首屏图片或使用 CDN。',
        suggestion: `当前 LCP 为 ${loadTime}s，建议开启 WebP 格式转换。`
      }
    ]
  };
};

/**
 * 获取历史记录
 */
export const getAuditHistory = () => {
  try {
    const history = localStorage.getItem('seo_audit_history');
    return history ? JSON.parse(history) : [];
  } catch (e) {
    console.error('Failed to parse history', e);
    return [];
  }
};

/**
 * 保存审计记录
 */
export const saveAuditResult = (result) => {
  try {
    const history = getAuditHistory();
    // 限制最多保存 20 条
    const newHistory = [result, ...history].slice(0, 20);
    localStorage.setItem('seo_audit_history', JSON.stringify(newHistory));
    return newHistory;
  } catch (e) {
    console.error('Failed to save history', e);
    return [];
  }
};

/**
 * 删除单条记录
 */
export const deleteAuditRecord = (timestamp) => {
    const history = getAuditHistory();
    const newHistory = history.filter(item => item.timestamp !== timestamp);
    localStorage.setItem('seo_audit_history', JSON.stringify(newHistory));
    return newHistory;
};

/**
 * 导出 CSV
 */
export const exportToCsv = (result) => {
  const headers = ['Domain', 'Date', 'Score', 'Load Time', 'TDK Health', 'Issue Title', 'Severity', 'Fix Suggestion'];
  const rows = result.issues.map(issue => [
    result.domain,
    new Date(result.timestamp).toLocaleDateString(),
    result.score,
    result.metrics.loadTime,
    result.metrics.tdkHealth,
    issue.title,
    issue.severity,
    issue.suggestion
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.map(c => `"${c}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `seo_audit_${result.domain}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
