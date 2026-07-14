import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [

    {
      path: '/inventory',
      name: 'inventory',
      component: () => import('../views/inventory/BranchInventoryView.vue')
    },

    {
      path: '/inventory/hq-orders',
      name: 'HqOrderManagement',
      component: () => import('../views/inventory/HqOrderManagement.vue')
    },

    {
      path: '/sales',
      name: 'sales',
      component: () => import('../views/sales/SalesDashboard.vue')
    }
  ]
})

export default router