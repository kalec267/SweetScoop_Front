import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../views/Dashboard.vue';
import OrderRequest from '../views/OrderRequest.vue';
import Inventory from '../views/Inventory.vue';
import Delivery from '../views/Delivery.vue';
import Branch from '../views/Branch.vue';
import MenuManagement from '../views/MenuManagement.vue';
import Analytics from '../views/Analytics.vue';
import Promotion from '../views/Promotion.vue';

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard },
  { path: '/order-request', name: 'OrderRequest', component: OrderRequest },
  { path: '/inventory', name: 'Inventory', component: Inventory },
  { path: '/delivery', name: 'Delivery', component: Delivery },
  { path: '/branch', name: 'Branch', component: Branch },
  { path: '/analytics', name: 'Analytics', component: Analytics },
  { path: '/event-management', name: 'Promotion', component: Promotion },
  { path: '/menu-management',name: 'MenuManagement',component: MenuManagement }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;