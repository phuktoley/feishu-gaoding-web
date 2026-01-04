# V4.1.1 版本更新日志

## 版本信息
- **版本号**: V4.1.1
- **发布日期**: 2026-01-05
- **分支**: v4.1

## Bug修复

### 1. Excel导出缺少文本_2列 (已修复)

**问题描述**: 导出的XLSX文件只有"页面"和"文本_1"两列，缺少"文本_2"列。

**根因分析**: 
- 文件: `client/src/pages/Export.tsx`
- 第44行调用 `createGaodingZip(data, ["页面", "文本_1"])` 时只传入了2个表头
- `gaodingXlsx.ts` 中的逻辑依赖 `headers.length > 2` 来决定是否输出 text2

**修复方案**:
```typescript
// 修改前
const zipBlob = await createGaodingZip(data, ["页面", "文本_1"]);

// 修改后
const zipBlob = await createGaodingZip(data, ["页面", "文本_1", "文本_2"]);
```

**修改文件**: `client/src/pages/Export.tsx`

---

### 2. 飞书上传ZIP失败 (已增强错误处理)

**问题描述**: 上传图片到飞书时显示全部失败。

**根因分析**:
- 可能原因包括：权限不足、Token过期、API参数错误等
- 原代码缺少详细的错误日志，难以定位具体问题

**修复方案**:
1. 在 `server/feishu.ts` 的 `uploadImage` 方法中添加详细日志
2. 在 `server/routers.ts` 的 `uploadImages` 方法中添加详细日志
3. 添加更完善的错误处理和错误信息返回

**修改文件**: 
- `server/feishu.ts`
- `server/routers.ts`

---

## 新增文档

### 1. E2E_TEST_CASES.md
完整的端到端测试用例集合，包含23个测试用例，覆盖：
- 首页功能测试
- 飞书配置功能测试
- 飞书数据功能测试
- 上传图片功能测试
- 完整业务流程测试
- 异常场景测试
- UI/UX测试

### 2. FEISHU_UPLOAD_API_NOTES.md
飞书上传素材API的关键信息和注意事项

### 3. CHANGELOG_V4.1.1.md
本版本更新日志

---

## 技术细节

### 飞书上传图片API要点

1. **API端点**: `POST https://open.feishu.cn/open-apis/drive/v1/medias/upload_all`

2. **必需参数**:
   - `file_name`: 文件名
   - `parent_type`: `bitable_image`（多维表格图片）
   - `parent_node`: 多维表格的 appToken
   - `size`: 文件大小（字节）
   - `file`: 文件二进制内容

3. **权限要求**: 应用需要 `drive:drive:media` 权限

4. **上传流程**:
   - 第一步：调用上传素材API获取 file_token
   - 第二步：调用更新记录API将 file_token 写入附件字段

---

## 部署说明

1. 将代码推送到 v4.1 分支
2. Railway 会自动触发部署
3. 部署完成后验证功能

---

## 后续建议

1. **监控日志**: 部署后查看 Railway 日志，确认上传功能是否正常
2. **权限检查**: 确认飞书应用已开通 `drive:drive:media` 权限
3. **完整测试**: 按照 E2E_TEST_CASES.md 执行完整测试

---

**文档作者**: Manus AI Agent  
**最后更新**: 2026-01-05
