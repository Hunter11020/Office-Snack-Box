import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { adminEmails } from '@/lib/auth/dal'

export async function POST(req: NextRequest) {
  const { name, email, password, phone } = await req.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: 'กรุณากรอกชื่อ' }, { status: 400 })
  }
  if (!email?.trim()) {
    return NextResponse.json({ error: 'กรุณากรอกอีเมล' }, { status: 400 })
  }
  // Phone is optional, but if provided it must look like a real number.
  const hasPhone = typeof phone === 'string' && phone.trim().length > 0
  if (hasPhone) {
    const phoneDigits = phone.replace(/[^0-9]/g, '')
    if (phoneDigits.length < 9 || phoneDigits.length > 15) {
      return NextResponse.json({ error: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง' }, { status: 400 })
    }
  }
  if (!password || password.length < 6) {
    return NextResponse.json({ error: 'รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร' }, { status: 400 })
  }

  const cleanEmail = email.trim().toLowerCase()
  const cleanName = name.trim()
  const cleanPhone = hasPhone ? phone.trim() : null

  // signUp via the server client so the session cookie (when email confirmation
  // is off) is set on the response and the user is logged in immediately.
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: { data: { name: cleanName, phone: cleanPhone } },
  })

  if (error) {
    const raw = error.message.toLowerCase()
    let msg = 'สมัครไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'
    if (raw.includes('already') || raw.includes('registered')) {
      msg = 'อีเมลนี้ถูกใช้สมัครแล้ว'
    } else if (raw.includes('rate limit')) {
      msg = 'ส่งอีเมลยืนยันบ่อยเกินไป กรุณารอสักครู่ หรือให้แอดมินปิด "Confirm email" ใน Supabase'
    } else if (raw.includes('password')) {
      msg = 'รหัสผ่านไม่ปลอดภัยพอ กรุณาตั้งรหัสผ่านที่คาดเดายากขึ้น'
    } else if (raw.includes('email') && raw.includes('invalid')) {
      msg = 'รูปแบบอีเมลไม่ถูกต้อง'
    }
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // When email confirmation is on and the email already exists, Supabase returns
  // an obfuscated user with no identities (to prevent email enumeration). Don't
  // write a row for it.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return NextResponse.json({ error: 'อีเมลนี้ถูกใช้สมัครแล้ว' }, { status: 400 })
  }

  // Persist the app user row right away so name/email show up in the DB at
  // registration time — not lazily on first login. The id comes from Supabase
  // Auth, so it can't be forged. Reconcile by email to avoid duplicates.
  if (data.user) {
    const isAdmin = adminEmails().includes(cleanEmail)
    try {
      await prisma.user.upsert({
        where: { email: cleanEmail },
        update: { id: data.user.id, name: cleanName, phone: cleanPhone },
        create: {
          id: data.user.id,
          email: cleanEmail,
          name: cleanName,
          phone: cleanPhone,
          role: isAdmin ? 'ADMIN' : 'USER',
        },
      })
    } catch (e) {
      // Auth user is created and name/phone are in user_metadata, so the profile
      // row will still be populated lazily on first login (see getCurrentUser).
      // Don't fail the whole registration over the profile write.
      console.error('register: failed to upsert user row', e)
    }
  }

  return NextResponse.json({ needsConfirmation: !data.session }, { status: 201 })
}
