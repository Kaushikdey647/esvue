import { createRouter, createWebHistory } from 'vue-router'
import { useConnectionStore } from '@/stores/connection'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/components/layout/AppShell.vue'),
      children: [
        { path: '', redirect: '/overview' },
        { path: 'overview', name: 'overview', component: () => import('@/views/OverviewView.vue') },
        { path: 'nodes', name: 'nodes', component: () => import('@/views/NodesView.vue') },
        { path: 'shards', name: 'shards', component: () => import('@/views/ShardsView.vue') },
        { path: 'disk', name: 'disk', component: () => import('@/views/DiskView.vue') },
        { path: 'threads', name: 'threads', component: () => import('@/views/ThreadsView.vue') },
        { path: 'indices', name: 'indices', component: () => import('@/views/IndicesView.vue') },
        { path: 'explain', name: 'explain', component: () => import('@/views/ExplainView.vue') },
        { path: 'tasks', name: 'tasks', component: () => import('@/views/TasksView.vue') },
        { path: 'settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
        {
          path: 'entity/node/:name',
          name: 'entity-node',
          component: () => import('@/views/entity/NodeDetailView.vue'),
        },
        {
          path: 'entity/index/:index',
          name: 'entity-index',
          component: () => import('@/views/entity/IndexDetailView.vue'),
        },
        {
          path: 'entity/alias/:alias',
          name: 'entity-alias',
          component: () => import('@/views/entity/AliasDetailView.vue'),
        },
        {
          path: 'entity/shard/:index/:shard',
          name: 'entity-shard',
          component: () => import('@/views/entity/ShardDetailView.vue'),
        },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const connection = useConnectionStore()
  if (!to.meta.public && !connection.connected) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && connection.connected) {
    return { name: 'overview' }
  }
  return true
})

export default router
