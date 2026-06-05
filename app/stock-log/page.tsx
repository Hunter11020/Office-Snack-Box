'use client'

import { useEffect, useState } from 'react'
import {
  Typography, Box, CircularProgress, Alert, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper,
} from '@mui/material'
import { useAuth } from '@/context/AuthContext'

type StockAction = 'CREATE' | 'UPDATE' | 'ADJUST' | 'DELETE'

interface StockLogEntry {
  id: number
  snackId: number | null
  snackName: string
  action: StockAction
  before: number | null
  after: number | null
  createdAt: string
  user: { email: string } | null
}

const ACTION_META: Record<StockAction, { label: string; color: 'success' | 'info' | 'warning' | 'error' }> = {
  CREATE: { label: 'เพิ่มขนมใหม่', color: 'success' },
  UPDATE: { label: 'แก้ไขข้อมูล', color: 'info' },
  ADJUST: { label: 'ปรับ Stock', color: 'warning' },
  DELETE: { label: 'ลบขนม', color: 'error' },
}

export default function StockLogPage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<StockLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/stock-logs')
        if (!res.ok) throw new Error('โหลดบันทึกไม่สำเร็จ')
        if (!cancelled) setLogs(await res.json())
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('th-TH', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  const renderChange = (l: StockLogEntry) => {
    if (l.action === 'CREATE') return `เริ่มต้น ${l.after ?? 0} ชิ้น`
    if (l.action === 'DELETE') return `${l.before ?? 0} → ลบ`
    if (l.before == null || l.after == null) return '—'
    const delta = l.after - l.before
    if (delta === 0) return 'แก้ไขรายละเอียด' // info-only edit, stock unchanged
    const sign = delta > 0 ? `+${delta}` : `${delta}`
    return `${l.before} → ${l.after} (${sign})`
  }

  if (user?.role !== 'ADMIN') {
    return <Alert severity="error">หน้านี้สำหรับ Admin เท่านั้น</Alert>
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        บันทึกการจัดการ Stock
      </Typography>
      <Typography sx={{ color: 'text.secondary', mb: 2 }}>
        ประวัติการเพิ่ม / แก้ไข / ปรับ / ลบขนม โดย Admin
      </Typography>

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>}
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

      {!loading && !error && (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 700 }}>วันที่</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>ผู้ดำเนินการ</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>ขนม</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>การกระทำ</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>การเปลี่ยนแปลง</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    ยังไม่มีบันทึกการจัดการ Stock
                  </TableCell>
                </TableRow>
              )}
              {logs.map((l) => {
                const meta = ACTION_META[l.action]
                return (
                  <TableRow key={l.id} hover>
                    <TableCell>{formatDate(l.createdAt)}</TableCell>
                    <TableCell>{l.user?.email ?? '(ผู้ใช้ถูกลบแล้ว)'}</TableCell>
                    <TableCell>{l.snackName}</TableCell>
                    <TableCell>
                      <Chip label={meta.label} color={meta.color} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{renderChange(l)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}
