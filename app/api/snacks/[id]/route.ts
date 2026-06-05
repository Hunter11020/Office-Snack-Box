import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/dal'
import { logStock } from '@/lib/stock-log'
import { isValidCategory } from '@/lib/categories'

type Ctx = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { user, error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await req.json()
  const { name, description, category, quantity, lowStockThreshold } = body

  if (name !== undefined && !name?.trim()) {
    return NextResponse.json({ error: 'กรุณาระบุชื่อขนม' }, { status: 400 })
  }
  if (category !== undefined && !isValidCategory(category)) {
    return NextResponse.json({ error: 'ประเภทขนมไม่ถูกต้อง' }, { status: 400 })
  }
  if (quantity !== undefined && (!Number.isInteger(quantity) || quantity < 0)) {
    return NextResponse.json({ error: 'จำนวนต้องเป็นจำนวนเต็มไม่ติดลบ' }, { status: 400 })
  }
  if (lowStockThreshold !== undefined && (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0)) {
    return NextResponse.json({ error: 'เกณฑ์ stock ต้องเป็นจำนวนเต็มไม่ติดลบ' }, { status: 400 })
  }

  const existing = await prisma.snack.findUnique({ where: { id: Number(id) } })
  if (!existing) return NextResponse.json({ error: 'ไม่พบขนมนี้' }, { status: 404 })

  const snack = await prisma.snack.update({
    where: { id: Number(id) },
    data: {
      name: name?.trim(),
      description: description ?? null,
      category,
      quantity,
      lowStockThreshold,
    },
  })

  await logStock({
    snackId: snack.id,
    snackName: snack.name,
    userId: user.id,
    action: 'UPDATE',
    before: existing.quantity,
    after: snack.quantity,
  })

  return NextResponse.json(snack)
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { user, error } = await requireAdmin()
  if (error) return error

  const { id } = await params

  const existing = await prisma.snack.findUnique({ where: { id: Number(id) } })
  if (!existing) return NextResponse.json({ error: 'ไม่พบขนมนี้' }, { status: 404 })

  // Log before deleting; the FK SetNull then clears snackId but the snapshot name remains.
  await logStock({
    snackId: existing.id,
    snackName: existing.name,
    userId: user.id,
    action: 'DELETE',
    before: existing.quantity,
  })

  await prisma.snack.delete({ where: { id: Number(id) } })
  return new NextResponse(null, { status: 204 })
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { user, error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const { delta } = await req.json()

  if (!Number.isInteger(delta)) {
    return NextResponse.json({ error: 'ค่าปรับ stock ต้องเป็นจำนวนเต็ม' }, { status: 400 })
  }

  const current = await prisma.snack.findUnique({ where: { id: Number(id) } })
  if (!current) return NextResponse.json({ error: 'ไม่พบขนมนี้' }, { status: 404 })

  const newQty = Math.max(0, current.quantity + delta)
  const snack = await prisma.snack.update({
    where: { id: Number(id) },
    data: { quantity: newQty },
  })

  await logStock({
    snackId: snack.id,
    snackName: snack.name,
    userId: user.id,
    action: 'ADJUST',
    before: current.quantity,
    after: snack.quantity,
  })

  return NextResponse.json(snack)
}
