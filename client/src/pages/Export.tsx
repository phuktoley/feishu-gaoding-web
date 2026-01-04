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
import { createGaodingZip } from "@/lib/gaodingXlsx";
import { AlertCircle, Download, FileSpreadsheet, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

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
      // 准备数据
      const data = recordsData.records.map((record, index) => ({
        page: `页面${index + 1}`,
        text1: record.mainTitle || "",
        text2: record.subTitle || "",
      }));

      // 使用新的稿定设计格式生成 ZIP
      const zipBlob = await createGaodingZip(data, ["页面", "文本_1"]);

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
