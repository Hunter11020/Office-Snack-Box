import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { DEFAULT_CATEGORY } from '../lib/categories'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

const now = Date.now()
const at = (d: number, h = 0, m = 0) => new Date(now - d * 86400000 - h * 3600000 - m * 60000)
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]
const rint = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

// Realistic office snack box: name, description, category, quantity, threshold
const SNACKS: [string, string, string, number, number][] = [
  ['KitKat ช็อกโกแลต', 'เวเฟอร์เคลือบช็อกโกแลตนม', 'ช็อกโกแลต', 24, 6],
  ['Snickers', 'ช็อกโกแลตถั่วลิสงคาราเมลนูกัต', 'ช็อกโกแลต', 3, 5],
  ['Twix', 'บิสกิตคาราเมลเคลือบช็อกโกแลต', 'ช็อกโกแลต', 9, 4],
  ["M&M's Peanut", 'เม็ดช็อกโกแลตสอดไส้ถั่วลิสง', 'ช็อกโกแลต', 14, 5],
  ["Lay's รสโนริสาหร่าย", 'มันฝรั่งทอดกรอบรสสาหร่าย', 'ขนมขบเคี้ยว', 0, 4],
  ['Pringles Original', 'มันฝรั่งแผ่นกรอบรสออริจินัล', 'ขนมขบเคี้ยว', 11, 4],
  ['Doritos Nacho Cheese', 'ข้าวโพดแผ่นกรอบรสนาโชชีส', 'ขนมขบเคี้ยว', 7, 4],
  ['ปลาเส้นทาโร่', 'ปลาเส้นปรุงรสดั้งเดิม', 'ขนมขบเคี้ยว', 26, 8],
  ['สาหร่ายเถ้าแก่น้อย', 'สาหร่ายทอดกรอบรสคลาสสิก', 'ขนมขบเคี้ยว', 4, 5],
  ['Oreo Original', 'คุกกี้ช็อกโกแลตสอดไส้ครีม', 'คุกกี้/บิสกิต', 18, 5],
  ['คุกกี้เนยสดอิมพีเรียล', 'คุกกี้เนยสดเดนมาร์ก', 'คุกกี้/บิสกิต', 5, 5],
  ['Pocky ช็อกโกแลต', 'แท่งบิสกิตเคลือบช็อกโกแลต', 'คุกกี้/บิสกิต', 16, 5],
  ['Mentos Mint', 'ลูกอมมินต์เคี้ยวหนึบ', 'ลูกอม/หมากฝรั่ง', 30, 10],
  ["Hall's เมนทอล", 'ลูกอมเมนทอลบรรเทาคอ', 'ลูกอม/หมากฝรั่ง', 2, 6],
  ['เม็ดมะม่วงหิมพานต์อบ', 'เม็ดมะม่วงหิมพานต์อบเกลือ', 'ของแห้ง/ถั่ว', 18, 6],
  ['กล้วยตาก', 'กล้วยตากอบธรรมชาติ', 'ของแห้ง/ถั่ว', 20, 6],
  ['กาแฟกระป๋อง เบอร์ดี้', 'กาแฟพร้อมดื่มกระป๋อง', 'เครื่องดื่ม', 28, 8],
  ['ชาเขียวอิชิตัน', 'ชาเขียวพร้อมดื่มรสน้ำผึ้งมะนาว', 'เครื่องดื่ม', 6, 8],
]

async function main() {
  // 1. Keep users; clear inventory + history
  console.log('🗑  Clearing stock logs, withdrawals, snacks (keeping users)...')
  await prisma.stockLog.deleteMany()
  await prisma.withdrawalLog.deleteMany()
  await prisma.snack.deleteMany()

  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } })
  if (users.length === 0) throw new Error('No users found — register at least one account first.')
  const admins = users.filter((u) => u.role === 'ADMIN')
  const admin = admins[0] ?? users[0]
  const displayName = (u: (typeof users)[number]) => u.name ?? u.email.split('@')[0]
  console.log(`👥 Using ${users.length} existing users (${admins.length} admin). Inventory managed by: ${displayName(admin)}`)

  // 2. Create snacks
  console.log('🍿 Creating snacks...')
  const created = []
  for (const [name, description, category, quantity, lowStockThreshold] of SNACKS) {
    created.push(
      await prisma.snack.create({ data: { name, description, category: category || DEFAULT_CATEGORY, quantity, lowStockThreshold } })
    )
  }

  // 3. Stock logs — admin "added" each snack ~14 days ago (CREATE), plus a few restocks/edits
  console.log('📦 Creating stock audit logs (admin actions)...')
  const stockLogs: {
    snackId: number; snackName: string; userId: string; action: 'CREATE' | 'UPDATE' | 'ADJUST' | 'DELETE'; before: number | null; after: number | null; createdAt: Date
  }[] = []
  created.forEach((s, i) => {
    // initial creation (admin stocked it)
    stockLogs.push({ snackId: s.id, snackName: s.name, userId: admin.id, action: 'CREATE', before: null, after: s.quantity + rint(2, 8), createdAt: at(14, 0, i * 7) })
  })
  // a few restocks (ADJUST) in the past week
  for (const s of created.filter((_, i) => i % 3 === 0)) {
    const before = rint(1, 4)
    stockLogs.push({ snackId: s.id, snackName: s.name, userId: admin.id, action: 'ADJUST', before, after: before + rint(6, 12), createdAt: at(rint(2, 6), rint(0, 5), rint(0, 59)) })
  }
  // a couple of info edits (UPDATE)
  for (const s of [created[2], created[9]]) {
    stockLogs.push({ snackId: s.id, snackName: s.name, userId: admin.id, action: 'UPDATE', before: s.quantity, after: s.quantity, createdAt: at(rint(1, 3), rint(0, 5), rint(0, 59)) })
  }
  await prisma.stockLog.createMany({ data: stockLogs })

  // 4. Withdrawal logs — real users withdrawing over the last ~10 days
  console.log('📋 Creating withdrawal history (by real users)...')
  const withdrawals = []
  const COUNT = 32
  for (let i = 0; i < COUNT; i++) {
    const u = pick(users)
    const s = pick(created)
    withdrawals.push({
      snackId: s.id,
      userId: u.id,
      withdrawnBy: displayName(u),
      quantity: rint(1, 3),
      createdAt: at(rint(0, 10), rint(0, 8), rint(0, 59)),
    })
  }
  await prisma.withdrawalLog.createMany({ data: withdrawals })

  console.log(`\n✅ Done: ${created.length} snacks, ${stockLogs.length} stock logs, ${withdrawals.length} withdrawals. Users untouched.`)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => pool.end())
