import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser, requireAdmin } from '@/lib/auth/dal'

export async function GET() {
  const { error } = await requireUser()
  if (error) return error

  const logs = await prisma.withdrawalLog.findMany({
    include: {
      snack: { select: { name: true } },
      user: { select: { role: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
  return NextResponse.json(logs)
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  const { snackId, quantity } = await req.json()
  // Identity comes from the session, never the client — prevents spoofing.
  const withdrawnBy = user.name ?? user.email

  // Must be a positive integer — otherwise a crafted negative value would
  // *increase* stock via the decrement below.
  if (!Number.isInteger(snackId) || !Number.isInteger(quantity) || quantity < 1) {
    return NextResponse.json({ error: 'กรุณาระบุขนมและจำนวนให้ถูกต้อง' }, { status: 400 })
  }

  const snack = await prisma.snack.findUnique({ where: { id: snackId } })
  if (!snack) return NextResponse.json({ error: 'ไม่พบขนมนี้' }, { status: 404 })

  // Decrement and log atomically. The conditional updateMany only succeeds while
  // stock is still sufficient, so concurrent withdrawals can't drive it negative.
  const log = await prisma.$transaction(async (tx) => {
    const updated = await tx.snack.updateMany({
      where: { id: snackId, quantity: { gte: quantity } },
      data: { quantity: { decrement: quantity } },
    })
    if (updated.count === 0) return null
    return tx.withdrawalLog.create({
      data: { snackId, quantity, withdrawnBy, userId: user.id },
    })
  })

  if (!log) {
    return NextResponse.json({ error: 'ไม่มีขนมเพียงพอ' }, { status: 400 })
  }

  return NextResponse.json(log, { status: 201 })
}

export async function DELETE() {
  const { error } = await requireAdmin()
  if (error) return error

  await prisma.withdrawalLog.deleteMany()
  return new NextResponse(null, { status: 204 })
}
