<script setup lang="ts">
import type { EntityKind } from '@/entities/types'
import { useUiStore } from '@/stores/ui'
import { useEntityActions } from '@/entities/useEntityActions'
import { createEntityPointerHandlers } from '@/composables/useEntityPointer'

const props = defineProps<{
  kind: EntityKind
  payload: Record<string, string>
  label: string
  labelClass?: string
}>()

const ui = useUiStore()
const { openDetail } = useEntityActions()

const { onPointerUp, onClick, onContextMenu } = createEntityPointerHandlers({
  onActivate: () => {
    void openDetail(props.kind, props.payload)
  },
  onMenu: (x, y) => {
    ui.openContextMenu(x, y, props.kind, props.payload)
  },
})
</script>

<template>
  <button
    type="button"
    class="rounded px-1 font-mono text-xs text-blue hover:bg-blue/10"
    :class="labelClass"
    :title="`Left-click: dashboard · Right-click: actions`"
    @pointerup.stop="onPointerUp"
    @click.stop="onClick"
    @contextmenu="onContextMenu"
  >
    {{ label }}
  </button>
</template>
