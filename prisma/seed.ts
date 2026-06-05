import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🗑  Clearing existing data...')
  await prisma.withdrawalLog.deleteMany()
  await prisma.snack.deleteMany()

  console.log('🍿 Seeding snacks...')
  // A realistic office snack box: a mix of Thai favourites and international brands,
  // with a believable spread of in-stock / low-stock / out-of-stock items.
  const snackData = [
    { name: 'KitKat ช็อกโกแลต',         description: 'เวเฟอร์เคลือบช็อกโกแลตนม 4 นิ้ว',     quantity: 28, lowStockThreshold: 6 }, // 0
    { name: 'Oreo Original',             description: 'คุกกี้ช็อกโกแลตสอดไส้ครีมวานิลลา',    quantity: 4,  lowStockThreshold: 5 }, // 1 low
    { name: 'Pringles Original',         description: 'มันฝรั่งแผ่นกรอบรสออริจินัล',         quantity: 11, lowStockThreshold: 4 }, // 2
    { name: "Lay's รสโนริสาหร่าย",       description: 'มันฝรั่งทอดกรอบรสสาหร่ายญี่ปุ่น',     quantity: 0,  lowStockThreshold: 4 }, // 3 out
    { name: 'Pocky ช็อกโกแลต',           description: 'แท่งบิสกิตเคลือบช็อกโกแลต',           quantity: 16, lowStockThreshold: 5 }, // 4
    { name: 'เลย์ มันฝรั่งรสครีมชีส',     description: 'มันฝรั่งแผ่นอบกรอบรสครีมชีส',          quantity: 2,  lowStockThreshold: 4 }, // 5 low
    { name: 'ทองม้วนสด',                 description: 'ทองม้วนกรอบสอดไส้ครีมมะพร้าว',         quantity: 22, lowStockThreshold: 6 }, // 6
    { name: 'สาหร่ายเถ้าแก่น้อย',         description: 'สาหร่ายทอดกรอบรสคลาสสิก',             quantity: 13, lowStockThreshold: 5 }, // 7
    { name: 'Twix',                      description: 'บิสกิตคาราเมลเคลือบช็อกโกแลต',         quantity: 7,  lowStockThreshold: 4 }, // 8
    { name: "M&M's Peanut",              description: 'เม็ดช็อกโกแลตสอดไส้ถั่วลิสง',          quantity: 9,  lowStockThreshold: 4 }, // 9
    { name: 'Snickers',                  description: 'ช็อกโกแลตถั่วลิสงคาราเมลนูกัต',        quantity: 3,  lowStockThreshold: 5 }, // 10 low
    { name: 'เม็ดมะม่วงหิมพานต์อบ',       description: 'เม็ดมะม่วงหิมพานต์อบเกลือ',           quantity: 18, lowStockThreshold: 6 }, // 11
    { name: 'Pepero Almond',             description: 'แท่งบิสกิตอัลมอนด์เคลือบช็อกโกแลต',    quantity: 12, lowStockThreshold: 4 }, // 12
    { name: 'กล้วยตาก',                  description: 'กล้วยตากอบธรรมชาติเคี้ยวหนึบ',         quantity: 20, lowStockThreshold: 6 }, // 13
    { name: 'Doritos Nacho Cheese',      description: 'ข้าวโพดแผ่นกรอบรสนาโชชีส',            quantity: 0,  lowStockThreshold: 4 }, // 14 out
    { name: 'ปลาเส้นทาโร่',               description: 'ปลาเส้นปรุงรสดั้งเดิม',               quantity: 26, lowStockThreshold: 8 }, // 15
    { name: 'คุกกี้เนยสดอิมพีเรียล',      description: 'คุกกี้เนยสดเดนมาร์กกระป๋องเล็ก',       quantity: 5,  lowStockThreshold: 5 }, // 16 low
    { name: 'Mentos Mint',               description: 'ลูกอมมินต์เคี้ยวหนึบเม็ดกลม',          quantity: 34, lowStockThreshold: 10 }, // 17
  ]

  for (const s of snackData) {
    await prisma.snack.create({ data: s })
  }

  // Insertion order is preserved by autoincrement id, so index → snack id is stable.
  const allSnacks = await prisma.snack.findMany({ orderBy: { id: 'asc' } })

  console.log('📋 Seeding withdrawal logs...')
  const now = new Date()
  // d = days ago, h = additional hours ago, m = minutes — builds a believable recent history
  const at = (d: number, h = 0, m = 0) =>
    new Date(now.getTime() - d * 86400000 - h * 3600000 - m * 60000)

  // [snack index, person, quantity, daysAgo, hoursAgo, minutesAgo]
  const logs: [number, string, number, number, number, number][] = [
    // today
    [0, 'สมชาย', 2, 0, 1, 12],
    [1, 'มินตรา', 1, 0, 2, 5],
    [6, 'ปรียา', 1, 0, 3, 40],
    [15, 'อนุชา', 2, 0, 5, 20],
    // yesterday
    [4, 'ธนกร', 1, 1, 1, 0],
    [5, 'นภา', 2, 1, 3, 30],
    [10, 'กานต์', 1, 1, 6, 10],
    [17, 'วิภา', 1, 1, 7, 45],
    // earlier this week
    [9, 'สมชาย', 1, 2, 2, 0],
    [11, 'ปรียา', 2, 2, 4, 15],
    [2, 'ธนกร', 1, 2, 6, 50],
    [13, 'มินตรา', 2, 3, 1, 30],
    [8, 'อนุชา', 1, 3, 3, 0],
    [7, 'นภา', 1, 3, 5, 25],
    [12, 'กานต์', 2, 4, 2, 10],
    [16, 'วิภา', 1, 4, 4, 40],
    [0, 'ธนกร', 3, 4, 7, 0],
    // last week
    [6, 'สมชาย', 2, 5, 1, 20],
    [1, 'ปรียา', 2, 5, 4, 0],
    [15, 'อนุชา', 1, 6, 2, 30],
    [17, 'มินตรา', 2, 6, 5, 10],
    [11, 'นภา', 1, 7, 1, 0],
    [4, 'กานต์', 1, 7, 3, 45],
    [13, 'วิภา', 2, 8, 2, 15],
    [10, 'ธนกร', 1, 9, 4, 0],
    [0, 'สมชาย', 2, 10, 1, 30],
    [7, 'อนุชา', 2, 11, 3, 20],
    [8, 'มินตรา', 1, 12, 2, 0],
    [15, 'ปรียา', 3, 13, 5, 40],
    [11, 'กานต์', 1, 14, 2, 10],
  ]

  await prisma.withdrawalLog.createMany({
    data: logs.map(([idx, by, qty, d, h, m]) => ({
      snackId: allSnacks[idx].id,
      withdrawnBy: by,
      quantity: qty,
      createdAt: at(d, h, m),
    })),
  })

  console.log(`✅ Done! ${allSnacks.length} snacks + ${logs.length} withdrawal logs created.`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => pool.end())
