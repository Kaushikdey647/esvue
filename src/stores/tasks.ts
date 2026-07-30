import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as tasksApi from '@/api/es/tasks'

export const useTasksStore = defineStore('tasks', () => {
  const data = ref<unknown>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)

  async function refresh(kind: 'all' | 'reindex' | 'bulk' | 'recovery' = 'all') {
    loading.value = true
    error.value = null
    try {
      if (kind === 'reindex') data.value = await tasksApi.reindexTasks()
      else if (kind === 'bulk') data.value = await tasksApi.bulkWriteTasks()
      else if (kind === 'recovery') data.value = await tasksApi.recoveryTasks()
      else data.value = await tasksApi.tasks()
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  return { data, error, loading, refresh }
})
