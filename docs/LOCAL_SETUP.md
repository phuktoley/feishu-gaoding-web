# 本地开发环境快速启动指南

本文档提供在本地环境快速启动项目的详细步骤。

## 前置要求

| 软件 | 版本要求 | 安装命令 |
|------|---------|---------|
| Node.js | 18.0+ | [下载](https://nodejs.org/) |
| pnpm | 8.0+ | `npm install -g pnpm` |
| MySQL | 8.0+ | `sudo apt install mysql-server` |

## 快速启动步骤

### 1. 克隆仓库

```bash
git clone https://github.com/YOUR_USERNAME/feishu-gaoding-web.git
cd feishu-gaoding-web
```

### 2. 安装依赖

```bash
pnpm install
```

如果出现构建脚本警告，执行：

```bash
pnpm approve-builds
# 选择所有包并确认
```

### 3. 启动 MySQL 服务

```bash
# Ubuntu/Debian
sudo service mysql start

# macOS (Homebrew)
brew services start mysql

# Windows
net start mysql
```

### 4. 创建数据库

```bash
# 登录 MySQL
sudo mysql

# 执行以下 SQL
CREATE DATABASE feishu_gaoding CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'feishu'@'localhost' IDENTIFIED BY 'feishu123';
GRANT ALL PRIVILEGES ON feishu_gaoding.* TO 'feishu'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 5. 配置环境变量

```bash
# 复制示例配置
cp .env.example .env

# 编辑 .env 文件
nano .env
```

**必须配置的环境变量：**

```bash
# 数据库连接（使用上面创建的用户）
DATABASE_URL="mysql://feishu:feishu123@localhost:3306/feishu_gaoding"

# JWT 密钥（生成随机密钥）
JWT_SECRET="$(openssl rand -base64 32)"

# OAuth 配置（Manus 平台）
VITE_APP_ID="feishu-gaoding-web"
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://manus.im/login"
```

### 6. 执行数据库迁移

```bash
pnpm db:push
```

成功输出示例：

```
3 tables
feishu_config 9 columns 0 indexes 0 fks
tasks 8 columns 0 indexes 0 fks
users 9 columns 0 indexes 0 fks
[✓] migrations applied successfully!
```

### 7. 启动开发服务器

```bash
pnpm dev
```

成功启动后访问：http://localhost:3000

## 常见问题

### Q: MySQL 连接失败？

**检查项：**
1. MySQL 服务是否运行：`sudo service mysql status`
2. 用户名密码是否正确
3. 数据库是否已创建

**重置密码：**
```bash
sudo mysql
ALTER USER 'feishu'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

### Q: 端口 3000 被占用？

修改 `.env` 中的 `PORT` 变量：

```bash
PORT=3001
```

### Q: OAuth 登录失败？

确保以下环境变量配置正确：
- `VITE_APP_ID`
- `OAUTH_SERVER_URL`
- `VITE_OAUTH_PORTAL_URL`

### Q: 数据库迁移失败？

1. 确保 `DATABASE_URL` 格式正确
2. 确保数据库用户有足够权限
3. 尝试手动连接测试：
   ```bash
   mysql -u feishu -pfeishu123 feishu_gaoding
   ```

## 开发命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 构建生产版本 |
| `pnpm start` | 启动生产服务器 |
| `pnpm db:push` | 执行数据库迁移 |
| `pnpm check` | TypeScript 类型检查 |
| `pnpm format` | 代码格式化 |
| `pnpm test` | 运行测试 |

## 项目结构

```
feishu-gaoding-web/
├── client/                 # 前端代码
│   ├── src/
│   │   ├── components/     # 通用组件
│   │   ├── pages/          # 页面组件
│   │   ├── lib/            # 工具函数
│   │   └── App.tsx         # 路由配置
│   └── index.html
├── server/                 # 后端代码
│   ├── _core/              # 框架核心（勿修改）
│   ├── db.ts               # 数据库查询
│   ├── feishu.ts           # 飞书 API 封装
│   ├── routers.ts          # tRPC 路由
│   └── storage.ts          # S3 存储
├── drizzle/                # 数据库 Schema
│   └── schema.ts
├── shared/                 # 前后端共享代码
├── docs/                   # 文档
│   ├── DEPLOYMENT.md       # 部署手册
│   ├── ENV_CONFIG.md       # 环境变量说明
│   └── LOCAL_SETUP.md      # 本地开发指南
├── .env.example            # 环境变量示例
└── package.json
```
