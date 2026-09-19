import { z } from "zod";

export const contentFilterSchema = z.object({
  source: z.string().optional(),
  type: z.string().optional(),
  tag: z.string().optional(),
  bookmarked: z.union([z.literal("all"), z.boolean()]).optional(),
  read: z.union([z.literal("all"), z.boolean()]).optional()
});

export const modelFilterSchema = z.object({
  source: z.string().optional(),
  organization: z.string().optional(),
  pipeline: z.string().optional(),
  query: z.string().optional()
});

export const sourceFormSchema = z.object({
  name: z.string().min(2),
  type: z.string().min(2),
  url: z.string().url(),
  checkIntervalMinutes: z.coerce.number().int().positive(),
  tags: z.string().optional(),
  isActive: z.boolean().default(true)
});

export const trendSearchSchema = z.object({
  query: z.string().trim().min(2).max(200),
  source: z.enum(["all", "arxiv", "github"]).default("all"),
  periodDays: z.coerce.number().int().refine((value) => [7, 30, 90, 365].includes(value), "Geçersiz trend aralığı."),
  limit: z.coerce.number().int().min(5).max(50).default(20)
});

export type TrendSearchValues = z.infer<typeof trendSearchSchema>;

export type SourceFormValues = z.infer<typeof sourceFormSchema>;
