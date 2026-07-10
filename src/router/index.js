import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [

    {
      path: '/inventory',
      name: 'inventory',
      component: () => import('../views/inventory/BranchInventoryView.vue')
    }
  ]
})

export default router