'use client'

import { useEffect, useState } from 'react'
import {
  Typography, Box, CircularProgress, Alert, Button, IconButton, Tooltip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
} from '@mui/material'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import DeleteIcon from '@mui/icons-material/Delete'
import { useRole } from '@/context/RoleContext'

interface LogEntry {
  id: number
  snackId: number | null
  withdrawnBy: string
  quantity: number
  createdAt: string
  snack: { name: string } | null
}

export default function HistoryPage() {
  const { role } = useRole()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await fetch('/api/withdrawals')
        if (!res.ok) throw new Error('โหลดประวัติไม่สำเร็จ')
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

  const handleDeleteOne = async (id: number) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/withdrawals/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('ลบรายการไม่สำเร็จ')
      setLogs(prev => prev.filter(l => l.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setDeletingId(null)
    }
  }

  const handleClear = async () => {
    setClearing(true)
    try {
      const res = await fetch('/api/withdrawals', { method: 'DELETE' })
      if (!res.ok) throw new Error('ลบประวัติไม่สำเร็จ')
      setLogs([])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setClearing(false)
      setConfirmOpen(false)
    }
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('th-TH', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  const isAdmin = role === 'admin'

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          ประวัติการเบิก
        </Typography>
        {isAdmin && logs.length > 0 && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteSweepIcon />}
            onClick={() => setConfirmOpen(true)}
          >
            ล้างประวัติ
          </Button>
        )}
      </Box>

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>}
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

      {!loading && !error && (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 700 }}>วันที่</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>ผู้เบิก</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>ขนม</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">จำนวน</TableCell>
                {isAdmin && <TableCell sx={{ width: 48 }} />}
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 5 : 4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    ยังไม่มีประวัติการเบิก
                  </TableCell>
                </TableRow>
              )}
              {logs.map((l) => (
                <TableRow key={l.id} hover>
                  <TableCell>{formatDate(l.createdAt)}</TableCell>
                  <TableCell>{l.withdrawnBy}</TableCell>
                  <TableCell>{l.snack?.name ?? '(ขนมถูกลบแล้ว)'}</TableCell>
                  <TableCell align="center">{l.quantity}</TableCell>
                  {isAdmin && (
                    <TableCell align="center" sx={{ py: 0.5 }}>
                      <Tooltip title="ลบรายการนี้">
                        <IconButton
                          size="small"
                          color="error"
                          disabled={deletingId === l.id}
                          onClick={() => handleDeleteOne(l.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>ล้างประวัติการเบิก</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ต้องการลบประวัติการเบิกทั้งหมด {logs.length} รายการใช่หรือไม่?
            การกระทำนี้ไม่สามารถย้อนกลับได้
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>ยกเลิก</Button>
          <Button variant="contained" color="error" onClick={handleClear} disabled={clearing}>
            {clearing ? 'กำลังลบ...' : 'ล้างประวัติ'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
