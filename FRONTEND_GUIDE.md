# Frontend Guide — Office Snack Box

> สิ่งที่ Frontend Developer ต้องรู้ทั้งหมดในระบบนี้
> ครอบคลุม: โครงสร้างไฟล์, Auth flow, API contract, State pattern, และ UI rules

---

## 1. โครงสร้างไฟล์ที่ Frontend ต้องรู้

```
app/
├── layout.tsx                ← Root layout (Server) — resolve user ที่นี่
├── page.tsx                  ← หน้าแรก: รายการขนม + เบิก
├── admin/page.tsx            ← จัดการขนม (Admin only)
├── history/page.tsx          ← ประวัติการเบิก
├── stock-log/page.tsx        ← Stock audit log (Admin only)
├── login/page.tsx            ← เข้าสู่ระบบ
├── register/page.tsx         ← สมัครสมาชิก
└── api/                      ← API routes (Server only)
    ├── snacks/route.ts
    ├── snacks/[id]/route.ts
    ├── withdrawals/route.ts
    ├── withdrawals/[id]/route.ts
    ├── stock-logs/route.ts
    └── register/route.ts

components/
├── Navbar.tsx                ← Client — อ่าน user จาก useAuth()
├── Providers.tsx             ← Client — ห่อ MUI Theme + AuthProvider
├── SnackCard.tsx             ← Client — export type Snack (ใช้ร่วมกัน)
├── WithdrawDialog.tsx        ← Client — POST /api/withdrawals
└── SnackFormDialog.tsx       ← Client — POST/PUT /api/snacks

context/
└── AuthContext.tsx           ← Client — useAuth(), useIsAdmin()

lib/
├── auth/dal.ts               ← Server only — getCurrentUser(), requireUser(), requireAdmin()
├── supabase/
│   ├── client.ts             ← Browser Supabase client (login/logout)
│   └── server.ts             ← Server Supabase client (session read)
├── categories.ts             ← Shared — SNACK_CATEGORIES, DEFAULT_CATEGORY
└── prisma.ts                 ← Server only — PrismaClient singleton
```

---

## 2. Auth Architecture — สำคัญมาก

### หลักการ: User ถูก resolve บน Server เสมอ

Client ไม่มีสิทธิ์ตัดสินว่าตัวเองเป็นใคร — มาจาก Server เท่านั้น

```
app/layout.tsx (Server Component)
     │
     ▼
getCurrentUser()  ←  lib/auth/dal.ts
     │                    │
     │              Supabase session (cookie)
     │                    │
     │              prisma.user.upsert()  ←  sync role + name
     │
     ▼
<Providers user={user}>          ←  components/Providers.tsx
     │
     ▼
<AuthProvider user={user}>       ←  context/AuthContext.tsx
     │
     ▼
useAuth()  /  useIsAdmin()       ←  ใช้ใน Client Components ทั่วระบบ
```

### AuthUser type

```ts
// context/AuthContext.tsx
export interface AuthUser {
  id: string
  email: string
  name: string | null
  role: 'USER' | 'ADMIN'
}
```

### การใช้งานใน Client Component

```tsx
import { useAuth, useIsAdmin } from '@/context/AuthContext'

function MyComponent() {
  const { user } = useAuth()   // null = ยังไม่ login
  const isAdmin = useIsAdmin() // shorthand สำหรับ user?.role === 'ADMIN'

  if (!user) return <p>กรุณาเข้าสู่ระบบ</p>
  if (!isAdmin) return <p>เฉพาะ Admin เท่านั้น</p>
}
```

### Login / Logout flow

```
LOGIN:
  login/page.tsx
      │  supabase.auth.signInWithPassword()  ←  client-side Supabase
      │  router.refresh()                    ←  บังคับ Server re-render
      ▼
  layout.tsx re-runs → getCurrentUser() → AuthProvider อัปเดต user

LOGOUT (Navbar.tsx):
  supabase.auth.signOut()   ←  lib/supabase/client.ts
  router.replace('/login')
  router.refresh()          ←  ล้าง user state
```

---

## 3. API Contract — สิ่งที่ Frontend ต้อง Call

### 3.1 Snacks

| Method | URL | Auth | Body | Returns |
|--------|-----|------|------|---------|
| `GET` | `/api/snacks` | User | — | `Snack[]` |
| `POST` | `/api/snacks` | Admin | `SnackBody` | `Snack` |
| `PUT` | `/api/snacks/[id]` | Admin | `SnackBody` | `Snack` |
| `PATCH` | `/api/snacks/[id]` | Admin | `{ delta: number }` | `Snack` |
| `DELETE` | `/api/snacks/[id]` | Admin | — | `{ ok: true }` |

