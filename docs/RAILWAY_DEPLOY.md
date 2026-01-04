# Railway 部署指南

本文档详细说明如何将飞书-稿定设计自动化工具部署到 Railway 平台。

## 目录

1. [前置准备](#前置准备)
2. [创建 Railway 项目](#创建-railway-项目)
3. [添加 MySQL 数据库](#添加-mysql-数据库)
4. [配置环境变量](#配置环境变量)
5. [部署应用](#部署应用)
6. [配置自定义域名](#配置自定义域名可选)
7. [常见问题](#常见问题)

---

## 前置准备

1. **GitHub 账号** - 代码已托管在 GitHub
2. **Railway 账号** - 访问 [railway.app](https://railway.app) 注册（可用 GitHub 登录）

---

## 创建 Railway 项目

### 步骤 1：登录 Railway

访问 [railway.app](https://railway.app)，使用 GitHub 账号登录。

### 步骤 2：创建新项目

1. 点击 **"New Project"**
2. 选择 **"Deploy from GitHub repo"**
3. 授权 Railway 访问您的 GitHub 仓库
4. 选择 `feishu-gaoding-web` 仓库

---

## 添加 MySQL 数据库

### 步骤 1：添加数据库服务

1. 在项目页面，点击 **"New"** → **"Database"** → **"MySQL"**
2. Railway 会自动创建一个 MySQL 实例

### 步骤 2：获取数据库连接信息

1. 点击 MySQL 服务卡片
2. 切换到 **"Variables"** 标签
3. 复制 `DATABASE_URL` 的值（格式：`mysql://user:pass@host:port/railway`）

---

## 配置环境变量

### 步骤 1：打开应用服务设置

1. 点击您的应用服务卡片（不是 MySQL）
2. 切换到 **"Variables"** 标签

### 步骤 2：添加环境变量

点击 **"New Variable"** 添加以下变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DATABASE_URL` | `${{MySQL.DATABASE_URL}}` | 引用 MySQL 服务的连接字符串 |
| `JWT_SECRET` | 随机 32+ 字符串 | 用于 session 签名 |
| `NODE_ENV` | `production` | 生产环境标识 |
| `PORT` | `3000` | 应用端口 |
| `VITE_APP_ID` | `feishu-gaoding-web` | OAuth 应用 ID |
| `OAUTH_SERVER_URL` | `https://api.manus.im` | OAuth 服务器 |
| `VITE_OAUTH_PORTAL_URL` | `https://manus.im/login` | OAuth 登录页 |

**生成 JWT_SECRET：**

```bash
# 在终端执行
openssl rand -base64 32
```

### 步骤 3：引用 MySQL 变量（推荐方式）

Railway 支持服务间变量引用，使用 `${{MySQL.DATABASE_URL}}` 可以自动获取数据库连接字符串。

或者直接复制 MySQL 服务的 `DATABASE_URL` 值粘贴。

---

## 部署应用

### 自动部署

配置完环境变量后，Railway 会自动触发部署。您可以在 **"Deployments"** 标签查看部署日志。

### 手动触发部署

如需手动部署：
1. 切换到 **"Deployments"** 标签
2. 点击 **"Deploy"** 按钮

### 部署成功标志

部署日志显示：
```
Server running on http://localhost:3000/
```

---

## 配置自定义域名（可选）

### 使用 Railway 提供的域名

1. 点击应用服务卡片
2. 切换到 **"Settings"** 标签
3. 在 **"Networking"** 部分，点击 **"Generate Domain"**
4. Railway 会生成一个 `*.up.railway.app` 域名

### 使用自定义域名

1. 在 **"Networking"** 部分，点击 **"Custom Domain"**
2. 输入您的域名（如 `feishu.yourdomain.com`）
3. 按照提示在您的 DNS 服务商添加 CNAME 记录

---

## 数据库迁移

首次部署后，需要执行数据库迁移：

### 方法 1：使用 Railway CLI

```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录
railway login

# 链接项目
railway link

# 执行迁移
railway run pnpm db:push
```

### 方法 2：在 Railway 控制台执行

1. 点击应用服务卡片
2. 切换到 **"Settings"** 标签
3. 找到 **"Run Command"** 部分
4. 临时修改启动命令为：`pnpm db:push && pnpm start`
5. 触发一次部署
6. 部署成功后改回：`pnpm start`

---

## 常见问题

### Q1: 部署失败，提示 "pnpm not found"？

**解决方案：** 项目已包含 `nixpacks.toml` 配置，确保文件存在且内容正确。

### Q2: 数据库连接失败？

**检查项：**
1. `DATABASE_URL` 环境变量是否正确设置
2. MySQL 服务是否正常运行
3. 尝试使用 `${{MySQL.DATABASE_URL}}` 引用方式

### Q3: OAuth 登录失败？

**检查项：**
1. 确保所有 OAuth 相关环境变量已配置
2. 检查 `VITE_OAUTH_PORTAL_URL` 是否正确

### Q4: 应用启动后无法访问？

**检查项：**
1. 确保已生成域名（Settings → Networking → Generate Domain）
2. 检查部署日志是否有错误
3. 确认 `PORT` 环境变量设置为 `3000`

### Q5: 如何查看应用日志？

1. 点击应用服务卡片
2. 切换到 **"Deployments"** 标签
3. 点击最新的部署记录
4. 查看 **"Build Logs"** 和 **"Deploy Logs"**

---

## 费用说明

Railway 提供：
- **免费额度**：每月 $5 免费额度（约 500 小时运行时间）
- **Hobby 计划**：$5/月，无使用限制
- **按需付费**：超出免费额度后按使用量计费

对于个人项目，免费额度通常足够使用。

---

## 更新部署

当您推送代码到 GitHub 时，Railway 会自动触发新的部署。

如需关闭自动部署：
1. 点击应用服务卡片
2. Settings → Service → Auto Deploy → 关闭

---

## 技术支持

如有问题，请在 GitHub Issues 中提交。
