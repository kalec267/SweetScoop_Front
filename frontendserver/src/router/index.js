import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import Dashboard from '../views/Dashboard.vue';
import BranchDashboard from '../views/BranchDashboard.vue'; 
import OrderRequest from '../views/OrderRequest.vue';
import Inventory from '../views/Inventory.vue';
import Delivery from '../views/Delivery.vue';
import Branch from '../views/Branch.vue';
import MenuManagement from '../views/MenuManagement.vue';
import Analytics from '../views/Analytics.vue';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: Login, meta: { requiresAuth: false } },
  
  // 🏢 본사(HQ) 전용 메뉴 그룹화 및 엄격한 가드
  { path: '/dashboard', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true, role: 'HQ' } },
  { path: '/menu-management', name: 'MenuManagement', component: MenuManagement, meta: { requiresAuth: true, role: 'HQ' } },
  { path: '/delivery', name: 'Delivery', component: Delivery, meta: { requiresAuth: true, role: 'HQ' } },
  { path: '/branch', name: 'Branch', component: Branch, meta: { requiresAuth: true, role: 'HQ' } },
  
  // 🏪 분점(BRANCH) 전용 메뉴 그룹화 및 엄격한 가드
  { path: '/branch/dashboard', name: 'BranchDashboard', component: BranchDashboard, meta: { requiresAuth: true, role: 'BRANCH' } },
  { path: '/order-request', name: 'OrderRequest', component: OrderRequest, meta: { requiresAuth: true, role: 'BRANCH' } },
  { path: '/inventory', name: 'Inventory', component: Inventory, meta: { requiresAuth: true, role: 'BRANCH' } },

  // 📊 공통 또는 기타 메뉴 (필요한 Role 설정에 맞게 맵핑)
  { path: '/analytics', name: 'Analytics', component: Analytics, meta: { requiresAuth: true } },

  // 예외 주소 처리
  { path: '/:pathMatch(.*)*', redirect: '/login' }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 🚀 네비게이션 가드: 로그인 및 권한 검증
router.beforeEach((to, from, next) => {
  const userRole = localStorage.getItem('userRole'); // 'HQ' 또는 'BRANCH'
  const isAuthenticated = !!userRole;

  // 1. 인증이 필요한 페이지인데 로그인 안 한 경우 -> 무조건 로그인으로
  if (to.meta.requiresAuth && !isAuthenticated) {
    alert('로그인이 필요한 서비스입니다.');
    return next('/login');
  }

  // 2. 권한 제한이 있는 페이지인데 로그인한 유저의 Role과 맞지 않는 경우
  if (to.meta.role && to.meta.role !== userRole) {
    alert('해당 메뉴에 접근 권한이 없습니다.');
    return next(userRole === 'HQ' ? '/dashboard' : '/branch/dashboard');
  }

  // 3. 이미 로그인했는데 로그인 페이지로 가려고 하는 경우 -> 대시보드로 자동 리다이렉트
  if (to.path === '/login' && isAuthenticated) {
    return next(userRole === 'HQ' ? '/dashboard' : '/branch/dashboard');
  }

  next();
});

export default router;