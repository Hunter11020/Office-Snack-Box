'use client'

import { useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Alert
} from '@mui/material'
import type { Snack } from './SnackCard'

interface Props {
  snack: Snack | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function WithdrawDialog({ snack, open, onClose, onSuccess }: Props) {
  const [qty, setQty] = useState('1')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!snack) return
    const amount = parseInt(qty)
    if (!name.trim()) { setError('กรุณาระบุชื่อ'); return }
    if (isNaN(amount) || amount < 1) { setError('จำนวนต้องมากกว่า 0'); return }
    if (amount > snack.quantity) { setError('จำนวนเกิน stock ที่มี'); return }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snackId: snack.id, quantity: amount, withdrawnBy: name.trim() }),
      })
      if (!res.ok) throw new Error(await res.text())
      onSuccess()
      handleClose()
    } catch (e: any) {
      setError(e.message ?? 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setQty('1')
    setName('')
    setError('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>เบิกขนม: {snack?.name}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="ชื่อผู้เบิก"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
        <TextField
          label="จำนวน"
          type="number"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          slotProps={{ htmlInput: { min: 1, max: snack?.quantity } }}
          helperText={`มีเหลือ ${snack?.quantity ?? 0} ชิ้น`}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>ยกเลิก</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? 'กำลังบันทึก...' : 'ยืนยันเบิก'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
