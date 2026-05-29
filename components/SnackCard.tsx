'use client'

import { Card, CardContent, CardActions, Typography, Button, Box } from '@mui/material'

export interface Snack {
  id: number
  name: string
  description: string | null
  quantity: number
  lowStockThreshold: number
}

interface Props {
  snack: Snack
  canWithdraw: boolean
  onWithdraw: (snack: Snack) => void
}

export default function SnackCard({ snack, canWithdraw, onWithdraw }: Props) {
  const isEmpty = snack.quantity === 0
  const isLow = !isEmpty && snack.quantity <= snack.lowStockThreshold

  const badge = isEmpty
    ? { label: 'หมดแล้ว', fg: 'rgba(0,0,0,0.4)', bg: 'rgba(0,0,0,0.06)' }
    : isLow
    ? { label: 'เหลือน้อย', fg: '#E65100', bg: 'rgba(245,124,0,0.14)' }
    : { label: 'พร้อมเบิก', fg: '#2E7D32', bg: 'rgba(56,142,60,0.14)' }

  const qtyColor = isEmpty ? 'rgba(0,0,0,0.25)' : isLow ? '#F57C00' : '#D32F2F'
  const borderColor = isEmpty
    ? 'rgba(0,0,0,0.10)'
    : isLow
    ? 'rgba(245,124,0,0.7)'
    : 'rgba(0,0,0,0.10)'

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#fff',
        border: '1px solid',
        borderColor,
        borderRadius: 3,
        boxShadow: 'none',
        opacity: isEmpty ? 0.65 : 1,
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            px: 1.25,
            py: 0.4,
            borderRadius: 1.5,
            bgcolor: badge.bg,
            mb: 1.5,
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', color: badge.fg }}>
            {badge.label}
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ fontWeight: 700, color: isEmpty ? 'text.disabled' : 'text.primary' }}>
          {snack.name}
        </Typography>

        {snack.description && (
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
            {snack.description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mt: 1.5 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '2.75rem', lineHeight: 1, color: qtyColor }}>
            {snack.quantity}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>ชิ้น</Typography>
        </Box>
      </CardContent>

      {canWithdraw && (
        <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
          <Button
            variant="outlined"
            fullWidth
            disabled={isEmpty}
            onClick={() => onWithdraw(snack)}
            sx={{
              borderColor: 'rgba(0,0,0,0.2)',
              color: 'rgba(0,0,0,0.75)',
              fontWeight: 700,
              borderRadius: 2,
              py: 1,
              '&:hover': { borderColor: 'rgba(0,0,0,0.4)', bgcolor: 'rgba(0,0,0,0.03)' },
            }}
          >
            {isEmpty ? 'หมดแล้ว' : 'เบิก'}
          </Button>
        </CardActions>
      )}
    </Card>
  )
}
