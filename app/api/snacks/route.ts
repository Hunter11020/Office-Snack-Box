import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser, requireAdmin } from '@/lib/auth/dal'
import { logStock } from '@/lib/stock-log'
import { isValidCategory, DEFAULT_CATEGORY } from '@/lib/categories'

export async function GET() {
  const { error } = await requireUser()
  if (error) return error

  const snacks = await prisma.snack.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(snacks)
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAdmin()
  if (error) return error

  const body = await req.json()
  const { name, description, category, quantity, lowStockThreshold } = body

  if (!name?.trim()) {
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

  const snack = await prisma.snack.create({
    data: {
      name: name.trim(),
      description: description ?? null,
      category: category ?? DEFAULT_CATEGORY,
      quantity: quantity ?? 0,
      lowStockThreshold: lowStockThreshold ?? 5,
    },
  })

  await logStock({
    snackId: snack.id,
    snackName: snack.name,
    userId: user.id,
    action: 'CREATE',
    after: snack.quantity,
  })

  return NextResponse.json(snack, { status: 201 })
}
