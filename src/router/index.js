import { createRouter, createWebHistory } from "vue-router";

import Home from "../views/Home.vue";
import IceCreamSize from "../views/IceCreamSize.vue";
import CupSelect from "../views/CupSelect.vue";
import Menu from "../views/Menu.vue";
import BranchManagement from "../views/admin/BranchManagement.vue";

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
    {
        path: "/admin/branches",
        name: "BranchManagement",
        component: BranchManagement
    }
    
  ],
});

export default router;
