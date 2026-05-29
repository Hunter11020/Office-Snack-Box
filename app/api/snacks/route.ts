import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const snacks = await prisma.snack.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(snacks)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, description, quantity, lowStockThreshold } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const snack = await prisma.snack.create({
    data: {
      name: name.trim(),
      description: description ?? null,
      quantity: quantity ?? 0,
      lowStockThreshold: lowStockThreshold ?? 5,
    },
  })
  return NextResponse.json(snack, { status: 201 })
}
