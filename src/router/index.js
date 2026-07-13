import {createRouter, createWebHistory} from "vue-router";

import Home from "../views/Home.vue";
import IceCreamSize from "../views/IceCreamSize.vue";
import CupSelect from "../views/CupSelect.vue";
import Menu from "../views/Menu.vue";
import Payment from "../views/Payment.vue";

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: "/",
            name: "Home",
            component: Home
        }, {
            path: "/size",
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
            component: Payment
        }
    ]
});

export default router;
