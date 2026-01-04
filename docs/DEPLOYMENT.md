# 部署手册

本文档详细说明如何部署飞书-稿定设计自动化工具。

## 目录

1. [环境要求](#环境要求)
2. [环境变量配置](#环境变量配置)
3. [数据库配置](#数据库配置)
4. [本地开发部署](#本地开发部署)
5. [生产环境部署](#生产环境部署)
6. [飞书应用配置](#飞书应用配置)
7. [常见问题](#常见问题)

---

## 环境要求

| 软件 | 版本要求 | 说明 |
|------|---------|------|
| Node.js | 18.0+ | 推荐使用 LTS 版本 |
| pnpm | 8.0+ | 包管理器 |
| MySQL | 8.0+ | 或 TiDB、PlanetScale 等兼容数据库 |

## 环境变量配置

### 必需的环境变量

创建 `.env` 文件，配置以下环境变量：

```bash
# ==================== 数据库配置 ====================
# MySQL 连接字符串
# 格式: mysql://用户名:密码@主机:端口/数据库名
DATABASE_URL="mysql://root:password@localhost:3306/feishu_gaoding"

# ==================== 认证配置 ====================
# JWT 密钥（用于 session 签名，请使用随机字符串）
JWT_SECRET="your-random-secret-key-at-least-32-characters"

# ==================== OAuth 配置（可选）====================
# 如果使用 Manus OAuth，需要配置以下变量
# VITE_APP_ID="your-app-id"
# OAUTH_SERVER_URL="https://api.manus.im"
# VITE_OAUTH_PORTAL_URL="https://manus.im/login"

# ==================== 存储配置（可选）====================
# 如果需要使用 S3 存储，配置以下变量
# AWS_ACCESS_KEY_ID="your-access-key"
# AWS_SECRET_ACCESS_KEY="your-secret-key"
# AWS_REGION="us-east-1"
# S3_BUCKET="your-bucket-name"
```

### 环境变量说明

| 变量名 | 必需 | 说明 |
|--------|------|------|
| `DATABASE_URL` | ✅ | MySQL 数据库连接字符串 |
| `JWT_SECRET` | ✅ | JWT 签名密钥，至少 32 字符 |
| `VITE_APP_ID` | ❌ | Manus OAuth 应用 ID |
| `OAUTH_SERVER_URL` | ❌ | OAuth 服务器地址 |
| `VITE_OAUTH_PORTAL_URL` | ❌ | OAuth 登录页面地址 |

---

## 数据库配置

### 1. 创建数据库

```sql
CREATE DATABASE feishu_gaoding CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. 数据库表结构

项目使用 Drizzle ORM 管理数据库。主要表结构如下：

#### users 表（用户表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| openId | VARCHAR(64) | OAuth 用户标识 |
| name | TEXT | 用户名 |
| email | VARCHAR(320) | 邮箱 |
| role | ENUM | 角色：user/admin |
| createdAt | TIMESTAMP | 创建时间 |
| updatedAt | TIMESTAMP | 更新时间 |

#### feishu_config 表（飞书配置表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| userId | INT | 用户 ID |
| appId | VARCHAR(128) | 飞书 App ID |
| appSecret | VARCHAR(256) | 飞书 App Secret |
| appToken | VARCHAR(128) | 多维表格 App Token |
| tableId | VARCHAR(128) | 多维表格 Table ID |
| imageFieldName | VARCHAR(128) | 图片字段名称 |

#### tasks 表（任务记录表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| userId | INT | 用户 ID |
| status | ENUM | 状态：pending/exporting/uploading/completed/failed |
| totalRecords | INT | 总记录数 |
| processedRecords | INT | 已处理记录数 |
| errorMessage | TEXT | 错误信息 |

### 3. 执行数据库迁移

```bash
# 生成并执行迁移
pnpm db:push
```

---

## 本地开发部署

### 步骤 1：克隆代码

```bash
git clone https://github.com/phuktoley/feishu-gaoding-web.git
cd feishu-gaoding-web
```

### 步骤 2：安装依赖

```bash
pnpm install
```

### 步骤 3：配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填写数据库连接等配置
```

### 步骤 4：初始化数据库

```bash
pnpm db:push
```

### 步骤 5：启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

---

## 生产环境部署

### 方式一：直接部署

#### 1. 构建项目

```bash
pnpm build
```

#### 2. 启动服务

```bash
pnpm start
```

#### 3. 使用 PM2 管理进程（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start dist/index.js --name feishu-gaoding

# 设置开机自启
pm2 startup
pm2 save
```

### 方式二：Docker 部署

创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建
RUN pnpm build

# 暴露端口
EXPOSE 3000

# 启动
CMD ["pnpm", "start"]
```

构建并运行：

```bash
docker build -t feishu-gaoding-web .
docker run -d -p 3000:3000 --env-file .env feishu-gaoding-web
```

### 方式三：使用 Manus 平台部署

本项目基于 Manus 平台开发，可直接在 Manus 平台上发布：

1. 在 Manus 中打开项目
2. 点击右上角「发布」按钮
3. 配置自定义域名（可选）

---

## 飞书应用配置

### 1. 创建飞书应用

1. 访问 [飞书开放平台](https://open.feishu.cn/)
2. 点击「创建应用」→「企业自建应用」
3. 填写应用名称和描述

### 2. 获取凭证

在应用的「凭证与基础信息」页面获取：
- App ID
- App Secret

### 3. 配置权限

在「权限管理」→「API 权限」中开启：

| 权限名称 | 权限标识 |
|---------|---------|
| 查看、评论、编辑和管理多维表格 | `bitable:app` |
| 上传、下载文件 | `drive:file` |
| 获取用户基本信息 | `contact:user.base:readonly` |

### 4. 发布应用

1. 在「版本管理与发布」中创建版本
2. 提交审核并发布
3. 在企业管理后台审批应用

### 5. 获取多维表格信息

从多维表格 URL 中提取：

```
https://xxx.feishu.cn/base/{APP_TOKEN}?table={TABLE_ID}
                          ↑                    ↑
                      App Token            Table ID
```

---

## 常见问题

### Q1: 数据库连接失败？

**检查项：**
1. 确认 MySQL 服务已启动
2. 检查 `DATABASE_URL` 格式是否正确
3. 确认用户名密码正确
4. 确认数据库已创建

**连接字符串格式：**
```
mysql://用户名:密码@主机:端口/数据库名
```

### Q2: 飞书 API 调用失败？

**检查项：**
1. App ID 和 App Secret 是否正确
2. 应用是否已发布并审批通过
3. 是否开启了必要的 API 权限
4. App Token 和 Table ID 是否正确

### Q3: 图片上传到飞书失败？

**可能原因：**
1. 图片字段名称不匹配 - 检查配置中的「图片字段名称」
2. 权限不足 - 确认开启了 `drive:file` 权限
3. 图片格式不支持 - 支持 PNG、JPG、JPEG、GIF、WebP

### Q4: 如何修改端口？

在启动时指定 `PORT` 环境变量：

```bash
PORT=8080 pnpm start
```

### Q5: 如何启用 HTTPS？

推荐使用反向代理（如 Nginx）处理 HTTPS：

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 技术支持

如有问题，请在 GitHub Issues 中提交。
