'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Typography, Grid, Box, CircularProgress, Alert,
  TextField, MenuItem, InputAdornment,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import SnackCard, { type Snack } from '@/components/SnackCard'
import WithdrawDialog from '@/components/WithdrawDialog'
import { useAuth } from '@/context/AuthContext'
import { SNACK_CATEGORIES } from '@/lib/categories'

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
  const { user } = useAuth()
  const [snacks, setSnacks] = useState<Snack[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [withdrawTarget, setWithdrawTarget] = useState<Snack | null>(null)
  const [updatedAt, setUpdatedAt] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch-on-mount: loading starts true and error starts empty, so the initial
  // setState calls are no-ops (React bails out on identical values) — no real cascade.
  // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const filteredSnacks = useMemo(() => {
    const q = search.trim().toLowerCase()
    return snacks.filter((s) => {
      const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.description?.toLowerCase().includes(q) ?? false)
      return matchesCategory && matchesSearch
    })
  }, [snacks, search, categoryFilter])

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

      {/* Search + category filter */}
      {!loading && !error && snacks.length > 0 && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            placeholder="ค้นหาขนม..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ flexGrow: 1, minWidth: 220 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            select
            label="ประเภท"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="all">ทุกประเภท</MenuItem>
            {SNACK_CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </TextField>
        </Box>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress sx={{ color: 'primary.main' }} />
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && !error && snacks.length === 0 && (
        <Alert severity="info">ยังไม่มีขนมในระบบ กรุณาให้ Admin เพิ่มขนมก่อน</Alert>
      )}

      {!loading && !error && snacks.length > 0 && filteredSnacks.length === 0 && (
        <Alert severity="info">ไม่พบขนมที่ตรงกับเงื่อนไข</Alert>
      )}

      {!loading && filteredSnacks.length > 0 && (
        <Grid container spacing={2}>
          {filteredSnacks.map((s) => (
            <Grid key={s.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <SnackCard
                snack={s}
                canWithdraw={!!user}
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
