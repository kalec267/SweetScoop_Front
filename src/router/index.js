import { createRouter, createWebHistory } from "vue-router";

import Home from "../views/Home.vue";
import IceCreamSize from "../views/IceCreamSize.vue";
import CupSelect from "../views/CupSelect.vue";
import Menu from "../views/Menu.vue";
// Payment는 아래 라우트 설정에서 직접 import 하므로 위에서 제거해도 됩니다.

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "Home",
      component: Home,
    },
    {
      path: "/size",
      component: IceCreamSize,
    },
    {
      path: "/cup",
      name: "CupSelect",
      component: CupSelect,
    },
    {
      path: "/menu",
      name: "Menu",
      component: Menu,
    },
    {
      path: "/payment",
      name: "Payment",
      component: () => import("@/views/Payment.vue"),
    },
    {
      path: "/payment/success",
      name: "PaymentSuccess",
      component: () => import("@/views/PaymentSuccess.vue"),
    },
    {
      path: "/complete",
      name: "OrderComplete",
      component: () => import("@/views/OrderComplete.vue"),
    },
  ],
});

// 모든 설정이 끝난 후 아래에서 내보내야 합니다.
export default router;
