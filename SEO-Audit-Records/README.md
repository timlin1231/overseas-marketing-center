# SEO Audit Records

此文件夹用于存储所有 SEO 审计记录。

## 存储格式

每个审计记录以 JSON 格式存储，文件名格式：

```
{domain}_{timestamp}.json
```

例如：`example_com_1708670400000.json`

## 数据结构

每个 JSON 文件包含以下字段：

- `domain`: 审计的域名
- `timestamp`: 审计时间（ISO 8601 格式）
- `score`: SEO 健康分（0-100）
- `metrics`: 核心指标（加载速度、TDK 合规度等）
- `summary`: 审计总结
- `issues`: 详细问题列表

## 自动管理

- 审计记录会自动同步到此文件夹
- 删除记录时会自动从此文件夹移除
- 支持从 localStorage 自动迁移历史记录
