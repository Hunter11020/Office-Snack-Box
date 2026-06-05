'use client'

import { Box, Typography, Button, Chip } from '@mui/material'
import CookieIcon from '@mui/icons-material/Cookie'
import LogoutIcon from '@mui/icons-material/Logout'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'

export default function Navbar() {
  const { user } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const isAdmin = user?.role === 'ADMIN'

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  const tabs = [
    { label: 'ขนม', href: '/' },
    ...(isAdmin
      ? [
          { label: 'จัดการ', href: '/admin' },
          { label: 'บันทึก Stock', href: '/stock-log' },
        ]
      : []),
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

        {/* Nav links — only when logged in */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexGrow: 1 }}>
          {user &&
            tabs.map((tab) => {
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

        {/* User + logout */}
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Chip
              label={isAdmin ? 'ADMIN' : 'USER'}
              size="small"
              sx={{
                bgcolor: 'rgba(255,255,255,0.22)',
                color: '#fff',
                fontWeight: 700,
                letterSpacing: 0.5,
              }}
            />
            <Typography
              sx={{ color: '#fff', fontSize: '0.9rem', display: { xs: 'none', sm: 'block' } }}
            >
              {user.name ?? user.email}
            </Typography>
            <Button
              size="small"
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
              sx={{
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.6)',
                fontWeight: 700,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
              }}
            >
              ออก
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  )
}
