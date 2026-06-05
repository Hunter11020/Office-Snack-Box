'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Box, Paper, Typography, TextField, Button, Alert,
} from '@mui/material'
import CookieIcon from '@mui/icons-material/Cookie'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      setLoading(false)
      return
    }
    // Refresh so the server re-reads the new session cookie.
    router.replace('/')
    router.refresh()
  }

  return (
    <Box
      sx={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Paper
        variant="outlined"
        sx={{ p: 4, width: '100%', maxWidth: 380, borderRadius: 3 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <CookieIcon sx={{ color: '#D32F2F' }} />
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            เข้าสู่ระบบ
          </Typography>
        </Box>
        <Typography sx={{ color: 'text.secondary', mb: 3 }}>
          Office Snack Box
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="อีเมล"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            fullWidth
          />
          <TextField
            label="รหัสผ่าน"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
          />
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ py: 1.2, fontWeight: 700 }}
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </Button>
          <Typography sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.9rem' }}>
            ยังไม่มีบัญชี?{' '}
            <Box component={Link} href="/register" sx={{ color: 'primary.main', fontWeight: 700 }}>
              สมัครสมาชิก
            </Box>
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}
