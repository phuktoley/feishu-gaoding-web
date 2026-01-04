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
