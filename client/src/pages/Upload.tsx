import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  CheckCircle2,
  FileArchive,
  ImageIcon,
  Loader2,
  Upload as UploadIcon,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface ParsedImage {
  name: string;
  data: string;
}

interface FeishuRecord {
  recordId: string;
  mainTitle: string;
  subTitle: string;
}

export default function Upload() {
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [parsedImages, setParsedImages] = useState<ParsedImage[]>([]);
  const [feishuRecords, setFeishuRecords] = useState<FeishuRecord[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{
    total: number;
    success: number;
    failed: number;
  } | null>(null);

  const { data: config } = trpc.feishuConfig.get.useQuery();

  const parseZipMutation = trpc.zip.parse.useMutation({
    onSuccess: (data) => {
      setParsedImages(data.images);
      toast.success(`成功解析 ${data.count} 张图片`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const getRecordsMutation = trpc.feishu.getRecords.useQuery(undefined, {
    enabled: !!config,
  });

  const uploadImagesMutation = trpc.feishu.uploadImages.useMutation({
    onSuccess: (data) => {
      setUploadResults(data);
      setIsUploading(false);
      if (data.failed === 0) {
        toast.success(`全部 ${data.success} 张图片上传成功！`);
      } else {
        toast.warning(`上传完成：成功 ${data.success}，失败 ${data.failed}`);
      }
    },
    onError: (error) => {
      setIsUploading(false);
      toast.error(error.message);
    },
  });

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".zip")) {
      toast.error("请选择 ZIP 文件");
      return;
    }

    setZipFile(file);
    setParsedImages([]);
    setUploadResults(null);

    // 读取文件并解析
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      parseZipMutation.mutate({ zipData: base64 });
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleUploadToFeishu = async () => {
    if (!parsedImages.length || !getRecordsMutation.data?.records.length) {
      toast.error("请先解析 ZIP 文件并确保飞书有数据");
      return;
    }

    const records = getRecordsMutation.data.records;
    if (parsedImages.length !== records.length) {
      toast.warning(
        `图片数量(${parsedImages.length})与飞书记录数量(${records.length})不匹配，将按顺序匹配`
      );
    }

    setIsUploading(true);
    setUploadProgress(0);

    // 准备上传数据
    const imagesToUpload = parsedImages.slice(0, records.length).map((img, index) => ({
      recordId: records[index].recordId,
      imageData: img.data,
      fileName: img.name,
    }));

    // 分批上传
    const batchSize = 5;
    const batches = [];
    for (let i = 0; i < imagesToUpload.length; i += batchSize) {
      batches.push(imagesToUpload.slice(i, i + batchSize));
    }

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < batches.length; i++) {
      try {
        const result = await uploadImagesMutation.mutateAsync({ images: batches[i] });
        successCount += result.success;
        failedCount += result.failed;
        setUploadProgress(((i + 1) / batches.length) * 100);
      } catch (error) {
        failedCount += batches[i].length;
      }
    }

    setUploadResults({
      total: imagesToUpload.length,
      success: successCount,
      failed: failedCount,
    });
    setIsUploading(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">上传图片到飞书</h1>
          <p className="text-muted-foreground">
            上传稿定设计下载的 ZIP 文件，自动解析并回传到飞书多维表格
          </p>
        </div>

        {!config && (
          <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="flex items-center gap-3 pt-6">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <p className="text-sm">请先在设置页面配置飞书凭证</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* 左侧：上传区域 */}
          <div className="space-y-4">
            {/* 文件上传 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileArchive className="h-5 w-5" />
                  上传 ZIP 文件
                </CardTitle>
                <CardDescription>
                  从稿定设计下载的批量套版图片 ZIP 文件
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    parseZipMutation.isPending
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-primary/50"
                  }`}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  {parseZipMutation.isPending ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">正在解析...</p>
                    </div>
                  ) : (
                    <>
                      <UploadIcon className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground mb-2">
                        拖拽 ZIP 文件到此处，或
                      </p>
                      <label>
                        <input
                          type="file"
                          accept=".zip"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileSelect(file);
                          }}
                        />
                        <Button variant="outline" size="sm" asChild>
                          <span>选择文件</span>
                        </Button>
                      </label>
                    </>
                  )}
                </div>

                {zipFile && (
                  <div className="mt-4 flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileArchive className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{zipFile.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(zipFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setZipFile(null);
                        setParsedImages([]);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 解析结果 */}
            {parsedImages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    解析结果
                  </CardTitle>
                  <CardDescription>共解析出 {parsedImages.length} 张图片</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="grid grid-cols-4 gap-2">
                      {parsedImages.map((img, index) => (
                        <div
                          key={index}
                          className="relative aspect-square rounded-lg overflow-hidden bg-muted"
                        >
                          <img
                            src={`data:image/png;base64,${img.data}`}
                            alt={img.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右侧：飞书数据和上传 */}
          <div className="space-y-4">
            {/* 飞书记录 */}
            <Card>
              <CardHeader>
                <CardTitle>飞书表格数据</CardTitle>
                <CardDescription>
                  {getRecordsMutation.isLoading
                    ? "正在加载..."
                    : getRecordsMutation.data
                    ? `共 ${getRecordsMutation.data.total} 条记录`
                    : "请先配置飞书凭证"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {getRecordsMutation.isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : getRecordsMutation.data?.records.length ? (
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {getRecordsMutation.data.records.map((record, index) => (
                        <div
                          key={record.recordId}
                          className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                        >
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {record.mainTitle || "(无主标题)"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {record.subTitle || "(无副标题)"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    暂无数据
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 上传进度 */}
            {isUploading && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">上传进度</CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    {Math.round(uploadProgress)}%
                  </p>
                </CardContent>
              </Card>
            )}

            {/* 上传结果 */}
            {uploadResults && (
              <Card
                className={
                  uploadResults.failed === 0 ? "border-green-500" : "border-amber-500"
                }
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {uploadResults.failed === 0 ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                    )}
                    上传完成
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{uploadResults.total}</p>
                      <p className="text-xs text-muted-foreground">总计</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-500">
                        {uploadResults.success}
                      </p>
                      <p className="text-xs text-muted-foreground">成功</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-destructive">
                        {uploadResults.failed}
                      </p>
                      <p className="text-xs text-muted-foreground">失败</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 上传按钮 */}
            <Button
              className="w-full"
              size="lg"
              disabled={
                !parsedImages.length ||
                !getRecordsMutation.data?.records.length ||
                isUploading
              }
              onClick={handleUploadToFeishu}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  上传中...
                </>
              ) : (
                <>
                  <UploadIcon className="mr-2 h-4 w-4" />
                  上传到飞书 ({parsedImages.length} 张图片)
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