**Snack type** (export จาก `components/SnackCard.tsx`):

```ts
export interface Snack {
  id: number
  name: string
  description: string | null
  category: string
  quantity: number
  lowStockThreshold: number
}
```

**SnackBody** (POST/PUT):

```ts
{
  name: string           // required
  description: string | null
  category: string       // ต้องอยู่ใน SNACK_CATEGORIES
  quantity: number
  lowStockThreshold: number
}
```

**PATCH** — ปรับ stock แบบ delta (ไม่ใช่ set ตรงๆ):

```ts
// เพิ่ม 10 ชิ้น
await fetch(`/api/snacks/${id}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ delta: 10 }),
})

// ลด 5 ชิ้น
body: JSON.stringify({ delta: -5 })
```

---

### 3.2 Withdrawals

| Method | URL | Auth | Body | Returns |
|--------|-----|------|------|---------|
| `GET` | `/api/withdrawals` | User | — | `WithdrawalLog[]` (max 200) |
| `POST` | `/api/withdrawals` | User | `{ snackId, quantity }` | `WithdrawalLog` |
| `DELETE` | `/api/withdrawals/[id]` | Admin | — | `{ ok: true }` |
| `DELETE` | `/api/withdrawals` | Admin | — | `{ deleted: number }` |

**POST body:**

```ts
{
  snackId: number
  quantity: number  // ต้องมากกว่า 0 และไม่เกิน stock ที่มี
}
```

> `withdrawnBy` ไม่ต้องส่ง — Server อ่านจาก session เองเสมอ (ป้องกัน spoofing)

**Error responses ที่ต้อง handle:**

```ts
// 400 — stock ไม่พอ
{ error: 'สินค้าคงเหลือไม่เพียงพอ' }

// 401 — ยังไม่ login
{ error: 'กรุณาเข้าสู่ระบบก่อน' }
```

---

### 3.3 Stock Logs (Admin only)

| Method | URL | Auth | Returns |
|--------|-----|------|---------|
| `GET` | `/api/stock-logs` | Admin | `StockLog[]` (max 200) |

```ts
// StockLog shape จาก API
{
  id: number
  snackName: string
  action: 'CREATE' | 'UPDATE' | 'ADJUST' | 'DELETE'
  before: number | null
  after: number | null
  createdAt: string
  user: { email: string } | null
}
```

---

### 3.4 Register

| Method | URL | Body |
|--------|-----|------|
| `POST` | `/api/register` | `RegisterBody` |

```ts
// RegisterBody
{
  name: string      // required
  email: string     // required
  phone?: string    // optional, format: 0X-XXXX-XXXX
  password: string  // min 8 chars, ต้องมีตัวเลข
}

// Response
{ needsConfirmation: boolean }  // true = ต้อง confirm email ก่อน login ได้
```

---

## 4. State Pattern ที่ใช้ในระบบ

### Pattern มาตรฐานของ Page ในระบบนี้

```tsx
'use client'

export default function SomePage() {
  const { user } = useAuth()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 1. fetchData ใช้ useCallback เพื่อให้ useEffect ไม่ re-run โดยไม่จำเป็น
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/...')
      if (!res.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ')
      setItems(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }, [])

  // 2. Fetch on mount
  useEffect(() => { fetchData() }, [fetchData])

  // 3. หลัง mutation → silent refetch (ไม่แสดง loading spinner)
  // onSuccess={() => fetchData(true)}
}
```

### Dialog Pattern (WithdrawDialog / SnackFormDialog)

```tsx
// ใน parent page — เก็บ target item เป็น state
const [target, setTarget] = useState<Snack | null>(null)

// ใน JSX
<SnackCard onWithdraw={setTarget} />
<WithdrawDialog
  snack={target}
  open={target !== null}
  onClose={() => setTarget(null)}
  onSuccess={() => fetchSnacks(true)}   // silent refetch
/>
```

### Form Reset Pattern (SnackFormDialog)

```tsx
// Sync form fields เมื่อ dialog เปิด หรือ target เปลี่ยน
useEffect(() => {
  if (snack) {
    setName(snack.name)
    setCategory(snack.category ?? DEFAULT_CATEGORY)
    // ...etc
  } else {
    // reset to blank defaults (add mode)
    setName('')
    setCategory(DEFAULT_CATEGORY)
  }
  setError('')
}, [snack, open])  // ← dependency ทั้ง snack และ open
```

---

## 5. Shared Types & Constants

### Snack type — export จาก SnackCard

```ts
// components/SnackCard.tsx — import ที่เดียวกับ component
import SnackCard, { type Snack } from '@/components/SnackCard'
```

### SNACK_CATEGORIES

```ts
// lib/categories.ts
export const SNACK_CATEGORIES = [
  'ช็อกโกแลต',
  'ขนมขบเคี้ยว',
  'คุกกี้/บิสกิต',
  'ลูกอม/หมากฝรั่ง',
  'ของแห้ง/ถั่ว',
  'เครื่องดื่ม',
  'อื่นๆ',
] as const

