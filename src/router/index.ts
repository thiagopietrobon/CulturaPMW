
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),

  routes: [
    {
      path: '/',
      name: 'inicio',
      component: () => import('../views/public/HomeView.vue'),
    },
  ],
})

export default router
