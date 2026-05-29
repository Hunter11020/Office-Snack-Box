'use client'

import { ReactNode } from 'react'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter'
import { RoleProvider } from '@/context/RoleContext'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#D32F2F' },
    warning: { main: '#F57C00' },
    success: { main: '#388E3C' },
    error: { main: '#D32F2F' },
    background: { default: '#f4f4f5', paper: '#ffffff' },
    divider: 'rgba(0,0,0,0.10)',
    text: {
      primary: '#1a1a1a',
      secondary: 'rgba(0,0,0,0.5)',
      disabled: 'rgba(0,0,0,0.3)',
    },
  },
  typography: {
    fontFamily: 'inherit',
  },
})

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <RoleProvider>{children}</RoleProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  )
}
