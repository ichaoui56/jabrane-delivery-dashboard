'use client'

import { useState, useEffect } from 'react'
import { SettingsClient } from './admin-settings-client'
import { fetchAdminSettings } from '@/lib/actions/admin/settings'
import type { AdminSettingsData } from '@/lib/actions/admin/settings'
import { SettingsSkeleton } from '@/components/skeletons/settings-skeleton'

type State = {
  success: boolean
  data: AdminSettingsData | null
  error: string | null
}

export function AdminSettingsContent() {
  const [state, setState] = useState<State>({
    success: false,
    data: null,
    error: null
  })
  const [isPending, setIsPending] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsPending(true)
        const result = await fetchAdminSettings()
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to load settings')
        }
        
        setState({
          success: true,
          data: result.data as AdminSettingsData,
          error: null
        })
      } catch (error) {
        console.error('Error loading settings:', error)
        setState({
          success: false,
          data: null,
          error: error instanceof Error ? error.message : 'An unknown error occurred'
        })
      } finally {
        setIsPending(false)
      }
    }

    loadData()
  }, [])

  if (isPending) {
    return <SettingsSkeleton />
  }

  if (state.error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {state.error}
      </div>
    )
  }

  if (!state.data) {
    return (
      <div className="text-center py-8">
        <p>No settings data available</p>
      </div>
    )
  }

  return <SettingsClient initialData={state.data} />
}
