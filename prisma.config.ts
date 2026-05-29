import 'dotenv/config'
import { defineConfig } from 'prisma/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

export default defineConfig({
  earlyAccess: true,
  schema: './prisma/schema.prisma',
  migrate: {
    async adapter(env) {
      const pool = new Pool({
        connectionString: env.DIRECT_URL,
      })
      return new PrismaPg(pool)
    },
  },
  datasource: {
    url: process.env.DIRECT_URL!,
  },
})