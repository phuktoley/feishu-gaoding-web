# 稿定设计 XLSX 格式规范

## 概述

本文档记录了稿定设计批量套版功能对 XLSX 文件格式的要求，以及本项目的实现方案。

## 稿定设计格式要求

### 关键发现

通过分析稿定设计官方模板，发现以下关键格式要求：

1. **必须使用 sharedStrings.xml 共享字符串表**
   - 稿定设计要求 XLSX 文件使用共享字符串表存储文本内容
   - 单元格使用 `t="s"` 类型引用共享字符串索引
   - 不支持内联字符串格式 `t="str"`

2. **完整的 XML 文件结构**
   - `[Content_Types].xml` - 内容类型定义
   - `_rels/.rels` - 根关系文件
   - `xl/_rels/workbook.xml.rels` - 工作簿关系
   - `xl/workbook.xml` - 工作簿定义
   - `xl/worksheets/sheet1.xml` - 工作表数据
   - `xl/sharedStrings.xml` - 共享字符串表
   - `xl/styles.xml` - 样式定义
   - `xl/theme/theme1.xml` - 主题定义
   - `docProps/app.xml` - 应用属性
   - `docProps/core.xml` - 核心属性

### 单元格格式示例

**正确格式（使用共享字符串）：**
```xml
<c r="A1" t="s">
  <v>0</v>
</c>
```
其中 `0` 是 sharedStrings.xml 中的字符串索引。

**错误格式（内联字符串）：**
```xml
<c r="A1" t="str">
  <v>文本内容</v>
</c>
```

## 实现方案

### 新增文件

- `client/src/lib/gaodingXlsx.ts` - 稿定设计 XLSX 生成工具库

### 核心功能

1. **createGaodingXlsx(headers: string[], rows: string[][]): Promise<Blob>**
   - 生成符合稿定设计格式的 XLSX 文件
   - 自动构建共享字符串表
   - 返回 Blob 对象

2. **createGaodingZip(headers: string[], rows: string[][], images: ImageData[]): Promise<Blob>**
   - 生成包含 XLSX 和图片的 ZIP 文件
   - 图片以 `images/` 目录存储
   - 图片 URL 在 XLSX 中以相对路径 `images/xxx.jpg` 引用

### 使用示例

```typescript
import { createGaodingZip } from '@/lib/gaodingXlsx';

const headers = ['标题', '图片'];
const rows = [
  ['示例标题1', 'images/image1.jpg'],
  ['示例标题2', 'images/image2.jpg'],
];
const images = [
  { name: 'image1.jpg', url: 'https://example.com/image1.jpg' },
  { name: 'image2.jpg', url: 'https://example.com/image2.jpg' },
];

const zipBlob = await createGaodingZip(headers, rows, images);
```

## 测试验证

### 验证步骤

1. 在应用中导出稿定格式 ZIP 文件
2. 解压 ZIP 文件检查 XLSX 结构
3. 确认存在 `xl/sharedStrings.xml` 文件
4. 确认 `xl/worksheets/sheet1.xml` 中单元格使用 `t="s"` 类型
5. 在稿定设计批量套版功能中导入 ZIP 文件
6. 确认数据正确填充到模板中

### 验证脚本

```python
import zipfile
import os

def verify_xlsx(xlsx_path):
    with zipfile.ZipFile(xlsx_path, 'r') as zf:
        # 检查 sharedStrings.xml 是否存在
        if 'xl/sharedStrings.xml' in zf.namelist():
            print("✅ sharedStrings.xml 存在")
        else:
            print("❌ sharedStrings.xml 不存在")
        
        # 检查 sheet1.xml 中的单元格类型
        sheet_content = zf.read('xl/worksheets/sheet1.xml').decode('utf-8')
        if 't="s"' in sheet_content:
            print("✅ 使用共享字符串引用 (t=\"s\")")
        if 't="str"' in sheet_content:
            print("⚠️ 使用内联字符串 (t=\"str\") - 可能不兼容")
```

## 常见问题

### Q: 为什么之前的 ZIP 文件无法上传到稿定设计？

A: 之前使用 SheetJS (xlsx) 库生成的 XLSX 文件使用内联字符串格式 `t="str"`，而稿定设计只支持共享字符串格式 `t="s"`。

### Q: 如何确认 XLSX 文件格式正确？

A: 解压 XLSX 文件（它本质上是一个 ZIP 文件），检查是否存在 `xl/sharedStrings.xml` 文件，以及 `xl/worksheets/sheet1.xml` 中的单元格是否使用 `t="s"` 类型。

## 更新日志

- **2026-01-04**: 初始版本，实现稿定设计 XLSX 格式兼容
