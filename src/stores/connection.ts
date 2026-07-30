import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { computed, ref } from 'vue'
import * as clusterApi from '@/api/es/cluster'

export const useConnectionStore = defineStore('connection', () => {
  const hostIp = useLocalStorage('esvue.hostIp', 'localhost')
  const port = useLocalStorage('esvue.port', '9200')
  const esIndex = useLocalStorage('esvue.esIndex', 'products_v3_misc')
  const esAlias = useLocalStorage('esvue.esAlias', 'products_live_misc')
  const esRackGroup = useLocalStorage('esvue.esRackGroup', 'g12')
  const pollIntervalMs = useLocalStorage('esvue.pollIntervalMs', 60_000)
  const pollPaused = useLocalStorage('esvue.pollPaused', false)

  const connected = ref(false)
  const connecting = ref(false)
  const connectError = ref<string | null>(null)
  const clusterName = ref('')
  const version = ref('')
  const lastRefreshAt = ref<number | null>(null)

  const displayEndpoint = computed(() => `${hostIp.value || 'localhost'}:${port.value || '9200'}`)

  async function connect(ip?: string, portStr?: string): Promise<boolean> {
    if (ip !== undefined) hostIp.value = ip.trim() || 'localhost'
    if (portStr !== undefined) port.value = portStr.trim() || '9200'
    connecting.value = true
    connectError.value = null
    try {
      const info = await clusterApi.ping()
      clusterName.value = info.cluster_name
      version.value = info.version?.number ?? ''
      connected.value = true
      return true
    } catch (e) {
      connected.value = false
      clusterName.value = ''
      version.value = ''
      connectError.value = e instanceof Error ? e.message : String(e)
      return false
    } finally {
      connecting.value = false
    }
  }

  function disconnect() {
    connected.value = false
    connectError.value = null
  }

  function setIndex(index: string) {
    esIndex.value = index
  }

  function setAlias(alias: string) {
    esAlias.value = alias
  }

  function setRackGroup(group: string) {
    esRackGroup.value = group
  }

  function markRefreshed() {
    lastRefreshAt.value = Date.now()
  }

  return {
    hostIp,
    port,
    esIndex,
    esAlias,
    esRackGroup,
    pollIntervalMs,
    pollPaused,
    connected,
    connecting,
    connectError,
    clusterName,
    version,
    lastRefreshAt,
    displayEndpoint,
    connect,
    disconnect,
    setIndex,
    setAlias,
    setRackGroup,
    markRefreshed,
  }
})
