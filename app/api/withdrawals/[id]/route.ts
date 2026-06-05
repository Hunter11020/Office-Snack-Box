import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/dal'

type Ctx = { params: Promise<{ id: string }> }

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  await prisma.withdrawalLog.delete({ where: { id: Number(id) } })
  return new NextResponse(null, { status: 204 })
}
