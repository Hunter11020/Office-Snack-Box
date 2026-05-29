'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Typography, Box, Button, Alert, CircularProgress,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Paper, IconButton, Tooltip
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { useRole } from '@/context/RoleContext'
import SnackFormDialog from '@/components/SnackFormDialog'
import type { Snack } from '@/components/SnackCard'

export default function AdminPage() {
  const { role } = useRole()
  const [snacks, setSnacks] = useState<Snack[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Snack | null>(null)

  const fetchSnacks = useCallback(async () => {
    try {
      const res = await fetch('/api/snacks')
      if (!res.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ')
      setSnacks(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch-on-mount: fetchSnacks only calls setState after an await, so no synchronous cascade.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchSnacks() }, [fetchSnacks])

  const handleDelete = async (id: number) => {
    if (!confirm('ยืนยันการลบขนมนี้?')) return
    try {
      const res = await fetch(`/api/snacks/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('ลบไม่สำเร็จ')
      fetchSnacks()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    }
  }

  const handleAdjustStock = async (id: number, delta: number) => {
    try {
      const res = await fetch(`/api/snacks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta }),
      })
      if (!res.ok) throw new Error('อัปเดตไม่สำเร็จ')
      fetchSnacks()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    }
  }

  if (role !== 'admin') {
    return <Alert severity="error">หน้านี้สำหรับ Admin เท่านั้น</Alert>
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>จัดการสินค้า</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { setEditTarget(null); setFormOpen(true) }}
        >
          เพิ่มขนม
        </Button>
      </Box>

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 700 }}>ชื่อขนม</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>คำอธิบาย</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Stock</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">ปรับ Stock</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">จัดการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {snacks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    ยังไม่มีขนม กด &quot;เพิ่มขนม&quot; เพื่อเริ่มต้น
                  </TableCell>
                </TableRow>
              )}
              {snacks.map((s) => {
                const isLow = s.quantity <= s.lowStockThreshold
                return (
                  <TableRow key={s.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {s.name}
                        {isLow && (
                          <Tooltip title={s.quantity === 0 ? 'หมดแล้ว' : 'เหลือน้อย'}>
                            <WarningAmberIcon color="warning" fontSize="small" />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', maxWidth: 240 }}>{s.description ?? '—'}</TableCell>
                    <TableCell align="center">
                      <Typography
                        component="span"
                        sx={{ fontWeight: 700, color: isLow ? 'warning.main' : 'text.primary' }}
                      >
                        {s.quantity}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <Tooltip title="เพิ่ม 1">
                          <IconButton size="small" color="primary" onClick={() => handleAdjustStock(s.id, 1)}>
                            <AddCircleIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ลด 1">
                          <IconButton size="small" color="warning" onClick={() => handleAdjustStock(s.id, -1)} disabled={s.quantity === 0}>
                            <RemoveCircleIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="แก้ไข">
                        <IconButton size="small" onClick={() => { setEditTarget(s); setFormOpen(true) }}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="ลบ">
                        <IconButton size="small" color="error" onClick={() => handleDelete(s.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <SnackFormDialog
        open={formOpen}
        snack={editTarget}
        onClose={() => setFormOpen(false)}
        onSuccess={fetchSnacks}
      />
    </Box>
  )
}
