import { watch } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import { useConnectionStore } from '@/stores/connection'

export function usePolling(fn: () => void | Promise<void>) {
  const connection = useConnectionStore()

  const { pause, resume, isActive } = useIntervalFn(
    () => {
      if (!connection.connected || connection.pollPaused) return
      void fn()
    },
    connection.pollIntervalMs,
    { immediate: true },
  )

  watch(
    () => connection.pollPaused,
    (paused) => {
      if (paused) pause()
      else resume()
    },
    { immediate: true },
  )

  return { pause, resume, isActive }
}
