import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import type { Role } from '../app/generated/prisma/enums'

// Creates mock Supabase Auth accounts (auto-confirmed, ready to log in) and
// seeds matching rows in the `users` table with the right role.
// Requires SUPABASE_SERVICE_ROLE_KEY (Supabase → Project Settings → API).
//
// Run with: npm run seed:users

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

const accounts: { email: string; password: string; role: Role }[] = [
  { email: 'admin@example.com', password: 'Admin@1234', role: 'ADMIN' },
  { email: 'user@example.com', password: 'User@1234', role: 'USER' },
]

// createUser fails if the email already exists; fall back to looking it up.
async function findUserIdByEmail(email: string): Promise<string | null> {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (error) throw error
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id ?? null
}

async function main() {
  for (const acc of accounts) {
    let userId: string | null = null

    const { data, error } = await supabase.auth.admin.createUser({
      email: acc.email,
      password: acc.password,
      email_confirm: true,
    })

    if (error) {
      // Most likely the user already exists — reuse it.
      console.log(`ℹ️  ${acc.email}: ${error.message} — reusing existing account`)
      userId = await findUserIdByEmail(acc.email)
    } else {
      userId = data.user.id
      console.log(`✅ Created auth user ${acc.email}`)
    }

    if (!userId) {
      console.error(`❌ Could not resolve id for ${acc.email}, skipping`)
      continue
    }

    await prisma.user.upsert({
      where: { id: userId },
      update: { email: acc.email.toLowerCase(), role: acc.role },
      create: { id: userId, email: acc.email.toLowerCase(), role: acc.role },
    })
    console.log(`   → users row synced (${acc.role})`)
  }

  console.log('\n🎉 Done. Login credentials:')
  for (const acc of accounts) {
    console.log(`   ${acc.role.padEnd(5)}  ${acc.email}  /  ${acc.password}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => pool.end())
