# 部署日志

## 部署信息
- **部署时间**: 2026-01-05 (UTC: Jan 4 2026 20:05)
- **部署平台**: Railway
- **项目名称**: spectacular-rebirth
- **服务名称**: feishu-gaoding-web
- **部署URL**: https://feishu-gaoding-web-production.up.railway.app
- **部署状态**: ✅ Deployment successful

## 部署版本
- **Commit**: fix: 修复Excel导出缺少文本_2列和飞书上传失败问题 (V4.1.1)
- **Deployment ID**: 2d736fd6

## 构建日志摘要
```
Using Nixpacks v1.38.0
setup: nodejs_20, pnpm
caddy: pkgs: caddy
install: pnpm install
build: pnpm install && pnpm build
start: pnpm start

Build time: 40.01 seconds
=== Successfully Built! ===
```

## 部署日志摘要
```
Starting Container
feishu-gaoding-web@1.0.0 db: /app
drizzle-kit generate && drizzle-kit migrate
No config path provided, using default 'drizzle.config.ts'
Reading config file '/app/drizzle.config.ts'
Reading schema files: /app/drizzle/schema.ts
3 tables
feishu_config 9 columns 0 indexes 0 fks
tasks 8 columns 0 indexes 0 fks
users 9 columns 0 indexes 0 fks
No schema changes, nothing to migrate 😴
[✓] applying migrations...[✓] migrations applied successfully!
```

## 验证清单
- [x] 代码推送到 v4.1 分支
- [x] Railway 自动触发部署
- [x] 构建成功 (40秒)
- [x] 部署成功
- [x] 服务状态: Online

## 下一步
1. 访问 https://feishu-gaoding-web-production.up.railway.app 验证功能
2. 执行端到端测试用例
3. 验证两个bug修复是否生效
