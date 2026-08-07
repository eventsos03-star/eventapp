'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, getAccessToken, setAccessToken } from '../lib/api'
import type { LoginInput, RegisterInput, SafeUser } from '../types'

interface AuthContextValue {
  user: SafeUser | null
  initializing: boolean
  login: (input: LoginInput) => Promise<SafeUser>
  register: (input: RegisterInput) => Promise<void>
  loginWithGoogle: (credential: string) => Promise<SafeUser>
  logout: () => Promise<void>
  logoutAll: () => Promise<void>
  refreshUser: () => Promise<SafeUser>
  updateProfile: (body: { firstName?: string; lastName?: string }) => Promise<SafeUser>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    let active = true

    async function bootstrap() {
      try {
        if (getAccessToken()) {
          const { data } = await api.me()
          if (active) setUser(data ?? null)
          return
        }
        try {
          const { data } = await api.refresh()
          if (!data) throw new Error('Refresh failed')
          setAccessToken(data.accessToken)
          if (active) setUser(data.user)
        } catch {
          setAccessToken(null)
        }
      } catch {
        setAccessToken(null)
      } finally {
        if (active) setInitializing(false)
      }
    }

    void bootstrap()
    return () => {
      active = false
    }
  }, [])

  const applyAuthResult = useCallback((accessToken: string, nextUser: SafeUser) => {
    setAccessToken(accessToken)
    setUser(nextUser)
  }, [])

  const login = useCallback(
    async (input: LoginInput) => {
      const { data } = await api.login(input)
      if (!data) throw new Error('Login failed')
      applyAuthResult(data.accessToken, data.user)
      return data.user
    },
    [applyAuthResult],
  )

  const register = useCallback(async (input: RegisterInput) => {
    await api.register(input)
  }, [])

  const loginWithGoogle = useCallback(
    async (credential: string) => {
      const { data } = await api.google(credential)
      if (!data) throw new Error('Google login failed')
      applyAuthResult(data.accessToken, data.user)
      return data.user
    },
    [applyAuthResult],
  )

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } finally {
      setAccessToken(null)
      setUser(null)
    }
  }, [])

  const logoutAll = useCallback(async () => {
    try {
      await api.logoutAll()
    } finally {
      setAccessToken(null)
      setUser(null)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    const { data } = await api.me()
    if (!data) throw new Error('Could not fetch profile')
    setUser(data)
    return data
  }, [])

  const updateProfile = useCallback(
    async (body: { firstName?: string; lastName?: string }) => {
      const { data } = await api.updateMe(body)
      if (!data) throw new Error('Could not update profile')
      setUser(data)
      return data
    },
    [],
  )

  const value = useMemo(
    () => ({
      user,
      initializing,
      login,
      register,
      loginWithGoogle,
      logout,
      logoutAll,
      refreshUser,
      updateProfile,
    }),
    [user, initializing, login, register, loginWithGoogle, logout, logoutAll, refreshUser, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
