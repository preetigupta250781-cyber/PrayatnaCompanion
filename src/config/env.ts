import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z
    .string()
    .min(1, 'EXPO_PUBLIC_SUPABASE_URL is required')
    .url('EXPO_PUBLIC_SUPABASE_URL must be a valid URL'),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'EXPO_PUBLIC_SUPABASE_ANON_KEY is required'),
});

export type Env = z.infer<typeof envSchema>;

const validateEnv = (): Env => {
  const parsed = envSchema.safeParse({
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!parsed.success) {
    const errorDetails = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('\n');

    throw new Error(
      `\n❌ [Environment Error] Invalid or missing environment variables:\n${errorDetails}\n\n👉 Please configure a valid .env file based on .env.example.\n`
    );
  }

  return parsed.data;
};

export const env = validateEnv();
