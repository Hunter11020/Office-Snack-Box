import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Ctx = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const body = await req.json()
  const { name, description, quantity, lowStockThreshold } = body

  const snack = await prisma.snack.update({
    where: { id: Number(id) },
    data: {
      name: name?.trim(),
      description: description ?? null,
      quantity,
      lowStockThreshold,
    },
  })
  return NextResponse.json(snack)
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  await prisma.snack.delete({ where: { id: Number(id) } })
  return new NextResponse(null, { status: 204 })
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const { delta } = await req.json()

  const current = await prisma.snack.findUnique({ where: { id: Number(id) } })
  if (!current) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const newQty = Math.max(0, current.quantity + delta)
  const snack = await prisma.snack.update({
    where: { id: Number(id) },
    data: { quantity: newQty },
  })
  return NextResponse.json(snack)
}
