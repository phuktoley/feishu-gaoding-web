import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Loader2, Save, TestTube } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Settings() {
  const { data: config, isLoading } = trpc.feishuConfig.get.useQuery();
  const utils = trpc.useUtils();

  const [formData, setFormData] = useState({
    appId: "",
    appSecret: "",
    appToken: "",
    tableId: "",
    imageFieldName: "封面图片",
  });

  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    fields?: { name: string; type: number }[];
  } | null>(null);

  useEffect(() => {
    if (config) {
      setFormData({
        appId: config.appId || "",
        appSecret: "", // 不显示密钥
        appToken: config.appToken || "",
        tableId: config.tableId || "",
        imageFieldName: config.imageFieldName || "封面图片",
      });
    }
  }, [config]);

  const saveMutation = trpc.feishuConfig.save.useMutation({
    onSuccess: () => {
      toast.success("配置保存成功");
      utils.feishuConfig.get.invalidate();
    },
    onError: (error) => {
      toast.error(`保存失败: ${error.message}`);
    },
  });

  const testMutation = trpc.feishuConfig.test.useMutation({
    onSuccess: (data) => {
      setTestResult(data);
      toast.success(data.message);
    },
    onError: (error) => {
      setTestResult({ success: false, message: error.message });
      toast.error(error.message);
    },
  });

  const handleSave = () => {
    if (!formData.appId || !formData.appToken || !formData.tableId) {
      toast.error("请填写必填字段");
      return;
    }
    // 如果密钥为空且已有配置，使用原有密钥
    const dataToSave = {
      ...formData,
      appSecret: formData.appSecret || (config?.appSecret === "******" ? "" : formData.appSecret),
    };
    if (!dataToSave.appSecret && !config) {
      toast.error("请填写 App Secret");
      return;
    }
    saveMutation.mutate(dataToSave);
  };

  const handleTest = () => {
    setTestResult(null);
    testMutation.mutate();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">飞书配置</h1>
          <p className="text-muted-foreground">配置飞书应用凭证和多维表格信息</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>飞书应用凭证</CardTitle>
            <CardDescription>
              从{" "}
              <a
                href="https://open.feishu.cn/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                飞书开放平台
              </a>{" "}
              获取应用凭证
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="appId">App ID *</Label>
              <Input
                id="appId"
                placeholder="cli_xxxxxxxxxx"
                value={formData.appId}
                onChange={(e) => setFormData({ ...formData, appId: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="appSecret">App Secret *</Label>
              <Input
                id="appSecret"
                type="password"
                placeholder={config ? "留空则保持原有密钥" : "输入 App Secret"}
                value={formData.appSecret}
                onChange={(e) => setFormData({ ...formData, appSecret: e.target.value })}
              />
              {config && (
                <p className="text-xs text-muted-foreground">已配置密钥，留空则保持不变</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>多维表格信息</CardTitle>
            <CardDescription>
              从多维表格 URL 中提取：https://xxx.feishu.cn/base/
              <code className="bg-muted px-1 rounded">{"{APP_TOKEN}"}</code>?table=
              <code className="bg-muted px-1 rounded">{"{TABLE_ID}"}</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="appToken">App Token *</Label>
              <Input
                id="appToken"
                placeholder="PJvZbmCDKa6iZnsn6Atc9m5fnWc"
                value={formData.appToken}
                onChange={(e) => setFormData({ ...formData, appToken: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tableId">Table ID *</Label>
              <Input
                id="tableId"
                placeholder="tblJI8DTafcqas66"
                value={formData.tableId}
                onChange={(e) => setFormData({ ...formData, tableId: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="imageFieldName">图片字段名称</Label>
              <Input
                id="imageFieldName"
                placeholder="封面图片"
                value={formData.imageFieldName}
                onChange={(e) => setFormData({ ...formData, imageFieldName: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                飞书表格中用于存储封面图片的字段名称
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 测试结果 */}
        {testResult && (
          <Card className={testResult.success ? "border-green-500" : "border-destructive"}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                {testResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <span className="h-5 w-5 text-destructive">✕</span>
                )}
                {testResult.success ? "连接成功" : "连接失败"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{testResult.message}</p>
              {testResult.fields && testResult.fields.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium mb-2">表格字段：</p>
                  <div className="flex flex-wrap gap-2">
                    {testResult.fields.map((field, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-muted rounded text-xs"
                      >
                        {field.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            保存配置
          </Button>
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={testMutation.isPending || !config}
          >
            {testMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <TestTube className="mr-2 h-4 w-4" />
            )}
            测试连接
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
