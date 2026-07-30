<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConnectionStore } from '@/stores/connection'

const connection = useConnectionStore()
const router = useRouter()
const route = useRoute()

const ip = ref(connection.hostIp === 'localhost' ? '' : connection.hostIp)
const port = ref(connection.port)

async function onConnect() {
  const ok = await connection.connect(ip.value, port.value)
  if (ok) {
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/overview'
    await router.push(redirect)
  }
}
</script>

<template>
  <div class="min-h-full flex items-center justify-center p-6 bg-bg">
    <div class="w-full max-w-lg rounded-lg border border-border bg-surface p-8 shadow-none">
      <div class="mb-6">
        <h1 class="text-2xl font-semibold tracking-tight">esvue</h1>
        <p class="mt-1 text-sm text-muted">Connect to a port-forwarded Elasticsearch cluster</p>
      </div>

      <form class="space-y-4" @submit.prevent="onConnect">
        <label class="block">
          <span class="text-xs uppercase tracking-wide text-muted">Host IP</span>
          <input
            v-model="ip"
            type="text"
            placeholder="localhost"
            class="mt-1 w-full rounded border border-border bg-bg px-3 py-2 font-mono text-sm outline-none focus:border-blue"
          />
          <span class="mt-1 block text-xs text-muted">Leave blank for localhost</span>
        </label>
        <label class="block">
          <span class="text-xs uppercase tracking-wide text-muted">Port</span>
          <input
            v-model="port"
            type="text"
            placeholder="9200"
            class="mt-1 w-full rounded border border-border bg-bg px-3 py-2 font-mono text-sm outline-none focus:border-blue"
          />
        </label>

        <button
          type="submit"
          class="w-full rounded bg-blue px-4 py-2.5 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-50"
          :disabled="connection.connecting"
        >
          {{ connection.connecting ? 'Connecting…' : 'Connect' }}
        </button>
      </form>

      <div
        v-if="connection.connectError"
        class="mt-6 rounded border border-red/40 bg-red/10 p-4 text-sm"
      >
        <p class="font-medium text-red">Connection failed</p>
        <p class="mt-1 text-muted font-mono text-xs">{{ connection.connectError }}</p>
        <p class="mt-3 text-muted">Check your tunnel, then:</p>
        <ol class="mt-2 list-decimal space-y-2 pl-5 text-sm text-text">
          <li>
            Open
            <a
              class="text-blue underline"
              href="http://console.bastion-prod.fkcloud.in/#"
              target="_blank"
              rel="noopener"
            >bastion console</a>,
            set DC and app id, get it approved
          </li>
          <li>
            Run:
            <code class="mt-1 block rounded bg-bg px-2 py-1.5 font-mono text-xs text-yellow break-all">
              fkst-cli installCert; ssh -L 9200:localhost:9200 {{ ip.trim() || connection.hostIp || 'localhost' }}
            </code>
          </li>
          <li>Retry Connect (proxy always targets localhost:9200)</li>
        </ol>
      </div>
    </div>
  </div>
</template>
