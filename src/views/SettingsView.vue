<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useConnectionStore } from '@/stores/connection'

const connection = useConnectionStore()
const router = useRouter()

const ip = ref(connection.hostIp)
const port = ref(connection.port)
const message = ref('')

async function reconnect() {
  const ok = await connection.connect(ip.value, port.value)
  message.value = ok ? 'Connected' : connection.connectError ?? 'Failed'
  if (!ok) await router.push('/login')
}

function disconnect() {
  connection.disconnect()
  void router.push('/login')
}
</script>

<template>
  <div class="mx-auto max-w-xl space-y-6">
    <h1 class="text-xl font-semibold">Settings</h1>

    <div class="rounded border border-yellow/40 bg-yellow/10 px-3 py-2 text-sm text-yellow">
      Production — read only. Writes, deletes, and search playground are disabled.
    </div>

    <section class="space-y-3 rounded border border-border bg-surface p-4">
      <h2 class="text-sm font-medium">Connection</h2>
      <p class="text-xs text-muted">
        Tunnel-first: proxy always hits localhost:9200. IP/port are for display and SSH help.
      </p>
      <label class="block text-xs text-muted">
        Host IP
        <input v-model="ip" class="mt-1 w-full rounded border border-border bg-bg px-2 py-1.5 font-mono text-sm" />
      </label>
      <label class="block text-xs text-muted">
        Port
        <input v-model="port" class="mt-1 w-full rounded border border-border bg-bg px-2 py-1.5 font-mono text-sm" />
      </label>
      <div class="flex gap-2">
        <button type="button" class="rounded bg-blue px-3 py-1.5 text-sm text-bg" @click="reconnect">
          Reconnect
        </button>
        <button type="button" class="rounded border border-border px-3 py-1.5 text-sm" @click="disconnect">
          Disconnect
        </button>
      </div>
      <p v-if="message" class="text-xs text-muted">{{ message }}</p>
    </section>

    <section class="space-y-3 rounded border border-border bg-surface p-4">
      <h2 class="text-sm font-medium">Defaults</h2>
      <label class="block text-xs text-muted">
        Default index
        <input v-model="connection.esIndex" class="mt-1 w-full rounded border border-border bg-bg px-2 py-1.5 font-mono text-sm" />
      </label>
      <label class="block text-xs text-muted">
        Default alias
        <input v-model="connection.esAlias" class="mt-1 w-full rounded border border-border bg-bg px-2 py-1.5 font-mono text-sm" />
      </label>
      <label class="block text-xs text-muted">
        Rack group
        <input v-model="connection.esRackGroup" class="mt-1 w-full rounded border border-border bg-bg px-2 py-1.5 font-mono text-sm" />
      </label>
      <label class="block text-xs text-muted">
        Poll interval (ms)
        <input
          v-model.number="connection.pollIntervalMs"
          type="number"
          min="5000"
          step="1000"
          class="mt-1 w-full rounded border border-border bg-bg px-2 py-1.5 font-mono text-sm"
        />
      </label>
    </section>
  </div>
</template>
