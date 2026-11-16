
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),

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