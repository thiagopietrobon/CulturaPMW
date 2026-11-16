
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),

  routes: [
    {
      path: '/',
      component: () => import('../components/layout/PublicLayout.vue'),

      children: [
        {
          path: '',
          name: 'inicio',
          component: () => import('../views/public/HomeView.vue'),
        },
      ],
    },
  ],
})

export default router