export const DEFAULT_CATEGORY = 'อื่นๆ'
```

> ต้องใช้ list นี้เสมอสำหรับ dropdown และ filter — ห้าม hardcode string ในหน้า

---

## 6. UI Rules — MUI Theme

Theme ถูก define ใน `components/Providers.tsx`:

```ts
const theme = createTheme({
  palette: {
    mode: 'light',
    primary:    { main: '#D32F2F' },  // แดง — ปุ่มหลัก, Navbar
    warning:    { main: '#F57C00' },  // ส้ม — low stock
    success:    { main: '#388E3C' },  // เขียว — พร้อมเบิก
    error:      { main: '#D32F2F' },
    background: { default: '#f4f4f5', paper: '#ffffff' },
  },
})
```

### Stock Status Logic (ใช้ใน SnackCard)

```ts
const isEmpty = snack.quantity === 0
const isLow   = !isEmpty && snack.quantity <= snack.lowStockThreshold

// badge
isEmpty → 'หมดแล้ว'   (gray)
isLow   → 'เหลือน้อย' (orange, #F57C00)
else    → 'พร้อมเบิก'  (green, #388E3C)
```

### Navbar Tabs (แสดงตาม role)

```ts
// components/Navbar.tsx
const tabs = [
  { label: 'ขนม',        href: '/' },
  ...(isAdmin ? [
    { label: 'จัดการ',    href: '/admin' },
    { label: 'บันทึก Stock', href: '/stock-log' },
  ] : []),
  { label: 'ประวัติ',    href: '/history' },
]
// tabs แสดงเฉพาะเมื่อ user login แล้วเท่านั้น
```

---

## 7. กฎสำคัญที่ต้องรู้

| เรื่อง | กฎ |
|--------|-----|
| **Role guard** | ตรวจสอบใน API (`requireAdmin()`) **และ** ใน UI (`useIsAdmin()`) ทั้งสองที่ |
| **withdrawnBy** | ห้ามส่งจาก client — Server อ่านจาก session เสมอ |
| **PATCH vs PUT** | PUT = แทนที่ทั้งหมด, PATCH = delta เท่านั้น (`{ delta: number }`) |
| **Category** | ต้องอยู่ใน `SNACK_CATEGORIES` — API validate ฝั่ง server ด้วย |
| **router.refresh()** | ต้องเรียกหลัง login/logout เสมอ เพื่อ trigger server re-render |
| **Client Supabase** | ใช้เฉพาะ login (`signInWithPassword`) และ logout (`signOut`) |
| **Server Supabase** | session read ทำใน `lib/auth/dal.ts` เท่านั้น ห้าม import ใน Client Component |
| **'use client'** | ทุก Page และ Component ที่ใช้ hook หรือ event handler ต้องมี directive นี้ |
| **Atomic withdrawal** | Server ใช้ Prisma transaction ป้องกัน race condition — client ไม่ต้อง handle |

---

## 8. Data Flow ภาพรวม

```
Browser (Client Components)
│
│  useAuth() → user.role
│  fetch('/api/...')
│
├── GET /api/snacks ──────────────────► prisma.snack.findMany()
│
├── POST /api/withdrawals ────────────► prisma.$transaction([
│    { snackId, quantity }                updateMany (gte check),
│                                         create withdrawalLog
│                                       ])
│
├── POST/PUT /api/snacks ─────────────► prisma.snack.create / update
│    (Admin)                             + logStock() (audit)
│
├── PATCH /api/snacks/[id] ───────────► prisma.snack.update({ quantity += delta })
│    { delta }                           + logStock(action: 'ADJUST')
│
└── DELETE /api/snacks/[id] ──────────► logStock(action: 'DELETE')
     (Admin)                             + prisma.snack.delete()

Server (API Routes)
│
├── requireUser()  → 401 ถ้าไม่ login
├── requireAdmin() → 403 ถ้าไม่ใช่ ADMIN
└── getCurrentUser() (cached per request) → Supabase session → prisma.user.upsert()
```
