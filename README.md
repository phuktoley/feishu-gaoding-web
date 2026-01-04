# 飞书-稿定设计自动化工具

一个 Web 应用，用于从飞书多维表格读取数据，通过稿定设计批量生成图片，并自动回传到飞书。

## 功能特性

- **飞书配置管理**：配置飞书应用凭证和多维表格信息，支持连接测试
- **飞书数据查看**：从多维表格读取数据，支持导出 CSV 用于稿定设计批量套版
- **ZIP 上传解析**：上传稿定设计下载的 ZIP 文件，自动解析并预览图片
- **图片回传飞书**：将解析的图片按顺序自动上传到飞书多维表格对应记录

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui |
| 后端 | Express + tRPC |
| 数据库 | MySQL (TiDB) + Drizzle ORM |
| 认证 | Manus OAuth |

## 使用流程

```
1. 配置飞书凭证 → 2. 在稿定设计生成图片 → 3. 上传 ZIP 回传飞书
```

### 详细步骤

1. **配置飞书应用**
   - 在 [飞书开放平台](https://open.feishu.cn/) 创建应用
   - 获取 App ID 和 App Secret
   - 开启多维表格相关权限

2. **配置多维表格**
   - 从多维表格 URL 获取 App Token 和 Table ID
   - URL 格式：`https://xxx.feishu.cn/base/{APP_TOKEN}?table={TABLE_ID}`

3. **在稿定设计生成图片**
   - 使用批量套版功能
   - 下载生成的 ZIP 文件

4. **上传并回传**
   - 在本工具上传 ZIP 文件
   - 系统自动解析并回传到飞书

## 本地开发

### 环境要求

- Node.js 18+
- pnpm 8+
- MySQL 数据库

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

详细配置说明请参考 [部署手册](./docs/DEPLOYMENT.md)。

### 数据库迁移

```bash
pnpm db:push
```

### 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

## 部署

详细部署说明请参考 [部署手册](./docs/DEPLOYMENT.md)。

## 项目结构

```
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
└── docs/                   # 文档
    └── DEPLOYMENT.md       # 部署手册
```

## 飞书权限配置

在飞书开放平台，需要为应用开启以下权限：

| 权限名称 | 权限标识 | 说明 |
|---------|---------|------|
| 查看、评论、编辑和管理多维表格 | bitable:app | 读写多维表格数据 |
| 上传、下载文件 | drive:file | 上传图片到飞书 |

## 常见问题

### Q: 图片上传失败？

A: 请检查：
1. 飞书应用是否开启了相关权限
2. App Token 和 Table ID 是否正确
3. 图片字段名称是否与配置一致

### Q: 图片顺序不对？

A: 稿定设计下载的 ZIP 中图片会按文件名排序。请确保生成图片时的顺序与飞书记录顺序一致。

## License

MIT
