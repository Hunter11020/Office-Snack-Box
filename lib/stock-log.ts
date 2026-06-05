import { prisma } from '@/lib/prisma'
import type { StockAction } from '@/app/generated/prisma/enums'

// Records an admin inventory change. Best-effort: the audit write must never
// break the underlying stock operation, so it swallows its own errors (the
// callers await it after the mutation has already committed).
export async function logStock(params: {
  snackId: number | null
  snackName: string
  userId: string
  action: StockAction
  before?: number | null
  after?: number | null
}) {
  try {
    await prisma.stockLog.create({
      data: {
        snackId: params.snackId,
        snackName: params.snackName,
        userId: params.userId,
        action: params.action,
        before: params.before ?? null,
        after: params.after ?? null,
      },
    })
  } catch (e) {
    console.error('logStock: failed to write audit log', e)
  }
}
