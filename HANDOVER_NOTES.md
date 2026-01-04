# 项目交接说明

## 项目信息

- **项目名称**: feishu-gaoding-web
- **GitHub 仓库**: https://github.com/phuktoley/feishu-gaoding-web
- **当前版本**: v4.1
- **部署地址**: https://feishu-gaoding-web-production.up.railway.app/
- **最后更新**: 2026-01-04

## 项目概述

这是一个飞书-稿定设计自动化工具，主要功能：
1. 从飞书多维表格获取数据
2. 导出为稿定设计批量套版格式的 CSV
3. 上传稿定设计生成的图片 ZIP 回传到飞书

## 技术栈

- **前端**: React + TypeScript + TailwindCSS + Vite
- **后端**: Express + tRPC
- **数据库**: MySQL (Railway 提供)
- **部署**: Railway

## 分支说明

| 分支名 | 说明 |
|-------|------|
| `main` | 主分支，包含最新稳定版本 (v4.1) |
| `v4.1` | v4.1 版本分支，稿定设计格式更新 |
| `deployment-2026-01-04-railway` | 部署记录分支 |

## 环境变量配置

Railway 部署需要以下环境变量：

```
DATABASE_URL=mysql://...  # Railway 自动提供
FEISHU_APP_ID=cli_a9dcabca84785cd1
FEISHU_APP_SECRET=D2UeA0RgzNC9anl2cAvBTceTP7HCmgfS
JWT_SECRET=CQicGYOMm1BTYvMDL20jxB5OxxeSWD+LrkBaReOiyYI=
NODE_ENV=production
OAUTH_SERVER_URL=https://feishu-gaoding-web-production.up.railway.app
PORT=8080
VITE_APP_ID=cli_a9dcabca84785cd1
VITE_OAUTH_PORTAL_URL=https://feishu-gaoding-web-production.up.railway.app
```

## 飞书配置

当前配置的飞书多维表格信息：
- **App Token**: PJvZbmCDKa6iZnsn6Atc9m5fnWc
- **Table ID**: tblJI8DTafcqas66

## v4.1 版本更新内容

### CSV 导出格式修改

**旧格式**:
```csv
序号,主标题,副标题,记录ID
"1","xxx","xxx","recv..."
```

**新格式 (稿定设计标准)**:
```csv
页面,文本_1,文本_2
"1","xxx","xxx"
```

### 修改的文件

- `client/src/pages/Export.tsx` - 导出页面组件

### 界面更新

- 按钮文字：导出 CSV → 导出稿定格式
- 表头：序号、主标题、副标题、记录 ID → 页面、文本_1 (主标题)、文本_2 (副标题)
- 文件名：feishu_data_日期.csv → 稿定设计-数据上传_日期.csv

## 本地开发

```bash
# 克隆仓库
gh repo clone phuktoley/feishu-gaoding-web
cd feishu-gaoding-web

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 启动开发服务器
pnpm dev

# 构建
pnpm build
```

## 部署流程

1. 推送代码到 GitHub main 分支
2. Railway 自动触发部署
3. 等待 1-2 分钟部署完成
4. 访问部署 URL 验证

## 常见问题

### 1. 页面显示旧版本

**原因**: 浏览器缓存或 Railway 部署未完成

**解决方案**:
- 强制刷新页面 (Ctrl+Shift+R)
- 在 URL 后添加查询参数 (如 ?v=4.1)
- 检查 Railway 部署状态

### 2. 飞书 API 连接失败

**原因**: 凭证配置错误或过期

**解决方案**:
- 检查 App ID 和 App Secret 是否正确
- 检查 App Token 和 Table ID 是否正确
- 确认飞书应用权限配置

### 3. CSV 导出格式不正确

**原因**: 代码未更新或缓存问题

**解决方案**:
- 确认使用的是 v4.1 或更高版本
- 检查 Export.tsx 文件内容
- 重新构建和部署

## 后续开发建议

1. **功能扩展**
   - 支持更多字段映射配置
   - 支持自定义导出格式
   - 添加批量处理进度显示

2. **代码优化**
   - 添加单元测试
   - 优化错误处理
   - 添加日志记录

3. **用户体验**
   - 添加导出预览功能
   - 支持导出历史记录
   - 添加操作引导

## 联系方式

如有问题，请通过 GitHub Issues 反馈。

---

**文档更新日期**: 2026-01-04  
**文档作者**: Manus AI Agent
