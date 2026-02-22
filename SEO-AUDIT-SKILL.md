# SEO Audit Skill

This skill performs a comprehensive technical SEO audit of a website based on professional standards (GEO Diagnosis).

## Audit Dimensions

The audit covers 4 main sections:

### 1. Code & Server (程序代码、服务器部分)
- **Page Speed**: LCP should be < 3s.
- **SSL Certificate**: Must use HTTPS.
- **Robots.txt**: Must exist and allow AI bots (GPTBot, Claude-Web, etc.).
- **Sitemap**: Must exist (sitemap.xml).
- **Meta Tags**: Check for `noindex`.
- **Structured Data**: Check for Schema.org (Breadcrumb, Organization, Product, Article).
- **URL Structure**: Lowercase, no special chars, depth < 3.
- **Headings**: H1 unique & contains keywords; H2 count reasonable.
- **Alt Attributes**: All images must have alt text.
- **Dead Links**: Check for 404s.

### 2. Content (网站内容相关)
- **Title**: 30-60 chars, keywords at front.
- **Description**: 90-160 chars, summarizes content.
- **Keywords**: Core keywords presence.
- **Content Richness**: Main content > 300 words.
- **Keyword Density**: Natural distribution, use `<strong>`.
- **Multimedia**: Images and videos presence.
- **YouTube**: Embedding YouTube videos is recommended.
- **Privacy Policy**: Must exist.

### 3. Mobile & AMP (手机端及AMP站点)
- **Mobile Performance**: Score > 50.
- **Responsive Design**: Compatible with various devices.
- **AMP**: Accelerated Mobile Pages support (optional but recommended).

### 4. Overall Scoring (整体评分)
- **Desktop Score**: Target > 80.
- **Mobile Score**: Target > 50.
- Weighted calculation based on the above sections.

## Output Format

The skill returns a JSON object with the following structure:
```json
{
  "domain": "https://example.com",
  "timestamp": "ISO-8601 string",
  "overallScore": {
    "overall": 85,
    "desktop": 90,
    "mobile": 60,
    "breakdown": { ... }
  },
  "sections": {
    "codeServer": { "title": "...", "items": [...] },
    "content": { "title": "...", "items": [...] },
    "mobile": { "title": "...", "items": [...] }
  },
  "summary": {
    "health": "Good",
    "topIssues": [...],
    "recommendations": [...]
  }
}
```

## Tools Used
- **Firecrawl**: For full page scraping (HTML, Markdown, Metadata).
- **PageSpeed Insights**: For Core Web Vitals and performance scores.
- **Validator**: For Schema.org and HTML validation logic.
