# Railway 部署记录 - 2026年1月4日

## 部署时间
2026-01-04

## 部署平台
Railway

## 仓库信息
- GitHub: phuktoley/feishu-gaoding-web
- 分支: deployment-2026-01-04-railway

## 项目分析总结

### 技术栈
- **前端**: React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui
- **后端**: Express + tRPC
- **数据库**: MySQL (TiDB) + Drizzle ORM
- **认证**: Manus OAuth（但已配置访客模式）
- **构建工具**: Vite + esbuild
- **包管理**: pnpm

### 核心功能模块
1. **飞书配置管理** - 配置飞书应用凭证和多维表格信息
2. **飞书数据导出** - 从多维表格读取数据并支持导出 CSV
3. **ZIP 文件上传解析** - 上传稿定设计生成的 ZIP 并解析图片
4. **图片回传飞书** - 将解析的图片自动上传到飞书多维表格

### 数据库表结构
1. **users** - 用户表（支持访客用户）
2. **feishu_config** - 飞书配置表
3. **tasks** - 任务记录表

## Railway 部署配置

### 必需环境变量

```bash
# 数据库配置（Railway MySQL 服务自动提供）
DATABASE_URL="${{MySQL.MYSQL_URL}}"

# 飞书应用配置（示例值，实际部署时可更新）
FEISHU_APP_ID="cli_a9dcabca84785cd1"
FEISHU_APP_SECRET="D2UeA0RgzNC9anl2cAvBTceTP7HCmgfS"

# JWT 密钥（可使用 openssl rand -base64 32 生成）
JWT_SECRET="CQicGYOMm1BTYvMDL20jxB5OxxeSWD+LrkBaReOiyYI="

# 应用环境
NODE_ENV="production"
PORT="8080"

# OAuth 配置（需要替换为实际的 Railway 域名）
OAUTH_SERVER_URL="https://your-project-name.up.railway.app"
VITE_APP_ID="cli_a9dcabca84785cd1"
VITE_OAUTH_PORTAL_URL="https://your-project-name.up.railway.app"
```

### Railway 部署文件配置

**railway.toml**:
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

**nixpacks.toml**:
```toml
[phases.setup]
nixPkgs = ['nodejs_20', 'pnpm']
```

### 部署步骤

1. **创建 Railway 项目**
   - 登录 Railway (https://railway.app)
   - 创建新项目
   - 选择 "Deploy from GitHub repo"

2. **连接 GitHub 仓库**
   - 选择 `phuktoley/feishu-gaoding-web`
   - 选择 `main` 分支或 `deployment-2026-01-04-railway` 分支

3. **添加 MySQL 数据库**
   - 在项目中点击 "New" → "Database" → "Add MySQL"
   - Railway 会自动生成 `MYSQL_URL` 环境变量

4. **配置环境变量**
   - 进入项目设置 → Variables
   - 添加上述所有必需环境变量
   - 注意：`OAUTH_SERVER_URL` 和 `VITE_OAUTH_PORTAL_URL` 需要使用实际的 Railway 域名

5. **触发部署**
   - 保存环境变量后会自动触发部署
   - 等待构建和部署完成

6. **验证部署**
   - 访问 Railway 提供的域名
   - 检查应用是否正常启动

## 已知问题和修复

### 问题 1: 数据库迁移 ✅ 已修复
- **问题**: 部署时 `feishu_config` 和 `tasks` 表不存在
- **修复**: 在 `railway.toml` 中添加 `preDeployCommand = "pnpm db:push"`

### 问题 2: 静态文件路径 ✅ 已修复
- **问题**: 生产环境下无法找到 `dist/public` 目录
- **修复**: 使用 `path.join(process.cwd(), "dist", "public")`

### 问题 3: 访客用户支持 ✅ 已修复
- **问题**: 未登录时数据库中没有访客用户导致查询失败
- **修复**: 在 `context.ts` 中添加自动创建访客用户的逻辑

### 问题 4: Railway 502 错误 ✅ 已修复
- **问题**: 服务器绑定到 localhost 导致 Railway 无法访问
- **修复**: 将服务器绑定到 `0.0.0.0`

## 测试计划

### 1. 基础功能测试
- [ ] 首页访问
- [ ] 页面导航（首页 → 飞书配置 → 飞书数据 → 上传图片）
- [ ] Guest User 身份显示

### 2. 飞书配置测试
- [ ] 打开飞书配置页面
- [ ] 填写配置信息（App ID, App Secret, App Token, Table ID）
- [ ] 保存配置
- [ ] 测试连接功能

### 3. 飞书数据测试
- [ ] 获取飞书多维表格数据
- [ ] 数据展示
- [ ] 导出 CSV 功能

### 4. ZIP 上传测试
- [ ] 上传 ZIP 文件
- [ ] 解析图片
- [ ] 图片预览

### 5. 图片回传测试
- [ ] 将图片上传到飞书多维表格
- [ ] 验证上传结果
- [ ] 检查飞书表格中的图片

## 部署状态

- **分支创建**: ✅ 完成
- **Railway 配置**: ⏳ 等待用户完成
- **部署验证**: ⏳ 待进行
- **功能测试**: ⏳ 待进行
- **文档更新**: ⏳ 待进行

## 下一步行动

1. 等待用户完成 Railway 部署配置
2. 获取部署后的 URL
3. 进行全流程功能测试
4. 记录测试结果
5. 更新文档
6. 推送分支到 GitHub

## 参考资料

- [之前的调试笔记](./DEBUG_NOTES.md)
- [之前的测试结果](./TEST_RESULTS.md)
- [项目 README](./README.md)
- [Railway 部署指南](./docs/RAILWAY_DEPLOY.md)

## 联系信息

- GitHub 仓库: https://github.com/phuktoley/feishu-gaoding-web
- 部署分支: deployment-2026-01-04-railway
