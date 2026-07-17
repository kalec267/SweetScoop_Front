import { createRouter, createWebHistory } from "vue-router";

// 키오스크 화면
import Home from "../views/Home.vue";
import IceCreamSize from "../views/IceCreamSize.vue";
import CupSelect from "../views/CupSelect.vue";
import Menu from "../views/Menu.vue";

// 관리자 공통 화면
import Login from "../views/Login.vue";
import Dashboard from "../views/Dashboard.vue";
import BranchDashboard from "../views/BranchDashboard.vue";
import OrderRequest from "../views/OrderRequest.vue";
import Inventory from "../views/Inventory.vue";
import Delivery from "../views/Delivery.vue";
import Branch from "../views/Branch.vue";
import MenuManagement from "../views/MenuManagement.vue";
import Analytics from "../views/Analytics.vue";
import BranchManagement from "../views/admin/BranchManagement.vue";

const routes = [
  // ==========================================
  // 키오스크 사용자 화면
  // ==========================================
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/size",
    name: "IceCreamSize",
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

  // ==========================================
  // 관리자 로그인
  // ==========================================
  {
    path: "/login",
    name: "Login",
    component: Login,
    meta: {
      requiresAuth: false,
    },
  },

  // ==========================================
  // 본사 관리자 전용
  // ==========================================
  {
    path: "/dashboard",
    name: "Dashboard",
    component: Dashboard,
    meta: {
      requiresAuth: true,
      role: "HQ",
    },
  },
  {
    path: "/menu-management",
    name: "MenuManagement",
    component: MenuManagement,
    meta: {
      requiresAuth: true,
      role: "HQ",
    },
  },
  {
    path: "/delivery",
    name: "Delivery",
    component: Delivery,
    meta: {
      requiresAuth: true,
      role: "HQ",
    },
  },
  {
    path: "/branch",
    name: "Branch",
    component: Branch,
    meta: {
      requiresAuth: true,
      role: "HQ",
    },
  },
  {
    path: "/admin/branches",
    name: "BranchManagement",
    component: BranchManagement,
    meta: {
      requiresAuth: true,
      role: "HQ",
    },
  },

  // ==========================================
  // 지점 관리자 전용
  // ==========================================
  {
    path: "/branch/dashboard",
    name: "BranchDashboard",
    component: BranchDashboard,
    meta: {
      requiresAuth: true,
      role: "BRANCH",
    },
  },
  {
    path: "/order-request",
    name: "OrderRequest",
    component: OrderRequest,
    meta: {
      requiresAuth: true,
      role: "BRANCH",
    },
  },
  {
    path: "/inventory",
    name: "Inventory",
    component: Inventory,
    meta: {
      requiresAuth: true,
      role: "BRANCH",
    },
  },

  // ==========================================
  // 공통 관리자 화면
  // ==========================================
  {
    path: "/analytics",
    name: "Analytics",
    component: Analytics,
    meta: {
      requiresAuth: true,
    },
  },

  // ==========================================
  // 존재하지 않는 주소
  // ==========================================
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// ==========================================
// 로그인 및 권한 검증
// ==========================================
router.beforeEach((to) => {
  const userRole = localStorage.getItem("userRole");
  const isAuthenticated = Boolean(userRole);

  // 로그인이 필요한 페이지인데 로그인하지 않은 경우
  if (to.meta.requiresAuth && !isAuthenticated) {
    alert("로그인이 필요한 서비스입니다.");

    return {
      path: "/login",
      query: {
        redirect: to.fullPath,
      },
    };
  }

  // 로그인한 사용자가 로그인 페이지에 접근하는 경우
  if (to.path === "/login" && isAuthenticated) {
    if (userRole === "HQ") {
      return "/dashboard";
    }

    if (userRole === "BRANCH") {
      return "/branch/dashboard";
    }
  }

  // 특정 권한이 필요한 페이지에서 권한이 일치하지 않는 경우
  if (to.meta.role && to.meta.role !== userRole) {
    alert("해당 페이지에 접근할 권한이 없습니다.");

    if (userRole === "HQ") {
      return "/dashboard";
    }

    if (userRole === "BRANCH") {
      return "/branch/dashboard";
    }

    return "/login";
  }

  return true;
});

export default router;