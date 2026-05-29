'use client'

import { useState, useEffect } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Alert
} from '@mui/material'
import type { Snack } from './SnackCard'

interface Props {
  open: boolean
  snack: Snack | null  // null = add mode
  onClose: () => void
  onSuccess: () => void
}

export default function SnackFormDialog({ open, snack, onClose, onSuccess }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('0')
  const [threshold, setThreshold] = useState('5')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (snack) {
      setName(snack.name)
      setDescription(snack.description ?? '')
      setQuantity(String(snack.quantity))
      setThreshold(String(snack.lowStockThreshold))
    } else {
      setName('')
      setDescription('')
      setQuantity('0')
      setThreshold('5')
    }
    setError('')
  }, [snack, open])

  const handleSubmit = async () => {
    if (!name.trim()) { setError('กรุณาระบุชื่อขนม'); return }
    setLoading(true)
    setError('')
    try {
      const body = {
        name: name.trim(),
        description: description.trim() || null,
        quantity: parseInt(quantity) || 0,
        lowStockThreshold: parseInt(threshold) || 5,
      }
      const res = snack
        ? await fetch(`/api/snacks/${snack.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch('/api/snacks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error(await res.text())
      onSuccess()
      onClose()
    } catch (e: any) {
      setError(e.message ?? 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{snack ? 'แก้ไขขนม' : 'เพิ่มขนมใหม่'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="ชื่อขนม" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        <TextField label="คำอธิบาย" value={description} onChange={(e) => setDescription(e.target.value)} multiline rows={2} />
        <TextField label="จำนวน Stock" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} slotProps={{ htmlInput: { min: 0 } }} />
        <TextField label="เกณฑ์ Low Stock" type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} slotProps={{ htmlInput: { min: 0 } }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>ยกเลิก</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? 'กำลังบันทึก...' : 'บันทึก'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
