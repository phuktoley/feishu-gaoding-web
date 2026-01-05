# V4.1 双应用协同集成计划

> 本文档由 Manus AI 生成，旨在指导开发人员实施“双应用协同”架构，实现配置共享和数据闭环。

## 1. 核心目标
1.  **共享数据库**：连接到与 `0103XHS` 应用相同的 MySQL 数据库。
2.  **配置复用**：直接读取 `personas` 表中的 `feishuConfig`，无需重复配置。
3.  **自动化闭环**：根据人设配置，自动监听对应的飞书表格，生成图片并回写。

## 2. 数据库连接 (P0)

### 2.1 环境变量配置
在 Railway 中，将本应用 (`feishu-gaoding-web`) 的 `DATABASE_URL` 环境变量设置为与 `0103XHS` 应用完全相同的值。

### 2.2 Schema 同步
修改 `drizzle/schema.ts`，引入 `personas` 表的定义（只读模式），以便查询配置。

```typescript
// drizzle/schema.ts

// 引入 Personas 表定义 (与 0103XHS 保持一致)
export const personas = mysqlTable("personas", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  // ... 其他字段
  feishuConfig: json("feishuConfig").$type<{
    appToken: string;
    tableId: string;
  }>(),
});
```

## 3. 业务逻辑变更 (P1)

### 3.1 移除本地配置表
废弃 `feishu_config` 表的使用，改为从 `personas` 表获取配置。

### 3.2 任务调度逻辑
修改任务生成逻辑，支持按“人设”维度触发任务。

```typescript
// server/tasks.ts (伪代码)

async function createTasksFromPersonas() {
  // 1. 获取所有配置了飞书表格的人设
  const activePersonas = await db.select().from(personas)
    .where(isNotNull(personas.feishuConfig));

  for (const persona of activePersonas) {
    // 2. 为每个人设创建图片生成任务
    await createImageGenerationTask({
      appToken: persona.feishuConfig.appToken,
      tableId: persona.feishuConfig.tableId,
      personaId: persona.id
    });
  }
}
```

## 4. 部署与验证
1.  **停止**本应用的旧数据库服务（如有）。
2.  **更新** `DATABASE_URL` 环境变量。
3.  **部署**新代码。
4.  **验证**：在 `0103XHS` 中修改人设配置，检查本应用是否能读取到最新配置。
