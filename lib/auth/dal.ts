import 'server-only'

import { cache } from 'react'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import type { User as DbUser } from '@/app/generated/prisma/client'

export type AppUser = Pick<DbUser, 'id' | 'email' | 'role' | 'name'>

// Emails listed in ADMIN_EMAILS are promoted to ADMIN on login — this bootstraps
// the first admin without hand-editing the database.
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

// Resolve the current request's user from the Supabase session and keep the app
// `User` table in sync. Memoized per render pass so repeated calls in one request
// hit the DB at most once.
export const getCurrentUser = cache(async (): Promise<AppUser | null> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) return null
  const email = user.email.toLowerCase()
  const shouldBeAdmin = adminEmails().includes(email)
  // Name and phone are set at registration via Supabase user_metadata.
  const metaName =
    typeof user.user_metadata?.name === 'string' ? user.user_metadata.name.trim() : ''
  const metaPhone =
    typeof user.user_metadata?.phone === 'string' ? user.user_metadata.phone.trim() : ''

  let dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (dbUser) {
    // Backfill role / name / phone if they're now available.
    if (
      (shouldBeAdmin && dbUser.role !== 'ADMIN') ||
      (metaName && !dbUser.name) ||
      (metaPhone && !dbUser.phone)
    ) {
      dbUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(shouldBeAdmin && dbUser.role !== 'ADMIN' ? { role: 'ADMIN' as const } : {}),
          ...(metaName && !dbUser.name ? { name: metaName } : {}),
          ...(metaPhone && !dbUser.phone ? { phone: metaPhone } : {}),
        },
      })
    }
  } else {
    // No row for this auth id. Reconcile by email (the unique business key) so a
    // stale row from an earlier signup attempt doesn't break login — update its
    // id to the current auth id rather than creating a duplicate.
    dbUser = await prisma.user.upsert({
      where: { email },
      update: {
        id: user.id,
        ...(shouldBeAdmin ? { role: 'ADMIN' as const } : {}),
        ...(metaName ? { name: metaName } : {}),
        ...(metaPhone ? { phone: metaPhone } : {}),
      },
      create: {
        id: user.id,
        email,
        name: metaName || null,
        phone: metaPhone || null,
        role: shouldBeAdmin ? 'ADMIN' : 'USER',
      },
    })
  }

  return { id: dbUser.id, email: dbUser.email, role: dbUser.role, name: dbUser.name }
})

// Guard for Route Handlers: requires any authenticated user.
export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) {
    return { user: null, error: NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 }) }
  }
  return { user, error: null as null }
}

// Guard for Route Handlers: requires an ADMIN user.
export async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user) {
    return { user: null, error: NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 }) }
  }
  if (user.role !== 'ADMIN') {
    return { user: null, error: NextResponse.json({ error: 'เฉพาะ Admin เท่านั้นที่ทำรายการนี้ได้' }, { status: 403 }) }
  }
  return { user, error: null as null }
}
