/**
 * 飞书多维表格 API 服务
 */

import axios from "axios";

interface FeishuCredentials {
  appId: string;
  appSecret: string;
  appToken: string;
  tableId: string;
}

interface FeishuRecord {
  record_id: string;
  fields: Record<string, unknown>;
}

interface CoverData {
  recordId: string;
  mainTitle: string;
  subTitle: string;
  rawFields: Record<string, unknown>;
}

export class FeishuBitableAPI {
  private credentials: FeishuCredentials;
  private token: string | null = null;

  constructor(credentials: FeishuCredentials) {
    this.credentials = credentials;
  }

  /**
   * 获取 tenant_access_token
   */
  async getTenantAccessToken(): Promise<string> {
    const url = "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal";
    const response = await axios.post(url, {
      app_id: this.credentials.appId,
      app_secret: this.credentials.appSecret,
    });

    if (response.data.code === 0) {
      this.token = response.data.tenant_access_token;
      return this.token!;
    } else {
      throw new Error(`获取 token 失败: ${JSON.stringify(response.data)}`);
    }
  }

  private async getHeaders() {
    if (!this.token) {
      await this.getTenantAccessToken();
    }
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * 获取多维表格的字段信息
   */
  async getTableFields() {
    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${this.credentials.appToken}/tables/${this.credentials.tableId}/fields`;
    const response = await axios.get(url, { headers: await this.getHeaders() });

    if (response.data.code === 0) {
      return response.data.data?.items || [];
    } else {
      throw new Error(`获取字段信息失败: ${JSON.stringify(response.data)}`);
    }
  }

  /**
   * 获取多维表格的记录
   */
  async getTableRecords(pageSize = 100, pageToken?: string) {
    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${this.credentials.appToken}/tables/${this.credentials.tableId}/records`;
    const params: Record<string, unknown> = { page_size: pageSize };
    if (pageToken) {
      params.page_token = pageToken;
    }

    const response = await axios.get(url, {
      headers: await this.getHeaders(),
      params,
    });

    if (response.data.code === 0) {
      return response.data.data || {};
    } else {
      throw new Error(`获取记录失败: ${JSON.stringify(response.data)}`);
    }
  }

  /**
   * 获取所有记录（处理分页）
   */
  async getAllRecords(): Promise<FeishuRecord[]> {
    const allRecords: FeishuRecord[] = [];
    let pageToken: string | undefined;

    while (true) {
      const data = await this.getTableRecords(100, pageToken);
      const records = data.items || [];
      allRecords.push(...records);

      if (!data.has_more) {
        break;
      }
      pageToken = data.page_token;
    }

    return allRecords;
  }

  /**
   * 更新单条记录
   */
  async updateRecord(recordId: string, fields: Record<string, unknown>) {
    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${this.credentials.appToken}/tables/${this.credentials.tableId}/records/${recordId}`;
    const response = await axios.put(
      url,
      { fields },
      { headers: await this.getHeaders() }
    );

    if (response.data.code === 0) {
      return response.data.data || {};
    } else {
      throw new Error(`更新记录失败: ${JSON.stringify(response.data)}`);
    }
  }

  /**
   * 上传图片到飞书多维表格
   * 注意：需要应用有 drive:drive:media 权限
   */
  async uploadImage(fileBuffer: Buffer, fileName: string): Promise<string> {
    const url = "https://open.feishu.cn/open-apis/drive/v1/medias/upload_all";

    // 确保 token 有效
    if (!this.token) {
      await this.getTenantAccessToken();
    }

    const FormData = (await import("form-data")).default;
    const formData = new FormData();
    formData.append("file_name", fileName);
    formData.append("parent_type", "bitable_image");
    formData.append("parent_node", this.credentials.appToken);
    formData.append("size", fileBuffer.length.toString());
    formData.append("file", fileBuffer, { filename: fileName });

    console.log(`[飞书上传] 开始上传图片: ${fileName}, 大小: ${fileBuffer.length} 字节`);
    console.log(`[飞书上传] parent_node (appToken): ${this.credentials.appToken}`);

    try {
      const headers = await this.getHeaders();
      const response = await axios.post(url, formData, {
        headers: {
          Authorization: headers.Authorization,
          ...formData.getHeaders(),
        },
        timeout: 60000, // 60秒超时
      });

      console.log(`[飞书上传] 响应: ${JSON.stringify(response.data)}`);

      if (response.data.code === 0) {
        const fileToken = response.data.data?.file_token;
        console.log(`[飞书上传] 上传成功, file_token: ${fileToken}`);
        return fileToken;
      } else {
        // 详细的错误信息
        const errorMsg = `上传图片失败 [code: ${response.data.code}]: ${response.data.msg || JSON.stringify(response.data)}`;
        console.error(`[飞书上传] ${errorMsg}`);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      // 处理网络错误或其他异常
      if (error.response) {
        const errorMsg = `上传图片HTTP错误 [${error.response.status}]: ${JSON.stringify(error.response.data)}`;
        console.error(`[飞书上传] ${errorMsg}`);
        throw new Error(errorMsg);
      }
      console.error(`[飞书上传] 上传异常: ${error.message}`);
      throw error;
    }
  }

  /**
   * 从记录中提取封面数据
   */
  extractCoverData(records: FeishuRecord[]): CoverData[] {
    return records.map((record) => {
      const fields = record.fields || {};
      let mainTitle = fields["封面主文案"] as string | unknown[];
      let subTitle = fields["封面副文案"] as string | unknown[];

      // 处理富文本格式
      if (Array.isArray(mainTitle)) {
        mainTitle = mainTitle.map((item: any) => item.text || "").join("");
      }
      if (Array.isArray(subTitle)) {
        subTitle = subTitle.map((item: any) => item.text || "").join("");
      }

      return {
        recordId: record.record_id,
        mainTitle: (mainTitle as string) || "",
        subTitle: (subTitle as string) || "",
        rawFields: fields,
      };
    });
  }
}

/**
 * 创建飞书 API 实例
 */
export function createFeishuAPI(credentials: FeishuCredentials) {
  return new FeishuBitableAPI(credentials);
}
