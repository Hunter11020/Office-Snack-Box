'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Box, Paper, Typography, TextField, Button, Alert,
} from '@mui/material'
import CookieIcon from '@mui/icons-material/Cookie'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('กรุณากรอกชื่อ'); return }
    if (!email.trim()) { setError('กรุณากรอกอีเมล'); return }
    if (phone.trim() && phone.replace(/[^0-9]/g, '').length < 9) { setError('รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง'); return }
    if (password.length < 6) { setError('รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร'); return }
    if (password !== confirm) { setError('รหัสผ่านยืนยันไม่ตรงกัน'); return }

    setLoading(true)
    setError('')
    setInfo('')

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim(), password }),
    })
    const data = await res.json().catch(() => null)

    if (!res.ok) {
      setError(data?.error || 'สมัครไม่สำเร็จ')
      setLoading(false)
      return
    }

    // If email confirmation is enabled in Supabase, there's no session yet.
    if (data?.needsConfirmation) {
      setInfo('สมัครสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี แล้วจึงเข้าสู่ระบบ')
      setLoading(false)
      return
    }

    // Logged in immediately — go to home.
    router.replace('/')
    router.refresh()
  }

  return (
    <Box sx={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper variant="outlined" sx={{ p: 4, width: '100%', maxWidth: 400, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <CookieIcon sx={{ color: '#D32F2F' }} />
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            สมัครสมาชิก
          </Typography>
        </Box>
        <Typography sx={{ color: 'text.secondary', mb: 3 }}>
          Office Snack Box
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {info && <Alert severity="success">{info}</Alert>}
          <TextField
            label="ชื่อ (สำหรับแสดงในประวัติการเบิก)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            fullWidth
          />
          <TextField
            label="อีเมล"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
          />
          <TextField
            label="เบอร์โทรศัพท์ (ไม่บังคับ)"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            fullWidth
          />
          <TextField
            label="รหัสผ่าน"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
          />
          <TextField
            label="ยืนยันรหัสผ่าน"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            fullWidth
          />
          <Button type="submit" variant="contained" disabled={loading} sx={{ py: 1.2, fontWeight: 700 }}>
            {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
          </Button>
          <Typography sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.9rem' }}>
            มีบัญชีอยู่แล้ว?{' '}
            <Box component={Link} href="/login" sx={{ color: 'primary.main', fontWeight: 700 }}>
              เข้าสู่ระบบ
            </Box>
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}
