/**
 * V4.2: 人设选择器组件
 * 从小红书应用(0103XHS)拉取人设数据，实现人设与飞书表格的长期关联
 */
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Link2, Unlink, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

// 人设类型定义
interface Persona {
  id: number;
  name: string;
  type: string;
  description: string | null;
  feishuConfig: {
    appId: string;
    appSecret: string;
    appToken: string;
    tableId: string;
  } | null;
  createdAt: string;
}

// 关联配置类型
interface PersonaLinkConfig {
  personaId: number;
  personaName: string;
  linkedAt: string;
  feishuConfig: {
    appId: string;
    appToken: string;
    tableId: string;
  };
}

interface PersonaSelectorProps {
  userId: number;
  xhsApiUrl: string;
  onConfigLinked: (config: {
    appId: string;
    appSecret: string;
    appToken: string;
    tableId: string;
  }) => void;
  onUnlink: () => void;
}

export default function PersonaSelector({ 
  userId, 
  xhsApiUrl, 
  onConfigLinked,
  onUnlink 
}: PersonaSelectorProps) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>("");
  const [linkedConfig, setLinkedConfig] = useState<PersonaLinkConfig | null>(null);
  const [linking, setLinking] = useState(false);

  // 从localStorage加载已关联的配置
  useEffect(() => {
    const saved = localStorage.getItem(`persona_link_${userId}`);
    if (saved) {
      try {
        const config = JSON.parse(saved) as PersonaLinkConfig;
        setLinkedConfig(config);
        setSelectedPersonaId(config.personaId.toString());
      } catch (e) {
        console.error("Failed to parse saved persona link config:", e);
      }
    }
  }, [userId]);

  // 从小红书应用拉取人设列表 (V4.2: 使用REST API)
  const fetchPersonas = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${xhsApiUrl}/api/public/personas?userId=${userId}`);
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setPersonas(data.data);
        if (data.data.length === 0) {
          toast.info("未找到配置了飞书的人设，请先在小红书应用中配置");
        }
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error: any) {
      console.error("Failed to fetch personas:", error);
      toast.error(`获取人设列表失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 获取完整的飞书配置（包含appSecret）(V4.2: 使用REST API)
  const fetchFullConfig = async (personaId: number): Promise<{
    appId: string;
    appSecret: string;
    appToken: string;
    tableId: string;
  } | null> => {
    try {
      const response = await fetch(`${xhsApiUrl}/api/public/persona/${personaId}/feishu-config?userId=${userId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        return data.data;
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch full config:", error);
      return null;
    }
  };

  // 建立长期关联
  const handleLink = async () => {
    if (!selectedPersonaId) {
      toast.error("请选择一个人设");
      return;
    }

    const persona = personas.find(p => p.id.toString() === selectedPersonaId);
    if (!persona || !persona.feishuConfig) {
      toast.error("所选人设没有飞书配置");
      return;
    }

    setLinking(true);
    try {
      // 获取完整配置（包含appSecret）
      const fullConfig = await fetchFullConfig(persona.id);
      if (!fullConfig) {
        throw new Error("无法获取完整的飞书配置");
      }

      // 保存关联配置到localStorage
      const linkConfig: PersonaLinkConfig = {
        personaId: persona.id,
        personaName: persona.name,
        linkedAt: new Date().toISOString(),
        feishuConfig: {
          appId: fullConfig.appId,
          appToken: fullConfig.appToken,
          tableId: fullConfig.tableId,
        },
      };
      localStorage.setItem(`persona_link_${userId}`, JSON.stringify(linkConfig));
      setLinkedConfig(linkConfig);

      // 通知父组件
      onConfigLinked(fullConfig);
      
      toast.success(`已关联人设「${persona.name}」的飞书配置`);
    } catch (error: any) {
      toast.error(`关联失败: ${error.message}`);
    } finally {
      setLinking(false);
    }
  };

  // 解除关联
  const handleUnlink = () => {
    localStorage.removeItem(`persona_link_${userId}`);
    setLinkedConfig(null);
    setSelectedPersonaId("");
    onUnlink();
    toast.success("已解除人设关联");
  };

  // 人设类型显示名称
  const getPersonaTypeName = (type: string) => {
    const typeNames: Record<string, string> = {
      senior_sister: "学姐人设",
      professional: "专业人设",
      anxious: "焦虑人设",
      critic: "批评人设",
    };
    return typeNames[type] || type;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          人设关联 (V4.2)
        </CardTitle>
        <CardDescription>
          从小红书应用拉取人设配置，实现飞书表格的长期关联
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 当前关联状态 */}
        {linkedConfig && (
          <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-700 dark:text-green-300">已关联人设</span>
            </div>
            <div className="text-sm text-green-600 dark:text-green-400 space-y-1">
              <p>人设名称: <strong>{linkedConfig.personaName}</strong></p>
              <p>App Token: {linkedConfig.feishuConfig.appToken}</p>
              <p>Table ID: {linkedConfig.feishuConfig.tableId}</p>
              <p className="text-xs opacity-75">
                关联时间: {new Date(linkedConfig.linkedAt).toLocaleString('zh-CN')}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={handleUnlink}
            >
              <Unlink className="mr-2 h-4 w-4" />
              解除关联
            </Button>
          </div>
        )}

        {/* 人设选择器 */}
        {!linkedConfig && (
          <>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchPersonas}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                拉取人设列表
              </Button>
              {personas.length > 0 && (
                <Badge variant="secondary">{personas.length} 个人设</Badge>
              )}
            </div>

            {personas.length > 0 && (
              <div className="space-y-3">
                <div className="grid gap-2">
                  <Label>选择人设</Label>
                  <Select 
                    value={selectedPersonaId} 
                    onValueChange={setSelectedPersonaId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择一个人设..." />
                    </SelectTrigger>
                    <SelectContent>
                      {personas.map((persona) => (
                        <SelectItem key={persona.id} value={persona.id.toString()}>
                          <div className="flex items-center gap-2">
                            <span>{persona.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {getPersonaTypeName(persona.type)}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 选中人设的详情 */}
                {selectedPersonaId && (
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    {(() => {
                      const persona = personas.find(p => p.id.toString() === selectedPersonaId);
                      if (!persona) return null;
                      return (
                        <div className="space-y-1">
                          <p><strong>人设名称:</strong> {persona.name}</p>
                          <p><strong>类型:</strong> {getPersonaTypeName(persona.type)}</p>
                          {persona.description && (
                            <p><strong>描述:</strong> {persona.description}</p>
                          )}
                          {persona.feishuConfig && (
                            <>
                              <p><strong>App Token:</strong> {persona.feishuConfig.appToken}</p>
                              <p><strong>Table ID:</strong> {persona.feishuConfig.tableId}</p>
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                <Button 
                  onClick={handleLink}
                  disabled={!selectedPersonaId || linking}
                >
                  {linking ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="mr-2 h-4 w-4" />
                  )}
                  建立长期关联
                </Button>
              </div>
            )}

            {personas.length === 0 && !loading && (
              <div className="p-4 bg-muted rounded-lg text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  点击"拉取人设列表"从小红书应用获取配置了飞书的人设
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
