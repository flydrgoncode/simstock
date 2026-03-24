import { z } from 'zod'

export const workspaceQuickQuestionSchema = z.object({
  label: z.string().min(1),
  command: z.string().min(1),
})

export const workspaceThemeSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
  command: z.string().min(1),
  quickQuestions: z.array(workspaceQuickQuestionSchema).default([]),
})

export const workspaceConfigSchema = z.object({
  themes: z.array(workspaceThemeSchema).default([]),
})

export type WorkspaceQuickQuestion = z.infer<typeof workspaceQuickQuestionSchema>
export type WorkspaceTheme = z.infer<typeof workspaceThemeSchema>
export type WorkspaceConfig = z.infer<typeof workspaceConfigSchema>
