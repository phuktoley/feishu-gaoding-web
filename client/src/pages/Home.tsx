import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowRight, CheckCircle2, FileSpreadsheet, ImageIcon, Settings, Upload } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: config } = trpc.feishuConfig.get.useQuery();

  const steps = [
    {
      icon: Settings,
      title: "配置飞书凭证",
      description: "设置飞书应用 ID、密钥和多维表格信息",
      action: () => setLocation("/settings"),
      completed: !!config,
    },
    {
      icon: FileSpreadsheet,
      title: "获取飞书数据",
      description: "从多维表格读取需要生成封面的记录",
      action: () => setLocation("/export"),
      completed: false,
    },
    {
      icon: Upload,
      title: "上传稿定设计图片",
      description: "上传从稿定设计下载的 ZIP 文件",
      action: () => setLocation("/upload"),
      completed: false,
    },
    {
      icon: ImageIcon,
      title: "回传到飞书",
      description: "将图片自动回填到飞书多维表格",
      action: () => setLocation("/upload"),
      completed: false,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* 欢迎区域 */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">飞书-稿定设计自动化工具</h1>
          <p className="text-muted-foreground">
            从飞书多维表格读取数据，通过稿定设计批量生成图片，自动回传到飞书
          </p>
        </div>

        {/* 工作流步骤 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <Card
              key={index}
              className={`cursor-pointer transition-all hover:shadow-md ${
                step.completed ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" : ""
              }`}
              onClick={step.action}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div
                    className={`p-2 rounded-lg ${
                      step.completed
                        ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">步骤 {index + 1}</span>
                </div>
                <CardTitle className="text-lg mt-2">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{step.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 快速开始 */}
        <Card>
          <CardHeader>
            <CardTitle>快速开始</CardTitle>
            <CardDescription>
              按照以下步骤完成飞书-稿定设计的自动化工作流
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-medium">配置飞书应用凭证</h4>
                <p className="text-sm text-muted-foreground">
                  在飞书开放平台创建应用，获取 App ID 和 App Secret
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setLocation("/settings")}>
                去配置 <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                2
              </div>
              <div className="flex-1">
                <h4 className="font-medium">在稿定设计生成图片</h4>
                <p className="text-sm text-muted-foreground">
                  使用批量套版功能生成图片，下载 ZIP 文件
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("https://www.gaoding.com/", "_blank")}
              >
                打开稿定设计 <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-medium">上传 ZIP 并回传飞书</h4>
                <p className="text-sm text-muted-foreground">
                  上传稿定设计下载的 ZIP，自动解析并回传到飞书表格
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setLocation("/upload")}>
                去上传 <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
