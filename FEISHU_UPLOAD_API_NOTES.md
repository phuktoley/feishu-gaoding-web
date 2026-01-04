# 飞书上传素材API关键信息

## API端点
`POST https://open.feishu.cn/open-apis/drive/v1/medias/upload_all`

## 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| file_name | string | 是 | 要上传的素材的名称 |
| parent_type | string | 是 | 上传点的类型 |
| parent_node | string | 是 | 上传点的 token（云文档的 token） |
| size | int | 是 | 文件的大小，单位为字节 |
| checksum | string | 否 | 文件的 Adler-32 校验和 |
| extra | string | 否 | 额外参数 |
| file | file | 是 | 文件的二进制内容 |

## parent_type 可选值

对于多维表格附件，应该使用：
- `bitable_image` - 多维表格图片
- `bitable_file` - 多维表格附件

## 当前代码问题分析

在 `server/feishu.ts` 中的 `uploadImage` 方法：
```typescript
formData.append("parent_type", "bitable_image");
formData.append("parent_node", this.credentials.appToken);
```

这里使用的是 `appToken` 作为 `parent_node`，这是正确的。

## 可能的问题

1. **权限问题**: 应用可能没有 `drive:drive:media` 权限
2. **Token过期**: tenant_access_token 可能已过期
3. **文件大小限制**: 素材大小不得超过 20 MB
4. **API调用频率限制**: 5 QPS，10000 次/天

## 修复建议

1. 添加更详细的错误日志
2. 检查API返回的具体错误码
3. 确保应用有正确的权限配置
