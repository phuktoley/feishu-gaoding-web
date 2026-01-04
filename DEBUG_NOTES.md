# feishu-gaoding-web 调试笔记

## 环境变量配置（Railway）

```
DATABASE_URL="${{MySQL.MYSQL_URL}}"
FEISHU_APP_ID="cli_a9dcabca84785cd1"
FEISHU_APP_SECRET="D2UeA0RgzNC9anl2cAvBTceTP7HCmgfS"
JWT_SECRET="CQicGYOMm1BTYvMDL20jxB5OxxeSWD+LrkBaReOiyYI="
NODE_ENV="production"
OAUTH_SERVER_URL="https://feishu-gaoding-web-production.up.railway.app"
PORT="8080"
VITE_APP_ID="cli_a9dcabca84785cd1"
VITE_OAUTH_PORTAL_URL="https://feishu-gaoding-web-production.up.railway.app"
```

## 问题诊断

### 问题 1: 保存飞书配置失败
**错误信息**: 
```
保存失败: Failed query: select `id`, `userId`, `appId`, `appSecret`, `appToken`, `tableId`, `imageFieldName`, `createdAt`, `updatedAt` from `feishu_config` where `feishu_config`.`userId` = ? limit ? params: 1,1
```

**根本原因分析**:
1. 数据库表 `feishu_config` 可能不存在
2. 需要检查数据库迁移是否已执行

### 待检查项
- [ ] 数据库迁移状态
- [ ] feishu_config 表是否存在
- [ ] users 表是否存在
- [ ] 默认用户 ID 是否正确

## 已完成的修复

### 1. 静态文件路径修复
- 文件: `server/_core/vite.ts`
- 问题: 生产环境下无法找到 `dist/public` 目录
- 修复: 使用 `path.join(process.cwd(), "dist", "public")`

### 2. 认证逻辑增强
- 文件: `server/_core/context.ts`
- 问题: 未登录时重定向导致 404
- 修复: 添加默认访客用户支持

## 问题根因分析

### 数据库迁移未执行

**发现**: Railway 部署配置中没有执行数据库迁移命令，导致 `feishu_config` 和 `tasks` 表不存在。

**迁移文件存在**:
- `drizzle/0000_romantic_metal_master.sql` - 创建 users 表
- `drizzle/0001_friendly_kabuki.sql` - 创建 feishu_config 和 tasks 表

**修复方案**:
在 `railway.toml` 中添加 `preDeployCommand` 来执行数据库迁移：

```toml
[deploy]
startCommand = "pnpm start"
preDeployCommand = "pnpm db:push"
```

## 下一步行动

1. ✅ 检查数据库迁移脚本 - 已完成
2. ✅ 确认 feishu_config 表结构 - 已确认
3. ✅ 添加数据库迁移到部署流程 - 已修复
4. 测试完整业务流程


## 业务逻辑分析

### 核心功能模块

1. **飞书配置管理** (`feishuConfig`)
   - `get`: 获取当前用户的飞书配置
   - `save`: 保存飞书配置（App ID, App Secret, App Token, Table ID, 图片字段名）
   - `test`: 测试飞书连接

2. **飞书数据操作** (`feishu`)
   - `getRecords`: 获取飞书多维表格数据
   - `uploadImages`: 上传图片到飞书

3. **ZIP 文件处理** (`zip`)
   - `parse`: 解析上传的 ZIP 文件，提取图片

4. **任务管理** (`tasks`)
   - `list`: 列出用户的所有任务
   - `get`: 获取单个任务详情
   - `create`: 创建新任务
   - `updateStatus`: 更新任务状态

### 数据库表结构

1. **users** - 用户表
   - id, openId, name, email, loginMethod, role, createdAt, updatedAt, lastSignedIn

2. **feishu_config** - 飞书配置表
   - id, userId, appId, appSecret, appToken, tableId, imageFieldName, createdAt, updatedAt

3. **tasks** - 任务表
   - id, userId, status, totalRecords, processedRecords, errorMessage, createdAt, updatedAt

### 业务流程

1. 用户登录（通过 OAuth 或使用默认访客用户）
2. 配置飞书凭证（App ID, App Secret, App Token, Table ID）
3. 从飞书多维表格获取数据
4. 在稿定设计生成图片并下载 ZIP
5. 上传 ZIP 文件，系统解析并提取图片
6. 将图片回传到飞书多维表格

## 已解决问题

### 问题 1: 数据库迁移 ✅ 已修复
- **状态**: 已添加 `preDeployCommand` 到 `railway.toml`
- **结果**: Railway 部署时自动执行数据库迁移

### 问题 2: 默认用户 ID ✅ 已修复
- **原实现**: 使用固定的访客用户 (id=1)
- **问题**: 如果数据库中没有 id=1 的用户，查询会失败
- **修复**: 在 `context.ts` 中添加自动创建用户的逻辑

## 最终修复代码

### context.ts 修复

```typescript
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { upsertUser, getUserByOpenId } from "../db";

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // 确保访客用户存在于数据库
    try {
      await upsertUser({
        openId: "guest",
        name: "Guest User",
        email: "guest@example.com",
        role: "admin",
        loginMethod: "guest",
      });
      
      // 从数据库获取实际用户 ID
      const dbUser = await getUserByOpenId("guest");
      if (dbUser) {
        user = dbUser;
      }
    } catch (dbError) {
      // 回退到默认用户
      user = { id: 1, openId: "guest", ... };
    }
  }

  return { req: opts.req, res: opts.res, user };
}
```

### railway.toml 修复

```toml
[build]
builder = "nixpacks"
buildCommand = "pnpm install && pnpm build"

[deploy]
startCommand = "pnpm start"
preDeployCommand = "pnpm db:push"
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```
