import {createRouter, createWebHistory} from "vue-router";

// ========================================== 키오스크 사용자 화면
// ==========================================
import Home from "../views/Home.vue";
import IceCreamSize from "../views/IceCreamSize.vue";
import CupSelect from "../views/CupSelect.vue";
import Menu from "../views/Menu.vue";

// ========================================== 관리자 공통 화면
// ==========================================
import Login from "../views/Login.vue";
import Dashboard from "../views/Dashboard.vue";
import BranchDashboard from "../views/BranchDashboard.vue";
import BranchOrderHistory from "../views/inventory/BranchOrderHistory.vue";
import Delivery from "../views/Delivery.vue";
import Branch from "../views/Branch.vue";
import MenuManagement from "../views/MenuManagement.vue";
import BranchManagement from "../views/admin/BranchManagement.vue";
import CouponManagement from "../views/CouponManagement.vue";
import Promotion from "../views/Promotion.vue";
import KioskControlView from "../views/kioskControlView.vue"
import BranchInventoryView from "../views/inventory/BranchInventoryView.vue";
import CS from '../views/CS.vue';
import Notice from '../views/Notice.vue';

// ========================================== 본사 물품 관리 화면
// ==========================================
import ItemList from "../views/ItemList.vue";
import ItemCreate from "../views/ItemCreate.vue";
import ItemEdit from "../views/ItemEdit.vue";

const routes = [
    // ========================================== 키오스크 사용자 화면
    // ==========================================
    {
        path: "/",
        name: "Home",
        component: Home
    }, {
        path: "/size",
        name: "IceCreamSize",
        component: IceCreamSize
    }, {
        path: "/cup",
        name: "CupSelect",
        component: CupSelect
    }, {
        path: "/menu",
        name: "Menu",
        component: Menu
    }, {
        path: "/payment",
        name: "Payment",
        component: () => import ("@/views/Payment.vue")
    }, {
        path: "/payment/success",
        name: "PaymentSuccess",
        component: () => import ("@/views/PaymentSuccess.vue")
    }, {
        path: "/complete",
        name: "OrderComplete",
        component: () => import ("@/views/OrderComplete.vue")
    },

    // ========================================== 관리자 로그인
    // ==========================================
    {
        path: "/login",
        name: "Login",
        component: Login,
        meta: {
            requiresAuth: false
        }
    },

    // ========================================== 본사 관리자 전용 화면
    // ==========================================
    {
        path: "/dashboard",
        name: "Dashboard",
        component: Dashboard,
        meta: {
            requiresAuth: true,
            role: "HQ"
        }
    }, {
        path: "/members",
        name: "MemberManagement",
        component: () => import ("@/views/MemberManagement.vue"),
        meta: {
            requiresAuth: true,
            role: "HQ"
        }
    }, {
        path: "/admin/coupons",
        name: "AdminCoupons",
        component: CouponManagement,
        meta: {
            requiresAuth: true,
            role: "HQ"
        }
    }, {
        path: "/menu-management",
        name: "MenuManagement",
        component: MenuManagement,
        meta: {
            requiresAuth: true,
            role: "HQ"
        }
    }, {
        path: "/event-management",
        name: "Promotion",
        component: Promotion,
        meta: {
            requiresAuth: true,
            role: "HQ"
        }
    }, {
        path: "/delivery",
        name: "Delivery",
        component: Delivery,
        meta: {
            requiresAuth: true,
            role: "HQ"
        }
    }, {
        path: "/branch",
        name: "Branch",
        component: Branch,
        meta: {
            requiresAuth: true,
            role: "HQ"
        }
    }, {
        path: "/admin/branches",
        name: "BranchManagement",
        component: BranchManagement,
        meta: {
            requiresAuth: true,
            role: "HQ"
        }
    },

    // ========================================== 본사 관리자 물품 관리
    // ==========================================
    {
        path: "/items",
        name: "ItemList",
        component: ItemList,
        meta: {
            requiresAuth: true,
            role: "HQ"
        }
    }, {
        path: "/items/new",
        name: "ItemCreate",
        component: ItemCreate,
        meta: {
            requiresAuth: true,
            role: "HQ"
        }
    }, {
        path: "/items/:id/edit",
        name: "ItemEdit",
        component: ItemEdit,
        props: true,
        meta: {
            requiresAuth: true,
            role: "HQ"
        }
    },

    // ========================================== 지점 관리자 전용 화면
    // ==========================================
    {
        path: "/branch/dashboard",
        name: "BranchDashboard",
        component: BranchDashboard,
        meta: {
            requiresAuth: true,
            role: "BRANCH"
        }
    }, {
        path: "/branch/order-request",
        name: "BranchOrderHistory",
        component: BranchOrderHistory,
        meta: {
            requiresAuth: true,
            roles: ["HQ", "BRANCH"]
        }
    }, {
        path: "/branch/inventory",
        name: "BranchInventory",
        component: BranchInventoryView,
        meta: {
            requiresAuth: true
        }
    },

    //분점 키오스크 활성화 화면
    {
        path: '/branch/kiosk-control',
        name: 'KioskControlView',
        component: KioskControlView,
        meta: {
            requiresAuth: true
        }
    },
    // ========================================== 지점 재고 관리
    // ==========================================
    {
        path: "/inventory/branch-inventory",
        name: "BranchInven",
        component: () => import ("../views/inventory/BranchInventoryView.vue"),
        meta: {
            requiresAuth: true,
            role: "HQ"
        }
    },
    // ========================================== 본사 재고 주문 관리
    // ==========================================
    {
        path: "/inventory/hq-orders",
        name: "HqOrderManagement",
        component: () => import ("../views/inventory/HqOrderManagement.vue"),
        meta: {
            requiresAuth: true,
            role: "HQ"
        }
    },

    // ========================================== 매출 관리
    // ==========================================
    {
        path: "/sales",
        name: "SalesDashboard",
        component: () => import ("../views/sales/SalesDashboard.vue"),
        meta: {
            requiresAuth: true,
            roles: ["HQ", "BRANCH"]
        }
    }, {
        path: '/inquiries',
        name: 'CS',
        component: CS,
        meta: {
        requiresAuth: true,
        role: "HQ"
    }
    }, {
        path: "/branch/inquiries",
        name: "BranchCS",
        component: CS,
        meta: {
            requiresAuth: true,
            role: "BRANCH"
        }
    }, {
        path: '/notice',
        name: 'Notice',
        component: Notice,
        meta: {
        requiresAuth: true,
        role: "HQ"
    }
    },

    // ========================================== 존재하지 않는 주소 처리
    // ==========================================
    {
        path: "/:pathMatch(.*)*",
        // 💡 화면이 완전히 깨지거나 멈추지 않도록 빈 컴포넌트 처리를 해줍니다.
        component: {
            template: "<div></div>"
        },

        // 💡 이 주소에 진입하기 직전에 콘솔 로그를 트리거합니다.
        beforeEnter: (to, from, next) => {
            alert("존재하지 않는 주소입니다.");
            next("");
        }
    }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
});

