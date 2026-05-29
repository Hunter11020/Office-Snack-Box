'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Typography, Grid, Box, CircularProgress, Alert } from '@mui/material'
import SnackCard, { type Snack } from '@/components/SnackCard'
import WithdrawDialog from '@/components/WithdrawDialog'
import { useRole } from '@/context/RoleContext'

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <Box
      sx={{
        bgcolor: '#fafafa',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        px: 3,
        py: 2.5,
        height: '100%',
      }}
    >
      <Typography sx={{ fontWeight: 800, fontSize: '2rem', lineHeight: 1, color }}>
        {value}
      </Typography>
      <Typography sx={{ mt: 1, color: 'text.secondary', fontSize: '0.95rem' }}>
        {label}
      </Typography>
    </Box>
  )
}

export default function HomePage() {
  const { role } = useRole()
  const [snacks, setSnacks] = useState<Snack[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [withdrawTarget, setWithdrawTarget] = useState<Snack | null>(null)
  const [updatedAt, setUpdatedAt] = useState('')

  const fetchSnacks = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/snacks')
      if (!res.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ')
      setSnacks(await res.json())
      setUpdatedAt(
        new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
      )
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSnacks() }, [fetchSnacks])

  const stats = useMemo(() => {
    let low = 0
    let empty = 0
    for (const s of snacks) {
      if (s.quantity === 0) empty++
      else if (s.quantity <= s.lowStockThreshold) low++
    }
    return { total: snacks.length, low, empty }
  }, [snacks])

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
        รายการขนม
      </Typography>
      <Typography sx={{ color: 'text.secondary', mt: 0.5, mb: 3 }}>
        {updatedAt ? `อัปเดตล่าสุด วันนี้ ${updatedAt}` : 'กำลังโหลด...'}
      </Typography>

      {/* Summary stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard value={stats.total} label="ทั้งหมด" color="#1a1a1a" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard value={stats.low} label="เหลือน้อย" color="#F57C00" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard value={stats.empty} label="หมดแล้ว" color="#D32F2F" />
        </Grid>
      </Grid>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress sx={{ color: 'primary.main' }} />
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && !error && snacks.length === 0 && (
        <Alert severity="info">ยังไม่มีขนมในระบบ กรุณาให้ Admin เพิ่มขนมก่อน</Alert>
      )}

      {!loading && snacks.length > 0 && (
        <Grid container spacing={2}>
          {snacks.map((s) => (
            <Grid key={s.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <SnackCard
                snack={s}
                canWithdraw={role === 'user'}
                onWithdraw={setWithdrawTarget}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <WithdrawDialog
        snack={withdrawTarget}
        open={withdrawTarget !== null}
        onClose={() => setWithdrawTarget(null)}
        onSuccess={() => fetchSnacks(true)}
      />
    </Box>
  )
}
