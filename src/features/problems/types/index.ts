import { z } from 'zod';

export const problemStatementSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1, 'Code is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable(),
  domain: z.string().nullable(),
  difficulty: z.string().nullable(),
  release_at: z.string(),
  created_at: z.string(),
});

export const problemStatementListSchema = z.array(problemStatementSchema);

export const nextProblemReleaseSchema = z.string().nullable();

export type ProblemStatement = z.infer<typeof problemStatementSchema>;
export type NextProblemRelease = z.infer<typeof nextProblemReleaseSchema>;
