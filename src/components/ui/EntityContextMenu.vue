<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useEntityActions } from '@/entities/useEntityActions'

const ui = useUiStore()
const { menuActions, runAction } = useEntityActions()

/** After menu opens, allow dismiss only on subsequent pointerdowns. */
let dismissArmed = false

function armDismiss() {
  dismissArmed = false
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      dismissArmed = true
    })
  })
}

function onDocPointerDown(e: PointerEvent) {
  if (!ui.contextMenu?.open || !dismissArmed) return
  const target = e.target as HTMLElement | null
  if (target?.closest('[data-entity-context-menu]')) return
  ui.closeContextMenu()
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown)
})
onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocPointerDown)
})

watch(
  () => ui.contextMenu?.open,
  (open) => {
    if (open) armDismiss()
    else dismissArmed = false
  },
)
</script>

<template>
  <div
    v-if="ui.contextMenu?.open"
    data-entity-context-menu
    class="fixed z-50 min-w-56 rounded border border-border bg-surface py-1 shadow-lg"
    :style="{ left: `${ui.contextMenu.x}px`, top: `${ui.contextMenu.y}px` }"
    @click.stop
    @pointerdown.stop
  >
    <button
      v-for="action in menuActions(ui.contextMenu.kind)"
      :key="action.id"
      type="button"
      class="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-surface-2"
      @click="runAction(ui.contextMenu!.kind, action, ui.contextMenu!.payload)"
    >
      <span>{{ action.label }}</span>
      <span class="text-[10px] uppercase text-muted">{{ action.type }}</span>
    </button>
  </div>
</template>
