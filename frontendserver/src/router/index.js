import { createRouter, createWebHistory } from 'vue-router';
import KioskSizeList from '../views/KioskSizeList.vue';
import KioskOptionSelect from '../views/KioskOptionSelect.vue';
import KioskFlavorSelect from '../views/KioskFlavorSelect.vue';

const routes = [
  { path: '/', redirect: '/kiosk/sizes' },
  { path: '/kiosk/sizes', component: KioskSizeList },
  { path: '/kiosk/options', component: KioskOptionSelect },
  { path: '/kiosk/flavors', component: KioskFlavorSelect }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;