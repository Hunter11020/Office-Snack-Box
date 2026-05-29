'use client'

import { Box, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material'
import CookieIcon from '@mui/icons-material/Cookie'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRole } from '@/context/RoleContext'

export default function Navbar() {
  const { role, setRole } = useRole()
  const pathname = usePathname()

  const tabs = [
    { label: 'ขนม', href: '/' },
    ...(role === 'admin' ? [{ label: 'จัดการ', href: '/admin' }] : []),
    { label: 'ประวัติ', href: '/history' },
  ]

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        width: '100%',
        height: 60,
        bgcolor: '#C62828',
        // separation from white content: soft shadow + crisp accent line
        boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
        borderBottom: '3px solid #8E1C1C',
      }}
    >
      <Box
        sx={{
          height: '100%',
          maxWidth: 1200,
          mx: 'auto',
          px: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 3,
        }}
      >
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <CookieIcon sx={{ color: '#FFCA28', fontSize: 26 }} />
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', letterSpacing: 0.2 }}
          >
            Office Snack Box
          </Typography>
        </Box>

        {/* Nav links */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexGrow: 1 }}>
          {tabs.map((tab) => {
            const active = pathname === tab.href
            return (
              <Box
                key={tab.href}
                component={Link}
                href={tab.href}
                sx={{
                  px: 1.75,
                  py: 0.75,
                  borderRadius: 1.5,
                  fontWeight: active ? 800 : 600,
                  fontSize: '0.95rem',
                  color: '#fff',
                  opacity: active ? 1 : 0.85,
                  bgcolor: active ? 'rgba(255,255,255,0.18)' : 'transparent',
                  transition: 'all 0.15s',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.15)', opacity: 1 },
                }}
              >
                {tab.label}
              </Box>
            )
          })}
        </Box>

        {/* Role switch */}
        <ToggleButtonGroup
          value={role}
          exclusive
          onChange={(_, val) => val && setRole(val)}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              border: '1px solid rgba(255,255,255,0.6)',
              px: 2.5,
              py: 0.5,
              color: '#fff',
              fontWeight: 700,
              letterSpacing: 1,
              lineHeight: 1.4,
            },
            '& .MuiToggleButton-root:hover': {
              bgcolor: 'rgba(255,255,255,0.12)',
            },
            '& .Mui-selected': {
              bgcolor: 'rgba(255,255,255,0.28) !important',
              color: '#fff !important',
            },
          }}
        >
          <ToggleButton value="user">USER</ToggleButton>
          <ToggleButton value="admin">ADMIN</ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Box>
  )
}
