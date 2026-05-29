import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const logs = await prisma.withdrawalLog.findMany({
    include: { snack: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
  return NextResponse.json(logs)
}

export async function POST(req: NextRequest) {
  const { snackId, quantity, withdrawnBy } = await req.json()

  if (!snackId || !quantity || !withdrawnBy?.trim()) {
    return NextResponse.json({ error: 'snackId, quantity, withdrawnBy required' }, { status: 400 })
  }

  const snack = await prisma.snack.findUnique({ where: { id: snackId } })
  if (!snack) return NextResponse.json({ error: 'snack not found' }, { status: 404 })
  if (snack.quantity < quantity) {
    return NextResponse.json({ error: 'ไม่มีขนมเพียงพอ' }, { status: 400 })
  }

  const [log] = await prisma.$transaction([
    prisma.withdrawalLog.create({
      data: { snackId, quantity, withdrawnBy: withdrawnBy.trim() },
    }),
    prisma.snack.update({
      where: { id: snackId },
      data: { quantity: { decrement: quantity } },
    }),
  ])

  return NextResponse.json(log, { status: 201 })
}

export async function DELETE() {
  await prisma.withdrawalLog.deleteMany()
  return new NextResponse(null, { status: 204 })
}
