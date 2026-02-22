# SEO 审计工具配置指南

## 当前已集成的工具

### 1. ✅ Firecrawl (已配置)
- **用途**: 页面抓取、HTML 解析、链接提取
- **API Key**: 已配置 `VITE_FIRECRAWL_API_KEY`
- **费用**: 付费服务（您已有 Key）
- **官网**: https://firecrawl.dev

---

## 需要配置的工具

### 2. ⚠️ Google PageSpeed Insights API (必需)
- **用途**: 
  - 页面性能分析（LCP, FCP, TTFB, CLS）
  - 桌面端和移动端评分
  - Core Web Vitals 检测
  
- **如何获取**:
  1. 访问: https://console.cloud.google.com/
  2. 创建项目或选择现有项目
  3. 启用 "PageSpeed Insights API"
  4. 创建 API Key
  5. 将 Key 添加到环境变量: `VITE_PAGESPEED_API_KEY`

- **费用**: 
  - 免费额度: 25,000 次请求/天
  - 超出后: $5/千次请求
  
- **配置步骤**:
  ```bash
  # .env 文件
  VITE_PAGESPEED_API_KEY=your_google_pagespeed_api_key_here
  ```

- **替代方案** (如果不想用 Google):
  - Lighthouse CI（需自建服务器）
  - WebPageTest API（免费但有限额）

---

## 推荐但非必需的增强工具

### 3. 🔍 Schema.org Validator API
- **用途**: 验证结构化数据
- **当前状态**: 使用 HTML 解析（基础检测）
- **增强方案**: 
  - Google Rich Results Test API
  - Schema.org Validator API
  
- **费用**: 免费
- **配置**: 
  ```bash
  # 暂无需配置，当前使用正则匹配
  ```

---

### 4. 🔗 Dead Link Checker
- **用途**: 检测死链接
- **当前状态**: 已实现基础框架（未实际请求）
- **增强方案**: 
  - 自建爬虫（逐个请求链接）
  - 使用第三方服务:
    - Broken Link Checker API
    - W3C Link Checker
    - Ahrefs API (付费)

- **费用**: 自建免费，第三方看情况
- **实现建议**: 
  - 简单版：在后台异步逐个请求外部链接，记录 404 状态
  - 专业版：使用 Ahrefs/Semrush API

---

### 5. 🤖 AI Crawler Detection (Robots.txt 深度分析)
- **用途**: 检测是否允许 AI 爬虫（GPTBot, Claude-Web, Perplexity等）
- **当前状态**: 已基础实现（检测 robots.txt）
- **增强方案**: 解析 robots.txt 的详细规则

- **费用**: 免费（HTTP 请求）
- **配置**: 无需额外配置

---

### 6. 📊 Sitemap XML Parser
- **用途**: 解析 sitemap.xml 并统计 URL 数量
- **当前状态**: 已实现
- **增强方案**: 
  - 检测 sitemap 是否已提交到 Google Search Console
  - 验证 sitemap 中的 URL 是否可访问

- **费用**: 免费
- **配置**: 无需额外配置

---

### 7. 🌐 SSL Certificate Checker
- **用途**: 检测 SSL 证书有效性、过期时间
- **当前状态**: 基础检测（是否 HTTPS）
- **增强方案**: 
  - SSL Labs API (https://www.ssllabs.com/ssltest/)
  - 自建检测（使用 Node.js tls 模块）

- **费用**: SSL Labs API 免费
- **配置**: 无需 API Key

---

### 8. 📱 Mobile-Friendly Test
- **用途**: 检测移动端兼容性
- **当前状态**: 通过 PageSpeed Insights 间接检测
- **增强方案**: 
  - Google Mobile-Friendly Test API
  - 检测 viewport meta 标签

- **费用**: 免费
- **配置**: 使用 Google Search Console API

---

### 9. 🔍 Keyword Density Analyzer (高级版)
- **用途**: 分析关键词密度、TF-IDF
- **当前状态**: 基础词频统计
- **增强方案**: 
  - 使用 NLP 库（如 Natural.js、compromise.js）
  - 对比竞争对手页面关键词

- **费用**: 开源库免费
- **配置**: 无需 API

---

### 10. 🎯 Competitor Analysis Tools (可选)
- **用途**: 竞品 SEO 对比分析
- **推荐工具**: 
  - Ahrefs API（付费，$99-$999/月）
  - Semrush API（付费，$119-$449/月）
  - Moz API（付费，$99-$599/月）

- **功能**: 
  - 竞品排名追踪
  - 反向链接分析
  - 关键词排名对比

- **费用**: 昂贵（建议按需采购）

---

## 快速配置清单

### 立即配置（必需）
✅ Firecrawl API Key (已完成)
⚠️ **Google PageSpeed Insights API Key** (待配置)

### 本周配置（推荐）
- Google Rich Results Test API
- SSL Labs API

### 按需配置（可选）
- Ahrefs/Semrush API（竞品分析）
- Dead Link Checker 自建服务

---

## 环境变量配置模板

```bash
# .env 文件
VITE_GITHUB_TOKEN=your_github_token
VITE_REPO_OWNER=your_username
VITE_REPO_NAME=overseas-marketing-center

# 必需
VITE_FIRECRAWL_API_KEY=fc-ae57322be6ae4ff9af1820f78914ad2e
VITE_PAGESPEED_API_KEY=your_google_pagespeed_api_key_here

# 可选（未来扩展）
VITE_AHREFS_API_KEY=your_ahrefs_key (如需竞品分析)
VITE_SEMRUSH_API_KEY=your_semrush_key (如需竞品分析)
```

---

## 总结

### 当前可用的审计维度（无需额外配置）:
- ✅ SSL 证书检测
- ✅ Robots.txt 检查
- ✅ Sitemap 检测
- ✅ 元标签分析（Title, Description, NoIndex）
- ✅ 结构化数据检测（基础）
- ✅ URL 规范化检查
- ✅ Heading Tag 分析
- ✅ ALT 属性检测
- ✅ 内容丰富度分析
- ✅ 多媒体内容检测

### 需要 Google PageSpeed API 的维度:
- ⚠️ **页面加载速度（LCP, FCP, TTFB）**
- ⚠️ **桌面端/移动端性能评分**
- ⚠️ **Core Web Vitals 检测**

### 需要付费工具的高级功能:
- ❌ 竞品分析（Ahrefs/Semrush）
- ❌ 反向链接分析
- ❌ 关键词排名追踪

**建议**: 
1. 立即配置 Google PageSpeed Insights API（免费且必需）
2. 其他工具可根据实际需求逐步添加