/**
 * 사용자 권한에 맞는 기본 화면 반환
 */
const getDefaultRouteByRole = (role) => {
    if (role === "HQ") {
        return {name: "Dashboard"};
    }

    if (role === "BRANCH") {
        return {name: "BranchDashboard"};
    }

    return {name: "Login"};
};

/**
 * 라우트에 설정된 단일 권한 조회
 */
const getRequiredRole = (to) => {
    return to
        .matched
        .map((routeRecord) => routeRecord.meta.role)
        .find(Boolean);
};

/**
 * 라우트에 설정된 복수 권한 조회
 */
const getAllowedRoles = (to) => {
    const matchedRoles = to
        .matched
        .map((routeRecord) => routeRecord.meta.roles)
        .find((roles) => Array.isArray(roles));

    return matchedRoles || [];
};

// ========================================== 로그인 및 권한 검증
// ==========================================
router.beforeEach((to) => {
    const userRole = localStorage.getItem("userRole");

    const isAuthenticated = userRole === "HQ" || userRole === "BRANCH";

    const requiresAuth = to
        .matched
        .some((routeRecord) => routeRecord.meta.requiresAuth === true);

    const requiredRole = getRequiredRole(to);

    const allowedRoles = getAllowedRoles(to);

    // 로그인이 필요한 페이지인데 로그인하지 않은 경우
    if (requiresAuth && !isAuthenticated) {
        window.alert("로그인이 필요한 서비스입니다.");

        return {
            name: "Login",
            query: {
                redirect: to.fullPath
            }
        };
    }

    // 로그인한 사용자가 로그인 페이지에 접근한 경우
    if (to.name === "Login" && isAuthenticated) {
        return getDefaultRouteByRole(userRole);
    }

    // 단일 권한이 설정된 페이지
    if (requiredRole && requiredRole !== userRole) {
        window.alert("해당 페이지에 접근할 권한이 없습니다.");

        return getDefaultRouteByRole(userRole);
    }

    // 복수 권한이 설정된 페이지
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        window.alert("해당 페이지에 접근할 권한이 없습니다.");

        return getDefaultRouteByRole(userRole);
    }

    return true;
});

export default router;