import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Download, FileSpreadsheet, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import JSZip from "jszip";

// 稿定设计模板的警告说明文字
const GAODING_WARNING_TEXT = `⚠️填写需知：
1. 每一行表格的内容将填充成一份设计结果；
2. 请不要增加 ，删除，修改表头内容，避免Excel无法导入成功；
3. 请不要合并、拆分单元格，避免Excel无法导入成功；
4. 请将用到的图片文件与Excel放在同一个文件夹中，打成压缩包后上传；
5. 图片仅需填写文件名，无需填写图片后缀，但请确保图片文件名不重复；
6. 请注意文案的内容输入字数，过多的字数将会导致排版时溢出；
7. 当前批量套版仅支持最多148行数据；`;

export default function Export() {
  const { data: config } = trpc.feishuConfig.get.useQuery();
  const {
    data: recordsData,
    isLoading,
    refetch,
    isRefetching,
  } = trpc.feishu.getRecords.useQuery(undefined, {
    enabled: !!config,
  });

  const handleExportZip = async () => {
    if (!recordsData?.records.length) {
      toast.error("没有数据可导出");
      return;
    }

    try {
      // 创建工作簿
      const wb = XLSX.utils.book_new();
      
      // 准备数据：第一行是警告说明，第二行是表头，后面是数据
      const wsData: (string | null)[][] = [];
      
      // 第一行：警告说明（只在 A1，其他为 null）
      const warningRow: (string | null)[] = [GAODING_WARNING_TEXT];
      for (let i = 1; i < 26; i++) {
        warningRow.push(null);
      }
      wsData.push(warningRow);
      
      // 第二行：表头
      const headerRow: (string | null)[] = ["页面", "文本_1", "文本_2"];
      for (let i = 3; i < 26; i++) {
        headerRow.push(null);
      }
      wsData.push(headerRow);
      
      // 数据行
      recordsData.records.forEach((record, index) => {
        const dataRow: (string | null)[] = [
          `页面${index + 1}`,  // 页面：页面1, 页面2, ...
          record.mainTitle || "",  // 文本_1：主标题
          record.subTitle || "",   // 文本_2：副标题
        ];
        for (let i = 3; i < 26; i++) {
          dataRow.push(null);
        }
        wsData.push(dataRow);
      });
      
      // 创建工作表
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // 设置合并单元格：A1:Z1
      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 25 } }  // A1:Z1
      ];
      
      // 设置列宽
      ws["!cols"] = [
        { wch: 15 },  // A 列（页面）
        { wch: 30 },  // B 列（文本_1）
        { wch: 30 },  // C 列（文本_2）
      ];
      
      // 设置行高
      ws["!rows"] = [
        { hpt: 120 },  // 第一行（警告说明）高度
        { hpt: 20 },   // 第二行（表头）
      ];
      
      // 添加工作表到工作簿，使用稿定设计的 sheet 名称
      XLSX.utils.book_append_sheet(wb, ws, "文案表（横版）");
      
      // 生成 XLSX 文件的二进制数据
      const xlsxData = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      
      // 创建 ZIP 文件
      const zip = new JSZip();
      zip.file("稿定设计-数据上传.xlsx", xlsxData);
      
      // 生成 ZIP 文件
      const zipBlob = await zip.generateAsync({ type: "blob" });
      
      // 下载
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `稿定设计-数据上传_${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("导出成功");
    } catch (error) {
      console.error("导出失败:", error);
      toast.error("导出失败，请重试");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">飞书数据</h1>
            <p className="text-muted-foreground">
              查看和导出飞书多维表格中的数据
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
            >
              {isRefetching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              刷新
            </Button>
            <Button
              onClick={handleExportZip}
              disabled={!recordsData?.records.length}
            >
              <Download className="mr-2 h-4 w-4" />
              导出稿定格式
            </Button>
          </div>
        </div>

        {!config && (
          <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="flex items-center gap-3 pt-6">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <p className="text-sm">请先在设置页面配置飞书凭证</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              表格数据
            </CardTitle>
            <CardDescription>
              {isLoading
                ? "正在加载..."
                : recordsData
                ? `共 ${recordsData.total} 条记录`
                : "暂无数据"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : recordsData?.records.length ? (
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">页面</TableHead>
                      <TableHead>文本_1 (主标题)</TableHead>
                      <TableHead>文本_2 (副标题)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recordsData.records.map((record, index) => (
                      <TableRow key={record.recordId}>
                        <TableCell className="font-medium">页面{index + 1}</TableCell>
                        <TableCell>{record.mainTitle || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {record.subTitle || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <FileSpreadsheet className="h-12 w-12 mb-4 opacity-50" />
                <p>暂无数据</p>
                <p className="text-sm">请确保飞书配置正确且表格中有数据</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 使用说明 */}
        <Card>
          <CardHeader>
            <CardTitle>使用说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">1. 导出数据到稿定设计</h4>
                <p className="text-sm text-muted-foreground">
                  点击"导出稿定格式"按钮，将数据下载为 ZIP 压缩包，内含稿定设计专用的 XLSX 文件。
                  格式：页面、文本_1（主标题）、文本_2（副标题）。
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">2. 在稿定设计生成图片</h4>
                <p className="text-sm text-muted-foreground">
                  在稿定设计的批量套版功能中上传 ZIP 文件，
                  映射字段后生成图片，完成后下载 ZIP 文件。
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">3. 上传图片到飞书</h4>
                <p className="text-sm text-muted-foreground">
                  前往"上传图片"页面，上传从稿定设计下载的 ZIP 文件，
                  系统会自动解析并回传到飞书。
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">稿定设计格式说明</h4>
                <p className="text-sm text-muted-foreground">
                  导出的 ZIP 文件包含符合稿定设计批量套版标准格式的 XLSX 文件：
                  页面（页面1、页面2...）、文本_1（主标题）、文本_2（副标题）。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
