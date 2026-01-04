import { describe, expect, it, vi } from "vitest";
import { createFeishuAPI, FeishuBitableAPI } from "./feishu";

describe("FeishuBitableAPI", () => {
  const mockCredentials = {
    appId: "cli_test123",
    appSecret: "secret123",
    appToken: "token123",
    tableId: "table123",
  };

  it("should create API instance with credentials", () => {
    const api = createFeishuAPI(mockCredentials);
    expect(api).toBeInstanceOf(FeishuBitableAPI);
  });

  it("should extract cover data from records correctly", () => {
    const api = createFeishuAPI(mockCredentials);
    
    const mockRecords = [
      {
        record_id: "rec1",
        fields: {
          "封面主文案": "主标题1",
          "封面副文案": "副标题1",
        },
      },
      {
        record_id: "rec2",
        fields: {
          "封面主文案": [{ text: "主标题2" }],
          "封面副文案": [{ text: "副标题2" }],
        },
      },
      {
        record_id: "rec3",
        fields: {},
      },
    ];

    const coverData = api.extractCoverData(mockRecords);

    expect(coverData).toHaveLength(3);
    expect(coverData[0]).toEqual({
      recordId: "rec1",
      mainTitle: "主标题1",
      subTitle: "副标题1",
      rawFields: mockRecords[0].fields,
    });
    expect(coverData[1]).toEqual({
      recordId: "rec2",
      mainTitle: "主标题2",
      subTitle: "副标题2",
      rawFields: mockRecords[1].fields,
    });
    expect(coverData[2]).toEqual({
      recordId: "rec3",
      mainTitle: "",
      subTitle: "",
      rawFields: {},
    });
  });

  it("should handle empty records array", () => {
    const api = createFeishuAPI(mockCredentials);
    const coverData = api.extractCoverData([]);
    expect(coverData).toEqual([]);
  });
});

describe("ZIP parsing", () => {
  it("should sort images by numeric order in filename", () => {
    const images = [
      { name: "image_10.png", data: "" },
      { name: "image_2.png", data: "" },
      { name: "image_1.png", data: "" },
    ];

    images.sort((a, b) => {
      const numA = parseInt(a.name.match(/\d+/)?.[0] || "0");
      const numB = parseInt(b.name.match(/\d+/)?.[0] || "0");
      return numA - numB;
    });

    expect(images[0].name).toBe("image_1.png");
    expect(images[1].name).toBe("image_2.png");
    expect(images[2].name).toBe("image_10.png");
  });
});
