# 环境变量配置说明

本文档说明项目所需的环境变量配置。

## 必需的环境变量

在部署前，请创建 `.env` 文件并配置以下环境变量：

### 数据库配置

```bash
# MySQL 连接字符串
# 格式: mysql://用户名:密码@主机:端口/数据库名
DATABASE_URL="mysql://root:password@localhost:3306/feishu_gaoding"
```

**说明：**
- 支持 MySQL 8.0+ 或兼容数据库（如 TiDB、PlanetScale）
- 请确保数据库已创建，字符集为 `utf8mb4`

### 认证配置

```bash
# JWT 密钥（用于 session 签名）
# 请使用随机字符串，至少 32 字符
JWT_SECRET="your-random-secret-key-at-least-32-characters-long"
```

**生成随机密钥：**
```bash
# 使用 openssl 生成
openssl rand -base64 32

# 或使用 node
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 可选的环境变量

### OAuth 配置

如果使用 Manus OAuth 进行用户认证：

```bash
VITE_APP_ID="your-manus-app-id"
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://manus.im/login"
```

### S3 存储配置

如果需要使用 S3 存储上传的文件：

```bash
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
S3_BUCKET="your-bucket-name"
```

### 应用配置

```bash
# 服务端口（默认 3000）
PORT=3000

# Node 环境
NODE_ENV=production
```

## 环境变量汇总表

| 变量名 | 必需 | 默认值 | 说明 |
|--------|------|--------|------|
| `DATABASE_URL` | ✅ | - | MySQL 数据库连接字符串 |
| `JWT_SECRET` | ✅ | - | JWT 签名密钥，至少 32 字符 |
| `PORT` | ❌ | 3000 | 服务监听端口 |
| `NODE_ENV` | ❌ | development | 运行环境 |
| `VITE_APP_ID` | ❌ | - | Manus OAuth 应用 ID |
| `OAUTH_SERVER_URL` | ❌ | - | OAuth 服务器地址 |
| `VITE_OAUTH_PORTAL_URL` | ❌ | - | OAuth 登录页面地址 |
| `AWS_ACCESS_KEY_ID` | ❌ | - | AWS 访问密钥 |
| `AWS_SECRET_ACCESS_KEY` | ❌ | - | AWS 密钥 |
| `AWS_REGION` | ❌ | - | AWS 区域 |
| `S3_BUCKET` | ❌ | - | S3 存储桶名称 |

## 示例 .env 文件

```bash
# 数据库
DATABASE_URL="mysql://root:mypassword@localhost:3306/feishu_gaoding"

# 认证
JWT_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"

# 端口
PORT=3000
```

## 注意事项

1. **安全性**：请勿将 `.env` 文件提交到版本控制系统
2. **密钥强度**：`JWT_SECRET` 应使用足够长度的随机字符串
3. **数据库编码**：建议使用 `utf8mb4` 字符集以支持 emoji 等特殊字符
4. **生产环境**：在生产环境中，建议使用环境变量管理工具或密钥管理服务
