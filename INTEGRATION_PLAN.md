# feishu-gaoding-web V4.2 集成计划

## 版本信息
- **版本**: V4.2
- **基于**: V4.1
- **更新日期**: 2026-01-05

## 双应用协同架构

本应用作为"应用 B: 飞书稿定"，与"应用 A: 内容生成器 (0103XHS)"共享同一个 Railway MySQL 数据库。

### 架构图

```
┌─────────────────────┐     ┌─────────────────────┐
│   应用 A: 0103XHS   │     │ 应用 B: feishu-gaoding│
│   (内容生成器)       │     │   (图片生成器)        │
├─────────────────────┤     ├─────────────────────┤
│ • 管理人设配置       │     │ • 读取共享配置        │
│ • 批量生成文本内容   │     │ • 监听飞书表格更新    │
│ • 写入飞书表格(Text) │     │ • 生成图片并回写      │
└──────────┬──────────┘     └──────────┬──────────┘
           │                           │
           └───────────┬───────────────┘
                       │
              ┌────────▼────────┐
              │  Shared MySQL   │
              │  (Railway)      │
              ├─────────────────┤
              │ • users         │
              │ • personas      │
              │ • feishuConfigs │
              │ • feishu_config │
              │ • tasks         │
              └─────────────────┘
```

## 集成步骤

### Step 1: 环境变量配置

在 Railway 中，将应用 B 的 `DATABASE_URL` 设置为与应用 A 相同的值：

```bash
# 两个应用使用相同的 DATABASE_URL
DATABASE_URL=mysql://user:password@host:port/database
```

### Step 2: 读取共享配置 (可选增强)

应用 B 可以直接读取应用 A 中 `personas` 表的 `feishuConfig` 字段：

```typescript
// 从共享数据库读取人设的飞书配置
import { isNotNull } from "drizzle-orm";

// 获取所有配置了飞书的人设
const activePersonas = await db.select().from(personas)
  .where(isNotNull(personas.feishuConfig));

// 遍历每个人设，处理对应的飞书表格
for (const p of activePersonas) {
  if (p.feishuConfig) {
    await processTable(p.feishuConfig.appToken, p.feishuConfig.tableId);
  }
}
```

### Step 3: 数据流向

1. **应用 A** 生成文本内容 → 写入飞书多维表格
2. **应用 B** 监听飞书表格 → 读取文本内容 → 调用稿定设计 API 生成图片 → 回写图片到飞书表格

## 当前实现状态

| 功能 | 状态 | 说明 |
|------|------|------|
| 飞书配置存储 | ✅ 已实现 | `feishu_config` 表 |
| 任务管理 | ✅ 已实现 | `tasks` 表 |
| 稿定设计集成 | ✅ 已实现 | 支持模板渲染 |
| CSV/XLSX 导出 | ✅ 已实现 | 支持稿定设计格式 |
| 飞书图片上传 | ✅ 已实现 | 支持附件字段 |

## 测试验证

1. 确认两个应用使用相同的 `DATABASE_URL`
2. 在应用 A 中创建人设并配置飞书
3. 在应用 A 中生成内容并导出到飞书
4. 在应用 B 中验证能否读取飞书表格数据
5. 在应用 B 中生成图片并上传到飞书

## 相关文件

- `drizzle/schema.ts` - 数据库 Schema
- `server/db.ts` - 数据库操作
- `server/routers.ts` - API 路由
