import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createTask,
  getFeishuConfig,
  getTaskById,
  getTasksByUser,
  updateTaskStatus,
  upsertFeishuConfig,
} from "./db";
import { createFeishuAPI } from "./feishu";
import { storagePut } from "./storage";
import AdmZip from "adm-zip";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // 飞书配置管理
  feishuConfig: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const config = await getFeishuConfig(ctx.user.id);
      if (!config) return null;
      // 隐藏敏感信息
      return {
        ...config,
        appSecret: config.appSecret ? "******" : "",
      };
    }),

    save: protectedProcedure
      .input(
        z.object({
          appId: z.string().min(1, "App ID 不能为空"),
          appSecret: z.string().min(1, "App Secret 不能为空"),
          appToken: z.string().min(1, "App Token 不能为空"),
          tableId: z.string().min(1, "Table ID 不能为空"),
          imageFieldName: z.string().default("封面图片"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await upsertFeishuConfig({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),

    test: protectedProcedure.mutation(async ({ ctx }) => {
      const config = await getFeishuConfig(ctx.user.id);
      if (!config) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "请先配置飞书凭证",
        });
      }

      try {
        const api = createFeishuAPI({
          appId: config.appId,
          appSecret: config.appSecret,
          appToken: config.appToken,
          tableId: config.tableId,
        });
        await api.getTenantAccessToken();
        const fields = await api.getTableFields();
        return {
          success: true,
          message: `连接成功，表格共有 ${fields.length} 个字段`,
          fields: fields.map((f: any) => ({ name: f.field_name, type: f.type })),
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `连接失败: ${error.message}`,
        });
      }
    }),
  }),

  // 飞书数据操作
  feishu: router({
    // 获取表格数据
    getRecords: protectedProcedure.query(async ({ ctx }) => {
      const config = await getFeishuConfig(ctx.user.id);
      if (!config) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "请先配置飞书凭证",
        });
      }

      const api = createFeishuAPI({
        appId: config.appId,
        appSecret: config.appSecret,
        appToken: config.appToken,
        tableId: config.tableId,
      });

      const records = await api.getAllRecords();
      const coverData = api.extractCoverData(records);

      return {
        total: records.length,
        records: coverData,
      };
    }),

    // 上传图片到飞书
    uploadImages: protectedProcedure
      .input(
        z.object({
          images: z.array(
            z.object({
              recordId: z.string(),
              imageData: z.string(), // base64 encoded
              fileName: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const config = await getFeishuConfig(ctx.user.id);
        if (!config) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "请先配置飞书凭证",
          });
        }

        const api = createFeishuAPI({
          appId: config.appId,
          appSecret: config.appSecret,
          appToken: config.appToken,
          tableId: config.tableId,
        });

        const results: { recordId: string; success: boolean; error?: string }[] = [];

        for (const img of input.images) {
          try {
            const buffer = Buffer.from(img.imageData, "base64");
            const fileToken = await api.uploadImage(buffer, img.fileName);

            await api.updateRecord(img.recordId, {
              [config.imageFieldName || "封面图片"]: [{ file_token: fileToken }],
            });

            results.push({ recordId: img.recordId, success: true });
          } catch (error: any) {
            results.push({
              recordId: img.recordId,
              success: false,
              error: error.message,
            });
          }
        }

        return {
          total: input.images.length,
          success: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length,
          results,
        };
      }),
  }),

  // ZIP 文件处理
  zip: router({
    // 解析上传的 ZIP 文件
    parse: protectedProcedure
      .input(
        z.object({
          zipData: z.string(), // base64 encoded ZIP
        })
      )
      .mutation(async ({ input }) => {
        try {
          const buffer = Buffer.from(input.zipData, "base64");
          const zip = new AdmZip(buffer);
          const entries = zip.getEntries();

          const images: { name: string; data: string }[] = [];

          for (const entry of entries) {
            const name = entry.entryName.toLowerCase();
            if (
              !entry.isDirectory &&
              (name.endsWith(".png") ||
                name.endsWith(".jpg") ||
                name.endsWith(".jpeg") ||
                name.endsWith(".gif") ||
                name.endsWith(".webp"))
            ) {
              const data = entry.getData().toString("base64");
              images.push({
                name: entry.entryName,
                data,
              });
            }
          }

          // 按文件名排序
          images.sort((a, b) => {
            const numA = parseInt(a.name.match(/\d+/)?.[0] || "0");
            const numB = parseInt(b.name.match(/\d+/)?.[0] || "0");
            return numA - numB;
          });

          return {
            success: true,
            count: images.length,
            images,
          };
        } catch (error: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `解析 ZIP 失败: ${error.message}`,
          });
        }
      }),
  }),

  // 任务管理
  tasks: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getTasksByUser(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getTaskById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          totalRecords: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const taskId = await createTask({
          userId: ctx.user.id,
          totalRecords: input.totalRecords,
        });
        return { taskId };
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          taskId: z.number(),
          status: z.enum(["pending", "exporting", "uploading", "completed", "failed"]),
          processedRecords: z.number().optional(),
          errorMessage: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await updateTaskStatus(
          input.taskId,
          input.status,
          input.processedRecords,
          input.errorMessage
        );
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
