import { z } from "zod";

export const TicketSchema = z.object({
  id: z.string(),
  issue_title: z.string(),
  assignee: z.string(),
  priority: z.enum(["Critical", "High", "Medium", "Low"]),
  story_points: z.number().int().min(1).max(13),
  acceptance_criteria: z.array(z.string()).min(1).max(5),
  dependency: z.object({
    has_dependency: z.boolean(),
    blocked_by: z.array(z.string()),
    note: z.string(),
  }),
  column: z.enum(["todo", "in_progress", "backlog"]),
});

export const AnalysisSchema = z.object({
  meeting_summary: z.string(),
  tickets: z.array(TicketSchema).min(1).max(8),
});

export type Ticket = z.infer<typeof TicketSchema>;
export type Analysis = z.infer<typeof AnalysisSchema>;