import { createRouter, createWebHistory } from 'vue-router';
import MainMenuView from '@/views/MainMenuView.vue';

const routes = [
  { path: '/', name: 'MainMenu', component: MainMenuView },
  { path: '/payment', name: 'Payment', component: () => import('@/views/PaymentView.vue') },
  { path: '/payment/success', name: 'PaymentSuccess', component: () => import('@/views/PaymentSuccess.vue') },
  { path: '/complete', name: 'OrderComplete', component: () => import('@/views/OrderComplete.vue') }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;