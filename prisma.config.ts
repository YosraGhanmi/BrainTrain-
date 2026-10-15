import { loadEnvConfig } from '@next/env';
import { defineConfig, env } from 'prisma/config';

// Same .env / .env.local files Next.js reads, so the CLI and the app always
// talk to the same database
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
