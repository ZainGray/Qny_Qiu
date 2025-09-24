import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/chat/:characterId',
    name: 'Chat',
    component: () => import('../views/Chat.vue'),
    props: true
  }
]