import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { EntityKind } from '@/entities/types'
import type { InspectKind } from '@/utils/inspect'

export interface DrawerState {
  open: boolean
  title: string
  kind: EntityKind | 'json'
  inspectKind: InspectKind
  indexName: string | null
  loading: boolean
  error: string | null
  data: unknown
}

export const useUiStore = defineStore('ui', () => {
  const drawer = ref<DrawerState>({
    open: false,
    title: '',
    kind: 'json',
    inspectKind: 'json',
    indexName: null,
    loading: false,
    error: null,
    data: null,
  })

  const contextMenu = ref<{
    open: boolean
    x: number
    y: number
    kind: EntityKind
    payload: Record<string, string>
  } | null>(null)

  function openDrawer(
    title: string,
    opts?: { inspectKind?: InspectKind; indexName?: string },
  ) {
    drawer.value = {
      open: true,
      title,
      kind: 'json',
      inspectKind: opts?.inspectKind ?? 'json',
      indexName: opts?.indexName ?? null,
      loading: true,
      error: null,
      data: null,
    }
  }

  function setDrawerData(data: unknown) {
    drawer.value.loading = false
    drawer.value.data = data
  }

  function setDrawerError(error: string) {
    drawer.value.loading = false
    drawer.value.error = error
  }

  function closeDrawer() {
    drawer.value.open = false
  }

  function openContextMenu(x: number, y: number, kind: EntityKind, payload: Record<string, string>) {
    contextMenu.value = { open: true, x, y, kind, payload }
  }

  function closeContextMenu() {
    contextMenu.value = null
  }

  return {
    drawer,
    contextMenu,
    openDrawer,
    setDrawerData,
    setDrawerError,
    closeDrawer,
    openContextMenu,
    closeContextMenu,
  }
})
